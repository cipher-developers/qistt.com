"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Layers3,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { TransactionForm } from "@/components/transactions/transaction-form";

type PlanRecord = {
  id: number;
  customerId: number;
  sellingPrice: number;
  advancePaid: number;
  monthlyAmount: number;
  months: number;
  startDate: string | Date;
  status: string;
  createdAt: string | Date;
  customer: {
    id: number;
    name: string;
    phone: string;
  };
  item: {
    id: number;
    name: string;
  };
  transactions: {
    id: number;
    amount: number;
    transactionDate: string | Date;
  }[];
};

type GroupBy = "none" | "customer" | "item";
type RevenueFilter = "all" | "pending" | "healthy" | "critical";

type GroupedPlan = {
  key: string;
  label: string;
  plans: PlanRecord[];
  totalRevenue: number;
  generatedRevenue: number;
  pendingRevenue: number;
  progress: number;
};

function getPlanMetrics(plan: PlanRecord) {
  const generatedRevenue =
    plan.advancePaid + plan.transactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingRevenue = Math.max(plan.sellingPrice - generatedRevenue, 0);
  const progress =
    plan.sellingPrice > 0 ? (generatedRevenue / plan.sellingPrice) * 100 : 0;

  return {
    totalRevenue: plan.sellingPrice,
    generatedRevenue,
    pendingRevenue,
    progress,
  };
}

function getProgressWidth(progress: number) {
  return `${Math.min(Math.max(progress, 0), 100)}%`;
}

function getProgressTone(progress: number) {
  if (progress >= 75) return "bg-emerald-500";
  if (progress >= 40) return "bg-cyan-500";
  return "bg-rose-500";
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PlansView({
  plans,
  tenantId,
  tenantName,
}: {
  plans: PlanRecord[];
  tenantId?: string;
  tenantName?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null);

  const customers = useMemo(() => {
    const map = new Map<number, string>();
    plans.forEach((p) => map.set(p.customer.id, p.customer.name));
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [plans]);

  const items = useMemo(() => {
    const map = new Map<number, string>();
    plans.forEach((p) => map.set(p.item.id, p.item.name));
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const metrics = getPlanMetrics(plan);

      const matchesSearch =
        !q ||
        plan.customer.name.toLowerCase().includes(q) ||
        plan.customer.phone.toLowerCase().includes(q) ||
        plan.item.name.toLowerCase().includes(q) ||
        String(plan.id).includes(q);

      const matchesCustomer =
        customerFilter === "all" || String(plan.customer.id) === customerFilter;
      const matchesItem =
        itemFilter === "all" || String(plan.item.id) === itemFilter;

      const matchesRevenueFilter =
        revenueFilter === "all"
          ? true
          : revenueFilter === "pending"
            ? metrics.pendingRevenue > 0
            : revenueFilter === "healthy"
              ? metrics.progress >= 75
              : metrics.progress < 40;

      return (
        matchesSearch && matchesCustomer && matchesItem && matchesRevenueFilter
      );
    });
  }, [plans, search, customerFilter, itemFilter, revenueFilter]);

  const groupedPlans = useMemo(() => {
    if (groupBy === "none") return [] as GroupedPlan[];

    const groups = new Map<string, GroupedPlan>();

    filteredPlans.forEach((plan) => {
      const key = String(
        groupBy === "customer" ? plan.customer.id : plan.item.id,
      );
      const label =
        groupBy === "customer" ? plan.customer.name : plan.item.name;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label,
          plans: [],
          totalRevenue: 0,
          generatedRevenue: 0,
          pendingRevenue: 0,
          progress: 0,
        });
      }

      const group = groups.get(key)!;
      const metrics = getPlanMetrics(plan);
      group.plans.push(plan);
      group.totalRevenue += metrics.totalRevenue;
      group.generatedRevenue += metrics.generatedRevenue;
      group.pendingRevenue += metrics.pendingRevenue;
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        progress:
          group.totalRevenue > 0
            ? (group.generatedRevenue / group.totalRevenue) * 100
            : 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredPlans, groupBy]);

  const summary = useMemo(() => {
    const totalRevenue = plans.reduce((sum, p) => sum + p.sellingPrice, 0);
    const generatedRevenue = plans.reduce(
      (sum, p) => sum + getPlanMetrics(p).generatedRevenue,
      0,
    );
    const pendingRevenue = Math.max(totalRevenue - generatedRevenue, 0);
    const avgProgress =
      plans.length > 0
        ? plans.reduce((sum, p) => sum + getPlanMetrics(p).progress, 0) /
          plans.length
        : 0;

    return {
      totalRevenue,
      generatedRevenue,
      pendingRevenue,
      avgProgress,
    };
  }, [plans]);

  function toggleGroup(groupKey: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setGroupBy("none");
    setRevenueFilter("all");
    setCustomerFilter("all");
    setItemFilter("all");
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Layers3 size={14} />
              Plans Workspace
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Active Installment Plans
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Monitor plan revenue health, group by customers or items, and
                record transactions directly against the right plan.
                {tenantName ? ` Workspace: ${tenantName}.` : ""}
              </p>
            </div>
          </div>

          <Button
            className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800"
            asChild
          >
            <Link href="/dashboard/onboarding">
              <Plus size={16} />
              New Plan (Onboarding)
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active Plans
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {plans.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-sky-50 p-2.5 text-sky-600">
              <BarChart3 size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Revenue
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-violet-50 p-2.5 text-violet-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Generated Revenue
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">
                {formatCurrency(summary.generatedRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pending Revenue
              </p>
              <p className="mt-2 text-2xl font-semibold text-rose-600">
                {formatCurrency(summary.pendingRevenue)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Avg progress: {summary.avgProgress.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-rose-50 p-2.5 text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
        </Card>
      </section>

      <Card className="border border-slate-200/70 bg-white/90 p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer, phone, item, or plan id"
              className="h-10 rounded-xl border-slate-200 bg-white pl-9"
            />
          </div>

          <Select
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as GroupBy)}
          >
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="customer">Group by Customer</SelectItem>
              <SelectItem value="item">Group by Item</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={revenueFilter}
            onValueChange={(value) => setRevenueFilter(value as RevenueFilter)}
          >
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="Revenue filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="pending">Pending Revenue</SelectItem>
              <SelectItem value="healthy">Healthy (75%+)</SelectItem>
              <SelectItem value="critical">Critical (&lt;40%)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Select value={itemFilter} onValueChange={setItemFilter}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="Item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={clearFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border border-slate-200/70 bg-white/90">
        {filteredPlans.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No active plans match the current filters.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting filters or start a new plan from onboarding.
            </p>
          </div>
        ) : groupBy === "none" ? (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Plan ID
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Item
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Generated
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pending
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-40">
                      Progress
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlans.map((plan) => {
                    const metrics = getPlanMetrics(plan);
                    const tone = getProgressTone(metrics.progress);
                    const canRecordTransaction = metrics.pendingRevenue > 0;

                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">
                          #{plan.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {plan.customer.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {plan.customer.phone}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">
                          <div>
                            <p className="font-medium text-slate-700">
                              {plan.item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {plan.months} months
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(metrics.totalRevenue)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-emerald-600">
                          {formatCurrency(metrics.generatedRevenue)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-rose-600">
                          {formatCurrency(metrics.pendingRevenue)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">
                          {formatDate(plan.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            <div className="h-1.5 rounded-full bg-slate-200">
                              <div
                                className={`h-1.5 rounded-full ${tone}`}
                                style={{
                                  width: getProgressWidth(metrics.progress),
                                }}
                              />
                            </div>
                            <p className="text-xs text-slate-500">
                              {metrics.progress.toFixed(0)}%
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800"
                            disabled={!canRecordTransaction}
                            onClick={() => setSelectedPlan(plan)}
                          >
                            <CreditCard size={14} />
                            {canRecordTransaction
                              ? "Record Transaction"
                              : "Fully Paid"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {filteredPlans.map((plan) => {
                const metrics = getPlanMetrics(plan);
                const tone = getProgressTone(metrics.progress);
                const canRecordTransaction = metrics.pendingRevenue > 0;

                return (
                  <div key={plan.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 truncate">
                          Plan ID #{plan.id}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {plan.customer.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {plan.item.name} • {plan.months} months
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Created {formatDate(plan.createdAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800"
                        disabled={!canRecordTransaction}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        {canRecordTransaction ? "Record" : "Paid"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Total</p>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(metrics.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Generated</p>
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(metrics.generatedRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Pending</p>
                        <p className="font-semibold text-rose-600">
                          {formatCurrency(metrics.pendingRevenue)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="h-1.5 rounded-full bg-slate-200">
                        <div
                          className={`h-1.5 rounded-full ${tone}`}
                          style={{ width: getProgressWidth(metrics.progress) }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {metrics.progress.toFixed(0)}% progress
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {groupBy === "customer" ? "Customer" : "Item"}
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Plans
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Generated
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pending
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-40">
                    Progress
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Expand
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedPlans.map((group) => {
                  const expanded = expandedGroups.has(group.key);
                  const tone = getProgressTone(group.progress);

                  return (
                    <>
                      <tr
                        key={group.key}
                        className="border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer"
                        onClick={() => toggleGroup(group.key)}
                      >
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
                          {group.label}
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm text-slate-600">
                          {group.plans.length}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(group.totalRevenue)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-emerald-600">
                          {formatCurrency(group.generatedRevenue)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-rose-600">
                          {formatCurrency(group.pendingRevenue)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            <div className="h-1.5 rounded-full bg-slate-200">
                              <div
                                className={`h-1.5 rounded-full ${tone}`}
                                style={{ width: `${group.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500">
                              {group.progress.toFixed(0)}%
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-500">
                          {expanded ? (
                            <ChevronUp size={16} className="inline" />
                          ) : (
                            <ChevronDown size={16} className="inline" />
                          )}
                        </td>
                      </tr>

                      {expanded
                        ? group.plans.map((plan) => {
                            const metrics = getPlanMetrics(plan);
                            const rowTone = getProgressTone(metrics.progress);

                            return (
                              <tr
                                key={plan.id}
                                className="border-b border-slate-100 bg-slate-50/40"
                              >
                                <td className="px-5 py-3.5 pl-10 text-sm text-slate-700">
                                  <div>
                                    <p>
                                      {groupBy === "customer"
                                        ? plan.item.name
                                        : plan.customer.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-mono">
                                      {plan.id}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-center text-xs text-slate-500">
                                  {plan.months} mo
                                </td>
                                <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                                  {formatCurrency(metrics.totalRevenue)}
                                </td>
                                <td className="px-5 py-3.5 text-right text-sm text-emerald-600">
                                  {formatCurrency(metrics.generatedRevenue)}
                                </td>
                                <td className="px-5 py-3.5 text-right text-sm text-rose-600">
                                  {formatCurrency(metrics.pendingRevenue)}
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="h-1.5 rounded-full bg-slate-200">
                                    <div
                                      className={`h-1.5 rounded-full ${rowTone}`}
                                      style={{
                                        width: getProgressWidth(
                                          metrics.progress,
                                        ),
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <Button
                                    size="sm"
                                    className="bg-slate-900 hover:bg-slate-800"
                                    disabled={metrics.pendingRevenue <= 0}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedPlan(plan);
                                    }}
                                  >
                                    {metrics.pendingRevenue > 0
                                      ? "Record"
                                      : "Paid"}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        : null}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog
        open={Boolean(selectedPlan)}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>
              Add a payment for this specific installment plan.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan ? (
            <TransactionForm
              tenantId={tenantId}
              plans={[selectedPlan]}
              initialPlanId={selectedPlan.id}
              lockPlan
              submitLabel="Record Transaction"
              onSuccess={() => {
                setSelectedPlan(null);
                router.refresh();
              }}
              onCancel={() => setSelectedPlan(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
