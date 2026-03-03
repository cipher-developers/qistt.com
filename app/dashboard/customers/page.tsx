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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Manage your customers and their information</p>
        </div>
        <Link href="/dashboard/customers/new" className="flex-shrink-0">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800">
            <Plus size={18} />
            Add Customer
          </Button>
        </Link>
      </div>

      {customers.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-slate-600">No customers yet. Start by adding your first customer.</p>
          <Link href="/dashboard/customers/new">
            <Button className="mt-4 bg-slate-900 hover:bg-slate-800">Add Customer</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 hidden md:table-header-group">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Name</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Email</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Phone</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Plans</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 block md:table-row-group">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors block md:table-row mb-4 md:mb-0 border md:border-0 rounded-lg md:rounded-none overflow-hidden">
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Name:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-900">
                      {customer.name}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Email:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                      {customer.email}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Phone:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                      {customer.phone}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Plans:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                      {customer._count.installmentPlans}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Actions:'] before:font-semibold before:mr-2 md:before:content-none">
                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/dashboard/customers/${customer.id}`}>
                          <Button variant="outline" size="sm" className="gap-2 text-xs">
                            <Edit size={14} />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </Link>
                        <CustomerDeleteButton customerId={customer.id} />
                      </div>
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
