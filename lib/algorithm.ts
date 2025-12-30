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

interface slot {
    start: string; // HH:mm
    end: string;   // HH:mm
}

const TIME_SLOTS: slot[] = [
    { start: "08:00", end: "10:00" },
    { start: "10:15", end: "12:15" },
    { start: "12:30", end: "14:30" },
    { start: "14:45", end: "16:45" },
    { start: "17:00", end: "19:00" },
];

export async function runScheduler(startDate: Date, endDate: Date, sessionName: string) {
    // 1. Fetch data
    const exams = await prisma.exam.findMany({
        include: {
            subject: {
                include: { cohort: true },
            },
        },
    }) as unknown as ExamWithDetails[];

    const rooms = await prisma.room.findMany();

    // 2. Randomize exams - Shuffling ensures any subject/level can start/end the session
    const shuffledExams = [...exams].sort(() => Math.random() - 0.5);

    // 3. Prepare result accumulator
    const results: any[] = [];
    const cohortBookings = new Set<string>(); // "cohortId-date-slotIndex"
    const roomBookings = new Set<string>();   // "roomId-date-slotIndex"

    const daysInRange = getDatesInRange(startDate, endDate);

    for (const exam of shuffledExams) {
        let placed = false;
        const cohortId = exam.subject.cohort.id;
        const cohortSize = exam.subject.cohort.size;

        // Iterate through days and slots
        for (const day of daysInRange) {
            if (placed) break;
            const dateStr = day.toISOString().split("T")[0];

            for (let sIndex = 0; sIndex < TIME_SLOTS.length; sIndex++) {
                if (placed) break;

                const cohortKey = `${cohortId}-${dateStr}-${sIndex}`;
                if (cohortBookings.has(cohortKey)) continue; // Cohort already busy

                // Find available rooms for this slot
                const availableRooms = rooms.filter(
                    (r) => !roomBookings.has(`${r.id}-${dateStr}-${sIndex}`)
                );

                // Try to find a single room (Best-Fit)
                const possibleSingleRooms = availableRooms
                    .filter((r) => r.capacity >= cohortSize)
                    .sort((a, b) => a.capacity - b.capacity); // Closest fit first

                if (possibleSingleRooms.length > 0) {
                    const room = possibleSingleRooms[0];
                    results.push({
                        examId: exam.id,
                        roomId: room.id,
                        date: day,
                        slotIndex: sIndex,
                    });
                    cohortBookings.add(cohortKey);
                    roomBookings.add(`${room.id}-${dateStr}-${sIndex}`);
                    placed = true;
                } else {
                    // Scission logic: Find a combination of available rooms
                    // We sort available rooms by capacity (descending) to use as few rooms as possible
                    const sortedAvailable = [...availableRooms].sort((a, b) => b.capacity - a.capacity);
                    let combinedCapacity = 0;
                    const selectedRooms: Room[] = [];

                    for (const r of sortedAvailable) {
                        selectedRooms.push(r);
                        combinedCapacity += r.capacity;
                        if (combinedCapacity >= cohortSize) break;
                    }

                    if (combinedCapacity >= cohortSize) {
                        for (const r of selectedRooms) {
                            results.push({
                                examId: exam.id,
                                roomId: r.id,
                                date: day,
                                slotIndex: sIndex,
                            });
                            roomBookings.add(`${r.id}-${dateStr}-${sIndex}`);
                        }
                        cohortBookings.add(cohortKey);
                        placed = true;
                    }
                }
            }
        }
    }

    // 4. Save results to database (transactional)
    const resultSession = await prisma.$transaction(async (tx) => {
        console.log("TX KEYS:", Object.keys(tx).filter(k => !k.startsWith("$")));
        if (!(tx as any).planningSession) {
            console.error("CRITICAL: planningSession is MISSING from tx client!");
            // Try PascalCase just in case
            if ((tx as any).PlanningSession) {
                console.log("Found PlanningSession (PascalCase) instead!");
                const session = await (tx as any).PlanningSession.create({
                    data: { name: sessionName },
                });
                return session;
            }
        }
        const session = await tx.planningSession.create({
            data: { name: sessionName },
        });

        for (const res of results) {
            // Create or find TimeSlot
            const startTime = new Date(res.date);
            const [startH, startM] = TIME_SLOTS[res.slotIndex].start.split(":");
            startTime.setHours(parseInt(startH), parseInt(startM), 0, 0);

            const endTime = new Date(res.date);
            const [endH, endM] = TIME_SLOTS[res.slotIndex].end.split(":");
            endTime.setHours(parseInt(endH), parseInt(endM), 0, 0);

            const slot = await tx.timeSlot.create({
                data: {
                    startTime,
                    endTime,
                },
            });

            await tx.schedule.create({
                data: {
                    examId: res.examId,
                    roomId: res.roomId,
                    timeSlotId: slot.id,
                    sessionId: session.id,
                },
            });
        }
        return session;
    });

    return {
        totalExams: shuffledExams.length,
        placedExams: results.filter((v, i, a) => a.findIndex(t => t.examId === v.examId) === i).length,
        sessionId: resultSession.id,
    };
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
