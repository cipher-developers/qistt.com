"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  FolderKanban,
  Package,
  Receipt,
  Tag,
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

type ItemDetail = {
  id: number;
  name: string;
  model: string | null;
  description: string | null;
  sku: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    installmentPlans: number;
  };
  installmentPlans: {
    id: number;
    status: string;
    sellingPrice: number;
    advancePaid: number;
    monthlyAmount: number;
    months: number;
    createdAt: string;
    customer: {
      id: number;
      name: string;
      phone: string;
    };
    transactions: {
      id: number;
      amount: number;
    }[];
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

export function ItemDetailSheet({
  open,
  itemId,
  onOpenChange,
}: {
  open: boolean;
  itemId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !itemId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function loadItem() {
      try {
        const response = await fetch(`/api/items/${itemId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load item details");
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
            : "Failed to load item details",
        );
      } finally {
        setLoading(false);
      }
    }

    loadItem();

    return () => controller.abort();
  }, [open, itemId]);

  const portfolio = useMemo(() => {
    if (!detail) {
      return null;
    }

    const activePlans = detail.installmentPlans.filter(
      (plan) => plan.status.toLowerCase() === "active",
    ).length;
    const uniqueCustomers = new Set(
      detail.installmentPlans.map((plan) => plan.customer.id),
    ).size;
    const contractedValue = detail.installmentPlans.reduce(
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
      uniqueCustomers,
      contractedValue,
      collected,
      margin:
        detail.sellingPrice !== null && detail.costPrice !== null
          ? detail.sellingPrice - detail.costPrice
          : null,
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
            Item Detail
          </div>
          <div className="space-y-2">
            <SheetTitle className="text-xl text-slate-900">
              {detail?.name || (itemId ? `Item #${itemId}` : "Item")}
            </SheetTitle>
            <SheetDescription className="text-sm leading-relaxed text-slate-500">
              Review pricing, category context, and plan usage for this item.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex h-full min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <Spinner className="size-4" />
                Loading item details
              </div>
            </div>
          ) : error ? (
            <Card className="border border-rose-200 bg-rose-50 p-5 text-rose-700">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Unable to load item</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </Card>
          ) : detail && portfolio ? (
            <div className="space-y-4">
              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-1 ">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Active Plans
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {portfolio.activePlans}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {portfolio.uniqueCustomers} customer
                      {portfolio.uniqueCustomers === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Package size={15} className="text-slate-500" />
                    Item Profile
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <FolderKanban size={12} />
                        Model
                      </p>
                      <p className="mt-1 text-slate-800">
                        {detail.model || "No Model"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <FolderKanban size={12} />
                        Category
                      </p>
                      <p className="mt-1 text-slate-800">
                        {detail.category?.name || "Uncategorized"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <Tag size={12} />
                        SKU
                      </p>
                      <p className="mt-1 text-slate-800">
                        {detail.sku || "No SKU added"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Description
                      </p>
                      <p className="mt-1 text-slate-800">
                        {detail.description || "No description added"}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Receipt size={15} className="text-slate-500" />
                    Pricing Snapshot
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Cost Price
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(detail.costPrice)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Selling Price
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(detail.sellingPrice)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Margin
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {portfolio.margin === null
                          ? "Not available"
                          : formatCurrency(portfolio.margin)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Contracted Value
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(portfolio.contractedValue)}
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
                      Plan Usage
                    </p>
                    <p className="text-xs text-slate-500">
                      Where this item is currently or recently financed.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Collected {formatCurrency(portfolio.collected)}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {detail.installmentPlans.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      No installment plans are using this item yet.
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
                                {plan.customer.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {plan.customer.phone} · {plan.months} months
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
                            <p>Plan #{plan.account_number || plan.id}</p>
                            <p>Total {formatCurrency(plan.sellingPrice)}</p>
                            <p>Paid {formatCurrency(paid)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            Product context stays one click away while you work through plans.
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/items">Open Items Workspace</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
