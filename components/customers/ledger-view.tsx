"use client";

import { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Package,
  Search,
  TrendingDown,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface PlanTransaction {
  amount: number;
}

interface Plan {
  id: string;
  sellingPrice: number;
  advancePaid: number;
  monthlyAmount: number;
  months: number;
  status: string;
  item: { name: string };
  transactions: PlanTransaction[];
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  installmentPlans: Plan[];
}

type FilterType = "all" | "outstanding" | "settled";

function computeEntry(customer: Customer) {
  let totalAmount = 0;
  let totalPaid = 0;
  customer.installmentPlans.forEach((plan) => {
    totalAmount += plan.sellingPrice;
    totalPaid +=
      plan.advancePaid + plan.transactions.reduce((s, t) => s + t.amount, 0);
  });
  return { customer, totalAmount, totalPaid, balance: totalAmount - totalPaid };
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function LedgerView({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const ledger = useMemo(() => customers.map(computeEntry), [customers]);

  // Summary stats
  const totalPortfolio = ledger.reduce((s, e) => s + e.totalAmount, 0);
  const totalCollected = ledger.reduce((s, e) => s + e.totalPaid, 0);
  const totalOutstanding = ledger.reduce(
    (s, e) => s + Math.max(e.balance, 0),
    0,
  );
  const settledCount = ledger.filter(
    (e) => e.balance <= 0 && e.totalAmount > 0,
  ).length;

  const filtered = useMemo(() => {
    let result = ledger;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.customer.name.toLowerCase().includes(q) ||
          e.customer.phone.toLowerCase().includes(q) ||
          (e.customer.email?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filter === "outstanding") result = result.filter((e) => e.balance > 0);
    if (filter === "settled")
      result = result.filter((e) => e.balance <= 0 && e.totalAmount > 0);
    return result;
  }, [ledger, search, filter]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpandAll() {
    if (expanded.size === filtered.length) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(filtered.map((e) => e.customer.id)));
    }
  }

  const allExpanded = filtered.length > 0 && expanded.size >= filtered.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Finance
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Customer Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Payment status across all customers
          </p>
        </div>
        <Link
          href="/dashboard/transactions"
          className="self-start sm:self-auto"
        >
          <Button
            variant="outline"
            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <CreditCard size={16} />
            Record Payment
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users size={18} className="text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">Customers</p>
              <p className="text-xl font-bold text-slate-900">
                {customers.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <CreditCard size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">Portfolio</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totalPortfolio)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">Collected</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totalCollected)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
              <TrendingDown size={18} className="text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">Outstanding</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main table card */}
      <Card className="overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <Input
              placeholder="Search by name, phone, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2 items-center">
            {/* Filter pills */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              {(["all", "outstanding", "settled"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filter === f
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f === "all"
                    ? `All (${ledger.length})`
                    : f === "outstanding"
                      ? "Outstanding"
                      : `Settled (${settledCount})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="p-10 sm:p-16 text-center">
            {customers.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Users size={22} className="text-slate-400" />
                </div>
                <p className="text-slate-700 font-semibold">No customers yet</p>
                <p className="text-sm text-slate-400 mt-1 mb-5 max-w-xs mx-auto">
                  Add customers and create installment plans to view their
                  ledger.
                </p>
                <Link href="/dashboard/customers">
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    Manage Customers
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-slate-500 font-medium">
                No customers match your filter.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Plans
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">
                      Progress
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-2 py-3 pr-5 text-right">
                      <button
                        onClick={toggleExpandAll}
                        className="text-xs text-slate-400 hover:text-slate-700 transition-colors font-medium"
                      >
                        {allExpanded ? "Collapse all" : "Expand all"}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const isExpanded = expanded.has(entry.customer.id);
                    const hasPlans = entry.customer.installmentPlans.length > 0;
                    const pct =
                      entry.totalAmount > 0
                        ? Math.min(
                            (entry.totalPaid / entry.totalAmount) * 100,
                            100,
                          )
                        : 0;
                    const isSettled =
                      entry.balance <= 0 && entry.totalAmount > 0;

                    return (
                      <Fragment key={entry.customer.id}>
                        {/* Customer summary row */}
                        <tr
                          className={`border-b border-slate-100 transition-colors ${
                            hasPlans
                              ? "cursor-pointer hover:bg-slate-50/80"
                              : ""
                          } ${isExpanded ? "bg-slate-50" : ""}`}
                          onClick={() =>
                            hasPlans && toggleExpand(entry.customer.id)
                          }
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${getAvatarColor(
                                  entry.customer.name,
                                )}`}
                              >
                                {getInitials(entry.customer.name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {entry.customer.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {entry.customer.phone}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                              {entry.customer.installmentPlans.length}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {entry.totalAmount > 0 ? (
                              <div>
                                <div className="w-full h-1.5 rounded-full bg-slate-200">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      isSettled
                                        ? "bg-emerald-500"
                                        : "bg-blue-500"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {pct.toFixed(0)}%
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-right text-slate-900 font-medium">
                            {entry.totalAmount > 0
                              ? formatCurrency(entry.totalAmount)
                              : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-right text-green-600 font-medium">
                            {entry.totalPaid > 0
                              ? formatCurrency(entry.totalPaid)
                              : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {entry.totalAmount === 0 ? (
                              <span className="text-xs text-slate-300">
                                No plans
                              </span>
                            ) : isSettled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                <CheckCircle2 size={11} />
                                Settled
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                                {formatCurrency(entry.balance)}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 pr-5 text-right text-slate-400">
                            {hasPlans &&
                              (isExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </td>
                        </tr>

                        {/* Expanded per-plan rows */}
                        {isExpanded &&
                          entry.customer.installmentPlans.map((plan) => {
                            const planPaid =
                              plan.advancePaid +
                              plan.transactions.reduce(
                                (s, t) => s + t.amount,
                                0,
                              );
                            const planBalance = plan.sellingPrice - planPaid;
                            const planPct = Math.min(
                              (planPaid / plan.sellingPrice) * 100,
                              100,
                            );
                            const planSettled = planBalance <= 0;

                            return (
                              <tr
                                key={plan.id}
                                className="border-b border-slate-100 bg-slate-50/60"
                              >
                                <td className="pl-16 py-2.5 pr-5">
                                  <div className="flex items-center gap-2">
                                    <Package
                                      size={13}
                                      className="text-slate-400 shrink-0"
                                    />
                                    <span className="text-sm text-slate-700 font-medium">
                                      {plan.item.name}
                                    </span>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                                        plan.status === "active"
                                          ? "bg-blue-50 text-blue-600"
                                          : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {plan.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-2.5 text-center">
                                  <span className="text-xs text-slate-400">
                                    {plan.months}mo
                                  </span>
                                </td>
                                <td className="px-5 py-2.5">
                                  <div className="w-full h-1 rounded-full bg-slate-200">
                                    <div
                                      className={`h-1 rounded-full ${
                                        planSettled
                                          ? "bg-emerald-400"
                                          : "bg-blue-400"
                                      }`}
                                      style={{ width: `${planPct}%` }}
                                    />
                                  </div>
                                </td>
                                <td className="px-5 py-2.5 text-sm text-right text-slate-600">
                                  {formatCurrency(plan.sellingPrice)}
                                </td>
                                <td className="px-5 py-2.5 text-sm text-right text-green-600">
                                  {formatCurrency(planPaid)}
                                </td>
                                <td className="px-5 py-2.5 text-right">
                                  {planSettled ? (
                                    <span className="text-xs text-emerald-600 font-semibold">
                                      Paid off
                                    </span>
                                  ) : (
                                    <span className="text-xs text-rose-600 font-semibold">
                                      {formatCurrency(planBalance)}
                                    </span>
                                  )}
                                </td>
                                <td />
                              </tr>
                            );
                          })}
                      </Fragment>
                    );
                  })}
                </tbody>

                {/* Footer totals */}
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-5 py-3 text-sm font-bold text-slate-900">
                      {filtered.length} customer
                      {filtered.length !== 1 ? "s" : ""}
                    </td>
                    <td />
                    <td />
                    <td className="px-5 py-3 text-sm text-right font-bold text-slate-900">
                      {formatCurrency(
                        filtered.reduce((s, e) => s + e.totalAmount, 0),
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-green-600">
                      {formatCurrency(
                        filtered.reduce((s, e) => s + e.totalPaid, 0),
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-rose-600">
                      {formatCurrency(
                        filtered.reduce(
                          (s, e) => s + Math.max(e.balance, 0),
                          0,
                        ),
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((entry) => {
                const isExpanded = expanded.has(entry.customer.id);
                const hasPlans = entry.customer.installmentPlans.length > 0;
                const pct =
                  entry.totalAmount > 0
                    ? Math.min((entry.totalPaid / entry.totalAmount) * 100, 100)
                    : 0;
                const isSettled = entry.balance <= 0 && entry.totalAmount > 0;

                return (
                  <div key={entry.customer.id}>
                    <div
                      className={`p-4 transition-colors ${
                        hasPlans ? "cursor-pointer hover:bg-slate-50" : ""
                      } ${isExpanded ? "bg-slate-50" : ""}`}
                      onClick={() =>
                        hasPlans && toggleExpand(entry.customer.id)
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${getAvatarColor(
                              entry.customer.name,
                            )}`}
                          >
                            {getInitials(entry.customer.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {entry.customer.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {entry.customer.phone}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {entry.totalAmount === 0 ? (
                            <span className="text-xs text-slate-300">
                              No plans
                            </span>
                          ) : isSettled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                              <CheckCircle2 size={10} />
                              Settled
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                              {formatCurrency(entry.balance)}
                            </span>
                          )}
                          {hasPlans &&
                            (isExpanded ? (
                              <ChevronUp
                                size={16}
                                className="text-slate-400 shrink-0"
                              />
                            ) : (
                              <ChevronDown
                                size={16}
                                className="text-slate-400 shrink-0"
                              />
                            ))}
                        </div>
                      </div>

                      {entry.totalAmount > 0 && (
                        <div className="mt-3 ml-12">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{formatCurrency(entry.totalPaid)} paid</span>
                            <span>of {formatCurrency(entry.totalAmount)}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200">
                            <div
                              className={`h-1.5 rounded-full ${
                                isSettled ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile expanded per-plan rows */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 border-t border-slate-100 divide-y divide-slate-100">
                        {entry.customer.installmentPlans.map((plan) => {
                          const planPaid =
                            plan.advancePaid +
                            plan.transactions.reduce((s, t) => s + t.amount, 0);
                          const planBalance = plan.sellingPrice - planPaid;
                          const planPct = Math.min(
                            (planPaid / plan.sellingPrice) * 100,
                            100,
                          );
                          const planSettled = planBalance <= 0;

                          return (
                            <div key={plan.id} className="px-4 py-3 pl-16">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Package
                                    size={12}
                                    className="text-slate-400 shrink-0"
                                  />
                                  <span className="text-sm font-medium text-slate-700 truncate">
                                    {plan.item.name}
                                  </span>
                                  <span
                                    className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-semibold ${
                                      plan.status === "active"
                                        ? "bg-blue-50 text-blue-600"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {plan.status}
                                  </span>
                                </div>
                                {planSettled ? (
                                  <span className="text-xs text-emerald-600 font-semibold shrink-0">
                                    Paid off
                                  </span>
                                ) : (
                                  <span className="text-xs text-rose-600 font-semibold shrink-0">
                                    {formatCurrency(planBalance)}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5">
                                <div className="w-full h-1 rounded-full bg-slate-200">
                                  <div
                                    className={`h-1 rounded-full ${
                                      planSettled
                                        ? "bg-emerald-400"
                                        : "bg-blue-400"
                                    }`}
                                    style={{ width: `${planPct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                                  <span>
                                    {formatCurrency(planPaid)} of{" "}
                                    {formatCurrency(plan.sellingPrice)}
                                  </span>
                                  <span>{plan.months}mo plan</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Card footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                Outstanding:{" "}
                {formatCurrency(
                  filtered.reduce((s, e) => s + Math.max(e.balance, 0), 0),
                )}
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
