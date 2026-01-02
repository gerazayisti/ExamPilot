"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";

// --- COHORTS ---

export async function getCohorts() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const cohorts = await prisma.cohort.findMany({
            where: { userId: user.id },
            include: {
                _count: {
                    select: { subjects: true },
                },
            },
            orderBy: { major: "asc" },
        });
        return { success: true, data: cohorts };
    } catch (error) {
        return { success: false, error: "Failed to fetch cohorts" };
    }
}

export async function getCohortById(id: string) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const cohort = await prisma.cohort.findFirst({
            where: { id, userId: user.id },
            include: {
                subjects: {
                    orderBy: { code: "asc" },
                },
            },
        });
        return { success: true, data: cohort };
    } catch (error) {
        return { success: false, error: "Failed to fetch cohort" };
    }
}

export async function createCohort(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const major = formData.get("major") as string;
    const level = formData.get("level") as string;
    const size = parseInt(formData.get("size") as string, 10);

    if (!major || !level || !size) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        await prisma.cohort.create({
            data: {
                major,
                level,
                size,
                userId: user.id
            },
        });
        revalidatePath("/dashboard/cohorts");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create cohort" };
    }
}

export async function updateCohort(id: string, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const major = formData.get("major") as string;
    const level = formData.get("level") as string;
    const size = parseInt(formData.get("size") as string, 10);

    if (!major || !level || !size) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        await prisma.cohort.update({
            where: { id, userId: user.id },
            data: {
                major,
                level,
                size
            },
        });
        revalidatePath("/dashboard/cohorts");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update cohort" };
    }
}

export async function deleteCohort(id: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.cohort.delete({ where: { id, userId: user.id } });
        revalidatePath("/dashboard/cohorts");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete cohort" };
    }
}

// --- SUBJECTS ---

export async function createSubject(formData: FormData, cohortId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Verify cohort ownership
    const cohort = await prisma.cohort.findFirst({ where: { id: cohortId, userId: user.id } });
    if (!cohort) return { success: false, error: "Cohort not found or access denied" };

    const code = formData.get("code") as string;
    const title = formData.get("title") as string;

    if (!code || !title || !cohortId) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        await prisma.subject.create({
            data: {
                code,
                title,
                cohortId,
                userId: user.id
            },
        });
        revalidatePath(`/dashboard/cohorts/${cohortId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create subject" };
    }
}

export async function deleteSubject(id: string, cohortId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.subject.delete({ where: { id, userId: user.id } });
        revalidatePath(`/dashboard/cohorts/${cohortId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete subject" };
    }
}
