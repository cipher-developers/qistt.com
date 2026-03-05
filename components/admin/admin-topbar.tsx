"use client";

import { useSession } from "next-auth/react";
import { Bell, User } from "lucide-react";

export function AdminTopBar() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
          Administration
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 truncate">
          {session?.user?.name || "Admin"}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <button className="p-2 hover:bg-slate-100 rounded-md transition-colors">
          <Bell size={18} className="text-slate-600" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-md transition-colors">
          <User size={18} className="text-slate-600" />
        </button>
      </div>
    </header>
  );
}
