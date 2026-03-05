import { TenantForm } from "@/components/admin/tenant-form";
import { requireAdminAuth } from "@/lib/admin-helper";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditTenantPage({
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Edit Tenant</h1>
        <p className="text-slate-600 mt-1">Update tenant information</p>
      </div>
      <TenantForm tenant={tenant} />
    </div>
  );
}
