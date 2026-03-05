import { TenantUserForm } from "@/components/admin/tenant-user-form";
import { requireAdminAuth } from "@/lib/admin-helper";

export default async function NewTenantUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAuth();
  const { id } = await params;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Add Tenant User</h1>
        <p className="text-slate-600 mt-1">Add a new user to this tenant</p>
      </div>
      <TenantUserForm tenantId={id} />
    </div>
  );
}
