import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { PlansView } from "@/components/plans/plans-view";

export const metadata = {
  title: "Plans Workspace - Kistly",
};

export default async function PlansWorkspacePage() {
  const tenant = await getCurrentTenant();

  const plans = await prisma.installmentPlan.findMany({
    where: {
      tenantId: tenant?.id,
      status: "active",
    },
    select: {
      id: true,
      customerId: true,
      sellingPrice: true,
      advancePaid: true,
      account_number: true,
      monthlyAmount: true,
      months: true,
      startDate: true,
      status: true,
      createdAt: true,
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
      purchase: {
        select: {
          id: true,
          unitCost: true,
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
          purchasedAt: true,
        },
      },
      transactions: {
        select: {
          id: true,
          amount: true,
          transactionDate: true,
        },
      },
      installments: {
        select: {
          id: true,
          installmentNumber: true,
          dueDate: true,
          amount: true,
          paidAmount: true,
          status: true,
          transactions: {
            select: {
              id: true,
              transactionDate: true,
            },
            orderBy: {
              transactionDate: "desc",
            },
          },
        },
        orderBy: {
          installmentNumber: "asc",
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <PlansView plans={plans} tenantName={tenant?.name} />;
}
