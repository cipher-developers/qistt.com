"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  Receipt,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CustomerDetailSheet } from "@/components/customers/customer-detail-sheet";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { EntityViewButton } from "@/components/shared/entity-view-button";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: number;
  amount: number;
  description: string | null;
  transactionDate: string | Date;
  plan: {
    customer: { id: number; name: string };
    item: { id: number; name: string };
  };
}

export function TransactionsView({
  transactions,
  activePlansCount,
  justCreated,
}: {
  transactions: Transaction[];
  activePlansCount: number;
  justCreated?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [showBanner, setShowBanner] = useState(justCreated ?? false);
  const [viewingCustomerId, setViewingCustomerId] = useState<number | null>(
    null,
  );
  const [viewingItemId, setViewingItemId] = useState<number | null>(null);

  useEffect(() => {
    if (justCreated) {
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      window.history.replaceState({}, "", url.toString());
    }
  }, [justCreated]);

  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
  const now = new Date();
  const thisMonthTotal = transactions
    .filter((t) => {
      const d = new Date(t.transactionDate);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.plan.customer.name.toLowerCase().includes(q) ||
        t.plan.item.name.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false),
    );
  }, [transactions, search]);

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="space-y-6">
      {showBanner && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 size={18} className="shrink-0" />
            <span className="text-sm font-medium">
              Installment plan created successfully! Use the Plans workspace to
              record plan-specific transactions.
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-3 shrink-0 text-emerald-600 transition-colors hover:text-emerald-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Finance
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track all payment activity
          </p>
        </div>

        <Button
          className="self-start bg-slate-900 hover:bg-slate-800 sm:self-auto"
          asChild
        >
          <Link href="/dashboard/ledger">
            <CreditCard size={16} />
            Open Plans Workspace
          </Link>
        </Button>
      </div>

      {activePlansCount === 0 && transactions.length === 0 && (
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-5">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              No active installment plans found
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Create a plan first, then record transactions directly from that
              plan row in the Plans workspace.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Receipt size={18} className="text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">Total Records</p>
              <p className="text-xl font-bold text-slate-900">
                {transactions.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <CreditCard size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">Total Collected</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">This Month</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(thisMonthTotal)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <TrendingUp size={18} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">Active Plans</p>
              <p className="text-xl font-bold text-slate-900">
                {activePlansCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Search by customer, item, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="text-slate-500"
            >
              Clear
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center sm:p-16">
            {transactions.length === 0 ? (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <CreditCard size={22} className="text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">
                  No transactions yet
                </p>
                <p className="mx-auto mb-5 mt-1 max-w-xs text-sm text-slate-400">
                  Record your first payment from the Plans workspace.
                </p>
                <Button className="bg-slate-900 hover:bg-slate-800" asChild>
                  <Link href="/dashboard/ledger">Go to Plans Workspace</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-500">
                  No transactions match your search.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-slate-400"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Item
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Note
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                            {getInitials(t.plan.customer.name)}
                          </div>
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-medium text-slate-900">
                              {t.plan.customer.name}
                            </span>
                            <EntityViewButton
                              label={`customer ${t.plan.customer.name}`}
                              className="shrink-0"
                              onClick={(event) => {
                                event.stopPropagation();
                                setViewingCustomerId(t.plan.customer.id);
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{t.plan.item.name}</span>
                          <EntityViewButton
                            label={`item ${t.plan.item.name}`}
                            className="shrink-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              setViewingItemId(t.plan.item.id);
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">
                        {t.description ?? (
                          <span className="select-none">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-sm font-semibold text-green-700">
                          {formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-500">
                        {formatDate(t.transactionDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {getInitials(t.plan.customer.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {t.plan.customer.name}
                          </p>
                          <EntityViewButton
                            label={`customer ${t.plan.customer.name}`}
                            className="shrink-0"
                            onClick={() =>
                              setViewingCustomerId(t.plan.customer.id)
                            }
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate text-xs text-slate-500">
                            {t.plan.item.name}
                          </p>
                          <EntityViewButton
                            label={`item ${t.plan.item.name}`}
                            className="shrink-0"
                            onClick={() => setViewingItemId(t.plan.item.id)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-sm font-bold text-green-700">
                        {formatCurrency(t.amount)}
                      </span>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(t.transactionDate)}
                      </p>
                    </div>
                  </div>
                  {t.description && (
                    <p className="ml-12 mt-2 text-xs text-slate-500">
                      {t.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs text-slate-500">
                {filtered.length}{" "}
                {filtered.length !== 1 ? "transactions" : "transaction"}
                {search ? " matching" : ""}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                Total:{" "}
                {formatCurrency(filtered.reduce((s, t) => s + t.amount, 0))}
              </p>
            </div>
          </>
        )}
      </Card>

      <CustomerDetailSheet
        open={Boolean(viewingCustomerId)}
        customerId={viewingCustomerId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingCustomerId(null);
          }
        }}
      />

      <ItemDetailSheet
        open={Boolean(viewingItemId)}
        itemId={viewingItemId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingItemId(null);
          }
        }}
      />
    </div>
  );
}
