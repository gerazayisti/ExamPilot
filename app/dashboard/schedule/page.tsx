"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Calendar, Play, Loader2, Building, Clock, MapPin,
    History, LayoutGrid, List, Download, ChevronRight,
    FileText, Table as TableIcon, AlertCircle, Trash2
} from "lucide-react";
import { generateScheduleAction } from "@/app/actions/scheduler";
import { getSessions, getSessionSchedule, deleteSession } from "@/app/actions/sessions";
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

    // Processed Schedule for Display and Export
    const processedSchedule = useMemo(() => {
        // 1. Sort
        const sorted = [...schedule].sort((a, b) => {
            const timeA = new Date(a.timeSlot.startTime).getTime();
            const timeB = new Date(b.timeSlot.startTime).getTime();
            if (timeA !== timeB) return timeA - timeB;

            // Then by Major (Filière)
            const majorA = a.exam.subject.cohort.major;
            const majorB = b.exam.subject.cohort.major;
            if (majorA !== majorB) return majorA.localeCompare(majorB);

            // Then by Level (Niveau)
            const levelA = a.exam.subject.cohort.level;
            const levelB = b.exam.subject.cohort.level;
            if (levelA !== levelB) return levelA.localeCompare(levelB);

            // Then by Code
            return a.exam.subject.code.localeCompare(b.exam.subject.code);
        });

        // 2. Calculate RowSpans
        const rows = sorted.map(item => {
            const date = new Date(item.timeSlot.startTime).toLocaleDateString("fr-FR", {
                weekday: "long", day: "numeric", month: "long"
            });
            const time = new Date(item.timeSlot.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

            return {
                id: item.id,
                date,
                time,
                level: item.exam.subject.cohort.level,
                code: item.exam.subject.code,
                major: item.exam.subject.cohort.major,
                room: item.room.name,
                size: item.exam.subject.cohort.size,
                raw: item,
                spans: {
                    date: 1,
                    time: 1,
                    major: 1,
                    level: 1,
                    code: 1
                }
            };
        });

        // Traverse to calculate spans
        for (let i = 0; i < rows.length; i++) {
            // DATE SPAN
            if (rows[i].spans.date > 0) {
                let j = i + 1;
                while (j < rows.length && rows[j].date === rows[i].date) {
                    rows[i].spans.date++;
                    rows[j].spans.date = 0;
                    j++;
                }
            }

            // TIME SPAN (Within same Date)
            if (rows[i].spans.time > 0) {
                let j = i + 1;
                while (j < rows.length && rows[j].time === rows[i].time && rows[j].date === rows[i].date) {
                    rows[i].spans.time++;
                    rows[j].spans.time = 0;
                    j++;
                }
            }

            // MAJOR SPAN (Within same Time)
            if (rows[i].spans.major > 0) {
                let j = i + 1;
                while (j < rows.length && rows[j].major === rows[i].major && rows[j].time === rows[i].time && rows[j].date === rows[i].date) {
                    rows[i].spans.major++;
                    rows[j].spans.major = 0;
                    j++;
                }
            }

            // LEVEL SPAN (Within same Major)
            if (rows[i].spans.level > 0) {
                let j = i + 1;
                while (j < rows.length && rows[j].level === rows[i].level && rows[j].major === rows[i].major && rows[j].time === rows[i].time && rows[j].date === rows[i].date) {
                    rows[i].spans.level++;
                    rows[j].spans.level = 0;
                    j++;
                }
            }

            // CODE SPAN (Within same Level)
            if (rows[i].spans.code > 0) {
                let j = i + 1;
                while (j < rows.length && rows[j].code === rows[i].code && rows[j].level === rows[i].level && rows[j].major === rows[i].major && rows[j].time === rows[i].time && rows[j].date === rows[i].date) {
                    rows[i].spans.code++;
                    rows[j].spans.code = 0;
                    j++;
                }
            }
        }

        return rows;
    }, [schedule]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || "Session";
        doc.setFontSize(18);
        doc.text(`Planning - ${sessionName}`, 14, 15);

        // Columns: Date, Heure, Filière, Niveau, Code UE, Salle, Effectif
        const headers = [['Date', 'Heure', 'Filière', 'Niveau', 'Code UE', 'Salle', 'Effectif']];
        const body = processedSchedule.map(row => {
            const rowData: any[] = [];

            if (row.spans.date > 0) {
                rowData.push({ content: row.date.toUpperCase(), rowSpan: row.spans.date, styles: { valign: 'middle', fillColor: [248, 250, 252] as any } });
            }
            if (row.spans.time > 0) {
                rowData.push({ content: row.time, rowSpan: row.spans.time, styles: { valign: 'middle' } });
            }
            if (row.spans.major > 0) {
                rowData.push({ content: row.major, rowSpan: row.spans.major, styles: { valign: 'middle' } });
            }
            if (row.spans.level > 0) {
                rowData.push({ content: row.level, rowSpan: row.spans.level, styles: { valign: 'middle' } });
            }
            if (row.spans.code > 0) {
                rowData.push({ content: row.code, rowSpan: row.spans.code, styles: { valign: 'middle', fontStyle: 'bold' } });
            }

            rowData.push(row.room);
            rowData.push(row.size);

            return rowData;
        });

        autoTable(doc, {
            startY: 25,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 15 },
                2: { cellWidth: 40 },
                3: { cellWidth: 15 },
                4: { cellWidth: 25 },
                5: { cellWidth: 30 },
                6: { cellWidth: 15 },
            },
        });

        doc.save(`Planning_${sessionName.replace(/\s+/g, '_')}.pdf`);
    };

    const handleExportExcel = () => {
        const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || "Session";
        const data: any[][] = [];
        const merges: XLSX.Range[] = [];

        // Header Row
        data.push(['Planning - ' + sessionName]);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
        data.push([]);

        // Columns: Date, Heure, Filière, Niveau, Code UE, Salle, Effectif
        const headers = ['Date', 'Heure', 'Filière', 'Niveau', 'Code UE', 'Salle', 'Effectif'];
        data.push(headers);

        let currentRow = 3; // 0-indexed, so 4th row

        processedSchedule.forEach((row) => {
            data.push([
                row.date.toUpperCase(),
                row.time,
                row.major,
                row.level,
                row.code,
                row.room,
                row.size
            ]);

            // Add merges
            // Date (Col 0)
            if (row.spans.date > 1) {
                merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + row.spans.date - 1, c: 0 } });
            }
            // Time (Col 1)
            if (row.spans.time > 1) {
                merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow + row.spans.time - 1, c: 1 } });
            }
            // Major (Col 2)
            if (row.spans.major > 1) {
                merges.push({ s: { r: currentRow, c: 2 }, e: { r: currentRow + row.spans.major - 1, c: 2 } });
            }
            // Level (Col 3)
            if (row.spans.level > 1) {
                merges.push({ s: { r: currentRow, c: 3 }, e: { r: currentRow + row.spans.level - 1, c: 3 } });
            }
            // Code (Col 4)
            if (row.spans.code > 1) {
                merges.push({ s: { r: currentRow, c: 4 }, e: { r: currentRow + row.spans.code - 1, c: 4 } });
            }

            currentRow++;
        });

        // Clean up data for spanned cells (Excel expects value in top-left, others can be empty or same)
        // Actually, for Excel merge, we just need to verify we aren't overwriting. 
        // Logic above pushes data every row. It's fine, merges will just cover them. 
        // Ideally we should empty the spanned cells for clarity if unmerged, but with native merge it doesn't matter visually.

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!merges'] = merges;
        // Adjusted widths: Date, Time, Major, Level, Code, Room, Size
        ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 10 }];

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

    const handleDeleteSession = async () => {
        if (!selectedSessionId) return;

        if (confirm("Êtes-vous sûr de vouloir supprimer cette session de planning ? Cette action est irréversible.")) {
            const result = await deleteSession(selectedSessionId);
            if (result.success) {
                // Refresh list
                await fetchInitialData();
            } else {
                alert("Erreur lors de la suppression : " + result.error);
            }
        }
    };

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
                        {selectedSessionId && (
                            <button
                                onClick={handleDeleteSession}
                                className="p-2 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                title="Supprimer cette session"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
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
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            {processedSchedule.map((item) => (
                                <CardItem key={item.id} item={item.raw} primaryColor={primaryColor} />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Heure</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Filière</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Niveau</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Code UE</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Salle</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Effectif</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {processedSchedule.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            {row.spans.date > 0 && (
                                                <td
                                                    rowSpan={row.spans.date}
                                                    className="px-6 py-4 text-sm font-bold text-slate-900 border-r border-slate-100 align-top uppercase"
                                                    style={{ backgroundColor: '#f8fafc' }}
                                                >
                                                    {row.date}
                                                </td>
                                            )}
                                            {row.spans.time > 0 && (
                                                <td
                                                    rowSpan={row.spans.time}
                                                    className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap align-top font-medium"
                                                >
                                                    {row.time}
                                                </td>
                                            )}
                                            {row.spans.major > 0 ? (
                                                <td
                                                    rowSpan={row.spans.major}
                                                    className="px-6 py-4 text-sm text-slate-700 align-middle"
                                                >
                                                    {row.major}
                                                </td>
                                            ) : null}
                                            {row.spans.level > 0 && (
                                                <td
                                                    rowSpan={row.spans.level}
                                                    className="px-6 py-4 text-sm text-slate-700 align-top"
                                                >
                                                    {row.level}
                                                </td>
                                            )}
                                            {row.spans.code > 0 ? (
                                                <td
                                                    rowSpan={row.spans.code}
                                                    className="px-6 py-4 text-sm font-bold text-slate-900 align-middle"
                                                >
                                                    {row.code}
                                                </td>
                                            ) : null}
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                <span className="font-medium text-slate-900">{row.room}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">{row.size}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Action Bar */}
            {schedule.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md transition-all z-50">
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

    const date = new Date(item.timeSlot.startTime).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric"
    });

    return (
        <div
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            style={{ borderLeft: `4px solid ${primaryColor}` }}
        >
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase bg-slate-100 text-slate-600">
                        {date}
                    </span>
                    <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase"
                        style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                    >
                        {startTime}
                    </span>
                </div>
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
