"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
    try {
        const [rooms, cohorts, exams, placed, recentSessions] = await Promise.all([
            prisma.room.count(),
            prisma.cohort.count(),
            prisma.exam.count(),
            prisma.schedule.findMany({
                distinct: ["examId"],
            }),
            prisma.planningSession.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                }
            })
        ]);

        return {
            success: true,
            data: {
                rooms,
                cohorts,
                exams,
                placed: placed.length,
                recentSessions,
            },
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch stats" };
    }
}
