"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Calendar,
  FileDown,
  FileSpreadsheet,
  FolderKanban,
  Package,
  Plus,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ItemForm } from "@/components/items/item-form";
import { ItemDeleteButton } from "@/components/items/delete-button";
import { ItemDetailSheet } from "@/components/items/item-detail-sheet";
import { EntityViewButton } from "@/components/shared/entity-view-button";
import { formatCurrency } from "@/lib/utils";

type CategoryRecord = {
  id: string;
  name: string;
};

type ItemRecord = {
  id: number;
  name: string;
  model: string | null;
  description: string | null;
  sku: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  createdAt: string | Date;
  categoryId: string;
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    installmentPlans: number;
  };
  purchases: {
    quantity: number;
    consumedQty: number;
  }[];
};

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

type ItemsViewProps = {
  tenantId?: string;
  tenantName?: string;
  items: ItemRecord[];
  categories: CategoryRecord[];
};

export function ItemsView({
  tenantId,
  tenantName,
  items,
  categories,
}: ItemsViewProps) {
  const [query, setQuery] = useState("");
  const [datePreset, setDatePreset] = useState<
    "this-month" | "last-30" | "all" | "custom"
  >("this-month");
  const [fromDate, setFromDate] = useState<string>(
    toDateInputValue(startOfCurrentMonth()),
  );
  const [toDate, setToDate] = useState<string>(
    toDateInputValue(endOfCurrentMonth()),
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
  const [viewingItemId, setViewingItemId] = useState<number | null>(null);

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

  const dateFilteredItems = useMemo(() => {
    return items.filter((item) => {
      const created = new Date(item.createdAt);
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
  }, [items, fromDate, toDate]);

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return dateFilteredItems;
    }

    return dateFilteredItems.filter((item) =>
      [item.name, item.model, item.description, item.sku, item.category?.name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(value)),
    );
  }, [dateFilteredItems, query]);

  const exportRows = useMemo(
    () =>
      [...filteredItems]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map((item) => ({
          itemId: item.id,
          itemName: item.name,
          model: item.model || "",
          category: item.category?.name || "Uncategorized",
          sku: item.sku || "",
          quantityIn: item.purchases.reduce((sum, p) => sum + p.quantity, 0),
          quantityOut: item.purchases.reduce(
            (sum, p) => sum + p.consumedQty,
            0,
          ),
          quantityAvailable: item.purchases.reduce(
            (sum, p) => sum + (p.quantity - p.consumedQty),
            0,
          ),
          plans: item._count.installmentPlans,
          createdDate: new Date(item.createdAt).toISOString().slice(0, 10),
        })),
    [filteredItems],
  );

  const totalPlans = dateFilteredItems.reduce(
    (sum, item) => sum + item._count.installmentPlans,
    0,
  );
  const totalStock = dateFilteredItems.reduce(
    (sum, item) =>
      sum +
      item.purchases.reduce(
        (inner, p) => inner + (p.quantity - p.consumedQty),
        0,
      ),
    0,
  );
  const canCreateItem = categories.length > 0;

  function exportToCsv() {
    if (exportRows.length === 0) return;

    const headers = [
      "Item #",
      "Name",
      "Model",
      "Category",
      "SKU",
      "Qty In",
      "Qty Out",
      "Qty Available",
      "Plans",
      "Created Date",
    ];

    const lines = [
      headers.join(","),
      ...exportRows.map((row) =>
        [
          row.itemId,
          row.itemName,
          row.model,
          row.category,
          row.sku,
          row.quantityIn,
          row.quantityOut,
          row.quantityAvailable,
          row.plans,
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
      `items-export-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  function exportToExcel() {
    if (exportRows.length === 0) return;

    const headerCells = [
      "Item #",
      "Name",
      "Model",
      "Category",
      "SKU",
      "Qty In",
      "Qty Out",
      "Qty Available",
      "Plans",
      "Created Date",
    ]
      .map((header) => `<th>${header}</th>`)
      .join("");

    const rowsHtml = exportRows
      .map(
        (row) => `
      <tr>
        <td>${row.itemId}</td>
        <td>${row.itemName}</td>
        <td>${row.model}</td>
        <td>${row.category}</td>
        <td>${row.sku}</td>
        <td>${row.quantityIn}</td>
        <td>${row.quantityOut}</td>
        <td>${row.quantityAvailable}</td>
        <td>${row.plans}</td>
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
      `items-export-${new Date().toISOString().slice(0, 10)}.xls`,
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles size={14} />
              Catalog Workspace
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Items
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Add, edit, and maintain your inventory without leaving the
                dashboard.
                {tenantName ? ` Workspace: ${tenantName}.` : ""}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 flex-1 sm:min-w-72 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by item, model, category, SKU, or description"
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
            <Button variant="outline" className="h-11 rounded-xl" asChild>
              <Link href="/dashboard/items/categories">Manage Categories</Link>
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              disabled={!canCreateItem}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300"
            >
              <Plus size={16} />
              Add Item
            </Button>
          </div>
        </div>
      </section>

      <section>
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
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Items
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {dateFilteredItems.length}
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
                Categories
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {categories.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Required for every item
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-2.5 text-emerald-600">
              <FolderKanban size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total In Stock
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {totalStock}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {totalPlans} total installment plans
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-amber-50 p-2.5 text-amber-600">
              <Boxes size={20} />
            </div>
          </div>
        </Card>
      </section>

      <section>
        {!canCreateItem ? (
          <Card className="border border-dashed border-slate-300 bg-white/75 p-10 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FolderKanban size={22} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Create a category first
              </h2>
              <p className="text-sm text-slate-600">
                Items require a category. Set up your category structure first,
                then add products directly from this page.
              </p>
              <Button className="bg-slate-900 hover:bg-slate-800" asChild>
                <Link href="/dashboard/items/categories">Go to Categories</Link>
              </Button>
            </div>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="border border-dashed border-slate-300 bg-white/75 p-10 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Package size={22} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {items.length === 0 ? "No items yet" : "No matching items"}
              </h2>
              <p className="text-sm text-slate-600">
                {items.length === 0
                  ? "Start building your catalog with an in-dashboard item creation flow."
                  : "Try another keyword or clear your search to see the full item list."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {items.length > 0 ? (
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear Search
                  </Button>
                ) : null}
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Item
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200/70 bg-white/90 p-0">
            <div className="hidden md:block">
              <div className="grid grid-cols-[90px_minmax(0,1.1fr)_180px_120px_120px_110px_130px_170px] border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>ID</div>
                <div>Item</div>
                <div>Category</div>
                <div>Stock</div>
                <div>Plans</div>
                <div>Created</div>
                <div>Actions</div>
              </div>
              <div className="divide-y divide-slate-200">
                {filteredItems.map((item) =>
                  (() => {
                    const availableQty = item.purchases.reduce(
                      (sum, p) => sum + (p.quantity - p.consumedQty),
                      0,
                    );
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[90px_minmax(0,1.2fr)_180px_120px_110px_130px_170px] items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          #{item.id}
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <p className="mt-1 truncate text-xs font-medium text-slate-600">
                              {item.model || "No model"}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <Tag size={12} />
                              <span className="truncate">
                                {item.sku || "No SKU"}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {item.description || "No description added"}
                            </p>
                          </div>
                          <EntityViewButton
                            label={`item ${item.name}`}
                            className="mt-0.5 shrink-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              setViewingItemId(item.id);
                            }}
                          />
                        </div>
                        <div className="truncate text-sm text-slate-600">
                          {item.category?.name || "Uncategorized"}
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {availableQty}
                        </div>
                        <div>
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {item._count.installmentPlans} plans
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {formatDate(item.createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setEditingItem(item)}
                          >
                            Edit
                          </Button>
                          <ItemDeleteButton itemId={item.id} compact />
                        </div>
                      </div>
                    );
                  })(),
                )}
              </div>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ID #{item.id}
                      </p>
                      <div className="mt-1 flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.model || "No model"} •{" "}
                            {item.category?.name || "Uncategorized"}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Created {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <EntityViewButton
                          label={`item ${item.name}`}
                          className="mt-0.5 shrink-0"
                          onClick={() => setViewingItemId(item.id)}
                        />
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {item._count.installmentPlans} plans
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>SKU: {item.sku || "No SKU"}</p>
                    <p>
                      Available Stock:{" "}
                      {item.purchases.reduce(
                        (sum, p) => sum + (p.quantity - p.consumedQty),
                        0,
                      )}
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {item.description || "No description added"}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingItem(item)}
                    >
                      Edit Item
                    </Button>
                    <ItemDeleteButton itemId={item.id} compact />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Add Item
            </DialogTitle>
            <DialogDescription>
              Add a new catalog item without leaving the list view.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <ItemForm
              tenantId={tenantId}
              categories={categories}
              onSuccess={() => setIsCreateOpen(false)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => (!open ? setEditingItem(null) : undefined)}
      >
        <DialogContent className="max-w-2xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Edit Item
            </DialogTitle>
            <DialogDescription>
              Update SKU, category, and product details in one place.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {editingItem ? (
              <ItemForm
                tenantId={tenantId}
                categories={categories}
                mode="edit"
                item={editingItem}
                onSuccess={() => setEditingItem(null)}
                onCancel={() => setEditingItem(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

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
