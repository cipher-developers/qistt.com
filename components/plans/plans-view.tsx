"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileDown,
  FileSpreadsheet,
  Layers3,
  MoreHorizontal,
  Percent,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
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
import { formatCurrency, wholeNumberInput } from "@/lib/utils";
import { isCollectedPlanTransaction } from "@/lib/plan-transactions";

type PlanRecord = {
  id: number;
  customerId: number;
  account_number?: number | null;
  sellingPrice: number;
  advancePaid: number;
  discount: number;
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
    description?: string | null;
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
  advancePaid: number;
  discount: number;
  generatedRevenue: number;
  pendingRevenue: number;
  progress: number;
};

type TableAlign = "left" | "right" | "center";

type TableColumnDef = {
  key: string;
  label: string;
  align?: TableAlign;
  headerClassName?: string;
  cellClassName?: string;
};

type PlanExportRow = {
  planId: number;
  customerId: number;
  customer: string;
  phone: string;
  item: string;
  purchaseId: number | string;
  purchaseVendor: string;
  purchaseUnitCost: number;
  sellingPrice: number;
  advancePaid: number;
  discount: number;
  generatedRevenue: number;
  pendingRevenue: number;
  grossProfitEstimate: number;
  months: number;
  monthlyAmount: number;
  progress: string;
  status: string;
  createdDate: string;
};

const PLAN_TABLE_COLUMNS: TableColumnDef[] = [
  { key: "plan", label: "Plan #", align: "left" },
  { key: "customer", label: "Customer", align: "left" },
  { key: "item", label: "Item", align: "left" },
  { key: "total", label: "Total", align: "right" },
  { key: "advancePaid", label: "Advance Paid", align: "right" },
  { key: "paid", label: "Total Paid", align: "right" },
  { key: "discount", label: "Discount", align: "right" },
  { key: "pending", label: "Pending", align: "right" },
  { key: "created", label: "Created", align: "left" },
  {
    key: "progress",
    label: "Progress",
    align: "left",
    headerClassName: "w-40",
  },
  { key: "actions", label: "Actions", align: "right" },
];

const GROUPED_PLAN_TABLE_COLUMNS: TableColumnDef[] = [
  { key: "label", label: "Group", align: "left" },
  { key: "plans", label: "Plans", align: "center" },
  { key: "total", label: "Total", align: "right" },
  { key: "discount", label: "Discount", align: "right" },
  { key: "advancePaid", label: "Advance Paid", align: "right" },
  { key: "paid", label: "Paid", align: "right" },
  { key: "pending", label: "Pending", align: "right" },
  {
    key: "progress",
    label: "Progress",
    align: "left",
    headerClassName: "w-40",
  },
  { key: "expand", label: "Expand", align: "right" },
];

const PLAN_MOBILE_METRIC_COLUMNS: {
  key: string;
  label: string;
  valueClassName: string;
}[] = [
  { key: "total", label: "Total", valueClassName: "text-slate-900" },
  { key: "discount", label: "Discount", valueClassName: "text-amber-700" },
  {
    key: "advancePaid",
    label: "Advance Paid",
    valueClassName: "text-cyan-700",
  },
  { key: "paid", label: "Paid", valueClassName: "text-emerald-600" },
  { key: "pending", label: "Pending", valueClassName: "text-rose-600" },
];

const EXPORT_COLUMN_DEFS: { key: keyof PlanExportRow; label: string }[] = [
  { key: "planId", label: "Plan #" },
  { key: "customerId", label: "Customer #" },
  { key: "customer", label: "Customer" },
  { key: "phone", label: "Phone" },
  { key: "item", label: "Item" },
  { key: "purchaseId", label: "Purchase #" },
  { key: "purchaseVendor", label: "Vendor" },
  { key: "purchaseUnitCost", label: "Unit Cost" },
  { key: "sellingPrice", label: "Selling Price" },
  { key: "discount", label: "Discount" },
  { key: "advancePaid", label: "Advance Paid" },
  { key: "generatedRevenue", label: "Collected" },
  { key: "pendingRevenue", label: "Pending" },
  { key: "grossProfitEstimate", label: "Gross Profit Est." },
  { key: "months", label: "Months" },
  { key: "monthlyAmount", label: "Monthly Amount" },
  { key: "progress", label: "Progress" },
  { key: "status", label: "Status" },
  { key: "createdDate", label: "Created Date" },
];

function getPlanMetrics(plan: PlanRecord) {
  const effectiveTotal = plan.sellingPrice - (plan.discount ?? 0);
  const generatedRevenue = plan.transactions.reduce(
    (sum, transaction) =>
      sum +
      (isCollectedPlanTransaction(transaction.description)
        ? transaction.amount
        : 0),
    0,
  );
  const pendingRevenue = Math.max(effectiveTotal - generatedRevenue, 0);
  const progress =
    effectiveTotal > 0 ? (generatedRevenue / effectiveTotal) * 100 : 0;

  return {
    totalRevenue: plan.sellingPrice,
    effectiveTotal,
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

function tableAlignClass(
  align: TableAlign | undefined,
  type: "header" | "cell",
) {
  const padding = type === "header" ? "px-5 py-3" : "px-5 py-3.5";

  if (align === "right") {
    return `${padding} text-right`;
  }

  if (align === "center") {
    return `${padding} text-center`;
  }

  return `${padding} text-left`;
}

function tableHeaderClassName(column: TableColumnDef) {
  return `${tableAlignClass(column.align, "header")} text-xs font-semibold uppercase tracking-wider text-slate-500 ${column.headerClassName ?? ""}`;
}

function tableCellClassName(column: TableColumnDef, extraClassName = "") {
  return `${tableAlignClass(column.align, "cell")} ${column.cellClassName ?? ""} ${extraClassName}`.trim();
}

export function PlansView({
  plans,
  tenantName,
}: {
  plans: PlanRecord[];
  tenantName?: string;
}) {
  const [search, setSearch] = useState("");
  // Date filtering removed: always show all plans
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
  const [editingTransactionId, setEditingTransactionId] = useState<
    number | null
  >(null);
  const [viewingTransactionId, setViewingTransactionId] = useState<
    number | null
  >(null);
  const [downloadingPlanId, setDownloadingPlanId] = useState<number | null>(
    null,
  );
  const [advanceDialogPlan, setAdvanceDialogPlan] = useState<PlanRecord | null>(
    null,
  );
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [savingAdvance, setSavingAdvance] = useState(false);
  const [advanceError, setAdvanceError] = useState("");
  const [discountDialogPlan, setDiscountDialogPlan] =
    useState<PlanRecord | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");
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

  const selectedInstallment = useMemo(
    () => installmentOptions.find((i) => i.id === selectedInstallmentId),
    [installmentOptions, selectedInstallmentId],
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

  // Date preset logic removed

  // Always show all plans (no date filtering)
  const dateFilteredPlans = plans;

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();

    return dateFilteredPlans.filter((plan) => {
      const metrics = getPlanMetrics(plan);

      const matchesSearch =
        !q ||
        plan.customer.name.toLowerCase().includes(q) ||
        plan.customer.phone.toLowerCase().includes(q) ||
        plan.item.name.toLowerCase().includes(q) ||
        String(plan.id).includes(q) ||
        String(plan.account_number).includes(q);

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
          advancePaid: 0,
          discount: 0,
          generatedRevenue: 0,
          pendingRevenue: 0,
          progress: 0,
        });
      }

      const group = groups.get(key)!;
      const metrics = getPlanMetrics(plan);
      group.plans.push(plan);
      group.totalRevenue += metrics.totalRevenue;
      group.discount += plan.discount ?? 0;
      group.advancePaid += plan.advancePaid;
      group.generatedRevenue += metrics.generatedRevenue;
      group.pendingRevenue += metrics.pendingRevenue;
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        progress:
          group.totalRevenue - group.discount > 0
            ? (group.generatedRevenue / (group.totalRevenue - group.discount)) *
              100
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
            discount: plan.discount ?? 0,
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
    const pendingRevenue = dateFilteredPlans.reduce(
      (sum, plan) => sum + getPlanMetrics(plan).pendingRevenue,
      0,
    );
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
  }

  function exportToCsv() {
    if (exportRows.length === 0) return;

    const headers = EXPORT_COLUMN_DEFS.map((column) => column.label);
    const lines = [
      headers.join(","),
      ...exportRows.map((row) =>
        EXPORT_COLUMN_DEFS.map((column) => escapeCsv(row[column.key])).join(
          ",",
        ),
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

    const headerCells = EXPORT_COLUMN_DEFS.map(
      (column) => `<th>${column.label}</th>`,
    ).join("");

    const rowsHtml = exportRows
      .map(
        (row) => `
      <tr>
        ${EXPORT_COLUMN_DEFS.map(
          (column) => `<td>${row[column.key]}</td>`,
        ).join("")}
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

  async function downloadPlanCard(plan: PlanRecord) {
    setDownloadingPlanId(plan.id);
    try {
      const response = await fetch(`/api/installment-plans/${plan.id}/card`);
      if (!response.ok) {
        throw new Error("Failed to download plan card");
      }
      const blob = await response.blob();
      const fallbackName = `${plan.customer.name || `plan-${plan.id}`}-plan-card.xlsx`;
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename="?([^\"]+)"?/i);
      const fileName = fileNameMatch?.[1] || fallbackName;
      downloadBlob(blob, fileName);
    } catch (error) {
      console.error(error);
    } finally {
      setDownloadingPlanId(null);
    }
  }

  async function downloadAcceptanceForm(plan: PlanRecord) {
    setDownloadingPlanId(plan.id);
    try {
      const response = await fetch(
        `/api/installment-plans/${plan.id}/acceptance-form`,
      );
      if (!response.ok) {
        throw new Error("Failed to download acceptance form");
      }
      const blob = await response.blob();
      const fallbackName = `${plan.customer.name || `plan-${plan.id}`}-acceptance-form.html`;
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename="?([^\"]+)"?/i);
      const fileName = fileNameMatch?.[1] || fallbackName;
      downloadBlob(blob, fileName);
    } catch (error) {
      console.error(error);
    } finally {
      setDownloadingPlanId(null);
    }
  }

  function openAdvanceDialog(plan: PlanRecord) {
    setAdvanceError("");
    setAdvanceAmount(String(plan.advancePaid ?? 0));
    setAdvanceDialogPlan(plan);
  }

  function openDiscountDialog(plan: PlanRecord) {
    setDiscountError("");
    setDiscountAmount(String(plan.discount ?? 0));
    setDiscountDialogPlan(plan);
  }

  async function saveAdvance() {
    if (!advanceDialogPlan) return;

    setSavingAdvance(true);
    setAdvanceError("");

    try {
      const response = await fetch(
        `/api/installment-plans/${advanceDialogPlan.id}/advance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ advancePaid: advanceAmount }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setAdvanceError(data.error || "Failed to update advance");
        return;
      }

      setAdvanceDialogPlan(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setAdvanceError("Failed to update advance");
    } finally {
      setSavingAdvance(false);
    }
  }

  async function saveDiscount() {
    if (!discountDialogPlan) return;

    setSavingDiscount(true);
    setDiscountError("");

    try {
      const response = await fetch(
        `/api/installment-plans/${discountDialogPlan.id}/discount`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discount: discountAmount }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setDiscountError(data.error || "Failed to update discount");
        return;
      }

      setDiscountDialogPlan(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setDiscountError("Failed to update discount");
    } finally {
      setSavingDiscount(false);
    }
  }

  function renderPlanActionsDropdown(plan: PlanRecord) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-300"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal size={14} />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="gap-2"
            disabled={downloadingPlanId === plan.id}
            onSelect={() => downloadPlanCard(plan)}
          >
            <Download size={14} />
            Card
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            disabled={downloadingPlanId === plan.id}
            onSelect={() => downloadAcceptanceForm(plan)}
          >
            <FileDown size={14} />
            Acceptance
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2"
            onSelect={() => openAdvanceDialog(plan)}
          >
            <Banknote size={14} />
            Advance
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onSelect={() => openDiscountDialog(plan)}
          >
            <Percent size={14} />
            Discount
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function getPlanMobileMetricValue(
    key: string,
    plan: PlanRecord,
    metrics: ReturnType<typeof getPlanMetrics>,
  ) {
    switch (key) {
      case "total":
        return formatCurrency(metrics.totalRevenue);
      case "discount":
        return formatCurrency(plan.discount ?? 0);
      case "advancePaid":
        return formatCurrency(plan.advancePaid);
      case "paid":
        return formatCurrency(metrics.generatedRevenue);
      case "pending":
        return formatCurrency(metrics.pendingRevenue);
      default:
        return "";
    }
  }

  function renderPlanTableCell(
    columnKey: string,
    {
      plan,
      metrics,
      tone,
      expanded,
      completed,
    }: {
      plan: PlanRecord;
      metrics: ReturnType<typeof getPlanMetrics>;
      tone: string;
      expanded: boolean;
      completed: boolean;
    },
  ): ReactNode {
    switch (columnKey) {
      case "plan":
        return (
          <div className="flex items-center justify-start gap-3 text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-1.5">
              {plan.account_number}
              <EntityViewButton
                label={`plan ${plan.account_number}`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (plan.account_number != null) {
                    setViewingPlanId(plan.account_number);
                  }
                }}
              />
            </div>
          </div>
        );
      case "customer":
        return (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {plan.customer.name}
              </p>
              <p className="text-xs text-slate-500">{plan.customer.phone}</p>
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
        );
      case "item":
        return (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-700">{plan.item.name}</p>
              <p className="text-xs text-slate-500">{plan.months} months</p>
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
        );
      case "total":
        return (
          <span className="text-sm font-semibold text-slate-900">
            {formatCurrency(metrics.totalRevenue)}
          </span>
        );
      case "discount":
        return (
          <span className="text-sm font-semibold text-amber-700">
            {formatCurrency(plan.discount ?? 0)}
          </span>
        );
      case "advancePaid":
        return (
          <span className="text-sm font-semibold text-cyan-700">
            {formatCurrency(plan.advancePaid)}
          </span>
        );
      case "paid":
        return (
          <span className="text-sm font-semibold text-emerald-600">
            {formatCurrency(metrics.generatedRevenue)}
          </span>
        );
      case "pending":
        return (
          <span className="text-sm font-semibold text-rose-600">
            {formatCurrency(metrics.pendingRevenue)}
          </span>
        );
      case "created":
        return (
          <span className="text-sm text-slate-600">
            {formatDate(plan.createdAt)}
          </span>
        );
      case "progress":
        return (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-slate-200">
              <div
                className={`h-1.5 rounded-full ${tone}`}
                style={{ width: getProgressWidth(metrics.progress) }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {metrics.progress.toFixed(0)}%
              {completed ? (
                <span className="ml-2 inline-block rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                  Completed
                </span>
              ) : null}
            </p>
          </div>
        );
      case "actions":
        return (
          <div className="flex items-center justify-end gap-2">
            {renderPlanActionsDropdown(plan)}
            <Button
              size="sm"
              variant="outline"
              className="border-slate-300"
              onClick={() => togglePlan(plan.id)}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>
        );
      default:
        return null;
    }
  }

  function renderGroupedPlanTableCell(
    columnKey: string,
    {
      group,
      expanded,
      tone,
    }: {
      group: GroupedPlan;
      expanded: boolean;
      tone: string;
    },
  ): ReactNode {
    switch (columnKey) {
      case "label":
        return (
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">
              {group.label}
            </span>
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
        );
      case "plans":
        return (
          <span className="text-sm text-slate-600">{group.plans.length}</span>
        );
      case "total":
        return (
          <span className="text-sm font-semibold text-slate-900">
            {formatCurrency(group.totalRevenue)}
          </span>
        );
      case "discount":
        return (
          <span className="text-sm font-semibold text-amber-700">
            {formatCurrency(group.discount)}
          </span>
        );
      case "advancePaid":
        return (
          <span className="text-sm font-semibold text-cyan-700">
            {formatCurrency(group.advancePaid)}
          </span>
        );
      case "paid":
        return (
          <span className="text-sm font-semibold text-emerald-600">
            {formatCurrency(group.generatedRevenue)}
          </span>
        );
      case "pending":
        return (
          <span className="text-sm font-semibold text-rose-600">
            {formatCurrency(group.pendingRevenue)}
          </span>
        );
      case "progress":
        return (
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
        );
      case "expand":
        return expanded ? (
          <ChevronUp size={16} className="inline text-slate-500" />
        ) : (
          <ChevronDown size={16} className="inline text-slate-500" />
        );
      default:
        return null;
    }
  }

  function renderGroupedPlanDetailCell(
    columnKey: string,
    {
      plan,
      metrics,
      rowTone,
    }: {
      plan: PlanRecord;
      metrics: ReturnType<typeof getPlanMetrics>;
      rowTone: string;
    },
  ): ReactNode {
    switch (columnKey) {
      case "label":
        return (
          <div className="flex items-start gap-2 pl-5 text-sm text-slate-700">
            <div className="min-w-0 flex-1">
              <p>
                {groupBy === "customer" ? plan.item.name : plan.customer.name}
              </p>
              <p className="font-mono text-[11px] text-slate-400">{plan.id}</p>
            </div>
            <EntityViewButton
              label={`${groupBy === "customer" ? "item" : "customer"} ${
                groupBy === "customer" ? plan.item.name : plan.customer.name
              }`}
              className="shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                if (groupBy === "customer") {
                  setViewingItemId(plan.item.id);
                } else {
                  setViewingCustomerId(plan.customer.id);
                }
              }}
            />
          </div>
        );
      case "plans":
        return <span className="text-xs text-slate-500">{plan.months} mo</span>;
      case "total":
        return (
          <span className="text-sm text-slate-700">
            {formatCurrency(metrics.totalRevenue)}
          </span>
        );
      case "discount":
        return (
          <span className="text-sm text-amber-700">
            {formatCurrency(plan.discount ?? 0)}
          </span>
        );
      case "advancePaid":
        return (
          <span className="text-sm text-cyan-700">
            {formatCurrency(plan.advancePaid)}
          </span>
        );
      case "paid":
        return (
          <span className="text-sm text-emerald-600">
            {formatCurrency(metrics.generatedRevenue)}
          </span>
        );
      case "pending":
        return (
          <span className="text-sm text-rose-600">
            {formatCurrency(metrics.pendingRevenue)}
          </span>
        );
      case "progress":
        return (
          <div className="h-1.5 rounded-full bg-slate-200">
            <div
              className={`h-1.5 rounded-full ${rowTone}`}
              style={{ width: getProgressWidth(metrics.progress) }}
            />
          </div>
        );
      case "expand":
        return (
          <div className="flex items-center justify-end gap-2">
            {renderPlanActionsDropdown(plan)}
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-slate-800"
              asChild
            >
              <Link href={`/dashboard/installments?plan=${plan.id}`}>
                View Installments
              </Link>
            </Button>
          </div>
        );
      default:
        return null;
    }
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

      {/* Date range filter removed: always show all plans */}

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
                    {PLAN_TABLE_COLUMNS.map((column) => (
                      <th
                        key={column.key}
                        className={tableHeaderClassName(column)}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlans.map((plan) => {
                    const metrics = getPlanMetrics(plan);
                    const tone = getProgressTone(metrics.progress);
                    const expanded = expandedPlanRows.has(plan.id);
                    const completed = metrics.progress >= 100;
                    const rowContext = {
                      plan,
                      metrics,
                      tone,
                      expanded,
                      completed,
                    };

                    return (
                      <>
                        <tr key={plan.id} className="hover:bg-slate-50/70">
                          {PLAN_TABLE_COLUMNS.map((column) => (
                            <td
                              key={column.key}
                              className={tableCellClassName(column)}
                            >
                              {renderPlanTableCell(column.key, rowContext)}
                            </td>
                          ))}
                        </tr>

                        {expanded ? (
                          <tr>
                            <td
                              colSpan={PLAN_TABLE_COLUMNS.length}
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
                                  const canEditPayment =
                                    Boolean(latestTransactionId);
                                  const canViewInvoice =
                                    installment.status !== "pending" &&
                                    Boolean(latestTransactionId);

                                  return (
                                    <div
                                      key={installment.id}
                                      className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 ${completed ? "line-through text-slate-400 opacity-70" : ""}`}
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
                                          disabled={
                                            remaining <= 0 && !canEditPayment
                                          }
                                          onClick={() => {
                                            if (remaining > 0) {
                                              setEditingTransactionId(null);
                                              setSelectedInstallmentId(
                                                installment.id,
                                              );
                                              return;
                                            }

                                            if (latestTransactionId) {
                                              setEditingTransactionId(
                                                latestTransactionId,
                                              );
                                              setSelectedInstallmentId(
                                                installment.id,
                                              );
                                            }
                                          }}
                                        >
                                          {remaining > 0
                                            ? "Record"
                                            : canEditPayment
                                              ? "Edit Payment"
                                              : "Paid"}
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
                const completed = metrics.progress >= 100;

                return (
                  <div key={plan.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 truncate">
                            Account # {plan.account_number}
                          </p>
                          <EntityViewButton
                            label={`plan ${plan.account_number}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (plan.account_number != null) {
                                setViewingPlanId(plan.account_number);
                              }
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
                    <div className="flex items-center gap-2">
                      {renderPlanActionsDropdown(plan)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {PLAN_MOBILE_METRIC_COLUMNS.map((metric) => (
                        <div key={metric.key}>
                          <p className="text-slate-500">{metric.label}</p>
                          <p
                            className={`font-semibold ${metric.valueClassName}`}
                          >
                            {getPlanMobileMetricValue(
                              metric.key,
                              plan,
                              metrics,
                            )}
                          </p>
                        </div>
                      ))}
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
                          const canEditPayment = Boolean(latestTransactionId);
                          const canViewInvoice =
                            installment.status !== "pending" &&
                            Boolean(latestTransactionId);

                          return (
                            <div
                              key={installment.id}
                              className={`space-y-1 rounded-lg border border-slate-200 bg-white p-2.5 ${completed ? "line-through text-slate-400 opacity-70" : ""}`}
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
                                  disabled={remaining <= 0 && !canEditPayment}
                                  onClick={() => {
                                    if (remaining > 0) {
                                      setEditingTransactionId(null);
                                      setSelectedInstallmentId(installment.id);
                                      return;
                                    }

                                    if (latestTransactionId) {
                                      setEditingTransactionId(
                                        latestTransactionId,
                                      );
                                      setSelectedInstallmentId(installment.id);
                                    }
                                  }}
                                >
                                  {remaining > 0
                                    ? "Record"
                                    : canEditPayment
                                      ? "Edit Payment"
                                      : "Paid"}
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
                  {GROUPED_PLAN_TABLE_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={tableHeaderClassName(column)}
                    >
                      {column.key === "label"
                        ? groupBy === "customer"
                          ? "Customer"
                          : "Item"
                        : column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedPlans.map((group) => {
                  const expanded = expandedGroups.has(group.key);
                  const tone = getProgressTone(group.progress);
                  const groupContext = { group, expanded, tone };

                  return (
                    <>
                      <tr
                        key={group.key}
                        className="border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer"
                        onClick={() => toggleGroup(group.key)}
                      >
                        {GROUPED_PLAN_TABLE_COLUMNS.map((column) => (
                          <td
                            key={column.key}
                            className={tableCellClassName(column)}
                          >
                            {renderGroupedPlanTableCell(
                              column.key,
                              groupContext,
                            )}
                          </td>
                        ))}
                      </tr>

                      {expanded
                        ? group.plans.map((plan) => {
                            const metrics = getPlanMetrics(plan);
                            const rowTone = getProgressTone(metrics.progress);
                            const detailContext = { plan, metrics, rowTone };

                            return (
                              <tr
                                key={plan.id}
                                className="border-b border-slate-100 bg-slate-50/40"
                              >
                                {GROUPED_PLAN_TABLE_COLUMNS.map((column) => (
                                  <td
                                    key={column.key}
                                    className={tableCellClassName(column)}
                                  >
                                    {renderGroupedPlanDetailCell(
                                      column.key,
                                      detailContext,
                                    )}
                                  </td>
                                ))}
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
            setEditingTransactionId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTransactionId
                ? "Edit Installment Transaction"
                : "Record Installment Transaction"}
            </DialogTitle>
            <DialogDescription>
              {editingTransactionId
                ? "Update the same transaction record for this paid installment."
                : "Add a payment directly against this installment."}
            </DialogDescription>
          </DialogHeader>

          {selectedInstallment ? (
            <TransactionForm
              installments={installmentOptions}
              initialInstallmentId={selectedInstallment.id}
              transactionId={editingTransactionId || undefined}
              mode={editingTransactionId ? "edit" : "create"}
              lockInstallment
              submitLabel={
                editingTransactionId ? "Save Changes" : "Record Transaction"
              }
              onSuccess={(createdTransaction) => {
                setSelectedInstallmentId(null);
                setEditingTransactionId(null);
                setViewingTransactionId(createdTransaction.id);
                router.refresh();
              }}
              onCancel={() => {
                setSelectedInstallmentId(null);
                setEditingTransactionId(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(advanceDialogPlan)}
        onOpenChange={(open) => {
          if (!open) {
            setAdvanceDialogPlan(null);
            setAdvanceError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Advance</DialogTitle>
            <DialogDescription>
              Update the advance amount for plan #{advanceDialogPlan?.id}. This
              updates the plan record and its advance transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance Amount</Label>
              <Input
                id="advanceAmount"
                inputMode="numeric"
                value={advanceAmount}
                onChange={(event) =>
                  setAdvanceAmount(wholeNumberInput(event.target.value))
                }
              />
              {advanceDialogPlan ? (
                <p className="text-xs text-slate-500">
                  Selling price:{" "}
                  {formatCurrency(advanceDialogPlan.sellingPrice)}
                  {(advanceDialogPlan.discount ?? 0) > 0
                    ? ` • Discount: ${formatCurrency(advanceDialogPlan.discount)}`
                    : ""}
                </p>
              ) : null}
              {advanceError ? (
                <p className="text-sm text-rose-600">{advanceError}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdvanceDialogPlan(null)}
              disabled={savingAdvance}
            >
              Cancel
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              onClick={saveAdvance}
              disabled={savingAdvance}
            >
              {savingAdvance ? "Saving..." : "Save Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(discountDialogPlan)}
        onOpenChange={(open) => {
          if (!open) {
            setDiscountDialogPlan(null);
            setDiscountError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
            <DialogDescription>
              Update the discount for plan #{discountDialogPlan?.id}. This
              updates the plan record and creates or edits the discount
              transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount Amount</Label>
              <Input
                id="discountAmount"
                inputMode="numeric"
                value={discountAmount}
                onChange={(event) =>
                  setDiscountAmount(wholeNumberInput(event.target.value))
                }
              />
              {discountDialogPlan ? (
                <p className="text-xs text-slate-500">
                  Selling price:{" "}
                  {formatCurrency(discountDialogPlan.sellingPrice)} • Advance
                  paid: {formatCurrency(discountDialogPlan.advancePaid)}
                </p>
              ) : null}
              {discountError ? (
                <p className="text-sm text-rose-600">{discountError}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDiscountDialogPlan(null)}
              disabled={savingDiscount}
            >
              Cancel
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              onClick={saveDiscount}
              disabled={savingDiscount}
            >
              {savingDiscount ? "Saving..." : "Save Discount"}
            </Button>
          </DialogFooter>
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
