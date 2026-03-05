import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-helper";
import Link from "next/link";
import { Edit, Plus, notFound } from "lucide-react";
import { TenantUserDeleteButton } from "@/components/admin/tenant-user-delete-button";
import { ArrowLeft } from "lucide-react";

export default async function TenantUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAuth();
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) {
    notFound();
  }

  const users = await prisma.user.findMany({
    where: { tenantId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {tenant.name} - Users
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Manage users for this tenant
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Link href={`/admin/tenants/${id}/users/new`} className="block">
            <Button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700">
              <Plus size={18} />
              Add User
            </Button>
          </Link>
        </div>
      </div>

      {users.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-slate-600">No users for this tenant yet.</p>
          <Link href={`/admin/tenants/${id}/users/new`}>
            <Button className="mt-4 bg-green-600 hover:bg-green-700">Add User</Button>
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
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Joined</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 block md:table-row-group">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors block md:table-row mb-4 md:mb-0 border md:border-0 rounded-lg md:rounded-none overflow-hidden">
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Name:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Email:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Role:'] before:font-semibold before:mr-2 md:before:content-none text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-800"
                          : user.role === "MANAGER"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Joined:'] before:font-semibold before:mr-2 md:before:content-none text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="block md:table-cell px-4 sm:px-6 py-4 before:content-['Actions:'] before:font-semibold before:mr-2 md:before:content-none">
                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/admin/tenants/${id}/users/${user.id}`}>
                          <Button variant="outline" size="sm" className="gap-2 text-xs">
                            <Edit size={14} />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </Link>
                        <TenantUserDeleteButton userId={user.id} />
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
