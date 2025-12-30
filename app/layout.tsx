import type { Metadata } from "next";
import "./globals.css";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { getSettings } from "@/app/actions/settings";

export const metadata: Metadata = {
  title: "ExamPilot",
  description: "Système de gestion et planification d'examens",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="fr" className="h-full">
      <body className="antialiased h-full">
        <BrandingProvider initialSettings={settings}>
          {children}
        </BrandingProvider>
      </body>
    </html>
  );
}
