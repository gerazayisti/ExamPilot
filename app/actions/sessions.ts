"use server";

import { prisma } from "@/lib/prisma";

export async function getSessions() {
    try {
        const sessions = await prisma.planningSession.findMany({
            orderBy: { createdAt: "desc" },
        });
        return { success: true, data: sessions };
    } catch (error) {
        return { success: false, error: "Failed to fetch sessions" };
    }
}

export async function getSessionSchedule(sessionId: string) {
    try {
        const schedules = await prisma.schedule.findMany({
            where: { sessionId },
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
        const session = await prisma.planningSession.findFirst({
            orderBy: { createdAt: "desc" },
        });
        if (!session) return { success: true, data: null };
        return getSessionSchedule(session.id);
    } catch (error) {
        return { success: false, error: "Failed to fetch latest session" };
    }
}
