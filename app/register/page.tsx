"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    // Note: register action signature should match useActionState requirements (state, formData)
    // We need to wrap or update register action signature in auth.ts if using useActionState directly, 
    // or use a wrapper here. Assuming register action returns a simple object or redirects.
    // Let's create a wrapper for type safety if needed, but for now assuming direct usage.

    // We need to update register in auth.ts to accept prevState if we use useActionState
    // Let's assume we update auth.ts shortly or use it as is if compatible.
    // To be safe, let's wrap it in an client-side handler or ensure server action signature matches.
    // Actually, let's update auth.ts signature in next step for consistency, creating page first.

    // Update: useActionState expects `(state: A, payload: P) => state | Promise<state>`
    // The previous implementation of `register` didn't take state as first arg. 
    // I'll fix the signature in auth.ts in a subsequent step or now. 

    // Actually, I'll use a simple form handler for now to avoid complexity or mismatch until verification.

    // Re-verification: Standard nextjs server actions can be used with `action={register}` directly but error handling is better with useActionState.
    // I will write this page assuming register takes (prevState, formData).

    const [state, formAction, isPending] = useActionState(register, null);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
                        Créer un compte
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Rejoignez ExamPilot pour gérer vos examens
                    </p>
                </div>

                <form action={formAction} className="mt-8 space-y-6">
                    <div className="space-y-4 rounded-md">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nom complet</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="school" className="block text-sm font-medium text-slate-700">Établissement</label>
                            <input
                                id="school"
                                name="school"
                                type="text"
                                placeholder="ex: Université de Yaoundé I"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-slate-700">Fonction</label>
                            <select
                                id="role"
                                name="role"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Directeur des Études">Directeur des Études</option>
                                <option value="Scolarité">Responsable Scolarité</option>
                                <option value="Enseignant">Enseignant</option>
                                <option value="Admin">Administrateur</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Mot de passe</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="text-sm font-medium text-red-600">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        S'inscrire
                    </button>

                    <p className="text-center text-sm text-slate-600">
                        Déjà un compte ?{" "}
                        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                            Se connecter
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
