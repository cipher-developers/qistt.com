import { requireAuth, requireTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, Package, FileText } from "lucide-react";

export default async function DashboardPage() {
  await requireAuth();
  const tenant = await requireTenant();

  // Fetch dashboard stats
  const [customerCount, itemCount, categoryCount, transactionCount] =
    await Promise.all([
      prisma.customer.count({ where: { tenantId: tenant?.id } }),
      prisma.item.count({ where: { tenantId: tenant?.id } }),
      prisma.category.count({ where: { tenantId: tenant?.id } }),
      prisma.transaction.count({ where: { tenantId: tenant?.id } }),
    ]);

  const stats = [
    {
      label: "Customers",
      value: customerCount,
      icon: Users,
      color: "bg-blue-500",
    },
    { label: "Items", value: itemCount, icon: Package, color: "bg-green-500" },
    {
      label: "Categories",
      value: categoryCount,
      icon: BarChart3,
      color: "bg-purple-500",
    },
    {
      label: "Transactions",
      value: transactionCount,
      icon: FileText,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome back, {tenant?.name}!
        </h1>
        <p className="text-sm sm:text-base text-slate-600">Here's your business overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 sm:p-6">
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
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <a
              href="/dashboard/customers"
              className="block p-2 sm:p-3 hover:bg-slate-50 rounded-md transition-colors text-sm sm:text-base text-slate-700"
            >
              + Add New Customer
            </a>
            <a
              href="/dashboard/items"
              className="block p-2 sm:p-3 hover:bg-slate-50 rounded-md transition-colors text-sm sm:text-base text-slate-700"
            >
              + Add New Item
            </a>
            <a
              href="/dashboard/onboarding"
              className="block p-2 sm:p-3 hover:bg-slate-50 rounded-md transition-colors text-sm sm:text-base text-slate-700"
            >
              + Create Installment Plan
            </a>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            System Status
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-slate-700 truncate">Database</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-slate-700 truncate">Tenant</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base text-slate-700 truncate">User Role</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                Admin
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
