import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { requireAuth } from "@/lib/auth-helper";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard - Kistly",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  if ((user as any)?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar - hidden on mobile, visible on md and up */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
