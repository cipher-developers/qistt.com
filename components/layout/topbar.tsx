"use client";

import { useSession } from "next-auth/react";
import { Bell, CalendarDays, CircleDot, User } from "lucide-react";
import { MobileNav } from "./mobile-nav";

export function TopBar() {
  const { data: session } = useSession();
  const tenantName = (session?.user as any)?.tenantName || "Tenant";
  const userName = session?.user?.name || "Dashboard";
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date());
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <MobileNav />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
              {userName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
              <span className="truncate">{tenantName}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" />
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CircleDot size={10} />
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 sm:flex">
            <CalendarDays size={14} className="text-slate-500" />
            {today}
          </div>

          <button className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-100">
            <Bell size={17} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sky-500" />
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-slate-700 transition-colors hover:bg-slate-100">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
              {userInitial}
            </span>
            <User size={15} className="hidden text-slate-500 sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
