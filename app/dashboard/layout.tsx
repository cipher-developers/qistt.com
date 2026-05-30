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
    <div className="dashboard-shell">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.16),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.2),transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#ecfeff_100%)]" />

      <div className="dashboard-sidebar-rail hidden md:block">
        <Sidebar />
      </div>

      <div className="dashboard-panel">
        <TopBar />
        <main className="dashboard-main">
          <div className="dashboard-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
