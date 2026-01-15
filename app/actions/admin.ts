"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "ADMIN") throw new Error("Forbidden - Admin access required");
    return user;
}

export async function getAdminStats() {
    await verifyAdmin();

    const [usersCount, examsCount, sessionsCount, logs] = await Promise.all([
        prisma.user.count(),
        prisma.exam.count(),
        prisma.planningSession.count(),
        prisma.systemLog.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        })
    ]);

    return { usersCount, examsCount, sessionsCount, logs };
}

export async function getAllUsers() {
    await verifyAdmin();

    const users = await prisma.user.findMany({
        include: {
            _count: {
                select: {
                    exams: true,
                    cohorts: true,
                    sessions: true,
                    logs: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: users };
}

export async function adminResetPassword(userId: string, newPass: string) {
    await verifyAdmin();

    if (newPass.length < 6) return { success: false, error: "Password too short" };

    const hashed = await hashPassword(newPass);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashed }
    });

    // Log the action (if user ID available contextually, but here we update another user)
    // Ideally we log who did it.

    revalidatePath("/admin");
    return { success: true };
}

export async function adminDeleteUser(userId: string) {
    const admin = await verifyAdmin();
    if (userId === admin.id) return { success: false, error: "Cannot delete yourself" };

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin");
    return { success: true };
}
