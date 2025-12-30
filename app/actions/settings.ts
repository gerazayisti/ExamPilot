"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings() {
    try {
        const settings = await prisma.settings.findUnique({
            where: { id: "default" },
        });

        if (!settings) {
            // Create default settings if they don't exist
            return await prisma.settings.create({
                data: { id: "default" },
            });
        }

        return settings;
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return null;
    }
}

export async function updateSettings(data: {
    appName?: string;
    logoUrl?: string;
    primaryColor?: string;
}) {
    try {
        const settings = await prisma.settings.upsert({
            where: { id: "default" },
            update: data,
            create: { id: "default", ...data },
        });

        revalidatePath("/");
        return { success: true, data: settings };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}
