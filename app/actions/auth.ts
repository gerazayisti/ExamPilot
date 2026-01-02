"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword, createSession, logout as logoutAction } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function register(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const school = formData.get("school") as string;
    const role = formData.get("role") as string;

    if (!email || !password || !name) {
        return { success: false, error: "Tous les champs sont requis." };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return { success: false, error: "Cet email est déjà utilisé." };
    }

    const hashedPassword = await hashPassword(password);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                school,
                role
            }
        });

        // Initialize default settings for this user
        await prisma.settings.create({
            data: {
                userId: user.id
            }
        });

        await createSession(user.id);
    } catch (error) {
        console.error("Registration Error:", error);
        return { success: false, error: "Erreur lors de l'inscription." };
    }

    redirect("/dashboard");
}

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { success: false, error: "Email et mot de passe requis." };
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
        return { success: false, error: "Identifiants incorrects." };
    }

    await createSession(user.id);
    redirect("/dashboard");
}

export async function logout() {
    await logoutAction();
}
