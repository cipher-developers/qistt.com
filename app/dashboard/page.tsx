import { requireAuth, requireTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, Package, FileText } from "lucide-react";

export default async function DashboardPage() {
  await requireAuth();
  const tenant = await requireTenant();

  // Fetch dashboard stats
  const [customerCount, itemCount, categoryCount, transactionCount] = await Promise.all([
    prisma.customer.count({ where: { tenantId: tenant?.id } }),
    prisma.item.count({ where: { tenantId: tenant?.id } }),
    prisma.category.count({ where: { tenantId: tenant?.id } }),
    prisma.transaction.count({ where: { installment: { installmentPlan: { tenantId: tenant?.id } } } }),
  ]);

  const stats = [
    { label: "Customers", value: customerCount, icon: Users, color: "bg-blue-500" },
    { label: "Items", value: itemCount, icon: Package, color: "bg-green-500" },
    { label: "Categories", value: categoryCount, icon: BarChart3, color: "bg-purple-500" },
    { label: "Transactions", value: transactionCount, icon: FileText, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {tenant?.name}!</h1>
        <p className="text-slate-600 mt-1">Here's your business overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/dashboard/customers" className="block p-3 hover:bg-slate-50 rounded-md transition-colors text-slate-700">
              + Add New Customer
            </a>
            <a href="/dashboard/items" className="block p-3 hover:bg-slate-50 rounded-md transition-colors text-slate-700">
              + Add New Item
            </a>
            <a href="/dashboard/onboarding" className="block p-3 hover:bg-slate-50 rounded-md transition-colors text-slate-700">
              + Create Installment Plan
            </a>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Database</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Tenant</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">User Role</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Admin
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
