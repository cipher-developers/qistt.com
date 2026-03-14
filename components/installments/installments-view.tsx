"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet";
import { EntityViewButton } from "@/components/shared/entity-view-button";
import { CustomerDetailSheet } from "@/components/customers/customer-detail-sheet";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { PlanDetailSheet } from "@/components/plans/plan-detail-sheet";

interface InstallmentRecord {
  id: string;
  planId: number;
  installmentNumber: number;
  dueDate: string | Date;
  amount: number;
  paidAmount: number;
  status: string;
  transactions: {
    id: number;
    transactionDate: string | Date;
  }[];
  plan: {
    id: number;
    customerId: number;
    customer: {
      id: number;
      name: string;
      phone: string;
    };
    item: {
      id: number;
      name: string;
    };
    sellingPrice: number;
    advancePaid: number;
    monthlyAmount: number;
    months: number;
    status: string;
    transactions: { amount: number }[];
  };
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusTone(status: string) {
  if (status === "paid")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "partial")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

const STATUS_OPTIONS = ["pending", "partial", "paid"] as const;

export function InstallmentsView({
  installments,
  initialInstallmentId,
}: {
  installments: InstallmentRecord[];
  initialInstallmentId?: string;
}) {
  const [search, setSearch] = useState("");
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null);
  const [filterItem, setFilterItem] = useState<number | null>(null);
  const [filterPlan, setFilterPlan] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<
    string | null
  >(initialInstallmentId ?? null);
  const [viewingCustomerId, setViewingCustomerId] = useState<number | null>(
    null,
  );
  const [viewingItemId, setViewingItemId] = useState<number | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<number | null>(null);
  const [viewingTransactionId, setViewingTransactionId] = useState<
    number | null
  >(null);
  const router = useRouter();

  // Derive unique filter options
  const customers = useMemo(() => {
    const seen = new Map<number, string>();
    for (const i of installments)
      seen.set(i.plan.customer.id, i.plan.customer.name);
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [installments]);

  const items = useMemo(() => {
    const seen = new Map<number, string>();
    for (const i of installments) seen.set(i.plan.item.id, i.plan.item.name);
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [installments]);

  const plans = useMemo(() => {
    const seen = new Set<number>();
    const result: number[] = [];
    for (const i of installments) {
      if (!seen.has(i.plan.id)) {
        seen.add(i.plan.id);
        result.push(i.plan.id);
      }
    }
    return result.sort((a, b) => a - b);
  }, [installments]);

  const activeFilters =
    (filterCustomer !== null ? 1 : 0) +
    (filterItem !== null ? 1 : 0) +
    (filterPlan !== null ? 1 : 0) +
    (filterStatus !== null ? 1 : 0);

  const totals = useMemo(() => {
    const total = installments.reduce((sum, i) => sum + i.amount, 0);
    const paid = installments.reduce((sum, i) => sum + i.paidAmount, 0);
    const pending = Math.max(total - paid, 0);
    const paidCount = installments.filter((i) => i.status === "paid").length;

    return { total, paid, pending, paidCount };
  }, [installments]);

  const filtered = useMemo(() => {
    let result = installments;

    if (filterCustomer !== null)
      result = result.filter((i) => i.plan.customer.id === filterCustomer);
    if (filterItem !== null)
      result = result.filter((i) => i.plan.item.id === filterItem);
    if (filterPlan !== null)
      result = result.filter((i) => i.plan.id === filterPlan);
    if (filterStatus !== null)
      result = result.filter((i) => i.status === filterStatus);

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (i) =>
          i.plan.customer.name.toLowerCase().includes(q) ||
          i.plan.item.name.toLowerCase().includes(q) ||
          String(i.plan.id).includes(q) ||
          String(i.installmentNumber).includes(q) ||
          i.status.toLowerCase().includes(q),
      );
    }

    return result;
  }, [
    installments,
    search,
    filterCustomer,
    filterItem,
    filterPlan,
    filterStatus,
  ]);

  function clearAllFilters() {
    setFilterCustomer(null);
    setFilterItem(null);
    setFilterPlan(null);
    setFilterStatus(null);
    setSearch("");
  }

  const selectedInstallment = installments.find(
    (i) => i.id === selectedInstallmentId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Collections
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Installments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record payments installment-by-installment across all plans.
          </p>
        </div>

        <Button
          className="self-start bg-slate-900 hover:bg-slate-800 sm:self-auto"
          asChild
        >
          <Link href="/dashboard/ledger">
            <FileText size={16} />
            Open Plans Workspace
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <FileText size={18} className="text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">
                Total Installments
              </p>
              <p className="text-xl font-bold text-slate-900">
                {installments.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">Paid</p>
              <p className="text-xl font-bold text-slate-900">
                {totals.paidCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <CreditCard size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">Collected</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totals.paid)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Clock3 size={18} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">Pending</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totals.pending)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search by customer, item, plan id, installment # or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            {(search || activeFilters > 0) && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            {/* Customer filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 gap-1.5 text-xs ${filterCustomer !== null ? "border-slate-800 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : ""}`}
                >
                  Customer
                  {filterCustomer !== null && (
                    <span className="ml-0.5 truncate max-w-24">
                      : {customers.find((c) => c.id === filterCustomer)?.name}
                    </span>
                  )}
                  <ChevronDown size={12} className="shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-64 overflow-y-auto"
              >
                {filterCustomer !== null && (
                  <DropdownMenuItem
                    onSelect={() => setFilterCustomer(null)}
                    className="text-xs text-slate-500"
                  >
                    <X size={12} className="mr-1.5" /> Clear filter
                  </DropdownMenuItem>
                )}
                {customers.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onSelect={() => setFilterCustomer(c.id)}
                    className={`text-xs ${filterCustomer === c.id ? "font-semibold" : ""}`}
                  >
                    {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Item filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 gap-1.5 text-xs ${filterItem !== null ? "border-slate-800 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : ""}`}
                >
                  Item
                  {filterItem !== null && (
                    <span className="ml-0.5 truncate max-w-24">
                      : {items.find((it) => it.id === filterItem)?.name}
                    </span>
                  )}
                  <ChevronDown size={12} className="shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-64 overflow-y-auto"
              >
                {filterItem !== null && (
                  <DropdownMenuItem
                    onSelect={() => setFilterItem(null)}
                    className="text-xs text-slate-500"
                  >
                    <X size={12} className="mr-1.5" /> Clear filter
                  </DropdownMenuItem>
                )}
                {items.map((it) => (
                  <DropdownMenuItem
                    key={it.id}
                    onSelect={() => setFilterItem(it.id)}
                    className={`text-xs ${filterItem === it.id ? "font-semibold" : ""}`}
                  >
                    {it.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Plan filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 gap-1.5 text-xs ${filterPlan !== null ? "border-slate-800 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : ""}`}
                >
                  Plan
                  {filterPlan !== null && (
                    <span className="ml-0.5">: #{filterPlan}</span>
                  )}
                  <ChevronDown size={12} className="shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-64 overflow-y-auto"
              >
                {filterPlan !== null && (
                  <DropdownMenuItem
                    onSelect={() => setFilterPlan(null)}
                    className="text-xs text-slate-500"
                  >
                    <X size={12} className="mr-1.5" /> Clear filter
                  </DropdownMenuItem>
                )}
                {plans.map((id) => (
                  <DropdownMenuItem
                    key={id}
                    onSelect={() => setFilterPlan(id)}
                    className={`text-xs ${filterPlan === id ? "font-semibold" : ""}`}
                  >
                    Plan #{id}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 gap-1.5 text-xs ${filterStatus !== null ? "border-slate-800 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : ""}`}
                >
                  Status
                  {filterStatus !== null && (
                    <span className="ml-0.5 capitalize">: {filterStatus}</span>
                  )}
                  <ChevronDown size={12} className="shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {filterStatus !== null && (
                  <DropdownMenuItem
                    onSelect={() => setFilterStatus(null)}
                    className="text-xs text-slate-500"
                  >
                    <X size={12} className="mr-1.5" /> Clear filter
                  </DropdownMenuItem>
                )}
                {STATUS_OPTIONS.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onSelect={() => setFilterStatus(s)}
                    className={`text-xs capitalize ${filterStatus === s ? "font-semibold" : ""}`}
                  >
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilters > 0 && (
              <span className="flex items-center text-xs text-slate-500">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <AlertCircle size={22} className="mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">
              No installments found
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Plan
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Item
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Installment
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Paid
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Due
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((installment) => {
                    const remaining = Math.max(
                      installment.amount - installment.paidAmount,
                      0,
                    );
                    const latestTransactionId = installment.transactions[0]?.id;
                    const canViewInvoice =
                      installment.status !== "pending" &&
                      Boolean(latestTransactionId);

                    return (
                      <tr key={installment.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-700">
                              #{installment.plan.id}
                            </span>
                            <EntityViewButton
                              label={`plan ${installment.plan.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingPlanId(installment.plan.id);
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-slate-900">
                              {installment.plan.customer.name}
                            </span>
                            <EntityViewButton
                              label={`customer ${installment.plan.customer.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingCustomerId(
                                  installment.plan.customer.id,
                                );
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-slate-700">
                              {installment.plan.item.name}
                            </span>
                            <EntityViewButton
                              label={`item ${installment.plan.item.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingItemId(installment.plan.item.id);
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm text-slate-700">
                          #{installment.installmentNumber}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(installment.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-emerald-600">
                          {formatCurrency(installment.paidAmount)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600">
                          {formatDate(installment.dueDate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            disabled={!canViewInvoice}
                            onClick={() => {
                              if (latestTransactionId) {
                                setViewingTransactionId(latestTransactionId);
                              }
                            }}
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusTone(installment.status)} ${canViewInvoice ? "cursor-pointer hover:opacity-85" : "cursor-default"}`}
                          >
                            {installment.status}
                          </button>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-300"
                              disabled={!canViewInvoice}
                              onClick={() => {
                                if (latestTransactionId) {
                                  setViewingTransactionId(latestTransactionId);
                                }
                              }}
                            >
                              View Invoice
                            </Button>
                            <Button
                              size="sm"
                              className="bg-slate-900 hover:bg-slate-800"
                              disabled={remaining <= 0}
                              onClick={() =>
                                setSelectedInstallmentId(installment.id)
                              }
                            >
                              {remaining > 0 ? "Record" : "Paid"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((installment) => {
                const remaining = Math.max(
                  installment.amount - installment.paidAmount,
                  0,
                );
                const latestTransactionId = installment.transactions[0]?.id;
                const canViewInvoice =
                  installment.status !== "pending" &&
                  Boolean(latestTransactionId);

                return (
                  <div key={installment.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Plan #{installment.plan.id} • Installment #
                            {installment.installmentNumber}
                          </p>
                          <EntityViewButton
                            label={`plan ${installment.plan.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingPlanId(installment.plan.id);
                            }}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {installment.plan.customer.name}
                          </p>
                          <EntityViewButton
                            label={`customer ${installment.plan.customer.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingCustomerId(
                                installment.plan.customer.id,
                              );
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs text-slate-500">
                            {installment.plan.item.name}
                          </p>
                          <EntityViewButton
                            label={`item ${installment.plan.item.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingItemId(installment.plan.item.id);
                            }}
                          />
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Calendar size={12} />
                          Due {formatDate(installment.dueDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300"
                          disabled={!canViewInvoice}
                          onClick={() => {
                            if (latestTransactionId) {
                              setViewingTransactionId(latestTransactionId);
                            }
                          }}
                        >
                          Invoice
                        </Button>
                        <Button
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800"
                          disabled={remaining <= 0}
                          onClick={() =>
                            setSelectedInstallmentId(installment.id)
                          }
                        >
                          {remaining > 0 ? "Record" : "Paid"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Amount</p>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(installment.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Paid</p>
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(installment.paidAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Pending</p>
                        <p className="font-semibold text-rose-600">
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canViewInvoice}
                      onClick={() => {
                        if (latestTransactionId) {
                          setViewingTransactionId(latestTransactionId);
                        }
                      }}
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusTone(installment.status)} ${canViewInvoice ? "cursor-pointer hover:opacity-85" : "cursor-default"}`}
                    >
                      {installment.status}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={Boolean(selectedInstallmentId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInstallmentId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Installment Transaction</DialogTitle>
            <DialogDescription>
              Add a payment directly against this installment.
            </DialogDescription>
          </DialogHeader>

          {selectedInstallment ? (
            <TransactionForm
              installments={installments}
              initialInstallmentId={selectedInstallment.id}
              lockInstallment
              submitLabel="Record Transaction"
              onSuccess={(createdTransaction) => {
                setSelectedInstallmentId(null);
                setViewingTransactionId(createdTransaction.id);
                router.refresh();
              }}
              onCancel={() => setSelectedInstallmentId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <CustomerDetailSheet
        open={Boolean(viewingCustomerId)}
        customerId={viewingCustomerId}
        onOpenChange={(open) => {
          if (!open) setViewingCustomerId(null);
        }}
      />

      <ItemDetailSheet
        open={Boolean(viewingItemId)}
        itemId={viewingItemId}
        onOpenChange={(open) => {
          if (!open) setViewingItemId(null);
        }}
      />

      <PlanDetailSheet
        open={Boolean(viewingPlanId)}
        planId={viewingPlanId}
        onOpenChange={(open) => {
          if (!open) setViewingPlanId(null);
        }}
      />

      <TransactionDetailSheet
        open={Boolean(viewingTransactionId)}
        transactionId={viewingTransactionId}
        onOpenChange={(open) => {
          if (!open) setViewingTransactionId(null);
        }}
      />
    </div>
  );
}
