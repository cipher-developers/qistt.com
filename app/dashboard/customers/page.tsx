import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { CustomersView } from "@/components/customers/customers-view";

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
      cnic: true,
      address: true,
      createdAt: true,
      _count: { select: { installmentPlans: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CustomersView
      tenantId={tenant?.id}
      tenantName={tenant?.name}
      customers={customers}
    />
  );
}
