"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { useBranding } from "@/components/providers/BrandingProvider";

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => Promise<{ success: boolean; error?: string; count?: number }>;
    title: string;
    description: string;
    templateName: string;
    templateData: any[];
}

export function ImportModal({
    isOpen,
    onClose,
    onImport,
    title,
    description,
    templateName,
    templateData
}: ImportModalProps) {
    const { primaryColor } = useBranding();
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setSuccessCount(null);
        }
    };

    const parseAndImport = async () => {
        if (!file) return;

        setIsParsing(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const bstr = e.target?.result;
                    const wb = XLSX.read(bstr, { type: "binary" });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    if (data.length === 0) {
                        setError("Le fichier est vide.");
                        setIsParsing(false);
                        return;
                    }
                    
                    const cleanData = JSON.parse(JSON.stringify(data));

                    setIsImporting(true);
                    // On utilise cleanData au lieu de data
                    const result = await onImport(cleanData); 
                    setIsImporting(false);
                    setIsParsing(false);

                    if (result.success) {
                        setSuccessCount(result.count || data.length);
                        setFile(null);
                    } else {
                        setError(result.error || "Une erreur est survenue lors de l'importation.");
                    }
                } catch (err: any) {
                    console.error("Erreur lors du parsing ou de l'importation:", err);
                    setError("Erreur lors de la lecture du fichier. Vérifiez le format.");
                    setIsParsing(false);
                }
            };
            reader.readAsBinaryString(file);
        } catch (err: any) {
            setError("Erreur lors de l'ouverture du fichier.");
            setIsParsing(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modèle");
        XLSX.writeFile(wb, `${templateName}_Template.xlsx`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6 py-2">
                <p className="text-sm text-slate-500">{description}</p>

                <div className="flex flex-col items-center justify-center space-y-4">
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                        style={{ color: primaryColor }}
                    >
                        <Download className="h-4 w-4" />
                        Télécharger le modèle Excel
                    </button>

                    <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100">
                        <div className="flex flex-col items-center justify-center pb-6 pt-5">
                            <Upload className="mb-3 h-8 w-8 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-500">
                                <span className="font-semibold">Cliquez pour téléverser</span> ou glissez-déposez
                            </p>
                            <p className="text-xs text-slate-400">XLSX, XLS ou CSV</p>
                        </div>
                        <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                    </label>

                    {file && (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                            <FileText className="h-4 w-4 text-slate-500" />
                            {file.name}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {successCount !== null && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-100">
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        <p>{successCount} éléments importés avec succès !</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                    >
                        Annuler
                    </button>
                    <button
                        disabled={!file || isParsing || isImporting}
                        onClick={parseAndImport}
                        className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {(isParsing || isImporting) ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importation en cours...
                            </>
                        ) : (
                            "Lancer l'importation"
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
