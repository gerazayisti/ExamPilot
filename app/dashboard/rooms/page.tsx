"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MapPin, Users, Building, Loader2, FileUp, Search, LayoutGrid, List, Pencil } from "lucide-react";
import { RoomModal } from "@/components/modals/RoomModal";
import { ImportModal } from "@/components/modals/ImportModal";
import { getRooms, deleteRoom } from "@/app/actions/rooms";
import { importRooms } from "@/app/actions/import";
import { useBranding } from "@/components/providers/BrandingProvider";
import { OnboardingTour } from "@/components/OnboardingTour";

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

    // New states for Search and View Mode
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(undefined);

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

    const handleEdit = (room: Room) => {
        setSelectedRoom(room);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedRoom(undefined);
        setIsModalOpen(true);
    };

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <OnboardingTour />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gestion des Salles</h2>
                    <p className="mt-1 text-slate-500">Gérez vos infrastructures, amphithéâtres et salles de cours.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        id="rooms-import-btn"
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                    >
                        <FileUp className="-ml-0.5 mr-2 h-5 w-5 text-slate-400" />
                        Importer
                    </button>
                    <button
                        id="rooms-add-btn"
                        onClick={handleAdd}
                        className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Plus className="-ml-0.5 mr-2 h-5 w-5" />
                        Ajouter une salle
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
                        id="rooms-search-input"
                        type="text"
                        placeholder="Rechercher une salle..."
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
            ) : filteredRooms.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center">
                    <Building className="h-10 w-10 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucune salle trouvée</h3>
                    <p className="mt-1 text-sm text-slate-500">Essayez de modifier votre recherche ou ajoutez une nouvelle salle.</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredRooms.map((room) => (
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
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(room)}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                        title="Modifier"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(room.id)}
                                        className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
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
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 bg-white">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Nom</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Capacité</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Localisation</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredRooms.map((room) => (
                                <tr key={room.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{room.name}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{room.type}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{room.capacity} places</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{room.location}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(room)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Modifier"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(room.id)}
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

            <RoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                room={selectedRoom}
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
