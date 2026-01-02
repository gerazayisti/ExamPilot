"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { createRoom, updateRoom } from "@/app/actions/rooms";
import { Loader2 } from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    room?: {
        id: string;
        name: string;
        capacity: number;
        location: string;
        type: string;
    };
}

const ROOM_TYPES = [
    "Amphithéâtre",
    "Salle TD",
    "Laboratoire Informatique",
    "Salle de conférence",
];

export function RoomModal({ isOpen, onClose, room }: RoomModalProps) {
    const { primaryColor } = useBranding();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError(null);

        let result;
        if (room) {
            result = await updateRoom(room.id, formData);
        } else {
            result = await createRoom(formData);
        }

        setIsSubmitting(false);

        if (result.success) {
            onClose();
        } else {
            setError(result.error || "Une erreur est survenue");
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={room ? "Modifier la Salle" : "Ajouter une Salle"}>
            <form action={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                        Nom / Code
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        defaultValue={room?.name}
                        placeholder="Ex: Amphi A, B204"
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-slate-700">
                        Capacité (Places)
                    </label>
                    <input
                        type="number"
                        name="capacity"
                        id="capacity"
                        required
                        defaultValue={room?.capacity}
                        min="1"
                        placeholder="Ex: 50"
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                        Localisation
                    </label>
                    <input
                        type="text"
                        name="location"
                        id="location"
                        required
                        defaultValue={room?.location}
                        placeholder="Ex: Bâtiment Sciences"
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                        Type de Salle
                    </label>
                    <select
                        name="type"
                        id="type"
                        required
                        defaultValue={room?.type}
                        className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        {ROOM_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {room ? "Mettre à jour" : "Enregistrer"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
