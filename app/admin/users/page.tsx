import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-helper";
import Link from "next/link";
import { Edit, Trash2, Plus, Shield } from "lucide-react";
import { AdminUserDeleteButton } from "@/components/admin/admin-user-delete-button";

export default async function AdminUsersPage() {
  await requireAdminAuth();

  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Users</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Manage system administrators</p>
        </div>
        <Link href="/admin/users/new" className="flex-shrink-0">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus size={18} />
            Add Admin
          </Button>
        </Link>
      </div>

      {adminUsers.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-slate-600">No admin users yet.</p>
          <Link href="/admin/users/new">
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">Add Admin</Button>
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
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Role</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Tenant</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 block md:table-row-group">
                {adminUsers.map(async (user) => {
                  const tenant = user.tenantId ? await prisma.tenant.findUnique({
                    where: { id: user.tenantId },
                  }) : null;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors block md:table-row mb-4 md:mb-0 border md:border-0 rounded-lg md:rounded-none overflow-hidden">
                      <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Name:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Email:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Role:'] before:font-semibold before:mr-2 md:before:content-none text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield size={12} />
                          {user.role}
                        </span>
                      </td>
                      <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Tenant:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                        {tenant?.name || "System Admin"}
                      </td>
                      <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Actions:'] before:font-semibold before:mr-2 md:before:content-none">
                        <div className="flex gap-2 flex-wrap">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm" className="gap-2 text-xs">
                              <Edit size={14} />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </Link>
                          <AdminUserDeleteButton userId={user.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
