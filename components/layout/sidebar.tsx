"use client";

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
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: Package, label: "Items", href: "/dashboard/items" },
  { icon: FileText, label: "Onboarding", href: "/dashboard/onboarding" },
  { icon: FileText, label: "Transactions", href: "/dashboard/transactions" },
  { icon: BarChart3, label: "Customer Ledger", href: "/dashboard/ledger" },
  { icon: UserCheck, label: "Manage Users", href: "/dashboard/users" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tenantName = (session?.user as any)?.tenantName || "Kistly";
  const tenantLogo = (session?.user as any)?.tenantLogo;

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          {tenantLogo ? (
            <img src={tenantLogo} alt={tenantName} className="h-10 w-10 object-contain rounded" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{tenantName.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold truncate">{tenantName}</h1>
        </div>
        <p className="text-xs text-slate-400">Powered by Kistly</p>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-md transition-colors",
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span className="text-xs sm:text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-3 sm:p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-slate-300 hover:bg-slate-800 rounded-md transition-colors text-xs sm:text-sm font-medium"
        >
          <LogOut size={20} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
