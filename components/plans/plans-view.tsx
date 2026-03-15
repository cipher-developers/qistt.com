"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileSpreadsheet,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerDetailSheet } from "@/components/customers/customer-detail-sheet";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { PlanDetailSheet } from "@/components/plans/plan-detail-sheet";
import { EntityViewButton } from "@/components/shared/entity-view-button";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet";
import { formatCurrency } from "@/lib/utils";

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
  installments: {
    id: string;
    installmentNumber: number;
    dueDate: string | Date;
    amount: number;
    paidAmount: number;
    status: string;
    transactions: {
      id: number;
      transactionDate: string | Date;
    }[];
  }[];
  customer: {
    id: number;
    name: string;
    phone: string;
  };
  item: {
    id: number;
    name: string;
  };
  purchase?: {
    id: number;
    unitCost: number;
    purchasedAt: string | Date;
    vendor: {
      id: number;
      name: string;
    };
  } | null;
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
  const stringValue = value == null ? "" : String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function PlansView({
  plans,
  tenantName,
}: {
  plans: PlanRecord[];
  tenantName?: string;
}) {
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<
    "this-month" | "last-30" | "all" | "custom"
  >("this-month");
  const [fromDate, setFromDate] = useState<string>(
    toDateInputValue(startOfCurrentMonth()),
  );
  const [toDate, setToDate] = useState<string>(
    toDateInputValue(endOfCurrentMonth()),
  );
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedPlanRows, setExpandedPlanRows] = useState<Set<number>>(
    new Set(),
  );
  const [viewingCustomerId, setViewingCustomerId] = useState<number | null>(
    null,
  );
  const [viewingItemId, setViewingItemId] = useState<number | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<number | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<
    string | null
  >(null);
  const [viewingTransactionId, setViewingTransactionId] = useState<
    number | null
  >(null);
  const router = useRouter();

  const installmentOptions = useMemo(
    () =>
      plans.flatMap((plan) =>
        plan.installments.map((installment) => ({
          id: installment.id,
          installmentNumber: installment.installmentNumber,
          amount: installment.amount,
          paidAmount: installment.paidAmount,
          status: installment.status,
          plan: {
            id: plan.id,
            customer: {
              id: plan.customer.id,
              name: plan.customer.name,
            },
            item: {
              id: plan.item.id,
              name: plan.item.name,
            },
          },
        })),
      ),
    [plans],
  );

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

  const dateFilteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const created = new Date(plan.createdAt);
      created.setHours(0, 0, 0, 0);

      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (created < start) return false;
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(0, 0, 0, 0);
        if (created > end) return false;
      }

      return true;
    });
  }, [plans, fromDate, toDate]);

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();

    return dateFilteredPlans.filter((plan) => {
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
  }, [dateFilteredPlans, search, customerFilter, itemFilter, revenueFilter]);

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

  const exportRows = useMemo(
    () =>
      [...filteredPlans]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map((plan) => {
          const metrics = getPlanMetrics(plan);
          return {
            planId: plan.id,
            customerId: plan.customer.id,
            customer: plan.customer.name,
            phone: plan.customer.phone,
            item: plan.item.name,
            purchaseId: plan.purchase?.id ?? "",
            purchaseVendor: plan.purchase?.vendor.name ?? "",
            purchaseUnitCost: plan.purchase?.unitCost ?? 0,
            sellingPrice: plan.sellingPrice,
            advancePaid: plan.advancePaid,
            generatedRevenue: metrics.generatedRevenue,
            pendingRevenue: metrics.pendingRevenue,
            grossProfitEstimate:
              plan.sellingPrice - (plan.purchase?.unitCost ?? 0),
            months: plan.months,
            monthlyAmount: plan.monthlyAmount,
            progress: `${metrics.progress.toFixed(0)}%`,
            status: plan.status,
            createdDate: new Date(plan.createdAt).toISOString().slice(0, 10),
          };
        }),
    [filteredPlans],
  );

  const summary = useMemo(() => {
    const totalRevenue = dateFilteredPlans.reduce(
      (sum, p) => sum + p.sellingPrice,
      0,
    );
    const generatedRevenue = dateFilteredPlans.reduce(
      (sum, p) => sum + getPlanMetrics(p).generatedRevenue,
      0,
    );
    const pendingRevenue = Math.max(totalRevenue - generatedRevenue, 0);
    const avgProgress =
      dateFilteredPlans.length > 0
        ? dateFilteredPlans.reduce(
            (sum, p) => sum + getPlanMetrics(p).progress,
            0,
          ) / dateFilteredPlans.length
        : 0;

    return {
      totalRevenue,
      generatedRevenue,
      pendingRevenue,
      avgProgress,
    };
  }, [dateFilteredPlans]);

  function toggleGroup(groupKey: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

  function togglePlan(planId: number) {
    setExpandedPlanRows((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  }

  function installmentStatusTone(status: string) {
    if (status === "paid")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "partial")
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  }

  function clearFilters() {
    setSearch("");
    setGroupBy("none");
    setRevenueFilter("all");
    setCustomerFilter("all");
    setItemFilter("all");
    applyDatePreset("this-month");
  }

  function exportToCsv() {
    if (exportRows.length === 0) return;

    const headers = [
      "Plan #",
      "Customer #",
      "Customer",
      "Phone",
      "Item",
      "Purchase #",
      "Vendor",
      "Unit Cost",
      "Selling Price",
      "Advance Paid",
      "Collected",
      "Pending",
      "Gross Profit Est.",
      "Months",
      "Monthly Amount",
      "Progress",
      "Status",
      "Created Date",
    ];

    const lines = [
      headers.join(","),
      ...exportRows.map((row) =>
        [
          row.planId,
          row.customerId,
          row.customer,
          row.phone,
          row.item,
          row.purchaseId,
          row.purchaseVendor,
          row.purchaseUnitCost,
          row.sellingPrice,
          row.advancePaid,
          row.generatedRevenue,
          row.pendingRevenue,
          row.grossProfitEstimate,
          row.months,
          row.monthlyAmount,
          row.progress,
          row.status,
          row.createdDate,
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    downloadBlob(
      new Blob([`\uFEFF${lines.join("\n")}`], {
        type: "text/csv;charset=utf-8;",
      }),
      `plans-export-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  function exportToExcel() {
    if (exportRows.length === 0) return;

    const headerCells = [
      "Plan #",
      "Customer #",
      "Customer",
      "Phone",
      "Item",
      "Purchase #",
      "Vendor",
      "Unit Cost",
      "Selling Price",
      "Advance Paid",
      "Collected",
      "Pending",
      "Gross Profit Est.",
      "Months",
      "Monthly Amount",
      "Progress",
      "Status",
      "Created Date",
    ]
      .map((header) => `<th>${header}</th>`)
      .join("");

    const rowsHtml = exportRows
      .map(
        (row) => `
      <tr>
        <td>${row.planId}</td>
        <td>${row.customerId}</td>
        <td>${row.customer}</td>
        <td>${row.phone}</td>
        <td>${row.item}</td>
        <td>${row.purchaseId}</td>
        <td>${row.purchaseVendor}</td>
        <td>${row.purchaseUnitCost}</td>
        <td>${row.sellingPrice}</td>
        <td>${row.advancePaid}</td>
        <td>${row.generatedRevenue}</td>
        <td>${row.pendingRevenue}</td>
        <td>${row.grossProfitEstimate}</td>
        <td>${row.months}</td>
        <td>${row.monthlyAmount}</td>
        <td>${row.progress}</td>
        <td>${row.status}</td>
        <td>${row.createdDate}</td>
      </tr>`,
      )
      .join("");

    const tableHtml = `
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    downloadBlob(
      new Blob([tableHtml], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      }),
      `plans-export-${new Date().toISOString().slice(0, 10)}.xls`,
    );
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

      <Card className="border border-slate-200/70 bg-white/90 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Created Date Range
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
              onChange={(event) => {
                setDatePreset("custom");
                setFromDate(event.target.value);
              }}
              className="h-10 rounded-xl border-slate-200 bg-white"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(event) => {
                setDatePreset("custom");
                setToDate(event.target.value);
              }}
              className="h-10 rounded-xl border-slate-200 bg-white"
            />
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active Plans
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {dateFilteredPlans.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-sky-50 p-2.5 text-sky-600">
              <Calendar size={20} />
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
              className="h-11 rounded-xl border-slate-200 bg-white pl-9"
            />
          </div>

          <Select
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as GroupBy)}
          >
            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
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
            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
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
            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
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

          <div>
            <Select value={itemFilter} onValueChange={setItemFilter}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
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
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            className="h-11 rounded-xl"
            onClick={clearFilters}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl"
            onClick={exportToCsv}
            disabled={exportRows.length === 0}
          >
            <FileDown size={16} />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl"
            onClick={exportToExcel}
            disabled={exportRows.length === 0}
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </Button>
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
                      Paid
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
                      Installments
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlans.map((plan) => {
                    const metrics = getPlanMetrics(plan);
                    const tone = getProgressTone(metrics.progress);
                    const hasPendingInstallments = plan.installments.some(
                      (installment) => installment.status !== "paid",
                    );
                    const expanded = expandedPlanRows.has(plan.id);

                    return (
                      <>
                        <tr key={plan.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              #{plan.id}
                              <EntityViewButton
                                label={`plan ${plan.id}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setViewingPlanId(plan.id);
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {plan.customer.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {plan.customer.phone}
                                </p>
                              </div>
                              <EntityViewButton
                                label={`customer ${plan.customer.name}`}
                                className="mt-0.5 shrink-0"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setViewingCustomerId(plan.customer.id);
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-600">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-700">
                                  {plan.item.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {plan.months} months
                                </p>
                              </div>
                              <EntityViewButton
                                label={`item ${plan.item.name}`}
                                className="mt-0.5 shrink-0"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setViewingItemId(plan.item.id);
                                }}
                              />
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
                              variant="outline"
                              className="border-slate-300"
                              onClick={() => togglePlan(plan.id)}
                            >
                              {expanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                              {expanded ? "Hide" : "Show"}
                            </Button>
                          </td>
                        </tr>

                        {expanded ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="bg-slate-50/60 px-5 py-4"
                            >
                              <div className="space-y-2">
                                {plan.installments.map((installment) => {
                                  const remaining = Math.max(
                                    installment.amount - installment.paidAmount,
                                    0,
                                  );
                                  const latestTransactionId =
                                    installment.transactions[0]?.id;
                                  const canViewInvoice =
                                    installment.status !== "pending" &&
                                    Boolean(latestTransactionId);

                                  return (
                                    <div
                                      key={installment.id}
                                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                                    >
                                      <div className="flex items-center gap-4 text-sm">
                                        <p className="font-semibold text-slate-700">
                                          Installment #
                                          {installment.installmentNumber}
                                        </p>
                                        <p className="text-slate-500">
                                          Due {formatDate(installment.dueDate)}
                                        </p>
                                        <p className="text-slate-700">
                                          {formatCurrency(
                                            installment.paidAmount,
                                          )}{" "}
                                          / {formatCurrency(installment.amount)}
                                        </p>
                                        <button
                                          type="button"
                                          disabled={!canViewInvoice}
                                          onClick={() => {
                                            if (latestTransactionId) {
                                              setViewingTransactionId(
                                                latestTransactionId,
                                              );
                                            }
                                          }}
                                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${installmentStatusTone(
                                            installment.status,
                                          )} ${canViewInvoice ? "cursor-pointer hover:opacity-85" : "cursor-default"}`}
                                        >
                                          {installment.status}
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-slate-300"
                                          disabled={!canViewInvoice}
                                          onClick={() => {
                                            if (latestTransactionId) {
                                              setViewingTransactionId(
                                                latestTransactionId,
                                              );
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
                                            setSelectedInstallmentId(
                                              installment.id,
                                            )
                                          }
                                        >
                                          {remaining > 0 ? "Record" : "Paid"}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {filteredPlans.map((plan) => {
                const metrics = getPlanMetrics(plan);
                const tone = getProgressTone(metrics.progress);
                const expanded = expandedPlanRows.has(plan.id);

                return (
                  <div key={plan.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 truncate">
                            Plan ID #{plan.id}
                          </p>
                          <EntityViewButton
                            label={`plan ${plan.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setViewingPlanId(plan.id);
                            }}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {plan.customer.name}
                          </p>
                          <EntityViewButton
                            label={`customer ${plan.customer.name}`}
                            className="shrink-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              setViewingCustomerId(plan.customer.id);
                            }}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate text-xs text-slate-500">
                            {plan.item.name} • {plan.months} months
                          </p>
                          <EntityViewButton
                            label={`item ${plan.item.name}`}
                            className="shrink-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              setViewingItemId(plan.item.id);
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          Created {formatDate(plan.createdAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-300"
                        onClick={() => togglePlan(plan.id)}
                      >
                        {expanded ? "Hide" : "Show"}
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
                        <p className="text-slate-500">Paid</p>
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

                    {expanded ? (
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        {plan.installments.map((installment) => {
                          const remaining = Math.max(
                            installment.amount - installment.paidAmount,
                            0,
                          );
                          const latestTransactionId =
                            installment.transactions[0]?.id;
                          const canViewInvoice =
                            installment.status !== "pending" &&
                            Boolean(latestTransactionId);

                          return (
                            <div
                              key={installment.id}
                              className="space-y-1 rounded-lg border border-slate-200 bg-white p-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-700">
                                  Inst #{installment.installmentNumber}
                                </p>
                                <button
                                  type="button"
                                  disabled={!canViewInvoice}
                                  onClick={() => {
                                    if (latestTransactionId) {
                                      setViewingTransactionId(
                                        latestTransactionId,
                                      );
                                    }
                                  }}
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${installmentStatusTone(
                                    installment.status,
                                  )} ${canViewInvoice ? "cursor-pointer hover:opacity-85" : "cursor-default"}`}
                                >
                                  {installment.status}
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Due {formatDate(installment.dueDate)}
                              </p>
                              <p className="text-xs text-slate-700">
                                {formatCurrency(installment.paidAmount)} /{" "}
                                {formatCurrency(installment.amount)}
                              </p>
                              <div className="mt-1 grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-300"
                                  disabled={!canViewInvoice}
                                  onClick={() => {
                                    if (latestTransactionId) {
                                      setViewingTransactionId(
                                        latestTransactionId,
                                      );
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
                          );
                        })}
                      </div>
                    ) : null}
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
                    Paid
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
                          <div className="flex items-center gap-2">
                            <span className="truncate">{group.label}</span>
                            <EntityViewButton
                              label={`${groupBy === "customer" ? "customer" : "item"} ${group.label}`}
                              className="shrink-0"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (groupBy === "customer") {
                                  setViewingCustomerId(Number(group.key));
                                } else {
                                  setViewingItemId(Number(group.key));
                                }
                              }}
                            />
                          </div>
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
                                  <div className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p>
                                        {groupBy === "customer"
                                          ? plan.item.name
                                          : plan.customer.name}
                                      </p>
                                      <p className="text-[11px] text-slate-400 font-mono">
                                        {plan.id}
                                      </p>
                                    </div>
                                    <EntityViewButton
                                      label={`${groupBy === "customer" ? "item" : "customer"} ${
                                        groupBy === "customer"
                                          ? plan.item.name
                                          : plan.customer.name
                                      }`}
                                      className="shrink-0"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (groupBy === "customer") {
                                          setViewingItemId(plan.item.id);
                                        } else {
                                          setViewingCustomerId(
                                            plan.customer.id,
                                          );
                                        }
                                      }}
                                    />
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
                                    asChild
                                  >
                                    <Link
                                      href={`/dashboard/installments?plan=${plan.id}`}
                                    >
                                      View Installments
                                    </Link>
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

      <PlanDetailSheet
        open={Boolean(viewingPlanId)}
        planId={viewingPlanId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingPlanId(null);
          }
        }}
      />

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

          {selectedInstallmentId ? (
            <TransactionForm
              installments={installmentOptions}
              initialInstallmentId={selectedInstallmentId}
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
