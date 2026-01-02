"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";

export async function importRooms(data: any[]) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const roomsToCreate = data.map((row) => ({
            name: String(row.nom || row.name || "").trim(),
            capacity: parseInt(row.capacite || row.capacity || "0"),
            location: String(row.localisation || row.location || "").trim(),
            type: String(row.type || "Salle TD").trim(),
        })).filter(r => r.name !== "");

        if (roomsToCreate.length === 0) return { success: false, error: "Aucune salle valide trouvée dans le fichier." };

        await prisma.$transaction(
            roomsToCreate.map((room) =>
                prisma.room.upsert({
                    where: {
                        name_userId: {
                            name: room.name,
                            userId: user.id
                        }
                    },
                    update: room,
                    create: { ...room, userId: user.id },
                })
            )
        );

        revalidatePath("/dashboard/rooms");
        return { success: true, count: roomsToCreate.length };
    } catch (error: any) {
        console.error("Import Rooms Error:", error);
        return { success: false, error: "Erreur lors de l'importation des salles." };
    }
}

export async function importCohortsAndSubjects(data: any[]) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        // Data format expected: Major, Level, Code, Title, Duration, Type
        // We group by Cohort (Major + Level)
        const cohortsMap = new Map<string, { major: string, level: string, size: number, subjects: any[] }>();

        data.forEach(row => {
            const major = String(row.filiere || row.major || "").trim();
            const level = String(row.niveau || row.level || "").trim();
            const code = String(row.code || "").trim();
            const title = String(row.ue || row.subject || row.title || "").trim();
            const duration = parseInt(row.duree || row.duration || "2");
            const type = String(row.type || "DS").trim();
            const size = parseInt(row.effectif || row.taille || row.size || "0"); // Prise en compte de l'effectif

            if (!major || !level || !code) return;

            const key = `${major}-${level}`;
            if (!cohortsMap.has(key)) {
                cohortsMap.set(key, { major, level, size: size > 0 ? size : 0, subjects: [] });
            } else if (size > 0 && size > cohortsMap.get(key)!.size) {
                // Si plusieurs sizes, on garde la plus grande valeur trouvée (tu peux adapter ça)
                cohortsMap.get(key)!.size = size;
            }
            cohortsMap.get(key)!.subjects.push({ code, title, duration, type });
        });

        if (cohortsMap.size === 0) return { success: false, error: "Aucune donnée valide trouvée." };

        await prisma.$transaction(async (tx) => {
            for (const [_, cohortData] of cohortsMap) {
                // Find or create cohort
                const cohort = await tx.cohort.upsert({
                    where: {
                        major_level_userId: {
                            major: cohortData.major,
                            level: cohortData.level,
                            userId: user.id
                        }
                    },
                    update: {}, // Don't update major/level
                    create: {
                        major: cohortData.major,
                        level: cohortData.level,
                        size: cohortData.size, // utilise la vraie taille si présente
                        userId: user.id
                    }
                });

                // Create subjects for this cohort
                for (const sub of cohortData.subjects) {
                    const subject = await tx.subject.upsert({
                        where: {
                            code_userId: {
                                code: sub.code,
                                userId: user.id
                            }
                        },
                        update: {
                            title: sub.title,
                            cohortId: cohort.id
                        },
                        create: {
                            code: sub.code,
                            title: sub.title,
                            cohortId: cohort.id,
                            userId: user.id
                        }
                    });

                    // We use the subject returned by upsert directly
                    await tx.exam.upsert({
                        where: {
                            subjectId_type: {
                                subjectId: subject.id,
                                type: sub.type
                            }
                        },
                        update: { duration: sub.duration, userId: user.id }, // Ensure userId is set/updated
                        create: {
                            subjectId: subject.id,
                            type: sub.type,
                            duration: sub.duration,
                            userId: user.id
                        }
                    });
                }
            }
        }, {
            timeout: 20000 // Increase timeout to 20 seconds
        });

        revalidatePath("/dashboard/cohorts");
        return { success: true, count: data.length };
    } catch (error: any) {
        console.error("Import Cohorts/Subjects Error:", error);
        return { success: false, error: "Erreur lors de l'importation." };
    }
}
