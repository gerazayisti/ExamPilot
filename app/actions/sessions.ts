"use server";

import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

export async function deleteSession(sessionId: string) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const session = await prisma.planningSession.findFirst({
            where: { id: sessionId, userId: user.id }
        });

        if (!session) return { success: false, error: "Session not found" };

        await prisma.planningSession.delete({
            where: { id: sessionId }
        });

        revalidatePath("/dashboard/schedule");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete session" };
    }
}

export async function getSessions() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const sessions = await prisma.planningSession.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, data: sessions };
    } catch (error) {
        return { success: false, error: "Failed to fetch sessions" };
    }
}

export async function getSessionSchedule(sessionId: string) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        // Ensure session belongs to user
        const session = await prisma.planningSession.findFirst({
            where: { id: sessionId, userId: user.id }
        });
        if (!session) return { success: false, error: "Session not found" };

        const schedules = await prisma.schedule.findMany({
            where: { planningSessionId: sessionId },
            include: {
                exam: {
                    include: {
                        subject: {
                            include: {
                                cohort: true,
                            },
                        },
                    },
                },
                room: true,
                timeSlot: true,
            },
            orderBy: {
                timeSlot: {
                    startTime: "asc",
                },
            },
        });
        return { success: true, data: schedules };
    } catch (error) {
        return { success: false, error: "Failed to fetch session schedule" };
    }
}

export async function getLatestSession() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const session = await prisma.planningSession.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });
        if (!session) return { success: true, data: null };
        return getSessionSchedule(session.id);
    } catch (error) {
        return { success: false, error: "Failed to fetch latest session" };
    }
}
