"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- COHORTS ---

export async function getCohorts() {
    try {
        const cohorts = await prisma.cohort.findMany({
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
        const cohort = await prisma.cohort.findUnique({
            where: { id },
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
    const major = formData.get("major") as string;
    const level = formData.get("level") as string;
    const size = parseInt(formData.get("size") as string, 10);

    if (!major || !level || !size) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        await prisma.cohort.create({
            data: { major, level, size },
        });
        revalidatePath("/dashboard/cohorts");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create cohort" };
    }
}

export async function deleteCohort(id: string) {
    try {
        await prisma.cohort.delete({ where: { id } });
        revalidatePath("/dashboard/cohorts");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete cohort" };
    }
}

// --- SUBJECTS ---

export async function createSubject(formData: FormData, cohortId: string) {
    const code = formData.get("code") as string;
    const title = formData.get("title") as string;

    if (!code || !title || !cohortId) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        await prisma.subject.create({
            data: { code, title, cohortId },
        });
        revalidatePath(`/dashboard/cohorts/${cohortId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to create subject" };
    }
}

export async function deleteSubject(id: string, cohortId: string) {
    try {
        await prisma.subject.delete({ where: { id } });
        revalidatePath(`/dashboard/cohorts/${cohortId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete subject" };
    }
}
