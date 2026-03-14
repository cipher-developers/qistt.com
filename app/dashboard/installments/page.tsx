import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { InstallmentsView } from "@/components/installments/installments-view";

export const metadata = {
  title: "Installments - Kistly",
};

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: { installment?: string; plan?: string };
}) {
  const tenant = await getCurrentTenant();

  const installments = await prisma.installment.findMany({
    where: {
      plan: {
        tenantId: tenant?.id,
      },
      ...(searchParams.plan && Number.isInteger(Number(searchParams.plan))
        ? { planId: Number(searchParams.plan) }
        : {}),
    },
    include: {
      plan: {
        select: {
          id: true,
          customerId: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          item: {
            select: {
              id: true,
              name: true,
            },
          },
          sellingPrice: true,
          advancePaid: true,
          monthlyAmount: true,
          months: true,
          status: true,
          transactions: {
            select: {
              amount: true,
            },
          },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }],
    take: 400,
  });

  return (
    <InstallmentsView
      installments={installments}
      initialInstallmentId={searchParams.installment || undefined}
    />
  );
}
