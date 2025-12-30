"use server";

import { prisma } from "@/lib/prisma";

export async function getFullSchedule() {
    try {
        const schedules = await prisma.schedule.findMany({
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
        return { success: false, error: "Failed to fetch schedule" };
    }
}
