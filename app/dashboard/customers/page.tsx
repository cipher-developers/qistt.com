import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata = {
  title: "Customers - Kistly",
};

export default async function CustomersPage() {
  const tenant = await getCurrentTenant();

  const [customers, references] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId: tenant?.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cnic: true,
        address: true,
        referenceId: true,
        createdAt: true,
        reference: { select: { id: true, name: true } },
        _count: { select: { installmentPlans: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reference.findMany({
      where: { tenantId: tenant?.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CustomersView
      tenantId={tenant?.id}
      tenantName={tenant?.name}
      customers={customers}
      references={references}
    />
  );
}
