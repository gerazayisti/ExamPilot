"use client";

import { useState, useRef, useEffect } from "react";
import { useBranding } from "@/components/providers/BrandingProvider";
import { updateSettings, getSettings } from "@/app/actions/settings";
import { Save, Upload, Palette, CheckCircle, Loader2, Image as ImageIcon, Users } from "lucide-react";

export default function SettingsPage() {
    const { primaryColor, logoUrl, appName, updateBranding } = useBranding();
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<"general" | "exams">("general");

    const [form, setForm] = useState({
        appName: appName,
        primaryColor: primaryColor,
        logoUrl: logoUrl || "",
        examInterStudentGap: 0,
        maxExamsPerDay: 2,
        maxConsecutiveExams: 2
    });

    useEffect(() => {
        // Fetch full settings to get the gap value which isn't in branding context
        getSettings().then(settings => {
            if (settings) {
                setForm(f => ({
                    ...f,
                    examInterStudentGap: settings.examInterStudentGap || 0,
                    maxExamsPerDay: settings.maxExamsPerDay || 2,
                    maxConsecutiveExams: settings.maxConsecutiveExams || 2
                }));
            }
        });
    }, []);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit for Base64 storage
                setFeedback({ type: "error", message: "Le logo est trop lourd (max 1Mo)." });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm({ ...form, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setFeedback(null);

        const result = await updateSettings(form);

        if (result.success) {
            updateBranding(form);
            setFeedback({ type: "success", message: "Paramètres enregistrés avec succès !" });
        } else {
            setFeedback({ type: "error", message: "Une erreur est survenue lors de l'enregistrement." });
        }
        setIsSaving(false);
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Paramètres de l'application</h2>
                <p className="mt-1 text-slate-500">Personnalisez l'apparence et l'identité de votre plateforme.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                            ${activeTab === "general"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"}
                        `}
                    >
                        Apparence & Identité
                    </button>
                    <button
                        onClick={() => setActiveTab("exams")}
                        className={`
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                            ${activeTab === "exams"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"}
                        `}
                    >
                        Configuration Examen
                    </button>
                </nav>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="space-y-6 md:col-span-2">
                    {activeTab === "general" && (
                        <>
                            {/* Identity Section */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="flex items-center text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
                                    <ImageIcon className="mr-2 h-5 w-5" style={{ color: form.primaryColor }} />
                                    Identité Visuelle
                                </h3>

                                <div className="mt-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Nom de l'application</label>
                                        <input
                                            type="text"
                                            value={form.appName}
                                            onChange={(e) => setForm({ ...form, appName: e.target.value })}
                                            className="mt-2 block w-full rounded-md px-3 py-2 text-sm shadow-sm"
                                            placeholder="ex: ExamPilot"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Logo de la Sidebar</label>
                                        <div className="mt-2 flex items-center gap-6">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-2">
                                                {form.logoUrl ? (
                                                    <img src={form.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                                ) : (
                                                    <ImageIcon className="h-8 w-8 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleLogoUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Charger un logo
                                                </button>
                                                {form.logoUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm({ ...form, logoUrl: "" })}
                                                        className="ml-2 text-xs font-medium text-red-600 hover:underline"
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                                <p className="text-xs text-slate-500">
                                                    PNG, SVG ou JPG. Taille recommandée : 40px de hauteur. Max 1Mo.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Colors Section */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="flex items-center text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
                                    <Palette className="mr-2 h-5 w-5" style={{ color: form.primaryColor }} />
                                    Charte Graphique
                                </h3>

                                <div className="mt-6">
                                    <label className="block text-sm font-bold text-slate-700">Couleur Primaire</label>
                                    <div className="mt-3 flex items-center gap-4">
                                        <div
                                            className="h-14 w-14 overflow-hidden rounded-xl border-2 shadow-sm transition-transform hover:scale-105"
                                            style={{ borderColor: form.primaryColor }}
                                        >
                                            <input
                                                type="color"
                                                value={form.primaryColor}
                                                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                                                className="h-full w-full cursor-pointer border-none bg-transparent"
                                                style={{ transform: 'scale(1.5)' }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={form.primaryColor}
                                                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                                                className="block w-full rounded-md px-3 py-2 text-sm font-mono shadow-sm"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Palettes Recommandées</span>
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#0ea5e9", "#8b5cf6", "#1e293b"].map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => setForm({ ...form, primaryColor: c })}
                                                    className="h-10 w-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200 transition-all hover:scale-110 active:scale-95"
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {/* Exam Configuration Section */}
                    {activeTab === "exams" && (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="flex items-center text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
                                <Users className="mr-2 h-5 w-5" style={{ color: form.primaryColor }} />
                                Configuration des Examens
                            </h3>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700">
                                        Ecart entre étudiants (places vides)
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">
                                        Nombre de places à laisser vides entre deux étudiants pour éviter la triche.
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            value={form.examInterStudentGap}
                                            onChange={(e) => setForm({ ...form, examInterStudentGap: parseInt(e.target.value) || 0 })}
                                            className="block w-24 rounded-md border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                        <div className="text-sm text-slate-600">
                                            places vides
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700">
                                        Limites par Étudiant
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">
                                        Contraintes pour générer un planning équilibré et sans surcharge.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Max examens / jour</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                value={form.maxExamsPerDay}
                                                onChange={(e) => setForm({ ...form, maxExamsPerDay: parseInt(e.target.value) || 1 })}
                                                className="block w-20 rounded-md border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Max examens successifs</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                value={form.maxConsecutiveExams}
                                                onChange={(e) => setForm({ ...form, maxConsecutiveExams: parseInt(e.target.value) || 1 })}
                                                className="block w-20 rounded-md border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {feedback && (
                        <div className={`flex items-center gap-3 rounded-lg p-4 text-sm font-medium shadow-sm border ${feedback.type === "success"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-red-50 text-red-700 border-red-100"
                            }`}>
                            {feedback.type === "success" ? <CheckCircle className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
                            {feedback.message}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center rounded-lg px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                            style={{ backgroundColor: form.primaryColor }}
                        >
                            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                            Enregistrer les changements
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Aperçu Sidebar</h3>
                        <div className="mt-6 rounded-lg overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
                            {/* Mini Sidebar Preview */}
                            <div className="bg-slate-900 p-4 pt-6 space-y-6">
                                <div className="flex items-center gap-2">
                                    {form.logoUrl ? (
                                        <img src={form.logoUrl} alt="Logo" className="max-h-8 max-w-[80%] object-contain" />
                                    ) : (
                                        <span className="text-xl font-black tracking-tight" style={{ color: form.primaryColor }}>{form.appName}</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="h-8 w-full rounded-md opacity-20" style={{ backgroundColor: form.primaryColor }}></div>
                                    <div className="h-8 w-full rounded-md bg-white/10" style={{ borderLeft: `3px solid ${form.primaryColor}` }}></div>
                                    <div className="h-8 w-4/5 rounded-md bg-white/5"></div>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-[10px] text-slate-400 leading-relaxed">
                            Cet aperçu montre comment vos choix d'identité s'intègrent dans l'interface de navigation.
                        </p>
                    </div>
                </div>
            </div >
        </div >
    );
}
