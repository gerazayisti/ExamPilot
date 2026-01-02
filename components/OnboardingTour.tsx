"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useBranding } from "@/components/providers/BrandingProvider";

import { usePathname } from "next/navigation";

export function OnboardingTour() {
    const { primaryColor } = useBranding();
    const pathname = usePathname();
    const driverObj = useRef<any>(null);

    useEffect(() => {
        // Map paths to specific tour steps and storage keys
        const tourConfig: Record<string, { key: string, steps: any[] }> = {
            "/dashboard": {
                key: "ep_tour_dashboard",
                steps: [
                    {
                        popover: {
                            title: "Bienvenue sur Exam-Pilot 👋",
                            description: "Prenez une minute pour découvrir comment planifier vos examens sans stress."
                        }
                    },
                    {
                        element: "#dashboard-stats-grid",
                        popover: {
                            title: "Vue d'ensemble",
                            description: "Ici, vous suivez en temps réel l'état de vos ressources : salles, étudiants et examens.",
                            side: "bottom", align: "start"
                        }
                    },
                    {
                        element: "#nav-item-rooms",
                        popover: {
                            title: "1. Configurez vos Salles",
                            description: "Commencez par ajouter vos salles d'examen et leur capacité.",
                            side: "right", align: "center"
                        }
                    }
                ]
            },
            "/dashboard/rooms": {
                key: "ep_tour_rooms",
                steps: [
                    {
                        element: "#rooms-import-btn",
                        popover: {
                            title: "Importation Rapide",
                            description: "Gagnez du temps en important vos salles via un fichier Excel.",
                            side: "bottom", align: "center"
                        }
                    },
                    {
                        element: "#rooms-add-btn",
                        popover: {
                            title: "Nouvelle Salle",
                            description: "Ou ajoutez une salle manuellement en précisant son nom et sa capacité.",
                            side: "bottom", align: "center"
                        }
                    }
                ]
            },
            "/dashboard/cohorts": {
                key: "ep_tour_cohorts",
                steps: [
                    {
                        element: "#cohorts-import-btn",
                        popover: {
                            title: "Import des Promotions",
                            description: "Importez vos filières et leurs matières (UE) en un clic.",
                            side: "bottom", align: "center"
                        }
                    },
                    {
                        element: "#cohorts-add-btn",
                        popover: {
                            title: "Ajout Manuel",
                            description: "Créez une nouvelle cohorte d'étudiants ici.",
                            side: "bottom", align: "center"
                        }
                    }
                ]
            },
            "/dashboard/exams": {
                key: "ep_tour_exams",
                steps: [
                    {
                        element: "#exams-add-btn",
                        popover: {
                            title: "Définition des Épreuves",
                            description: "Précisez quelles matières seront évaluées durant cette session.",
                            side: "bottom", align: "center"
                        }
                    }
                ]
            },
            "/dashboard/schedule": {
                key: "ep_tour_schedule",
                steps: [
                    {
                        element: "#schedule-new-session-btn",
                        popover: {
                            title: "Lancer la Génération",
                            description: "Cliquez ici pour que l'algorithme crée votre planning automatiquement.",
                            side: "bottom", align: "center"
                        }
                    },
                    {
                        element: "#schedule-session-select",
                        popover: {
                            title: "Historique",
                            description: "Retrouvez ici tous les plannings générés précédemment.",
                            side: "bottom", align: "center"
                        }
                    }
                ]
            }
        };

        const currentTour = tourConfig[pathname];
        if (!currentTour) return;

        const hasSeenTour = localStorage.getItem(currentTour.key);
        if (hasSeenTour) return;

        driverObj.current = driver({
            showProgress: true,
            animate: true,
            doneBtnText: "Compris !",
            nextBtnText: "Suivant",
            prevBtnText: "Précédent",
            steps: currentTour.steps,
            onDestroyStarted: () => {
                driverObj.current.destroy();
                localStorage.setItem(currentTour.key, "true");
            },
        });

        const timer = setTimeout(() => {
            driverObj.current.drive();
        }, 800);

        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}
