"use client";

import { useEffect, useState } from "react";
import { getAdminStats, getAllUsers, adminResetPassword, adminDeleteUser } from "@/app/actions/admin";
import { Users, Shield, BookOpen, Clock, Activity, Lock, Trash2, Key, Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useBranding } from "@/components/providers/BrandingProvider";

export default function AdminPage() {
    const { appName } = useBranding();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [passMsg, setPassMsg] = useState("");

    const fetchData = async () => {
        setIsLoading(true);
        const st = await getAdminStats();
        setStats(st);
        const us = await getAllUsers();
        if (us.success) setUsers(us.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            setPassMsg("Mot de passe trop court.");
            return;
        }
        await adminResetPassword(selectedUser.id, newPassword);
        setPassMsg("Mot de passe mis à jour !");
        setTimeout(() => {
            setIsPasswordModalOpen(false);
            setPassMsg("");
            setNewPassword("");
        }, 1500);
    };

    const handleDeleteUser = async (user: any) => {
        if (confirm(`Voulez-vous vraiment supprimer l'utilisateur ${user.name} ? Cette action est irréversible.`)) {
            await adminDeleteUser(user.id);
            fetchData();
        }
    };

    if (isLoading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-indigo-600" />
                    Administration
                </h2>
                <p className="mt-1 text-sm text-slate-500">Plateforme: <span className="font-semibold">{appName}</span></p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Utilisateurs</p>
                            <h3 className="text-2xl font-bold">{stats?.usersCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Examens</p>
                            <h3 className="text-2xl font-bold">{stats?.examsCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Sessions Planifiées</p>
                            <h3 className="text-2xl font-bold">{stats?.sessionsCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900">Utilisateurs</h3>
                        <div className="flex bg-white rounded-md border border-slate-200 px-3 py-1">
                            <Search className="h-4 w-4 text-slate-400 mr-2" />
                            <input placeholder="Rechercher..." className="text-sm outline-none bg-transparent" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-slate-500 bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Utilisateur</th>
                                    <th className="px-6 py-3 font-medium">Rôle</th>
                                    <th className="px-6 py-3 font-medium text-center">Activités</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {user.role || 'USER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-3 text-xs text-slate-500">
                                                <span title="Examens"><BookOpen className="h-3 w-3 inline mr-1" />{user._count.exams}</span>
                                                <span title="Cohortes"><Users className="h-3 w-3 inline mr-1" />{user._count.cohorts}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}
                                                    className="p-1 text-slate-400 hover:text-amber-600 transition-colors" title="Changer mot de passe"
                                                >
                                                    <Key className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Supprimer"
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
                </div>

                {/* Activity Feed */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-fit">
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Logs Système
                        </h3>
                    </div>
                    <div className="p-0">
                        {stats?.logs.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500">Aucune activité récente</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {stats?.logs.map((log: any) => (
                                    <div key={log.id} className="px-6 py-4">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-slate-700">{log.action}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">{log.details || "Pas de détails"}</p>
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                                            <Users className="h-3 w-3" />
                                            {log.user.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={`Changer le mot de passe de ${selectedUser?.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                        <input
                            type="password"
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>
                    {passMsg && <p className={`text-sm ${passMsg.includes("mis à jour") ? "text-green-600" : "text-red-600"}`}>{passMsg}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setIsPasswordModalOpen(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Annuler</button>
                        <button onClick={handleResetPassword} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Sauvegarder</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
