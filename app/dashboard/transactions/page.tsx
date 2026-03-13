import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { TransactionsView } from "@/components/transactions/transactions-view";

export const metadata = {
  title: "Transactions - Kistly",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { created?: string };
}) {
  const tenant = await getCurrentTenant();

  const [transactions, activePlansCount] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenantId: tenant?.id },
      include: {
        plan: {
          include: {
            customer: true,
            item: true,
          },
        },
      },
      orderBy: { transactionDate: "desc" },
      take: 200,
    }),
    prisma.installmentPlan.count({
      where: { tenantId: tenant?.id, status: "active" },
    }),
  ]);

  return (
    <TransactionsView
      transactions={transactions}
      activePlansCount={activePlansCount}
      justCreated={searchParams.created === "1"}
    />
  );
}
