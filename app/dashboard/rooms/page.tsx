"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MapPin, Users, Building, Loader2, FileUp } from "lucide-react";
import { RoomModal } from "@/components/modals/RoomModal";
import { ImportModal } from "@/components/modals/ImportModal";
import { getRooms, deleteRoom } from "@/app/actions/rooms";
import { importRooms } from "@/app/actions/import";
import { useBranding } from "@/components/providers/BrandingProvider";

interface Room {
    id: string;
    name: string;
    capacity: number;
    location: string;
    type: string;
}

export default function RoomsPage() {
    const { primaryColor } = useBranding();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRooms = async () => {
        setIsLoading(true);
        const result = await getRooms();
        if (result.success && result.data) {
            setRooms(result.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRooms();
    }, [isModalOpen, isImportModalOpen]);

    const handleDelete = async (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) {
            await deleteRoom(id);
            fetchRooms();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gestion des Salles</h2>
                    <p className="mt-1 text-slate-500">Gérez vos infrastructures, amphithéâtres et salles de cours.</p>
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
                        Ajouter une salle
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
                </div>
            ) : rooms.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center">
                    <Building className="h-10 w-10 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucune salle</h3>
                    <p className="mt-1 text-sm text-slate-500">Commencez par créer une nouvelle salle.</p>
                    <div className="mt-6">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                        >
                            <Plus className="-ml-0.5 mr-2 h-5 w-5 text-slate-400" />
                            Ajouter une salle
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                        <div
                            key={room.id}
                            className="relative flex flex-col space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">{room.name}</h3>
                                    <span
                                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                        style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, ringColor: `${primaryColor}20` } as any}
                                    >
                                        {room.type}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(room.id)}
                                    className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex flex-1 flex-col space-y-1">
                                <div className="flex items-center text-sm text-slate-500">
                                    <Users className="mr-2 h-4 w-4" />
                                    {room.capacity} places
                                </div>
                                <div className="flex items-center text-sm text-slate-500">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {room.location}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <RoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importRooms}
                title="Importer des Salles"
                description="Téléversez un fichier Excel ou CSV contenant la liste de vos salles. Le système créera ou mettra à jour les salles automatiquement."
                templateName="Salles"
                templateData={[
                    { nom: "Salle 101", capacite: 40, localisation: "Bâtiment A, 1er étage" },
                    { nom: "Amphi 500", capacite: 500, localisation: "Sous-sol" },
                ]}
            />
        </div>
    );
}
