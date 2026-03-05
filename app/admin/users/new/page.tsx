import { AdminUserForm } from "@/components/admin/admin-user-form";
import { requireAdminAuth } from "@/lib/admin-helper";

export default async function NewAdminUserPage() {
  await requireAdminAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create Admin User</h1>
        <p className="text-slate-600 mt-1">Add a new system administrator</p>
      </div>
      <AdminUserForm />
    </div>
  );
}
