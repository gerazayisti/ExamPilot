"use client";

import Link from "next/link";
import { Home, ArrowLeft, Frown } from "lucide-react";
import { useEffect, useState } from "react";
import { useBranding } from "@/components/providers/BrandingProvider";

export default function NotFound() {
    const { primaryColor } = useBranding();
    const [mounted, setMounted] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setMounted(true);

        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]"></div>

            {/* Mouse follower glow */}
            <div
                className="pointer-events-none fixed w-96 h-96 rounded-full blur-3xl opacity-30 transition-all duration-300 ease-out"
                style={{
                    backgroundColor: primaryColor,
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                    transform: 'translate(-50%, -50%)'
                }}
            ></div>

            {/* Secondary smaller glow */}
            <div
                className="pointer-events-none fixed w-64 h-64 rounded-full blur-2xl opacity-20 transition-all duration-500 ease-out"
                style={{
                    backgroundColor: primaryColor,
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                    transform: 'translate(-50%, -50%)'
                }}
            ></div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="max-w-3xl w-full">
                    <div className={`text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>

                        {/* Friendly icon */}
                        <div className="mb-8 flex justify-center">
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <Frown className="w-12 h-12" style={{ color: primaryColor }} />
                            </div>
                        </div>

                        {/* Large 404 */}
                        <div className="relative mb-8">
                            <h1 className="text-[100px] md:text-[140px] font-black leading-none text-slate-200">
                                404
                            </h1>
                        </div>

                        {/* Empathetic message */}
                        <div className={`space-y-6 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                                Oups, cette page n'existe pas
                            </h2>

                            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                Nous ne trouvons pas la page que vous cherchez.
                                <br className="hidden md:block" />
                                Elle a peut-être été déplacée ou n'existe plus.
                            </p>

                            <p className="text-base text-slate-500 max-w-xl mx-auto">
                                Ne vous inquiétez pas, utilisez les boutons ci-dessous pour retourner à une page que vous connaissez.
                            </p>

                            {/* Action buttons with primary color */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                                <Link
                                    href="/dashboard"
                                    className="group inline-flex items-center gap-3 px-8 py-4 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Home className="w-5 h-5" />
                                    <span>Retour à l'accueil</span>
                                </Link>

                                <button
                                    onClick={() => window.history.back()}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-700 font-semibold rounded-lg shadow-md hover:shadow-lg border-2 border-slate-200 hover:border-slate-300 transform hover:scale-105 transition-all duration-300"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>Revenir en arrière</span>
                                </button>
                            </div>

                            {/* Helpful suggestions */}
                            <div className="mt-16 pt-8 border-t border-slate-200">
                                <p className="text-sm text-slate-500 mb-4 font-medium">
                                    Que souhaitez-vous faire ?
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <Link
                                        href="/dashboard"
                                        className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                    >
                                        📊 Voir le tableau de bord
                                    </Link>
                                    <Link
                                        href="/dashboard/schedule"
                                        className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                    >
                                        📅 Voir les plannings
                                    </Link>
                                    <Link
                                        href="/dashboard/exams"
                                        className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                    >
                                        📝 Gérer les examens
                                    </Link>
                                </div>
                            </div>

                            {/* Support message */}
                            <div className="mt-12">
                                <p className="text-sm text-slate-400">
                                    Besoin d'aide ? Contactez votre administrateur système.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
