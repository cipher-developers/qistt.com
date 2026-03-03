"use client";

import { useSession } from "next-auth/react";
import { Bell, User } from "lucide-react";

export function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {session?.user?.name || "Dashboard"}
        </h2>
        <p className="text-sm text-slate-600">
          {(session?.user as any)?.tenantName || "Tenant"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-md transition-colors">
          <Bell size={20} className="text-slate-600" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-md transition-colors">
          <User size={20} className="text-slate-600" />
        </button>
      </div>
    </header>
  );
}
