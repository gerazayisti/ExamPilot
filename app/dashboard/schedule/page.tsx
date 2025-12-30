"use client";

import { useState, useEffect } from "react";
import {
    Calendar, Play, Loader2, Building, Clock, MapPin,
    History, LayoutGrid, List, Download, ChevronRight,
    FileText, Table as TableIcon, AlertCircle
} from "lucide-react";
import { generateScheduleAction } from "@/app/actions/scheduler";
import { getSessions, getSessionSchedule } from "@/app/actions/sessions";
import { Modal } from "@/components/ui/Modal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useBranding } from "@/components/providers/BrandingProvider";
import React from "react";

interface ScheduleItem {
    id: string;
    exam: {
        type: string;
        duration: number;
        subject: {
            code: string;
            title: string;
            cohort: { major: string; level: string; size: number };
        };
    };
    room: { name: string; location: string };
    timeSlot: { startTime: Date | string; endTime: Date | string };
}

interface Session {
    id: string;
    name: string;
    createdAt: Date | string;
}

export default function SchedulePage() {
    const { primaryColor } = useBranding();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"card" | "table">("card");

    // Generation Modal States
    const [isGenModalOpen, setIsGenModalOpen] = useState(false);
    const [genSessionName, setGenSessionName] = useState("");
    const [startDate, setStartDate] = useState("2026-01-12");
    const [endDate, setEndDate] = useState("2026-01-20");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || "Session";
        doc.setFontSize(18);
        doc.text(`Planning des Examens - ${sessionName}`, 14, 15);

        const tableData: any[] = [];

        // Group data just like in the UI
        const grouped: Record<string, Record<string, ScheduleItem[]>> = {};
        schedule.forEach(item => {
            const date = new Date(item.timeSlot.startTime).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
            });
            const hour = new Date(item.timeSlot.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

            if (!grouped[date]) grouped[date] = {};
            if (!grouped[date][hour]) grouped[date][hour] = [];
            grouped[date][hour].push(item);
        });

        Object.entries(grouped).forEach(([date, hours]) => {
            // Add Date Header Row
            tableData.push([
                { content: date.toUpperCase(), colSpan: 6, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42] } }
            ]);

            Object.entries(hours).forEach(([hour, items]) => {
                items.forEach((item, idx) => {
                    const row: any[] = [];
                    if (idx === 0) {
                        row.push({ content: hour, rowSpan: items.length, styles: { fontStyle: 'bold', textColor: [30, 41, 59] } });
                    }
                    row.push(item.exam.subject.code);
                    row.push(`${item.exam.subject.title}\n(${item.exam.type})`);
                    row.push(item.exam.subject.cohort.major);
                    row.push(item.exam.subject.cohort.level);
                    row.push(item.room.name);
                    tableData.push(row);
                });
            });
        });

        autoTable(doc, {
            startY: 25,
            head: [['Heure', 'Code', 'Examen', 'Filière', 'Niveau', 'Salle']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 25 },
                2: { cellWidth: 50 },
                5: { cellWidth: 25 }
            }
        });

        doc.save(`Planning_${sessionName.replace(/\s+/g, '_')}.pdf`);
    };

    const handleExportExcel = () => {
        const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || "Session";
        const data: any[][] = [];
        const merges: XLSX.Range[] = [];

        // Header Row
        data.push(['Planning des Examens - ' + sessionName]);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
        data.push([]); // Empty row
        data.push(['Heure', 'Code', 'Examen', 'Filière', 'Niveau', 'Salle']);

        let currentRow = 3;

        // Group data for Excel
        const grouped: Record<string, Record<string, ScheduleItem[]>> = {};
        schedule.forEach(item => {
            const date = new Date(item.timeSlot.startTime).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
            });
            const hour = new Date(item.timeSlot.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

            if (!grouped[date]) grouped[date] = {};
            if (!grouped[date][hour]) grouped[date][hour] = [];
            grouped[date][hour].push(item);
        });

        Object.entries(grouped).forEach(([date, hours]) => {
            // Date Header
            data.push([date.toUpperCase()]);
            merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 5 } });
            currentRow++;

            Object.entries(hours).forEach(([hour, items]) => {
                const hourStartRow = currentRow;
                items.forEach((item) => {
                    data.push([
                        hour,
                        item.exam.subject.code,
                        `${item.exam.subject.title} (${item.exam.type})`,
                        item.exam.subject.cohort.major,
                        item.exam.subject.cohort.level,
                        item.room.name
                    ]);
                    currentRow++;
                });

                if (items.length > 1) {
                    merges.push({ s: { r: hourStartRow, c: 0 }, e: { r: currentRow - 1, c: 0 } });
                }
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!merges'] = merges;

        // Column widths
        ws['!cols'] = [
            { wch: 10 }, // Heure
            { wch: 15 }, // Code
            { wch: 40 }, // Examen
            { wch: 20 }, // Filière
            { wch: 10 }, // Niveau
            { wch: 15 }  // Salle
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Planning");
        XLSX.writeFile(wb, `Planning_${sessionName.replace(/\s+/g, '_')}.xlsx`);
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        const sResult = await getSessions();
        if (sResult.success && sResult.data && sResult.data.length > 0) {
            setSessions(sResult.data as any);
            setSelectedSessionId(sResult.data[0].id);
            fetchSessionSchedule(sResult.data[0].id);
        } else {
            setIsLoading(false);
        }
    };

    const fetchSessionSchedule = async (sessionId: string) => {
        setIsLoading(true);
        const result = await getSessionSchedule(sessionId);
        if (result.success && result.data) {
            setSchedule(result.data as any);
        }
        setIsLoading(false);
    };

    const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sid = e.target.value;
        setSelectedSessionId(sid);
        fetchSessionSchedule(sid);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        const result = (await generateScheduleAction(startDate, endDate, genSessionName)) as any;
        setIsGenerating(false);

        if (result.success) {
            alert(`Planning généré avec succès !`);
            setIsGenModalOpen(false);
            fetchInitialData();
        } else {
            alert(result.error);
        }
    };

    // Group by date
    const groupedSchedule: Record<string, ScheduleItem[]> = {};
    schedule.forEach((item) => {
        const d = new Date(item.timeSlot.startTime).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
        if (!groupedSchedule[d]) groupedSchedule[d] = [];
        groupedSchedule[d].push(item);
    });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Planning des Examens</h2>
                    <p className="mt-1 text-slate-500">Consultez l'historique ou générez une nouvelle session.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode("card")}
                            className={`p-1.5 rounded transition-all ${viewMode === "card" ? "shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                            style={viewMode === "card" ? { backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}30` } : {}}
                            title="Vue Cartes"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded transition-all ${viewMode === "table" ? "shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                            style={viewMode === "table" ? { backgroundColor: `${primaryColor}15`, color: primaryColor, borderColor: `${primaryColor}30` } : {}}
                            title="Vue Tableau"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    {/* Session Selector */}
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-slate-400" />
                        <select
                            value={selectedSessionId}
                            onChange={handleSessionChange}
                            className="rounded-md border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 transition-all"
                            style={{ '--tw-ring-color': primaryColor, borderColor: `${primaryColor}40`, color: primaryColor } as any}
                        >
                            <option value="" disabled>Choisir une session...</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({new Date(s.createdAt).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setIsGenModalOpen(true)}
                        className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        Nouvelle Session
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
                </div>
            ) : schedule.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                    <Calendar className="h-10 w-10 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucun planning trouvé</h3>
                    <p className="mt-1 text-sm text-slate-500">Lancez une nouvelle génération pour commencer.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {viewMode === "card" ? (
                        Object.entries(groupedSchedule).map(([date, items]) => (
                            <div key={date} className="space-y-4">
                                <h3 className="flex items-center text-lg font-bold capitalize text-slate-900">
                                    <Calendar className="mr-2 h-5 w-5" style={{ color: primaryColor }} />
                                    {date}
                                </h3>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                    {items.map((item) => (
                                        <CardItem key={item.id} item={item} primaryColor={primaryColor} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Heure</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">UE / Examen</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">FILIERE</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Salle</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {Object.entries(groupedSchedule).map(([date, dateItems]) => {
                                        // Within each date, further group by hour
                                        const hourGroups: Record<string, ScheduleItem[]> = {};
                                        dateItems.forEach(item => {
                                            const hour = new Date(item.timeSlot.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                                            if (!hourGroups[hour]) hourGroups[hour] = [];
                                            hourGroups[hour].push(item);
                                        });

                                        return (
                                            <React.Fragment key={date}>
                                                {/* Date Header Row */}
                                                <tr className="bg-slate-100/50">
                                                    <td colSpan={4} className="px-6 py-2 text-sm font-black text-slate-900 uppercase tracking-widest border-y border-slate-200">
                                                        {date}
                                                    </td>
                                                </tr>
                                                {Object.entries(hourGroups).map(([hour, hourItems]) => (
                                                    <React.Fragment key={hour}>
                                                        {hourItems.map((item, idx) => (
                                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-slate-200">
                                                                {idx === 0 ? (
                                                                    <td
                                                                        rowSpan={hourItems.length}
                                                                        className="whitespace-nowrap px-6 py-4 text-sm font-black text-slate-900 border-r border-slate-100 align-top"
                                                                        style={{ color: primaryColor }}
                                                                    >
                                                                        {hour}
                                                                    </td>
                                                                ) : null}
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm font-bold text-slate-900">{item.exam.subject.code}</div>
                                                                    <div className="text-xs text-slate-500">{item.exam.subject.title} ({item.exam.type})</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                                    <div className="font-medium text-slate-900">{item.exam.subject.cohort.major}</div>
                                                                    <div className="text-xs text-slate-500">{item.exam.subject.cohort.level}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                                    <span className="font-bold text-slate-800">{item.room.name}</span>
                                                                    <span className="block text-xs text-slate-400">{item.room.location}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Action Bar */}
            {schedule.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md transition-all">
                    <div className="flex items-center gap-2 px-3 pr-5 border-r border-slate-700">
                        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span>{schedule.length} sessions</span>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-full font-bold transition-colors"
                        style={{ color: primaryColor }}
                    >
                        <FileText className="h-4 w-4" />
                        PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-full text-green-400 font-bold transition-colors"
                    >
                        <TableIcon className="h-4 w-4" />
                        Excel
                    </button>
                </div>
            )}

            {/* Generation Modal */}
            <Modal isOpen={isGenModalOpen} onClose={() => setIsGenModalOpen(false)} title="Générer un planning">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Nom de la session</label>
                        <input
                            type="text"
                            required
                            placeholder="ex: Session Janvier 2026"
                            value={genSessionName}
                            onChange={(e) => setGenSessionName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': `${primaryColor}33`, focusBorderColor: primaryColor } as any}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Début</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                style={{ '--tw-ring-color': primaryColor, borderColor: 'var(--tw-ring-color)' } as any}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Fin</label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                style={{ '--tw-ring-color': primaryColor, borderColor: 'var(--tw-ring-color)' } as any}
                            />
                        </div>
                    </div>
                    <div className="p-3 rounded-lg flex gap-3 text-xs bg-slate-50 border border-slate-200">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-slate-400" />
                        <p className="text-slate-600">De nouvelles sessions seront générées. L'historique des sessions précédentes sera conservé.</p>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsGenModalOpen(false)}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Lancer la Génération
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function CardItem({ item, primaryColor }: { item: ScheduleItem; primaryColor: string }) {
    const startTime = new Date(item.timeSlot.startTime).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            style={{ borderLeft: `4px solid ${primaryColor}` }}
        >
            <div className="flex items-center justify-between">
                <span
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase"
                    style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                >
                    {startTime}
                </span>
                <span className="text-xs font-medium text-slate-400">
                    {item.exam.type}
                </span>
            </div>

            <div className="mt-3">
                <h4 className="text-sm font-bold text-slate-900 transition-colors" style={{ groupHover: { color: primaryColor } } as any}>
                    {item.exam.subject.code} - {item.exam.subject.title}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                    {item.exam.subject.cohort.major} {item.exam.subject.cohort.level} ({item.exam.subject.cohort.size} étu.)
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 text-xs">
                <div className="flex items-center text-slate-600">
                    <Building className="mr-1 h-3.5 w-3.5" />
                    <span className="font-semibold">{item.room.name}</span>
                </div>
                <div className="flex items-center text-slate-400">
                    <MapPin className="mr-1 h-3 w-3" />
                    {item.room.location}
                </div>
            </div>
        </div>
    );
}
