"use server";

import { revalidatePath } from "next/cache";
import { runScheduler } from "@/lib/algorithm";
import { getCurrentUser } from "@/lib/auth";

export async function generateScheduleAction(startDateStr: string, endDateStr: string, sessionName: string) {
    try {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return { success: false, error: "Dates invalides" };
        }

        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const result = await runScheduler(startDate, endDate, sessionName, user.id);

        revalidatePath("/dashboard/schedule");
        revalidatePath("/dashboard");

        return { success: true, ...result };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Erreur lors de la génération du planning" };
    }
}
