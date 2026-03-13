"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  UserCheck,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: BarChart3, label: "Plans", href: "/dashboard/ledger" },
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: Package, label: "Items", href: "/dashboard/items" },
  { icon: FileText, label: "Transactions", href: "/dashboard/transactions" },
  { icon: UserCheck, label: "Manage Users", href: "/dashboard/users" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const tenantName = (session?.user as any)?.tenantName || "Kistly";
  const initials = tenantName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleClose = () => setIsOpen(false);

  return (
    <>
      {/* Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-xl border border-slate-200/70 bg-white/80 p-2 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X size={20} className="text-slate-700" />
        ) : (
          <Menu size={20} className="text-slate-700" />
        )}
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm md:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-800/80 bg-slate-950/95 text-slate-100 backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-400 text-sm font-bold text-slate-950">
              {initials || "K"}
            </div>
            <div>
              <h1 className="max-w-40 truncate text-lg font-semibold">
                {tenantName}
              </h1>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Business Workspace
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-slate-900"
            aria-label="Close menu"
          >
            <X size={20} className="text-slate-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-linear-to-r from-sky-500/20 to-cyan-400/20 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.35)]"
                    : "text-slate-300 hover:bg-slate-900",
                )}
              >
                <Icon size={18} className="shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-slate-800/80 p-4">
          <button
            onClick={() => {
              handleClose();
              signOut({ callbackUrl: "/login" });
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          >
            <LogOut size={18} className="shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
