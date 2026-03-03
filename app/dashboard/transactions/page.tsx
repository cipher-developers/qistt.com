import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Transactions - Kistly",
};

export default async function TransactionsPage() {
  const tenant = await getCurrentTenant();

  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId: tenant?.id,
    },
    include: {
      plan: {
        include: {
          customer: true,
          item: true,
        },
      },
    },
    orderBy: { transactionDate: "desc" },
    take: 100,
  });

  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600 mt-1">Manage payments and receipts</p>
        </div>
        <Link href="/dashboard/transactions/new">
          <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800">
            <Plus size={18} />
            Record Payment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900">
            {transactions.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Amount Paid</p>
          <p className="text-2xl font-bold text-slate-900">
            ${totalPaid.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Average Payment</p>
          <p className="text-2xl font-bold text-slate-900">
            $
            {transactions.length > 0
              ? (totalPaid / transactions.length).toFixed(2)
              : "0.00"}
          </p>
        </Card>
      </div>

      {transactions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">No transactions yet.</p>
          <Link href="/dashboard/transactions/new">
            <Button className="mt-4 bg-slate-900 hover:bg-slate-800">
              Record Payment
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Installment
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {transaction.plan.customer.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {transaction.plan.item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      Plan #{transaction.planId.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {transaction.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(
                        transaction.transactionDate,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
