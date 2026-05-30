import { requireAuth, requireTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  Package,
  Users,
} from "lucide-react";

export default async function DashboardPage() {
  await requireAuth();
  const tenant = await requireTenant();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    customerCount,
    itemCount,
    categoryCount,
    transactionCount,
    activePlans,
    planTotals,
    paidTransactions,
    monthlyTransactions,
    recentTransactions,
  ] = await Promise.all([
    prisma.customer.count({ where: { tenantId: tenant?.id } }),
    prisma.item.count({ where: { tenantId: tenant?.id } }),
    prisma.category.count({ where: { tenantId: tenant?.id } }),
    prisma.transaction.count({ where: { tenantId: tenant?.id } }),
    prisma.installmentPlan.count({
      where: { tenantId: tenant?.id, status: "active" },
    }),
    prisma.installmentPlan.aggregate({
      where: { tenantId: tenant?.id },
      _sum: {
        sellingPrice: true,
        advancePaid: true,
      },
    }),
    prisma.transaction.aggregate({
      where: { tenantId: tenant?.id },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        tenantId: tenant?.id,
        transactionDate: {
          gte: monthStart,
        },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { tenantId: tenant?.id },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { transactionDate: "desc" },
      take: 5,
    }),
  ]);

  const totalContracted = planTotals._sum.sellingPrice || 0;
  const totalCollected =
    (planTotals._sum.advancePaid || 0) + (paidTransactions._sum.amount || 0);
  const totalOutstanding = Math.max(totalContracted - totalCollected, 0);
  const monthlyCollected = monthlyTransactions._sum.amount || 0;

  const summaryStats = [
    {
      label: "Customers",
      value: customerCount.toLocaleString(),
      helper: "Registered accounts",
      icon: Users,
      iconClass: "text-sky-600",
      accent: "from-sky-500/15 to-cyan-400/10",
    },
    {
      label: "Items",
      value: itemCount.toLocaleString(),
      helper: `${categoryCount.toLocaleString()} categories`,
      icon: Package,
      iconClass: "text-emerald-600",
      accent: "from-emerald-500/15 to-lime-400/10",
    },
    {
      label: "Transactions",
      value: transactionCount.toLocaleString(),
      helper: `${activePlans.toLocaleString()} active plans`,
      icon: FileText,
      iconClass: "text-amber-600",
      accent: "from-amber-500/15 to-orange-400/10",
    },
    {
      label: "This Month",
      value: formatCurrency(monthlyCollected),
      helper: "Payments collected",
      icon: Banknote,
      iconClass: "text-indigo-600",
      accent: "from-indigo-500/15 to-sky-400/10",
    },
  ];

  const quickActions = [
    {
      href: "/dashboard/customers/new",
      label: "Add Customer",
      description: "Create a customer profile and start onboarding.",
    },
    {
      href: "/dashboard/items/new",
      label: "Add Item",
      description: "Expand your product catalog with pricing details.",
    },
    {
      href: "/dashboard/onboarding",
      label: "Create Installment Plan",
      description: "Set up repayment terms and activate a new plan.",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Layers3 size={14} />
              Workspace Overview
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {tenant?.name}
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              Monitor collections, customer growth, and installment plan health
              from one place.
            </p>
          </div>

          <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Collected
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Outstanding
              </p>
              <p className="mt-1 text-lg font-semibold text-rose-600">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="relative overflow-hidden border border-slate-200/70 bg-white/85 p-5 shadow-[0_14px_35px_-28px_rgba(15,23,42,0.5)] backdrop-blur"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-linear-to-br ${stat.accent}`}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{stat.helper}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <Icon size={20} className={stat.iconClass} />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-slate-200/70 bg-white/90 p-0 shadow-[0_16px_44px_-32px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>
            <p className="text-sm text-slate-500">
              Create records and keep operations moving.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:p-6">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_8px_25px_-18px_rgba(14,116,144,0.6)]"
              >
                <div className="pr-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {action.description}
                  </p>
                </div>
                <ArrowUpRight
                  size={17}
                  className="text-slate-400 transition-colors group-hover:text-sky-600"
                />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-0 shadow-[0_16px_44px_-32px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Transactions
            </h2>
            <p className="text-sm text-slate-500">
              Latest payment activity across your plans.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {recentTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
                No transactions yet. Your recent activity will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {transaction.customer.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 size={13} />
                        {new Date(
                          transaction.transactionDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">
                      +{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Data is synced live with your latest transactions.
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
