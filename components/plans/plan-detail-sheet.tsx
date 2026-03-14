"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ListChecks,
  Package,
  User,
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

type PlanDetail = {
  id: number;
  sellingPrice: number;
  advancePaid: number;
  monthlyAmount: number;
  months: number;
  startDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    name: string;
    phone: string;
    cnic: string | null;
    email: string | null;
    address: string | null;
  };
  item: {
    id: number;
    name: string;
    model: string | null;
    sku: string | null;
    category: { name: string } | null;
  };
  installments: {
    id: string;
    installmentNumber: number;
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: string;
  }[];
  transactions: {
    id: number;
    amount: number;
    description: string | null;
    transactionDate: string;
  }[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPlanStatusTone(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getInstallmentStatusTone(status: string) {
  if (status === "paid")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "partial")
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function PlanDetailSheet({
  open,
  planId,
  onOpenChange,
}: {
  open: boolean;
  planId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !planId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDetail(null);

    async function loadPlan() {
      try {
        const response = await fetch(`/api/installment-plans/${planId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load plan details");
        }

        setDetail(payload);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setDetail(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load plan details",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
    return () => controller.abort();
  }, [open, planId]);

  const metrics = useMemo(() => {
    if (!detail) return null;
    const collected =
      detail.advancePaid +
      detail.transactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = Math.max(detail.sellingPrice - collected, 0);
    const progress = Math.min((collected / detail.sellingPrice) * 100, 100);
    const paidInstallments = detail.installments.filter(
      (i) => i.status === "paid",
    ).length;
    return { collected, remaining, progress, paidInstallments };
  }, [detail]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-l border-slate-200 bg-slate-50 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-slate-200 bg-white px-6 py-5 text-left">
          <div className="inline-flex w-fit items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
            Plan Detail
          </div>
          <div className="space-y-2">
            <SheetTitle className="text-xl text-slate-900">
              Plan #{planId}
              {detail && (
                <span
                  className={`ml-3 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPlanStatusTone(detail.status)}`}
                >
                  {detail.status}
                </span>
              )}
            </SheetTitle>
            <SheetDescription className="text-sm leading-relaxed text-slate-500">
              Full plan breakdown — customer, item, installment schedule, and
              collected payments.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex h-full min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <Spinner className="size-4" />
                Loading plan details
              </div>
            </div>
          ) : error ? (
            <Card className="border border-rose-200 bg-rose-50 p-5 text-rose-700">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Unable to load plan</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </Card>
          ) : detail && metrics ? (
            <div className="space-y-4">
              {/* Financial Summary */}
              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CreditCard size={15} className="text-slate-500" />
                  Financial Summary
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Selling Price
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(detail.sellingPrice)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Advance Paid
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-600">
                      {formatCurrency(detail.advancePaid)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Monthly
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(detail.monthlyAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Duration
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {detail.months} months
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                      Collected
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">
                      {formatCurrency(metrics.collected)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                      Remaining
                    </p>
                    <p className="mt-1 text-sm font-bold text-rose-700">
                      {formatCurrency(metrics.remaining)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-700">
                      {metrics.progress.toFixed(0)}% •{" "}
                      {metrics.paidInstallments}/{detail.months} installments
                      paid
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metrics.progress >= 100
                          ? "bg-emerald-500"
                          : metrics.progress >= 50
                            ? "bg-sky-500"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(metrics.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </Card>

              {/* Customer & Item */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <User size={15} className="text-slate-500" />
                    Customer
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-slate-900">
                      {detail.customer.name}
                    </p>
                    <p className="text-slate-600">{detail.customer.phone}</p>
                    {detail.customer.cnic && (
                      <p className="text-xs text-slate-500">
                        CNIC: {detail.customer.cnic}
                      </p>
                    )}
                    {detail.customer.email && (
                      <p className="text-xs text-slate-500">
                        {detail.customer.email}
                      </p>
                    )}
                    {detail.customer.address && (
                      <p className="text-xs text-slate-500">
                        {detail.customer.address}
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Package size={15} className="text-slate-500" />
                    Item
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-slate-900">
                      {detail.item.name}
                    </p>
                    {detail.item.model && (
                      <p className="text-slate-600">{detail.item.model}</p>
                    )}
                    {detail.item.category && (
                      <p className="text-xs text-slate-500">
                        Category: {detail.item.category.name}
                      </p>
                    )}
                    {detail.item.sku && (
                      <p className="text-xs text-slate-500">
                        SKU: {detail.item.sku}
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Installment schedule */}
              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ListChecks size={15} className="text-slate-500" />
                    Installment Schedule
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {metrics.paidInstallments} / {detail.months} paid
                  </span>
                </div>

                <div className="space-y-2">
                  {detail.installments.map((inst) => {
                    const remaining = Math.max(
                      inst.amount - inst.paidAmount,
                      0,
                    );
                    return (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                            {inst.installmentNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-700">
                              {formatCurrency(inst.amount)}
                              {inst.paidAmount > 0 &&
                                inst.status !== "paid" && (
                                  <span className="ml-1 text-emerald-600">
                                    (+{formatCurrency(inst.paidAmount)} paid)
                                  </span>
                                )}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-slate-500">
                              <CalendarDays size={10} />
                              Due {formatDate(inst.dueDate)}
                              {remaining > 0 && (
                                <span className="text-rose-500">
                                  · {formatCurrency(remaining)} left
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${getInstallmentStatusTone(inst.status)}`}
                        >
                          {inst.status === "paid" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              {inst.status}
                            </span>
                          ) : inst.status === "partial" ? (
                            inst.status
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock3 size={10} />
                              {inst.status}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Recent transactions */}
              {detail.transactions.length > 0 && (
                <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CreditCard size={15} className="text-slate-500" />
                    Recorded Payments
                    <span className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {detail.transactions.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {detail.transactions.slice(0, 10).map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-emerald-700">
                            +{formatCurrency(txn.amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(txn.transactionDate)}
                            {txn.description && ` · ${txn.description}`}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          #{txn.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Timeline */}
              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <CalendarDays size={12} />
                  Record Timeline
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>Started {formatDate(detail.startDate)}</p>
                  <p>Created {formatDate(detail.createdAt)}</p>
                  <p>Updated {formatDate(detail.updatedAt)}</p>
                </div>
              </Card>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            Plan context at a glance — no page navigation needed.
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/installments">Open Installments</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
