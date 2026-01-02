"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Users, GraduationCap, ArrowRight, Loader2, FileUp, Search, LayoutGrid, List, Pencil } from "lucide-react";
import Link from "next/link";
import { CohortModal } from "@/components/modals/CohortModal";
import { ImportModal } from "@/components/modals/ImportModal";
import { getCohorts, deleteCohort } from "@/app/actions/cohorts";
import { importCohortsAndSubjects } from "@/app/actions/import";
import { useBranding } from "@/components/providers/BrandingProvider";
import { OnboardingTour } from "@/components/OnboardingTour";

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

    // New states
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedCohort, setSelectedCohort] = useState<Cohort | undefined>(undefined);

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

    const handleEdit = (cohort: Cohort, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedCohort(cohort);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCohort(undefined);
        setIsModalOpen(true);
    };

    const filteredCohorts = cohorts.filter(cohort =>
        cohort.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cohort.level.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <OnboardingTour />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cohortes & UE</h2>
                    <p className="mt-1 text-slate-500">Gérez les filières, les niveaux et leurs unités d'enseignement.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        id="cohorts-import-btn"
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                    >
                        <FileUp className="-ml-0.5 mr-2 h-5 w-5 text-slate-400" />
                        Importer
                    </button>
                    <button
                        id="cohorts-add-btn"
                        onClick={handleAdd}
                        className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Plus className="-ml-0.5 mr-2 h-5 w-5" />
                        Ajouter une Cohorte
                    </button>
                </div>
            </div>

            {/* Search and View Toggle Bar */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="cohorts-search-input"
                        type="text"
                        placeholder="Rechercher une filière..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                </div>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-1">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`rounded p-1.5 transition-colors ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        title="Vue Grille"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`rounded p-1.5 transition-colors ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        title="Vue Liste"
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
                </div>
            ) : filteredCohorts.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                    <Users className="h-10 w-10 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucune cohorte trouvée</h3>
                    <p className="mt-1 text-sm text-slate-500">Modifiez votre recherche ou ajoutez une nouvelle cohorte.</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCohorts.map((cohort) => (
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
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => handleEdit(cohort, e)}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 z-10 relative" // z-10 to be clickable over Link
                                        title="Modifier"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(cohort.id, e)}
                                        className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 z-10 relative"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
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
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 bg-white">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Filière</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Niveau</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Effectif</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">UE Associées</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredCohorts.map((cohort) => (
                                <tr key={cohort.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">
                                        <Link href={`/dashboard/cohorts/${cohort.id}`} className="hover:underline">
                                            {cohort.major}
                                        </Link>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                            {cohort.level}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{cohort.size} étudiants</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{cohort._count.subjects} UE</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/dashboard/cohorts/${cohort.id}`}
                                                className="text-slate-400 hover:text-slate-600 mr-2"
                                                title="Gérer les UE"
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={(e) => handleEdit(cohort, e)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Modifier"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(cohort.id, e)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CohortModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} cohort={selectedCohort} />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importCohortsAndSubjects}
                title="Importer Cohortes et UE"
                description="Téléversez un fichier Excel contenant vos filières, niveaux et UE. Le système créera automatiquement les cohortes et leurs matières associées."
                templateName="Cohortes_UE"
                templateData={[
                    { filiere: "Informatique", niveau: "L3", effectif: 30, code: "INF301", ue: "Algorithmique avancée", duree: 120, type: "DS" },
                    { filiere: "Informatique", niveau: "L3", effectif: 30, code: "INF302", ue: "Bases de données", duree: 90, type: "DS" },
                    { filiere: "Mathématiques", niveau: "M1", effectif: 28, code: "MAT401", ue: "Analyse fonctionnelle", duree: 180, type: "DS" },
                ]}
            />
        </div>
    );
}
