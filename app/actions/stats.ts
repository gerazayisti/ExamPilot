"use server";

import { prisma } from "@/lib/prisma";

import { getCurrentUser } from "@/lib/auth";

export async function getDashboardStats() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const [rooms, cohorts, exams, placed, recentSessions] = await Promise.all([
            prisma.room.count({ where: { userId: user.id } }),
            prisma.cohort.count({ where: { userId: user.id } }),
            prisma.exam.count({ where: { userId: user.id } }),
            prisma.schedule.findMany({
                where: {
                    exam: { userId: user.id }
                },
                distinct: ["examId"],
            }),
            prisma.planningSession.findMany({
                where: { userId: user.id },
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
