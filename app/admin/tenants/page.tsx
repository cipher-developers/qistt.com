import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-helper";
import Link from "next/link";
import { Edit, Trash2, Plus } from "lucide-react";
import { TenantDeleteButton } from "@/components/admin/tenant-delete-button";

export default async function TenantsPage() {
  await requireAdminAuth();

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tenants</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Manage all tenant accounts</p>
        </div>
        <Link href="/admin/tenants/new" className="flex-shrink-0">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus size={18} />
            Add Tenant
          </Button>
        </Link>
      </div>

      {tenants.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-slate-600">No tenants yet.</p>
          <Link href="/admin/tenants/new">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Add Tenant</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 hidden md:table-header-group">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Name</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Subdomain</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Owner Email</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 block md:table-row-group">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50 transition-colors block md:table-row mb-4 md:mb-0 border md:border-0 rounded-lg md:rounded-none overflow-hidden">
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Name:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-900">
                      {tenant.name}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Subdomain:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                      {tenant.subdomain}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Owner:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                      {tenant.ownerEmail}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Status:'] before:font-semibold before:mr-2 md:before:content-none text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tenant.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Actions:'] before:font-semibold before:mr-2 md:before:content-none">
                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/admin/tenants/${tenant.id}`}>
                          <Button variant="outline" size="sm" className="gap-2 text-xs">
                            <Edit size={14} />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </Link>
                        <Link href={`/admin/tenants/${tenant.id}/users`}>
                          <Button variant="outline" size="sm" className="gap-2 text-xs">
                            Users
                          </Button>
                        </Link>
                        <TenantDeleteButton tenantId={tenant.id} />
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
