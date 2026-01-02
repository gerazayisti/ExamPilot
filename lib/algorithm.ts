import { prisma } from "./prisma";

interface ExamWithDetails {
    id: string;
    duration: number;
    subject: {
        title: string;
        cohort: {
            id: string;
            size: number;
            major: string;
        };
    };
}

interface Room {
    id: string;
    name: string;
    capacity: number;
}

interface Slot {
    start: string; // HH:mm
    end: string;   // HH:mm
}

interface PlacementAttempt {
    examId: string;
    dayIndex: number;
    slotIndex: number;
    waste: number; // gaspillage de capacité
    score: number; // added score for sorting
}

const TIME_SLOTS: Slot[] = [
    { start: "08:00", end: "10:00" },
    { start: "10:15", end: "12:15" },
    { start: "12:30", end: "14:30" },
    { start: "14:45", end: "16:45" },
    { start: "17:00", end: "19:00" },
];

export async function runScheduler(startDate: Date, endDate: Date, sessionName: string, userId: string) {
    // 1. Fetch data
    const exams = await prisma.exam.findMany({
        where: { userId },
        include: {
            subject: {
                include: { cohort: true },
            },
        },
    }) as unknown as ExamWithDetails[];

    const rooms = await prisma.room.findMany({
        where: { userId }
    });

    // Fetch settings for gap
    const settings = await prisma.settings.findUnique({
        where: { userId }
    });
    const gap = settings?.examInterStudentGap ?? 0;

    // 2. Tri des examens par difficulté (taille décroissante, puis par contraintes)
    const sortedExams = [...exams].sort((a, b) => {
        // Priorité 1: Taille de cohorte (décroissant)
        const sizeDiff = b.subject.cohort.size - a.subject.cohort.size;
        if (sizeDiff !== 0) return sizeDiff;

        // Priorité 2: Durée (décroissant)
        const durationDiff = b.duration - a.duration;
        if (durationDiff !== 0) return durationDiff;

        // Priorité 3: Par ordre aléatoire pour les égalités
        return Math.random() - 0.5;
    });

    // 3. Pré-calculer les capacités des salles par créneau
    const daysInRange = getDatesInRange(startDate, endDate);

    // Structures de suivi améliorées
    const cohortBookings = new Set<string>(); // "cohortId-date-slotIndex"
    const roomBookings = new Set<string>();   // "roomId-date-slotIndex"
    const slotRoomUsage = new Map<string, Set<string>>(); // "date-slotIndex" -> Set(roomIds)
    const cohortDayUsage = new Map<string, number>(); // "cohortId-date" -> count of exams
    const results: any[] = [];
    const unplacedExams: ExamWithDetails[] = [];

    // 4. Heuristique: Pré-filtrer les salles par capacité
    const roomsByCapacity = new Map<number, Room[]>();
    rooms.forEach(room => {
        if (!roomsByCapacity.has(room.capacity)) {
            roomsByCapacity.set(room.capacity, []);
        }
        roomsByCapacity.get(room.capacity)!.push(room);
    });

    // 5. Placement principal avec mécanisme de réessai
    for (const exam of sortedExams) {
        const cohortId = exam.subject.cohort.id;
        const cohortSize = exam.subject.cohort.size;
        let placed = false;

        // 5a. Premier essai: Chercher le meilleur créneau (minimisant le gaspillage)
        const possiblePlacements: PlacementAttempt[] = [];

        // Randomize day order slightly to avoid fixed patterns? 
        // No, we will use score to handle it.
        for (let dayIndex = 0; dayIndex < daysInRange.length; dayIndex++) {
            const day = daysInRange[dayIndex];
            const dateStr = day.toISOString().split("T")[0];

            // Calculate penalty for this day based on previous exams for this cohort
            // Goal: Distribute exams for a cohort across different days
            const dayUsage = cohortDayUsage.get(`${cohortId}-${dateStr}`) || 0;
            const dayPenalty = dayUsage * 10000; // Heavy penalty for same day

            for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
                const cohortKey = `${cohortId}-${dateStr}-${slotIndex}`;
                if (cohortBookings.has(cohortKey)) continue;

                // Calculer les salles disponibles pour ce créneau
                const slotKey = `${dateStr}-${slotIndex}`;
                let availableRooms = rooms.filter(r => !roomBookings.has(`${r.id}-${dateStr}-${slotIndex}`));

                // Stratégie: Optimiser l'occupation des salles
                // Si certaines salles sont encore libres à ce créneau, prioriser leur utilisation
                const usedRooms = slotRoomUsage.get(slotKey) || new Set();
                const freeRooms = availableRooms.filter(r => !usedRooms.has(r.id));

                // Essayer d'abord les salles pas encore utilisées aujourd'hui
                if (freeRooms.length > 0) {
                    availableRooms = [...freeRooms, ...availableRooms.filter(r => !freeRooms.includes(r))];
                }

                // Évaluer les options de placement
                const placementOptions = evaluatePlacementOptions(
                    cohortSize,
                    availableRooms,
                    exam.duration,
                    gap
                );

                if (placementOptions.length > 0) {
                    // Choisir l'option avec le moins de gaspillage
                    const bestOption = placementOptions.sort((a, b) => a.waste - b.waste)[0];

                    // Calculate final score: Waste + DayPenalty + RandomFactor
                    // RandomFactor (0-50) ensures we don't always pick Day 0 if wastes are equal (0 vs 0).
                    const randomFactor = Math.random() * 50;
                    const score = bestOption.waste + dayPenalty + randomFactor;

                    possiblePlacements.push({
                        examId: exam.id,
                        dayIndex,
                        slotIndex,
                        waste: bestOption.waste,
                        score: score
                    });
                }
            }
        }

        // 5b. Trier les placements possibles par SCORE (et non juste gaspillage)
        possiblePlacements.sort((a, b) => a.score - b.score);

        // 5c. Essayer le meilleur placement
        if (possiblePlacements.length > 0) {
            const bestPlacement = possiblePlacements[0];
            const day = daysInRange[bestPlacement.dayIndex];
            const dateStr = day.toISOString().split("T")[0];
            const slotIndex = bestPlacement.slotIndex;
            const cohortKey = `${cohortId}-${dateStr}-${slotIndex}`;

            // Récupérer les salles disponibles à nouveau pour ce créneau
            const availableRooms = rooms.filter(r => !roomBookings.has(`${r.id}-${dateStr}-${slotIndex}`));
            const placementOptions = evaluatePlacementOptions(
                cohortSize,
                availableRooms,
                exam.duration,
                gap
            );

            if (placementOptions.length > 0) {
                const bestOption = placementOptions.sort((a, b) => a.waste - b.waste)[0];

                // Enregistrer le placement
                for (const room of bestOption.rooms) {
                    results.push({
                        examId: exam.id,
                        roomId: room.id,
                        date: day,
                        slotIndex,
                        isMainRoom: bestOption.rooms[0] === room
                    });
                    roomBookings.add(`${room.id}-${dateStr}-${slotIndex}`);

                    // Mettre à jour l'utilisation des salles par créneau
                    const slotKey = `${dateStr}-${slotIndex}`;
                    if (!slotRoomUsage.has(slotKey)) {
                        slotRoomUsage.set(slotKey, new Set());
                    }
                    slotRoomUsage.get(slotKey)!.add(room.id);
                }

                cohortBookings.add(cohortKey);

                // Update cohort day usage
                const currentDayUsage = cohortDayUsage.get(`${cohortId}-${dateStr}`) || 0;
                cohortDayUsage.set(`${cohortId}-${dateStr}`, currentDayUsage + 1);

                placed = true;
            }
        }

        // 5d. Si non placé, ajouter à la liste pour réessai
        if (!placed) {
            unplacedExams.push(exam);
        }
    }

    // 6. Mécanisme de réessai pour les examens non placés
    if (unplacedExams.length > 0) {
        console.log(`Tentative de placement pour ${unplacedExams.length} examens restants...`);

        for (const exam of unplacedExams) {
            const cohortId = exam.subject.cohort.id;
            const cohortSize = exam.subject.cohort.size;
            let placedInRetry = false;

            // Stratégie de réessai: Essayer de déplacer des examens moins contraignants
            for (let dayIndex = 0; dayIndex < daysInRange.length && !placedInRetry; dayIndex++) {
                const day = daysInRange[dayIndex];
                const dateStr = day.toISOString().split("T")[0];

                for (let slotIndex = 0; slotIndex < TIME_SLOTS.length && !placedInRetry; slotIndex++) {
                    const cohortKey = `${cohortId}-${dateStr}-${slotIndex}`;
                    if (cohortBookings.has(cohortKey)) continue;

                    // Vérifier si on peut libérer des salles en déplaçant d'autres examens
                    const availableRooms = rooms.filter(r => !roomBookings.has(`${r.id}-${dateStr}-${slotIndex}`));

                    // Si pas assez de salles disponibles, essayer de trouver un examen à déplacer
                    if (availableRooms.reduce((sum, r) => sum + r.capacity, 0) < cohortSize) {
                        // Chercher un examen "facile" à déplacer (petite cohorte) dans ce créneau
                        const examsInSlot = results.filter(r =>
                            r.date.getTime() === day.getTime() &&
                            r.slotIndex === slotIndex
                        );

                        // Trier les examens par difficulté (taille croissante)
                        const examsToMove = examsInSlot.sort((a, b) => {
                            const examA = sortedExams.find(e => e.id === a.examId);
                            const examB = sortedExams.find(e => e.id === b.examId);
                            return (examA?.subject.cohort.size || 0) - (examB?.subject.cohort.size || 0);
                        });

                        // Essayer de déplacer le plus petit examen
                        if (examsToMove.length > 0) {
                            const examToMove = examsToMove[0];
                            const originalExam = sortedExams.find(e => e.id === examToMove.examId);

                            if (originalExam && originalExam.subject.cohort.size < cohortSize) {
                                // Retirer temporairement cet examen
                                const movedResults = results.filter(r => r.examId !== examToMove.examId);
                                const newRoomBookings = new Set(roomBookings);

                                // Retirer les bookings de cet examen
                                results.filter(r => r.examId === examToMove.examId).forEach(r => {
                                    newRoomBookings.delete(`${r.roomId}-${dateStr}-${slotIndex}`);
                                });

                                // Vérifier si on peut maintenant placer notre examen
                                const newAvailableRooms = rooms.filter(r =>
                                    !newRoomBookings.has(`${r.id}-${dateStr}-${slotIndex}`)
                                );

                                const placementOptions = evaluatePlacementOptions(
                                    cohortSize,
                                    newAvailableRooms,
                                    exam.duration,
                                    gap
                                );

                                if (placementOptions.length > 0) {
                                    // Placer le nouvel examen
                                    const bestOption = placementOptions.sort((a, b) => a.waste - b.waste)[0];

                                    for (const room of bestOption.rooms) {
                                        results.push({
                                            examId: exam.id,
                                            roomId: room.id,
                                            date: day,
                                            slotIndex,
                                            isMainRoom: bestOption.rooms[0] === room
                                        });
                                        newRoomBookings.add(`${room.id}-${dateStr}-${slotIndex}`);
                                    }

                                    // Mettre à jour les sets globaux
                                    results.forEach((r, index) => {
                                        if (r.examId === examToMove.examId) {
                                            results.splice(index, 1);
                                        }
                                    });

                                    roomBookings.clear();
                                    newRoomBookings.forEach(v => roomBookings.add(v));
                                    cohortBookings.add(cohortKey);

                                    // Remettre l'examen déplacé dans la liste des non placés
                                    unplacedExams.push(originalExam);
                                    placedInRetry = true;
                                }
                            }
                        }
                    } else {
                        // Assez de salles disponibles normalement
                        const placementOptions = evaluatePlacementOptions(
                            cohortSize,
                            availableRooms,
                            exam.duration,
                            gap
                        );

                        if (placementOptions.length > 0) {
                            const bestOption = placementOptions.sort((a, b) => a.waste - b.waste)[0];

                            for (const room of bestOption.rooms) {
                                results.push({
                                    examId: exam.id,
                                    roomId: room.id,
                                    date: day,
                                    slotIndex,
                                    isMainRoom: bestOption.rooms[0] === room
                                });
                                roomBookings.add(`${room.id}-${dateStr}-${slotIndex}`);
                            }

                            cohortBookings.add(cohortKey);
                            placedInRetry = true;

                            // Retirer de la liste des non placés
                            const index = unplacedExams.findIndex(e => e.id === exam.id);
                            if (index > -1) unplacedExams.splice(index, 1);
                        }
                    }
                }
            }

            // Si toujours non placé après réessai, on le laisse non placé
            if (!placedInRetry) {
                console.warn(`Examen ${exam.id} non placé après réessai`);
            }
        }
    }

    // 7. Optimisation: Remplir les créneaux sous-utilisés
    optimizeSlotOccupation(daysInRange, results, rooms, roomBookings);

    // 8. Sauvegarde dans la base de données
    const resultSession = await saveResultsToDatabase(results, sessionName, userId);

    return {
        totalExams: sortedExams.length,
        placedExams: new Set(results.map(r => r.examId)).size,
        unplacedExams: unplacedExams.length,
        sessionId: resultSession.id,
        roomUtilization: calculateRoomUtilization(daysInRange, results, rooms)
    };
}

// Fonction pour évaluer les options de placement
function evaluatePlacementOptions(
    cohortSize: number,
    availableRooms: Room[],
    examDuration: number,
    gap: number = 0
): Array<{ rooms: Room[], waste: number }> {
    const options: Array<{ rooms: Room[], waste: number }> = [];

    // Calculate effective capacity for each room based on gap
    // If gap is 0, effective = capacity
    // If gap is 1, effective = floor(capacity / 2)
    const getEffectiveCapacity = (r: Room) => Math.floor(r.capacity / (gap + 1));

    // Vérifier la durée (tous les créneaux font 2h = 120 minutes)
    if (examDuration > 120) {
        return options; // Examen trop long pour les créneaux
    }

    // Option 1: Une seule salle (best-fit)
    const suitableSingleRooms = availableRooms
        .filter(r => getEffectiveCapacity(r) >= cohortSize)
        .sort((a, b) => getEffectiveCapacity(a) - getEffectiveCapacity(b));

    for (const room of suitableSingleRooms) {
        options.push({
            rooms: [room],
            waste: getEffectiveCapacity(room) - cohortSize // Gaspillage de capacité effective
        });
    }

    // Option 2: Scission en plusieurs salles (si pas de salle unique)
    if (suitableSingleRooms.length === 0) {
        // Sort by effective capacity descending
        const sortedRooms = [...availableRooms].sort((a, b) => getEffectiveCapacity(b) - getEffectiveCapacity(a));
        let bestCombination: Room[] = [];
        let minWaste = Infinity;

        // Algorithme glouton amélioré pour la scission
        for (let i = 0; i < Math.min(5, sortedRooms.length); i++) {
            let remainingCapacity = cohortSize;
            const combination: Room[] = [];

            for (let j = i; j < sortedRooms.length && remainingCapacity > 0; j++) {
                const room = sortedRooms[j];
                const effectiveCap = getEffectiveCapacity(room);
                if (effectiveCap > 0) {
                    combination.push(room);
                    remainingCapacity -= effectiveCap;
                }
            }

            if (remainingCapacity <= 0) {
                const totalEffectiveCapacity = combination.reduce((sum, r) => sum + getEffectiveCapacity(r), 0);
                const waste = totalEffectiveCapacity - cohortSize;
                if (waste < minWaste) {
                    minWaste = waste;
                    bestCombination = combination;
                }
            }
        }

        if (bestCombination.length > 0) {
            options.push({
                rooms: bestCombination,
                waste: minWaste
            });
        }
    }

    return options;
}

// Fonction pour optimiser l'occupation des créneaux
function optimizeSlotOccupation(
    daysInRange: Date[],
    results: any[],
    rooms: Room[],
    roomBookings: Set<string>
) {
    // Pour chaque créneau, vérifier l'occupation
    for (const day of daysInRange) {
        const dateStr = day.toISOString().split("T")[0];

        for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
            // Calculer les salles utilisées dans ce créneau
            const usedRoomsInSlot = results.filter(r =>
                r.date.getTime() === day.getTime() &&
                r.slotIndex === slotIndex
            ).map(r => r.roomId);

            const unusedRooms = rooms.filter(r =>
                !usedRoomsInSlot.includes(r.id) &&
                !roomBookings.has(`${r.id}-${dateStr}-${slotIndex}`)
            );

            // Si moins de 90% des salles sont utilisées, essayer de combler
            const usageRatio = usedRoomsInSlot.length / rooms.length;
            if (usageRatio < 0.9 && unusedRooms.length > 0) {
                console.log(`Créneau ${dateStr} - ${TIME_SLOTS[slotIndex].start}: ${Math.round(usageRatio * 100)}% d'occupation`);

                // Stratégie: Regrouper des petits examens s'il en reste
                // (Cette optimisation nécessiterait plus de logique et de données)
            }
        }
    }
}

// Fonction pour sauvegarder les résultats
async function saveResultsToDatabase(results: any[], sessionName: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
        const session = await tx.planningSession.create({
            data: {
                name: sessionName,
                userId
            },
        });

        // Regrouper les résultats par examId pour gérer les scissions
        const groupedResults = results.reduce((acc, result) => {
            if (!acc[result.examId]) {
                acc[result.examId] = [];
            }
            acc[result.examId].push(result);
            return acc;
        }, {} as Record<string, any[]>);

        for (const examId in groupedResults) {
            const examResults = groupedResults[examId];
            const firstResult = examResults[0];

            // Créer un seul TimeSlot pour l'examen (même s'il est dans plusieurs salles)
            const startTime = new Date(firstResult.date);
            const [startH, startM] = TIME_SLOTS[firstResult.slotIndex].start.split(":");
            startTime.setHours(parseInt(startH), parseInt(startM), 0, 0);

            const endTime = new Date(firstResult.date);
            const [endH, endM] = TIME_SLOTS[firstResult.slotIndex].end.split(":");
            endTime.setHours(parseInt(endH), parseInt(endM), 0, 0);

            const slot = await tx.timeSlot.create({
                data: {
                    startTime,
                    endTime,
                },
            });

            // Créer un Schedule par salle utilisée
            // Optimisation: Utiliser Promise.all pour paralléliser les créations
            await Promise.all(examResults.map((result: any) =>
                tx.schedule.create({
                    data: {
                        examId: result.examId,
                        roomId: result.roomId,
                        timeSlotId: slot.id,
                        planningSessionId: session.id,
                    },
                })
            ));
        }

        return session;
    }, {
        timeout: 50000 // 50s timeout to handle large datasets
    });
}

// Fonction pour calculer l'utilisation des salles
function calculateRoomUtilization(daysInRange: Date[], results: any[], rooms: Room[]) {
    const utilization: Record<string, number> = {};

    for (const day of daysInRange) {
        const dateStr = day.toISOString().split("T")[0];

        for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
            const slotKey = `${dateStr}-${TIME_SLOTS[slotIndex].start}`;
            const usedRooms = results.filter(r =>
                r.date.getTime() === day.getTime() &&
                r.slotIndex === slotIndex
            );

            utilization[slotKey] = usedRooms.length / rooms.length;
        }
    }

    return utilization;
}

function getDatesInRange(startDate: Date, endDate: Date): Date[] {
    const dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}