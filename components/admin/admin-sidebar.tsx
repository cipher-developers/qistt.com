"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, Building2, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ADMIN_MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Tenants", href: "/admin/tenants" },
  { icon: Users, label: "Admin Users", href: "/admin/users" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const tenantName = (session?.user as any)?.tenantName || "Kistly";
  const tenantLogo = (session?.user as any)?.tenantLogo;

  return (
    <>
      {/* Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 p-2 hover:bg-slate-100 rounded-md z-50"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X size={24} className="text-slate-600" />
        ) : (
          <Menu size={24} className="text-slate-600" />
        )}
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static top-0 left-0 h-screen w-64 bg-slate-900 text-white z-50 md:z-0 flex flex-col transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="h-10 w-10 object-contain rounded" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{tenantName.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">Kistly</h1>
              <p className="text-xs text-slate-400">Platform Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {ADMIN_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                  isActive
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-4">
          <button
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: "/login" });
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-md transition-colors text-sm font-medium"
          >
            <LogOut size={20} className="flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
