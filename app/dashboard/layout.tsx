import { Sidebar } from "@/components/ui/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-50 md:flex-row">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 pt-20 pb-20 md:p-8 md:pt-8 md:pb-8">
                {children}
            </main>
        </div>
    );
}
