"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { createExam, createBatchExams, getSubjectsForExam } from "@/app/actions/exams";
import { getCohorts } from "@/app/actions/cohorts";
import { Loader2, Plus, Users } from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";

interface ExamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Subject {
    id: string;
    code: string;
    title: string;
    cohort: {
        major: string;
        level: string;
    };
}

interface Cohort {
    id: string;
    major: string;
    level: string;
}

export function ExamModal({ isOpen, onClose }: ExamModalProps) {
    const { primaryColor } = useBranding();
    const [mode, setMode] = useState<"single" | "batch">("single");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            getSubjectsForExam().then((result) => {
                if (result.success && result.data) {
                    setSubjects(result.data);
                }
            });
            getCohorts().then((result) => {
                if (result.success && result.data) {
                    setCohorts(result.data as any);
                }
            });
        }
    }, [isOpen]);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError(null);

        let result;
        if (mode === "single") {
            result = await createExam(formData);
        } else {
            const duration = parseInt(formData.get("duration") as string, 10);
            const type = formData.get("type") as string;
            result = await createBatchExams(selectedCohorts, duration, type);
        }

        setIsSubmitting(false);

        if (result.success) {
            setSelectedCohorts([]);
            onClose();
        } else {
            setError(result.error || "Une erreur est survenue");
        }
    }

    const toggleCohort = (id: string) => {
        setSelectedCohorts((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === "single" ? "Définir un Examen" : "Ajout Groupé par Cohorte"}>
            <div className="mb-6 flex overflow-hidden rounded-lg border border-slate-200">
                <button
                    onClick={() => setMode("single")}
                    className={`flex-1 px-4 py-2 text-sm font-bold transition-all ${mode === "single" ? "text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    style={mode === "single" ? { backgroundColor: primaryColor } : {}}
                >
                    Individuel
                </button>
                <button
                    onClick={() => setMode("batch")}
                    className={`flex-1 px-4 py-2 text-sm font-bold transition-all ${mode === "batch" ? "text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    style={mode === "batch" ? { backgroundColor: primaryColor } : {}}
                >
                    Par Cohorte
                </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
                {mode === "single" ? (
                    <div>
                        <label htmlFor="subjectId" className="block text-sm font-medium text-slate-700">
                            Matière (UE)
                        </label>
                        <select
                            name="subjectId"
                            id="subjectId"
                            required
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Sélectionner une matière...</option>
                            {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.code} - {sub.title} ({sub.cohort.major} {sub.cohort.level})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Sélectionner les Cohortes
                        </label>

                        {/* Quick Level Selection */}
                        <div className="mb-3 flex flex-wrap gap-2">
                            {Array.from(new Set(cohorts.map(c => c.level))).sort().map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => {
                                        const cohortsToSelect = cohorts.filter(c => c.level === level).map(c => c.id);
                                        const allSelected = cohortsToSelect.every(id => selectedCohorts.includes(id));

                                        if (allSelected) {
                                            // Deselect all
                                            setSelectedCohorts(prev => prev.filter(id => !cohortsToSelect.includes(id)));
                                        } else {
                                            // Select all
                                            setSelectedCohorts(prev => [...new Set([...prev, ...cohortsToSelect])]);
                                        }
                                    }}
                                    className="px-2 py-1 text-xs font-semibold rounded border transition-colors"
                                    style={{
                                        borderColor: primaryColor,
                                        color: selectedCohorts.some(id => cohorts.find(c => c.id === id)?.level === level) ? "white" : primaryColor,
                                        backgroundColor: selectedCohorts.some(id => cohorts.find(c => c.id === id)?.level === level) ? primaryColor : "transparent"
                                    }}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 p-2 space-y-1">
                            {cohorts.map((cohort) => (
                                <label key={cohort.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedCohorts.includes(cohort.id)}
                                        onChange={() => toggleCohort(cohort.id)}
                                        className="h-4 w-4 rounded border-slate-300 focus:ring-primary"
                                        style={{ color: primaryColor }}
                                    />
                                    <span className="text-sm text-slate-700">
                                        {cohort.major} - {cohort.level}
                                    </span>
                                </label>
                            ))}
                            {cohorts.length === 0 && (
                                <p className="text-sm text-slate-500 p-2">Aucune cohorte disponible</p>
                            )}
                        </div>
                        {selectedCohorts.length > 0 && (
                            <p className="mt-1 text-xs font-bold" style={{ color: primaryColor }}>
                                {selectedCohorts.length} cohorte{selectedCohorts.length > 1 ? 's' : ''} sélectionnée{selectedCohorts.length > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-slate-700">
                            Durée
                        </label>
                        <select
                            name="duration"
                            id="duration"
                            required
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="60">1h (60 min)</option>
                            <option value="90">1h30 (90 min)</option>
                            <option value="120">2h (120 min)</option>
                            <option value="180">3h (180 min)</option>
                            <option value="240">4h (240 min)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                            Type d'épreuve
                        </label>
                        <select
                            name="type"
                            id="type"
                            required
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="Écrit">Écrit</option>
                            <option value="Oral">Oral</option>
                            <option value="Pratique">Pratique</option>
                        </select>
                    </div>
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
                        disabled={isSubmitting || (mode === "batch" && selectedCohorts.length === 0)}
                        className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "batch" ? "Ajouter UE Concernées" : "Enregistrer"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
