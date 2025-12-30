"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function importRooms(data: any[]) {
    try {
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
                    where: { name: room.name },
                    update: room,
                    create: room,
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
        // Data format expected: Major, Level, Code, Title, Duration, Type
        // We group by Cohort (Major + Level)
        const cohortsMap = new Map<string, { major: string, level: string, subjects: any[] }>();

        data.forEach(row => {
            const major = String(row.filiere || row.major || "").trim();
            const level = String(row.niveau || row.level || "").trim();
            const code = String(row.code || "").trim();
            const title = String(row.ue || row.subject || row.title || "").trim();
            const duration = parseInt(row.duree || row.duration || "2");
            const type = String(row.type || "DS").trim();

            if (!major || !level || !code) return;

            const key = `${major}-${level}`;
            if (!cohortsMap.has(key)) {
                cohortsMap.set(key, { major, level, subjects: [] });
            }
            cohortsMap.get(key)!.subjects.push({ code, title, duration, type });
        });

        if (cohortsMap.size === 0) return { success: false, error: "Aucune donnée valide trouvée." };

        await prisma.$transaction(async (tx) => {
            for (const [_, cohortData] of cohortsMap) {
                // Find or create cohort
                const cohort = await tx.cohort.upsert({
                    where: {
                        major_level: {
                            major: cohortData.major,
                            level: cohortData.level
                        }
                    },
                    update: {}, // Don't update major/level
                    create: {
                        major: cohortData.major,
                        level: cohortData.level,
                        size: 0 // Default size if not provided
                    }
                });

                // Create subjects for this cohort
                for (const sub of cohortData.subjects) {
                    await tx.subject.upsert({
                        where: { code: sub.code },
                        update: {
                            title: sub.title,
                            cohortId: cohort.id
                        },
                        create: {
                            code: sub.code,
                            title: sub.title,
                            cohortId: cohort.id
                        }
                    });

                    // Find subject again to get ID for Exam creation
                    const subject = await tx.subject.findUnique({ where: { code: sub.code } });
                    if (subject) {
                        await tx.exam.upsert({
                            where: {
                                subjectId_type: {
                                    subjectId: subject.id,
                                    type: sub.type
                                }
                            },
                            update: { duration: sub.duration },
                            create: {
                                subjectId: subject.id,
                                type: sub.type,
                                duration: sub.duration
                            }
                        });
                    }
                }
            }
        });

        revalidatePath("/dashboard/cohorts");
        return { success: true, count: data.length };
    } catch (error: any) {
        console.error("Import Cohorts/Subjects Error:", error);
        return { success: false, error: "Erreur lors de l'importation." };
    }
}
