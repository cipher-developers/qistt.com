"use client";

import { useMemo, useState } from "react";
import {
  FileDown,
  FileSpreadsheet,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
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
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { formatCurrency } from "@/lib/utils";

function escapeCsv(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
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

type Purchase = {
  id: number;
  quantity: number;
  consumedQty: number;
  unitCost: number;
  purchasedAt: string | Date;
  notes: string | null;
  vendor: { id: number; name: string; phone: string };
  item: { id: number; name: string; model: string | null; sku: string | null };
};

type Option = {
  id: number;
  label: string;
};

type PurchasesViewProps = {
  purchases: Purchase[];
  vendors: Option[];
  items: Option[];
};

export function PurchasesView({ purchases, vendors, items }: PurchasesViewProps) {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<
    "this-month" | "last-30" | "all" | "custom"
  >("this-month");
  const [fromDate, setFromDate] = useState<string>(
    toDateInputValue(startOfCurrentMonth()),
  );
  const [toDate, setToDate] = useState<string>(
    toDateInputValue(endOfCurrentMonth()),
  );

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

  const dateFilteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const purchased = new Date(purchase.purchasedAt);
      purchased.setHours(0, 0, 0, 0);

      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (purchased < start) return false;
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(0, 0, 0, 0);
        if (purchased > end) return false;
      }

      return true;
    });
  }, [purchases, fromDate, toDate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dateFilteredPurchases;
    return dateFilteredPurchases.filter((row) =>
      [
        row.vendor.name,
        row.vendor.phone,
        row.item.name,
        row.item.model,
        row.item.sku,
        row.notes,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [dateFilteredPurchases, query]);

  const exportRows = useMemo(
    () =>
      [...filtered]
        .sort(
          (a, b) =>
            new Date(b.purchasedAt).getTime() -
            new Date(a.purchasedAt).getTime(),
        )
        .map((row) => ({
          purchaseId: row.id,
          date: new Date(row.purchasedAt).toISOString().slice(0, 10),
          vendor: row.vendor.name,
          vendorPhone: row.vendor.phone,
          item: row.item.name,
          quantity: row.quantity,
          consumed: row.consumedQty,
          remaining: Math.max(row.quantity - row.consumedQty, 0),
          unitCost: row.unitCost,
          totalCost: row.quantity * row.unitCost,
          notes: row.notes || "",
        })),
    [filtered],
  );

  function exportToCsv() {
    if (exportRows.length === 0) return;

    const headers = [
      "Purchase #",
      "Date",
      "Vendor",
      "Vendor Phone",
      "Item",
      "Quantity",
      "Consumed",
      "Remaining",
      "Unit Cost",
      "Total Cost",
      "Notes",
    ];

    const lines = [
      headers.join(","),
      ...exportRows.map((row) =>
        [
          row.purchaseId,
          row.date,
          row.vendor,
          row.vendorPhone,
          row.item,
          row.quantity,
          row.consumed,
          row.remaining,
          row.unitCost,
          row.totalCost,
          row.notes,
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    downloadBlob(
      new Blob([`\uFEFF${lines.join("\n")}`], {
        type: "text/csv;charset=utf-8;",
      }),
      `purchases-export-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  function exportToExcel() {
    if (exportRows.length === 0) return;

    const headerCells = [
      "Purchase #",
      "Date",
      "Vendor",
      "Vendor Phone",
      "Item",
      "Quantity",
      "Consumed",
      "Remaining",
      "Unit Cost",
      "Total Cost",
      "Notes",
    ]
      .map((header) => `<th>${header}</th>`)
      .join("");

    const rowsHtml = exportRows
      .map(
        (row) => `
      <tr>
        <td>${row.purchaseId}</td>
        <td>${row.date}</td>
        <td>${row.vendor}</td>
        <td>${row.vendorPhone}</td>
        <td>${row.item}</td>
        <td>${row.quantity}</td>
        <td>${row.consumed}</td>
        <td>${row.remaining}</td>
        <td>${row.unitCost}</td>
        <td>${row.totalCost}</td>
        <td>${row.notes}</td>
      </tr>`,
      )
      .join("");

    const tableHtml = `<table><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`;

    downloadBlob(
      new Blob([tableHtml], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      }),
      `purchases-export-${new Date().toISOString().slice(0, 10)}.xls`,
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles size={14} />
              Purchase Ledger
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Purchases
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Track all item purchases, costs, quantities, and remaining
                stock.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 flex-1 sm:min-w-72 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search vendor, item, phone, SKU, or notes"
                className="h-11 rounded-xl border-slate-200 bg-white pl-9"
              />
            </div>
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
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium hover:bg-slate-800"
            >
              <Plus size={16} />
              Record Purchase
            </Button>
          </div>
        </div>
      </section>

      <section>
        <Card className="border border-slate-200/70 bg-white/90 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Purchase Date Range
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
      </section>

      <Card className="overflow-hidden border border-slate-200/70 bg-white/90 p-0">
        <div className="hidden md:block">
          <div className="grid grid-cols-[100px_120px_minmax(0,1fr)_minmax(0,1fr)_100px_100px_100px_120px_160px] border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>#</div>
            <div>Date</div>
            <div>Vendor</div>
            <div>Item</div>
            <div>Qty</div>
            <div>Used</div>
            <div>Balance</div>
            <div>Unit Cost</div>
            <div>Total Cost</div>
          </div>
          <div className="divide-y divide-slate-200">
            {filtered.map((row) => {
              const remaining = Math.max(row.quantity - row.consumedQty, 0);
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[100px_120px_minmax(0,1fr)_minmax(0,1fr)_100px_100px_100px_120px_160px] items-center gap-4 px-6 py-4 hover:bg-slate-50/80"
                >
                  <div className="text-sm font-semibold text-slate-700">
                    #{row.id}
                  </div>
                  <div className="text-sm text-slate-600">
                    {new Date(row.purchasedAt).toLocaleDateString()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {row.vendor.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.vendor.phone}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {row.item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.item.model || row.item.sku || "-"}
                    </p>
                  </div>
                  <div className="text-sm text-slate-700">{row.quantity}</div>
                  <div className="text-sm text-slate-700">{row.consumedQty}</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {remaining}
                  </div>
                  <div className="text-sm text-slate-700">
                    {formatCurrency(row.unitCost)}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {formatCurrency(row.unitCost * row.quantity)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 p-4 md:hidden">
          {filtered.map((row) => {
            const remaining = Math.max(row.quantity - row.consumedQty, 0);
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {row.item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Vendor: {row.vendor.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(row.purchasedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    #{row.id}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <p>Qty: {row.quantity}</p>
                  <p>Used: {row.consumedQty}</p>
                  <p>Balance: {remaining}</p>
                  <p>Unit: {formatCurrency(row.unitCost)}</p>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/75 p-10 text-center text-slate-600">
              <ShoppingCart className="mx-auto mb-2 text-slate-400" />
              {purchases.length === 0
                ? "No purchases found."
                : dateFilteredPurchases.length === 0
                  ? "No purchases in selected date range."
                  : "No purchases match your search."}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Record Purchase
            </DialogTitle>
            <DialogDescription>
              Add quantity and purchase cost from a vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <PurchaseForm
              vendors={vendors}
              items={items}
              onSuccess={() => setIsCreateOpen(false)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
