"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExams() {
    try {
        const exams = await prisma.exam.findMany({
            include: {
                subject: {
                    include: {
                        cohort: true,
                    },
                },
            },
            orderBy: { subject: { code: "asc" } },
        });
        return { success: true, data: exams };
    } catch (error) {
        return { success: false, error: "Failed to fetch exams" };
    }
}

export async function getSubjectsForExam() {
    try {
        // Only fetch subjects that don't have an exam yet? 
        // For MVP, user can create multiple exams for same subject if needed (e.g. Session 1, Session 2), 
        // but typically we'd filter. Let's return all.
        const subjects = await prisma.subject.findMany({
            include: {
                cohort: true,
            },
            orderBy: { code: "asc" },
        });
        return { success: true, data: subjects };
    } catch (error) {
        return { success: false, error: "Failed to fetch subjects" };
    }
}

export async function createExam(formData: FormData) {
    const subjectId = formData.get("subjectId") as string;
    const duration = parseInt(formData.get("duration") as string, 10);
    const type = formData.get("type") as string;

    if (!subjectId || !duration || !type) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        await prisma.exam.create({
            data: {
                subjectId,
                duration,
                type,
            },
        });
        revalidatePath("/dashboard/exams");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create exam" };
    }
}

export async function deleteExam(id: string) {
    try {
        await prisma.exam.delete({ where: { id } });
        revalidatePath("/dashboard/exams");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete exam" };
    }
}

export async function createBatchExams(cohortIds: string[], duration: number, type: string) {
    if (!cohortIds || cohortIds.length === 0) {
        return { success: false, error: "Aucune cohorte sélectionnée" };
    }

    try {
        const subjects = await prisma.subject.findMany({
            where: {
                cohortId: { in: cohortIds },
            },
        });

        if (subjects.length === 0) {
            return { success: false, error: "Aucune matière trouvée pour ces cohortes" };
        }

        // Use a transaction to create multiple exams
        await prisma.$transaction(
            subjects.map((sub) =>
                prisma.exam.create({
                    data: {
                        subjectId: sub.id,
                        duration,
                        type,
                    },
                })
            )
        );

        revalidatePath("/dashboard/exams");
        return { success: true, count: subjects.length };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Erreur lors de la création groupée" };
    }
}
