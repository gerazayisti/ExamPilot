"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { SubjectModal } from "@/components/modals/SubjectModal";
import { getCohortById, deleteSubject } from "@/app/actions/cohorts";

interface Subject {
    id: string;
    code: string;
    title: string;
}

interface CohortDetail {
    id: string;
    major: string;
    level: string;
    size: number;
    subjects: Subject[];
}

export default function CohortDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cohort, setCohort] = useState<CohortDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCohort = async () => {
        setIsLoading(true);
        const result = await getCohortById(params.id as string);
        if (result.success && result.data) {
            setCohort(result.data);
        } else {
            router.push("/dashboard/cohorts");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (params.id) {
            fetchCohort();
        }
    }, [params.id, isModalOpen]);

    const handleDeleteSubject = async (id: string) => {
        if (confirm("Supprimer cette matière ?")) {
            await deleteSubject(id, params.id as string);
            fetchCohort();
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!cohort) return null;

    return (
        <div className="space-y-8">
            <div>
                <Link
                    href="/dashboard/cohorts"
                    className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Retour aux cohortes
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            {cohort.major} - {cohort.level}
                        </h2>
                        <div className="mt-2 flex items-center text-slate-600">
                            <Users className="mr-2 h-5 w-5" />
                            <span className="font-medium">{cohort.size} étudiants</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        <Plus className="-ml-0.5 mr-2 h-5 w-5" />
                        Ajouter une UE
                    </button>
                </div>
            </div>

            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-900">Unités d'Enseignement (UE)</h3>
                </div>

                {cohort.subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <BookOpen className="h-10 w-10 text-slate-300" />
                        <p className="mt-2 text-sm text-slate-500">Aucune matière configurée pour cette cohorte.</p>
                    </div>
                ) : (
                    <ul role="list" className="divide-y divide-slate-100">
                        {cohort.subjects.map((subject) => (
                            <li key={subject.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                                <div className="flex min-w-0 gap-x-4">
                                    <div className="min-w-0 flex-auto">
                                        <p className="text-sm font-semibold leading-6 text-slate-900">{subject.code}</p>
                                        <p className="mt-1 truncate text-xs leading-5 text-slate-500">{subject.title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteSubject(subject.id)}
                                    className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <SubjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                cohortId={cohort.id}
            />
        </div>
    );
}
