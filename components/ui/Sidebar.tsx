"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    BookOpen,
    CalendarDays,
    Settings as SettingsIcon,
    LogOut
} from "lucide-react";
import { clsx } from "clsx";
import { useBranding } from "@/components/providers/BrandingProvider";
import { logout } from "@/app/actions/auth";

const navigation = [
    { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
    { name: "Salles", href: "/dashboard/rooms", icon: Building2 },
    { name: "Cohortes & UE", href: "/dashboard/cohorts", icon: Users },
    { name: "Examens", href: "/dashboard/exams", icon: BookOpen },
    { name: "Planning", href: "/dashboard/schedule", icon: CalendarDays },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logoUrl, appName, primaryColor } = useBranding();

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden h-full w-64 flex-col bg-slate-900 text-white md:flex">
                <div className="flex h-20 items-center px-6 border-b border-white/5 bg-white/5">
                    {logoUrl ? (
                        <img src={logoUrl} alt={appName} className="max-h-12 max-w-full object-contain" />
                    ) : (
                        <h4 className="text-2xl font-black tracking-tighter" style={{ color: primaryColor }}>
                            LoGo .
                            <span className="ml-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }}>   </span>
                        </h4>
                    )}

                    <h1 className="text-2xl font-black tracking-tighter ml-2" style={{ color: primaryColor }}>
                        {appName}
                        <span className="ml-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                    </h1>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const itemId = item.href === "/dashboard" ? "nav-item-dashboard" : `nav-item-${item.href.split("/").pop()}`;
                        return (
                            <Link
                                key={item.name}
                                id={itemId}
                                href={item.href}
                                className={clsx(
                                    "group flex items-center rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200 shadow-sm mb-1",
                                    isActive
                                        ? "text-white shadow-lg"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                                style={isActive ? { backgroundColor: primaryColor } : {}}
                            >
                                <item.icon
                                    className={clsx(
                                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                        isActive ? "text-white" : "text-slate-500 group-hover:text-white"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-800 p-4 space-y-4">
                    <Link
                        href="/dashboard/settings"
                        id="nav-item-settings"
                        className={clsx(
                            "group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200 shadow-sm",
                            pathname === "/dashboard/settings"
                                ? "text-white shadow-lg"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                        style={pathname === "/dashboard/settings" ? { backgroundColor: primaryColor } : {}}
                    >
                        <SettingsIcon
                            className={clsx(
                                "mr-3 h-5 w-5 transition-colors",
                                pathname === "/dashboard/settings" ? "text-white" : "text-slate-500 group-hover:text-white"
                            )}
                        /> Paramètres
                    </Link>

                    <form action={logout}>
                        <button
                            type="submit"
                            className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-bold text-slate-400 transition-all duration-200 shadow-sm hover:bg-slate-800 hover:text-white"
                        >
                            <LogOut
                                className="mr-3 h-5 w-5 transition-colors text-slate-500 group-hover:text-white"
                            />
                            Se déconnecter
                        </button>
                    </form>

                    <div className="px-3 pt-2">
                        <p className="text-[10px] font-medium leading-tight text-slate-500">
                            Développé par <br />
                            <span className="text-slate-300 font-bold">Gervais Azanga Ayissi</span> <br />
                            <span className="opacity-60">+237 695 18 37 68</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:hidden">
                <div className="flex items-center gap-2">
                    {logoUrl ? (
                        <img src={logoUrl} alt={appName} className="h-8 w-auto object-contain" />
                    ) : (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-white" style={{ backgroundColor: primaryColor }}>EP</div>
                    )}
                    <span className="text-lg font-black tracking-tighter text-slate-900">{appName}</span>
                </div>
                <Link
                    href="/dashboard/settings"
                    className={clsx(
                        "rounded-full p-2 transition-colors",
                        pathname === "/dashboard/settings" ? "bg-slate-100 text-blue-600" : "text-slate-500"
                    )}
                >
                    <SettingsIcon className="h-5 w-5" />
                </Link>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 md:hidden">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center gap-1 px-2 pt-1 transition-all",
                                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                            )}
                            style={isActive ? { color: primaryColor } : {}}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name.split(" ")[0]}</span>
                            {isActive && (
                                <span className="h-1 w-1 rounded-full bg-current"></span>
                            )}
                        </Link>
                    );
                })}
                <form action={logout}>
                    <button type="submit" className="flex flex-col items-center justify-center gap-1 px-2 pt-1 text-slate-400">
                        <LogOut className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Quitter</span>
                    </button>
                </form>
            </div>
        </>
    );
}

