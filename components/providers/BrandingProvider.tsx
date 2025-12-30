"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface BrandingContextType {
    primaryColor: string;
    logoUrl: string | null;
    appName: string;
    updateBranding: (data: Partial<BrandingContextType>) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({
    children,
    initialSettings,
}: {
    children: React.ReactNode;
    initialSettings: any;
}) {
    const [branding, setBranding] = useState({
        primaryColor: initialSettings?.primaryColor || "#3b82f6",
        logoUrl: initialSettings?.logoUrl || null,
        appName: initialSettings?.appName || "ExamPilot",
    });

    useEffect(() => {
        // Apply primary color as a CSS variable
        document.documentElement.style.setProperty("--primary-color", branding.primaryColor);

        // Generate lighter and darker variants if needed (simple hex manipulation or use a library)
        // For now, we'll just use the main color
    }, [branding.primaryColor]);

    const updateBranding = (data: Partial<BrandingContextType>) => {
        setBranding((prev) => ({ ...prev, ...data }));
    };

    return (
        <BrandingContext.Provider value={{ ...branding, updateBranding }}>
            {children}
        </BrandingContext.Provider>
    );
}

export function useBranding() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error("useBranding must be used within a BrandingProvider");
    }
    return context;
}
