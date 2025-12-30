"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { createCohort } from "@/app/actions/cohorts";
import { Loader2 } from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";

interface CohortModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LEVELS = ["L1", "L2", "L3", "M1", "M2", "Doctorat"];

export function CohortModal({ isOpen, onClose }: CohortModalProps) {
    const { primaryColor } = useBranding();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError(null);

        const result = await createCohort(formData);

        setIsSubmitting(false);

        if (result.success) {
            onClose();
        } else {
            setError(result.error || "Une erreur est survenue");
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une Cohorte">
            <form action={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="major" className="block text-sm font-medium text-slate-700">
                        Filière
                    </label>
                    <input
                        type="text"
                        name="major"
                        id="major"
                        required
                        placeholder="Ex: Informatique, Droit"
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="level" className="block text-sm font-medium text-slate-700">
                        Niveau
                    </label>
                    <select
                        name="level"
                        id="level"
                        required
                        className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        {LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="size" className="block text-sm font-medium text-slate-700">
                        Effectif (Étudiants)
                    </label>
                    <input
                        type="number"
                        name="size"
                        id="size"
                        required
                        min="1"
                        placeholder="Ex: 350"
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </button>
                </div>
            </form>
        </Modal>
    );
}
