import { requireAdminAuth } from "@/lib/admin-helper";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";

export const metadata = {
  title: "Admin - Kistly",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminAuth();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar - hidden on mobile, visible on md and up */}
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <AdminTopBar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
