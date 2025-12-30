"use client";

import { useState, useEffect } from "react";
import { Building2, Users, BookOpen, CalendarCheck, Loader2 } from "lucide-react";
import { getDashboardStats } from "@/app/actions/stats";
import { useBranding } from "@/components/providers/BrandingProvider";

export default function DashboardPage() {
    const { primaryColor } = useBranding();
    const [stats, setStats] = useState({
        rooms: 0,
        cohorts: 0,
        exams: 0,
        placed: 0,
        recentSessions: [] as { id: string, name: string, createdAt: Date }[]
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getDashboardStats().then((result) => {
            if (result.success && result.data) {
                setStats(result.data);
            }
            setIsLoading(false);
        });
    }, []);

    const statConfig = [
        { name: 'Salles Configurées', value: stats.rooms, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
        { name: 'Cohortes Totales', value: stats.cohorts, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
        { name: 'Examens à Planifier', value: stats.exams, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
        { name: 'Examens Placés', value: stats.placed, icon: CalendarCheck, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
            </div>
        );
    }
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tableau de Bord</h2>
                <p className="mt-2 text-lg text-slate-600">Bienvenue sur ExamPilot. Configurez vos ressources pour commencer.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statConfig.map((stat) => (
                    <div key={stat.name} className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                            <div className={`rounded-lg p-3 ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* System Status Card */}
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">État du Système</h3>
                    {stats.rooms === 0 || stats.cohorts === 0 ? (
                        <div className="rounded-xl bg-yellow-50 p-5 border border-yellow-100">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 font-bold">!</div>
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-tight">Configuration Requise</h4>
                                    <p className="mt-1 text-sm text-yellow-700 leading-relaxed">
                                        Aucune donnée détectée. Pour commencer à générer des plannings, vous devez d'abord configurer vos salles et vos cohortes d'étudiants via le menu latéral.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-slate-50 p-5 border border-slate-200">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">✓</div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Système Prêt</h4>
                                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                        Vos ressources sont configurées et prêtes. L'algorithme de planification dispose de toutes les données nécessaires pour optimiser vos sessions d'examens.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Activity Card */}
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Sessions Récentes</h3>
                    {stats.recentSessions && (stats.recentSessions as any).length > 0 ? (
                        <div className="space-y-3">
                            {(stats.recentSessions as any).map((session: any) => (
                                <a
                                    key={session.id}
                                    href={`/dashboard/schedule?sessionId=${session.id}`}
                                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-all hover:bg-slate-100 hover:shadow-sm group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{session.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Créée le {new Date(session.createdAt).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-white text-slate-500 border border-slate-200 uppercase tracking-tighter">Voir</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune session générée</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
