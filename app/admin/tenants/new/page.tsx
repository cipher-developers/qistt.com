import { TenantForm } from "@/components/admin/tenant-form";
import { requireAdminAuth } from "@/lib/admin-helper";

export default async function NewTenantPage() {
  await requireAdminAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create New Tenant</h1>
        <p className="text-slate-600 mt-1">Add a new tenant to the system</p>
      </div>
      <TenantForm />
    </div>
  );
}
