"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
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
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: number;
  amount: number;
  description: string | null;
  transactionDate: string | Date;
  installment?: {
    id: string;
    installmentNumber: number;
    status: string;
  };
  plan: {
    sellingPrice: number;
    customer: { id: number; name: string; phone: string };
    item: { id: number; name: string };
  };
}

type SortKey = "customer" | "item" | "installment" | "note" | "amount" | "date";
type SortDirection = "asc" | "desc";

function toDateInputValue(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function endOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

function escapeCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function TransactionsView({
  transactions,
  activePlansCount,
  justCreated,
  initialTransactionId,
}: {
  transactions: Transaction[];
  activePlansCount: number;
  justCreated?: boolean;
  initialTransactionId?: number;
}) {
  const [search, setSearch] = useState("");
  const [showBanner, setShowBanner] = useState(justCreated ?? false);
  const [datePreset, setDatePreset] = useState<
    "this-month" | "last-30" | "all" | "custom"
  >("this-month");
  const [fromDate, setFromDate] = useState<string>(
    toDateInputValue(startOfCurrentMonth()),
  );
  const [toDate, setToDate] = useState<string>(
    toDateInputValue(endOfCurrentMonth()),
  );
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewingCustomerId, setViewingCustomerId] = useState<number | null>(
    null,
  );
  const [viewingItemId, setViewingItemId] = useState<number | null>(null);
  const [viewingTransactionId, setViewingTransactionId] = useState<
    number | null
  >(initialTransactionId ?? null);

  useEffect(() => {
    if (justCreated || initialTransactionId) {
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      url.searchParams.delete("transaction");
      window.history.replaceState({}, "", url.toString());
    }
  }, [justCreated, initialTransactionId]);

  function applyDatePreset(preset: "this-month" | "last-30" | "all") {
    setDatePreset(preset);

    if (preset === "all") {
      setFromDate("");
      setToDate("");
      return;
    }

    if (preset === "last-30") {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      setFromDate(toDateInputValue(start));
      setToDate(toDateInputValue(end));
      return;
    }

    setFromDate(toDateInputValue(startOfCurrentMonth()));
    setToDate(toDateInputValue(endOfCurrentMonth()));
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "amount" || key === "date" ? "desc" : "asc");
  }

  const dateFiltered = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.transactionDate);
      txDate.setHours(0, 0, 0, 0);

      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(0, 0, 0, 0);
        if (txDate > end) return false;
      }

      return true;
    });
  }, [transactions, fromDate, toDate]);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (t) =>
        t.plan.customer.name.toLowerCase().includes(q) ||
        t.plan.customer.phone.toLowerCase().includes(q) ||
        t.plan.item.name.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false),
    );
  }, [dateFiltered, search]);

  const exportRows = useMemo(() => {
    return [...filtered]
      .sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime(),
      )
      .map((t) => ({
        customerId: t.plan.customer.id,
        customerName: t.plan.customer.name,
        customerPhone: t.plan.customer.phone,
        item: t.plan.item.name,
        totalItemSellingPrice: t.plan.sellingPrice,
        installmentNumber: t.installment?.installmentNumber ?? "",
        date: new Date(t.transactionDate).toISOString().slice(0, 10),
        amount: t.amount,
      }));
  }, [filtered]);

  function exportToCsv() {
    if (exportRows.length === 0) return;

    const headers = [
      "Customer #",
      "Customer Name",
      "Phone",
      "Item",
      "Total Item Selling Price",
      "Installment #",
      "Date",
      "Amount",
    ];

    const lines = [
      headers.join(","),
      ...exportRows.map((row) =>
        [
          row.customerId,
          row.customerName,
          row.customerPhone,
          row.item,
          row.totalItemSellingPrice,
          row.installmentNumber,
          row.date,
          row.amount,
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    const csv = `\uFEFF${lines.join("\n")}`;
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "transactions-export.csv",
    );
  }

  function exportToExcel() {
    if (exportRows.length === 0) return;

    const rowsHtml = exportRows
      .map(
        (row) => `
          <tr>
            <td>${row.customerId}</td>
            <td>${row.customerName}</td>
            <td>${row.customerPhone}</td>
            <td>${row.item}</td>
            <td>${row.totalItemSellingPrice}</td>
            <td>${row.installmentNumber}</td>
            <td>${row.date}</td>
            <td>${row.amount}</td>
          </tr>`,
      )
      .join("");

    const html = `
      <table>
        <thead>
          <tr>
            <th>Customer #</th>
            <th>Customer Name</th>
            <th>Phone</th>
            <th>Item</th>
            <th>Total Item Selling Price</th>
            <th>Installment #</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>`;

    downloadBlob(
      new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }),
      "transactions-export.xls",
    );
  }

  const sortedTransactions = useMemo(() => {
    const rows = [...filtered];

    rows.sort((a, b) => {
      let left: string | number = "";
      let right: string | number = "";

      if (sortKey === "customer") {
        left = a.plan.customer.name.toLowerCase();
        right = b.plan.customer.name.toLowerCase();
      } else if (sortKey === "item") {
        left = a.plan.item.name.toLowerCase();
        right = b.plan.item.name.toLowerCase();
      } else if (sortKey === "installment") {
        left = a.installment?.installmentNumber ?? -1;
        right = b.installment?.installmentNumber ?? -1;
      } else if (sortKey === "note") {
        left = (a.description ?? "").toLowerCase();
        right = (b.description ?? "").toLowerCase();
      } else if (sortKey === "amount") {
        left = a.amount;
        right = b.amount;
      } else {
        left = new Date(a.transactionDate).getTime();
        right = new Date(b.transactionDate).getTime();
      }

      if (left < right) return sortDirection === "asc" ? -1 : 1;
      if (left > right) return sortDirection === "asc" ? 1 : -1;
      return b.id - a.id;
    });

    return rows;
  }, [filtered, sortDirection, sortKey]);

  const rangeStats = useMemo(() => {
    const total = dateFiltered.reduce((sum, t) => sum + t.amount, 0);
    const avg = dateFiltered.length ? total / dateFiltered.length : 0;

    return {
      count: dateFiltered.length,
      total,
      avg,
    };
  }, [dateFiltered]);

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

  function SortIcon({ forKey }: { forKey: SortKey }) {
    if (sortKey !== forKey) {
      return <ArrowUpDown size={13} className="text-slate-400" />;
    }

    return sortDirection === "asc" ? (
      <ArrowUp size={13} className="text-slate-600" />
    ) : (
      <ArrowDown size={13} className="text-slate-600" />
    );
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

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Date Range
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={datePreset === "this-month" ? "default" : "outline"}
                className={
                  datePreset === "this-month"
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "border-slate-300"
                }
                onClick={() => applyDatePreset("this-month")}
              >
                This Month
              </Button>
              <Button
                size="sm"
                variant={datePreset === "last-30" ? "default" : "outline"}
                className={
                  datePreset === "last-30"
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "border-slate-300"
                }
                onClick={() => applyDatePreset("last-30")}
              >
                Last 30 Days
              </Button>
              <Button
                size="sm"
                variant={datePreset === "all" ? "default" : "outline"}
                className={
                  datePreset === "all"
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "border-slate-300"
                }
                onClick={() => applyDatePreset("all")}
              >
                All Time
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setDatePreset("custom");
                setFromDate(e.target.value);
              }}
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setDatePreset("custom");
                setToDate(e.target.value);
              }}
            />
          </div>
        </div>
      </Card>

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
                {rangeStats.count}
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
                {formatCurrency(rangeStats.total)}
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
              <p className="truncate text-xs text-slate-500">Average Ticket</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(rangeStats.avg)}
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
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300"
            onClick={exportToCsv}
            disabled={exportRows.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300"
            onClick={exportToExcel}
            disabled={exportRows.length === 0}
          >
            Export Excel
          </Button>
        </div>

        {sortedTransactions.length === 0 ? (
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
            ) : dateFiltered.length === 0 ? (
              <>
                <p className="font-medium text-slate-500">
                  No transactions in selected date range.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-slate-400"
                  onClick={() => applyDatePreset("this-month")}
                >
                  Reset to this month
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
              <table className="w-full min-w-245">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <button
                        type="button"
                        onClick={() => toggleSort("customer")}
                        className="inline-flex items-center gap-1.5"
                      >
                        Customer
                        <SortIcon forKey="customer" />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <button
                        type="button"
                        onClick={() => toggleSort("item")}
                        className="inline-flex items-center gap-1.5"
                      >
                        Item
                        <SortIcon forKey="item" />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <button
                        type="button"
                        onClick={() => toggleSort("installment")}
                        className="inline-flex items-center gap-1.5"
                      >
                        Installment
                        <SortIcon forKey="installment" />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <button
                        type="button"
                        onClick={() => toggleSort("note")}
                        className="inline-flex items-center gap-1.5"
                      >
                        Note
                        <SortIcon forKey="note" />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <button
                        type="button"
                        onClick={() => toggleSort("amount")}
                        className="inline-flex items-center gap-1.5"
                      >
                        Amount
                        <SortIcon forKey="amount" />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <button
                        type="button"
                        onClick={() => toggleSort("date")}
                        className="inline-flex items-center gap-1.5"
                      >
                        Date
                        <SortIcon forKey="date" />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTransactions.map((t) => (
                    <tr
                      key={t.id}
                      className="transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                            {getInitials(t.plan.customer.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
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
                            <p className="truncate text-xs text-slate-500">
                              {t.plan.customer.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        <div className="min-w-0">
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
                          <p className="truncate text-xs text-slate-500">
                            Selling: {formatCurrency(t.plan.sellingPrice)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {t.installment ? (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                            #{t.installment.installmentNumber} (
                            {t.installment.status})
                          </span>
                        ) : (
                          <span className="select-none">-</span>
                        )}
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
                      <td className="px-5 py-3.5 text-right">
                        <EntityViewButton
                          label={`transaction ${t.id}`}
                          onClick={() => setViewingTransactionId(t.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {sortedTransactions.map((t) => (
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
                        <p className="truncate text-[11px] text-slate-500">
                          {t.plan.customer.phone}
                        </p>
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
                        <p className="truncate text-[11px] text-slate-500">
                          Selling: {formatCurrency(t.plan.sellingPrice)}
                        </p>
                        {t.installment ? (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Installment #{t.installment.installmentNumber} (
                            {t.installment.status})
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="mb-1 flex justify-end">
                        <EntityViewButton
                          label={`transaction ${t.id}`}
                          onClick={() => setViewingTransactionId(t.id)}
                        />
                      </div>
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
                {sortedTransactions.length}{" "}
                {sortedTransactions.length !== 1
                  ? "transactions"
                  : "transaction"}
                {search ? " matching" : ""}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                Total:{" "}
                {formatCurrency(
                  sortedTransactions.reduce((s, t) => s + t.amount, 0),
                )}
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

      <TransactionDetailSheet
        open={Boolean(viewingTransactionId)}
        transactionId={viewingTransactionId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingTransactionId(null);
          }
        }}
      />
    </div>
  );
}
