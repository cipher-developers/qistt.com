"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: Package, label: "Items", href: "/dashboard/items" },
  { icon: FileText, label: "Onboarding", href: "/dashboard/onboarding" },
  { icon: FileText, label: "Transactions", href: "/dashboard/transactions" },
  { icon: BarChart3, label: "Customer Ledger", href: "/dashboard/ledger" },
  { icon: UserCheck, label: "Manage Users", href: "/dashboard/users" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleClose = () => setIsOpen(false);

  return (
    <>
      {/* Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 hover:bg-slate-100 rounded-md transition-colors"
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
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white z-50 md:hidden flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kistly</h1>
            <p className="text-xs text-slate-400 mt-1">Installment Manager</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-800 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X size={20} className="text-slate-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClose}
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

        {/* Sign Out */}
        <div className="border-t border-slate-700 p-4">
          <button
            onClick={() => {
              handleClose();
              signOut({ callbackUrl: "/login" });
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-md transition-colors text-sm font-medium"
          >
            <LogOut size={20} className="flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
