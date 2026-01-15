"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";

export async function getExams() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const exams = await prisma.exam.findMany({
            where: { userId: user.id },
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
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const subjects = await prisma.subject.findMany({
            where: { userId: user.id },
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
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const subjectId = formData.get("subjectId") as string;
    const duration = parseInt(formData.get("duration") as string, 10);
    const type = formData.get("type") as string;

    if (!subjectId || !duration || !type) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        // Verify subject ownership
        const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: user.id } });
        if (!subject) return { success: false, error: "Subject not found or access denied" };

        await prisma.exam.create({
            data: {
                subjectId,
                duration,
                type,
                userId: user.id
            },
        });
        revalidatePath("/dashboard/exams");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create exam" };
    }
}

export async function deleteExam(id: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.exam.delete({ where: { id, userId: user.id } });
        revalidatePath("/dashboard/exams");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete exam" };
    }
}

export async function createBatchExams(cohortIds: string[], duration: number, type: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (!cohortIds || cohortIds.length === 0) {
        return { success: false, error: "Aucune cohorte sélectionnée" };
    }

    try {
        const subjects = await prisma.subject.findMany({
            where: {
                cohortId: { in: cohortIds },
                userId: user.id
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
                        userId: user.id
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

export async function deleteExams(ids: string[]) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (!ids || ids.length === 0) return { success: true };

    try {
        await prisma.exam.deleteMany({
            where: {
                id: { in: ids },
                userId: user.id
            }
        });
        revalidatePath("/dashboard/exams");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete exams" };
    }
}
