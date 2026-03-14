"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ListChecks,
  Settings,
  LogOut,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Items", href: "/dashboard/items" },
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: BarChart3, label: "Plans", href: "/dashboard/ledger" },
  { icon: ListChecks, label: "Installments", href: "/dashboard/installments" },
  { icon: FileText, label: "Transactions", href: "/dashboard/transactions" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tenantName = (session?.user as any)?.tenantName || "Kistly";
  const tenantLogo = (session?.user as any)?.tenantLogo;
  const displayName = session?.user?.name || "Team Member";
  const displayEmail = session?.user?.email || "";
  const initials = tenantName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <aside className="h-screen w-72 border-r border-slate-800/70 bg-slate-950/95 text-slate-100 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-800/80 px-6 py-6">
          <div className="mb-4 flex items-center gap-3">
            {tenantLogo ? (
              <img
                src={tenantLogo}
                alt={tenantName}
                className="h-11 w-11 rounded-xl border border-slate-700/80 object-contain"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-400 text-sm font-bold text-slate-950">
                <span>{initials || "K"}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-white">
                {tenantName}
              </h1>
              <p className="truncate text-xs text-slate-400">
                Business Workspace
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
            <p className="truncate text-xs font-medium text-slate-100">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {displayEmail}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
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
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-linear-to-r from-sky-500/20 to-cyan-400/20 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.35)]"
                    : "text-slate-300 hover:bg-slate-900 hover:text-slate-100",
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0",
                    isActive
                      ? "text-cyan-300"
                      : "text-slate-400 group-hover:text-sky-300",
                  )}
                />
                <span className="font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 p-4">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
            <Sparkles size={14} className="text-sky-300" />
            Powered by Kistly
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          >
            <LogOut size={18} className="shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
