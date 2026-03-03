import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { CustomerDeleteButton } from "@/components/customers/delete-button";

export const metadata = {
  title: "Customers - Kistly",
};

export default async function CustomersPage() {
  const tenant = await getCurrentTenant();
  
  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant?.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      _count: { select: { installmentPlans: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600 mt-1">Manage your customers and their information</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800">
            <Plus size={18} />
            Add Customer
          </Button>
        </Link>
      </div>

      {customers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">No customers yet. Start by adding your first customer.</p>
          <Link href="/dashboard/customers/new">
            <Button className="mt-4 bg-slate-900 hover:bg-slate-800">Add Customer</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Plans</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{customer.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer._count.installmentPlans}</td>
                    <td className="px-6 py-4 text-sm space-x-2 flex items-center gap-2">
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit size={16} />
                          Edit
                        </Button>
                      </Link>
                      <CustomerDeleteButton customerId={customer.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
