"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";

type CustomerDetail = {
  id: number;
  name: string;
  phone: string;
  cnic: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    installmentPlans: number;
    transactions: number;
  };
  installmentPlans: {
    id: number;
    account_number?: number | null;
    status: string;
    sellingPrice: number;
    advancePaid: number;
    monthlyAmount: number;
    months: number;
    createdAt: string;
    item: {
      id: number;
      name: string;
      model: string | null;
    };
    transactions: {
      id: number;
      amount: number;
    }[];
  }[];
  transactions: {
    id: number;
    amount: number;
    description: string | null;
    transactionDate: string;
    planId: number;
  }[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusTone(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function CustomerDetailSheet({
  open,
  customerId,
  onOpenChange,
}: {
  open: boolean;
  customerId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !customerId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function loadCustomer() {
      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load customer details");
        }

        setDetail(payload);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }

        setDetail(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load customer details",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();

    return () => controller.abort();
  }, [open, customerId]);

  const portfolio = useMemo(() => {
    if (!detail) {
      return null;
    }

    const activePlans = detail.installmentPlans.filter(
      (plan) => plan.status.toLowerCase() === "active",
    ).length;
    const totalFinanced = detail.installmentPlans.reduce(
      (sum, plan) => sum + plan.sellingPrice,
      0,
    );
    const collected = detail.installmentPlans.reduce((sum, plan) => {
      const paidByTransactions = plan.transactions.reduce(
        (transactionSum, transaction) => transactionSum + transaction.amount,
        0,
      );

      return sum + plan.advancePaid + paidByTransactions;
    }, 0);

    return {
      activePlans,
      totalFinanced,
      collected,
      outstanding: Math.max(totalFinanced - collected, 0),
      lastPaymentDate: detail.transactions[0]?.transactionDate ?? null,
    };
  }, [detail]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-l border-slate-200 bg-slate-50 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-slate-200 bg-white px-6 py-5 text-left">
          <div className="inline-flex w-fit items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Customer Detail
          </div>
          <div className="space-y-2">
            <SheetTitle className="text-xl text-slate-900">
              {detail?.name ||
                (customerId ? `Customer #${customerId}` : "Customer")}
            </SheetTitle>
            <SheetDescription className="text-sm leading-relaxed text-slate-500">
              Review customer profile, plan exposure, and recent payment
              activity.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex h-full min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <Spinner className="size-4" />
                Loading customer details
              </div>
            </div>
          ) : error ? (
            <Card className="border border-rose-200 bg-rose-50 p-5 text-rose-700">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    Unable to load customer
                  </p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </Card>
          ) : detail && portfolio ? (
            <div className="space-y-4">
              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-1">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Outstanding
                    </p>
                    <p className="mt-2 text-xl font-semibold text-rose-600">
                      {formatCurrency(portfolio.outstanding)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Collected {formatCurrency(portfolio.collected)}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Phone size={15} className="text-slate-500" />
                    Contact Details
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </p>
                      <p className="mt-1 text-slate-800">
                        {detail.phone || "No phone"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <Mail size={12} />
                        Email
                      </p>
                      <p className="mt-1 break-words text-slate-800">
                        {detail.email || "No email added"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        CNIC
                      </p>
                      <p className="mt-1 text-slate-800">
                        {detail.cnic || "No CNIC added"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <MapPin size={12} />
                        Address
                      </p>
                      <p className="mt-1 text-slate-800">
                        {detail.address || "No address added"}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CreditCard size={15} className="text-slate-500" />
                    Portfolio Snapshot
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Total Plans
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {detail._count.installmentPlans}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Transactions
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {detail._count.transactions}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Total Financed
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(portfolio.totalFinanced)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Last Payment
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {portfolio.lastPaymentDate
                          ? formatDate(portfolio.lastPaymentDate)
                          : "No payments yet"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <CalendarDays size={12} />
                      Record Timeline
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      <p>Created {formatDate(detail.createdAt)}</p>
                      <p>Updated {formatDate(detail.updatedAt)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Recent Plans
                    </p>
                    <p className="text-xs text-slate-500">
                      Latest financing activity tied to this customer.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {detail.installmentPlans.length} total
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {detail.installmentPlans.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No installment plans found for this customer.
                    </div>
                  ) : (
                    detail.installmentPlans.slice(0, 5).map((plan) => {
                      const paid =
                        plan.advancePaid +
                        plan.transactions.reduce(
                          (sum, transaction) => sum + transaction.amount,
                          0,
                        );

                      return (
                        <div
                          key={plan.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {plan.item.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {plan.item.model || "No model"} · {plan.months}{" "}
                                months
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(
                                plan.status,
                              )}`}
                            >
                              {plan.status}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                            <p>Account # {plan.account_number ?? "-"}</p>
                            <p>Total {formatCurrency(plan.sellingPrice)}</p>
                            <p>Paid {formatCurrency(paid)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Recent Transactions
                  </p>
                  <p className="text-xs text-slate-500">
                    Most recent payments recorded for this customer.
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {detail.transactions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No transactions recorded yet.
                    </div>
                  ) : (
                    detail.transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {transaction.description ||
                              `Account${transaction.planId}`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(transaction.transactionDate)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-emerald-600">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            Quick profile access without leaving the current workflow.
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/customers">Open Customers Workspace</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
