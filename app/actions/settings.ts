"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";

export async function getSettings() {
    try {
        const user = await getCurrentUser();
        if (!user) return null; // Or unauthorized logic, but for layout we return null or default

        // Logic here changes: settings are now per user.
        // If settings don't exist for user, create them.

        // Note: getCurrentUser already includes settings if we configured it so, 
        // but here we might want to fetch fresh or ensure creation.

        let settings = await prisma.settings.findUnique({
            where: { userId: user.id },
        });

        if (!settings) {
            settings = await prisma.settings.create({
                data: { userId: user.id },
            });
        }

        return settings;
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return null;
    }
}

interface UpdateSettingsData {
    appName: string;
    primaryColor: string;
    logoUrl?: string;
    examInterStudentGap?: number;
    maxExamsPerDay?: number;
    maxConsecutiveExams?: number;
}

export async function updateSettings(data: UpdateSettingsData) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await prisma.settings.upsert({
            where: { userId: user.id },
            update: {
                appName: data.appName,
                primaryColor: data.primaryColor,
                logoUrl: data.logoUrl,
                examInterStudentGap: data.examInterStudentGap ?? 0,
                maxExamsPerDay: data.maxExamsPerDay ?? 2,
                maxConsecutiveExams: data.maxConsecutiveExams ?? 2,
            },
            create: {
                appName: data.appName,
                primaryColor: data.primaryColor,
                logoUrl: data.logoUrl,
                examInterStudentGap: data.examInterStudentGap ?? 0,
                maxExamsPerDay: data.maxExamsPerDay ?? 2,
                maxConsecutiveExams: data.maxConsecutiveExams ?? 2,
                userId: user.id
            },
        });
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}
