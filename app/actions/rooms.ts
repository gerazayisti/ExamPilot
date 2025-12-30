"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getRooms() {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: { name: "asc" },
        });
        return { success: true, data: rooms };
    } catch (error) {
        return { success: false, error: "Failed to fetch rooms" };
    }
}

export async function createRoom(formData: FormData) {
    const name = formData.get("name") as string;
    const capacity = parseInt(formData.get("capacity") as string, 10);
    const location = formData.get("location") as string;
    const type = formData.get("type") as string;

    if (!name || !capacity || !location || !type) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        await prisma.room.create({
            data: {
                name,
                capacity,
                location,
                type,
            },
        });
        revalidatePath("/dashboard/rooms");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to create room" };
    }
}

export async function deleteRoom(id: string) {
    try {
        await prisma.room.delete({
            where: { id },
        });
        revalidatePath("/dashboard/rooms");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete room" };
    }
}
