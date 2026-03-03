import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const metadata = {
  title: "Record Payment - Kistly",
};

export default async function NewTransactionPage() {
  const tenant = await getCurrentTenant();

  // Get all pending installments
  const pendingInstallments = await prisma.installment.findMany({
    where: {
      status: "pending",
      plan: {
        tenantId: tenant?.id,
      },
    },
    include: {
      plan: {
        include: {
          customer: true,
          item: true,
        },
      },
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Record Payment</h1>
        <p className="text-slate-600 mt-1">Create a new payment transaction</p>
      </div>
      <TransactionForm tenantId={tenant?.id} installments={pendingInstallments} />
    </div>
  );
}
