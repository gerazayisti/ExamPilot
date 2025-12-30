"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Users, GraduationCap, ArrowRight, Loader2, FileUp } from "lucide-react";
import Link from "next/link";
import { CohortModal } from "@/components/modals/CohortModal";
import { ImportModal } from "@/components/modals/ImportModal";
import { getCohorts, deleteCohort } from "@/app/actions/cohorts";
import { importCohortsAndSubjects } from "@/app/actions/import";
import { useBranding } from "@/components/providers/BrandingProvider";

interface Cohort {
    id: string;
    major: string;
    level: string;
    size: number;
    _count: { subjects: number };
}

export default function CohortsPage() {
    const { primaryColor } = useBranding();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCohorts = async () => {
        setIsLoading(true);
        const result = await getCohorts();
        if (result.success && result.data) {
            setCohorts(result.data as any);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCohorts();
    }, [isModalOpen, isImportModalOpen]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Supprimer cette cohorte et toutes ses UE associées ?")) {
            await deleteCohort(id);
            fetchCohorts();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cohortes & UE</h2>
                    <p className="mt-1 text-slate-500">Gérez les filières, les niveaux et leurs unités d'enseignement.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                    >
                        <FileUp className="-ml-0.5 mr-2 h-5 w-5 text-slate-400" />
                        Importer
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Plus className="-ml-0.5 mr-2 h-5 w-5" />
                        Ajouter une Cohorte
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
                </div>
            ) : cohorts.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                    <Users className="h-10 w-10 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucune cohorte</h3>
                    <p className="mt-1 text-sm text-slate-500">Créez une cohorte pour commencer à lui associer des matières.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cohorts.map((cohort) => (
                        <Link
                            key={cohort.id}
                            href={`/dashboard/cohorts/${cohort.id}`}
                            className="group relative block rounded-lg border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md"
                            style={{ borderLeft: `4px solid ${primaryColor}` }}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors" style={{ groupHover: { color: primaryColor } } as any}>
                                        {cohort.major}
                                    </h3>
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                                        {cohort.level}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(cohort.id, e)}
                                    className="rounded-full p-2 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                                <div className="flex items-center font-medium">
                                    <Users className="mr-2 h-4 w-4" />
                                    {cohort.size} étudiants
                                </div>
                                <div className="flex items-center font-medium">
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    {cohort._count.subjects} UE
                                </div>
                            </div>

                            <div className="mt-4 flex items-center text-sm font-bold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: primaryColor }}>
                                Gérer les UE <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <CohortModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importCohortsAndSubjects}
                title="Importer Cohortes et UE"
                description="Téléversez un fichier Excel contenant vos filières, niveaux et UE. Le système créera automatiquement les cohortes et leurs matières associées."
                templateName="Cohortes_UE"
                templateData={[
                    { filiere: "Informatique", niveau: "L3", code: "INF301", ue: "Algorithmique avancée", duree: 120, type: "DS" },
                    { filiere: "Informatique", niveau: "L3", code: "INF302", ue: "Bases de données", duree: 90, type: "DS" },
                    { filiere: "Mathématiques", niveau: "M1", code: "MAT401", ue: "Analyse fonctionnelle", duree: 180, type: "DS" },
                ]}
            />
        </div>
    );
}
