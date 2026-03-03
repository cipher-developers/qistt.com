import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Customer Ledger - Kistly",
};

export default async function CustomerLedgerPage() {
  const tenant = await getCurrentTenant();

  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant?.id },
    include: {
      installmentPlans: {
        include: {
          item: true,
          installments: {
            include: {
              transactions: true,
            },
          },
        },
      },
    },
  });

  // Calculate ledger for each customer
  const ledger = customers.map((customer) => {
    let totalAmount = 0;
    let totalPaid = 0;

    customer.installmentPlans.forEach((plan) => {
      totalAmount += plan.sellingPrice;
      totalPaid += plan.advancePaid;

      plan.installments.forEach((installment) => {
        installment.transactions.forEach((transaction) => {
          totalPaid += transaction.amount;
        });
      });
    });

    return {
      customer,
      totalAmount,
      totalPaid,
      balance: totalAmount - totalPaid,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Customer Ledger</h1>
        <p className="text-slate-600 mt-1">Overall customer payment status</p>
      </div>

      {ledger.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">No customers yet.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Plans</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Total Amount</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Total Paid</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ledger.map((entry) => (
                  <tr key={entry.customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {entry.customer.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {entry.customer.installmentPlans.length}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      ${entry.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                      ${entry.totalPaid.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold">
                      <span
                        className={
                          entry.balance <= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        ${entry.balance.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900">TOTAL</td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900">
                    {ledger.reduce((sum, e) => sum + e.customer.installmentPlans.length, 0)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-bold">
                    ${ledger.reduce((sum, e) => sum + e.totalAmount, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-bold text-green-600">
                    ${ledger.reduce((sum, e) => sum + e.totalPaid, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-bold">
                    ${ledger.reduce((sum, e) => sum + e.balance, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
