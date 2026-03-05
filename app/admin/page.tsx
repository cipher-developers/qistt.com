import { Card } from "@/components/ui/card";
import { getAdminStats } from "@/lib/admin-helper";
import { Building2, Users, BarChart3, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const { tenantCount, userCount } = await getAdminStats();

  const stats = [
    {
      label: "Total Tenants",
      value: tenantCount,
      icon: Building2,
      color: "bg-blue-100 text-blue-600",
      href: "/admin/tenants",
    },
    {
      label: "Admin Users",
      value: userCount,
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      href: "/admin/users",
    },
    {
      label: "System Health",
      value: "Optimal",
      icon: BarChart3,
      color: "bg-green-100 text-green-600",
      href: "#",
    },
    {
      label: "Security Status",
      value: "Secure",
      icon: Shield,
      color: "bg-amber-100 text-amber-600",
      href: "#",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Administration Dashboard
        </h1>
        <p className="text-sm sm:text-base text-slate-600">Manage system tenants and users</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="block">
              <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">
                      {stat.label}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                    <Icon size={20} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Link href="/admin/tenants/new">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start">
                + Create New Tenant
              </Button>
            </Link>
            <Link href="/admin/users/new">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 justify-start">
                + Add Admin User
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            System Status
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-slate-700">Database</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-slate-700">API Status</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Running
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-slate-700">Backups</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Up-to-date
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
