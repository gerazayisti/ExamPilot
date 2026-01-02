"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, FileText, Users, Loader2 } from "lucide-react";
import { ExamModal } from "@/components/modals/ExamModal";
import { getExams, deleteExam } from "@/app/actions/exams";
import { useBranding } from "@/components/providers/BrandingProvider";
import { OnboardingTour } from "@/components/OnboardingTour";

interface Exam {
    id: string;
    duration: number;
    type: string;
    subject: {
        code: string;
        title: string;
        cohort: {
            major: string;
            level: string;
            size: number;
        };
    };
}

export default function ExamsPage() {
    const { primaryColor } = useBranding();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchExams = async () => {
        setIsLoading(true);
        const result = await getExams();
        if (result.success && result.data) {
            setExams(result.data as any);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchExams();
    }, [isModalOpen]);

    const handleDelete = async (id: string) => {
        if (confirm("Supprimer cet examen ?")) {
            await deleteExam(id);
            fetchExams();
        }
    };

    function formatDuration(minutes: number) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h${m > 0 ? m : ""}`;
    }

    return (
        <div className="space-y-6">
            <OnboardingTour />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Examens à Planifier</h2>
                    <p className="mt-1 text-slate-500">Définissez les épreuves pour la session d'examen.</p>
                </div>
                <button
                    id="exams-add-btn"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                >
                    <Plus className="-ml-0.5 mr-2 h-5 w-5" />
                    Ajouter un Examen
                </button>
            </div>

            {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
                </div>
            ) : exams.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                    <FileText className="h-10 w-10 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucun examen défini</h3>
                    <p className="mt-1 text-sm text-slate-500">Ajoutez des examens pour commencer la planification.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Matière</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cohorte</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Durée & Type</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {exams.map((exam) => (
                                <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="ml-0">
                                                <div className="text-sm font-bold text-slate-900">{exam.subject.code}</div>
                                                <div className="text-xs text-slate-500">{exam.subject.title}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-900 font-medium">{exam.subject.cohort.major} {exam.subject.cohort.level}</span>
                                            <span className="inline-flex items-center text-xs text-slate-500">
                                                <Users className="mr-1 h-3 w-3" />
                                                {exam.subject.cohort.size}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-4">
                                            <span
                                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                            >
                                                <Clock className="mr-1 h-3 w-3" />
                                                {formatDuration(exam.duration)}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                                {exam.type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(exam.id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ExamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
