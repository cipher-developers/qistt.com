"use client";

import { useMemo, useState } from "react";
import { Building2, Calendar, Plus, Search, Sparkles } from "lucide-react";
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
import { VendorForm } from "@/components/vendors/vendor-form";
import { VendorDeleteButton } from "@/components/vendors/vendor-delete-button";

type Vendor = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string | Date;
  _count: {
    purchases: number;
  };
};

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

export function VendorsView({ vendors }: { vendors: Vendor[] }) {
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
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

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

  const dateFilteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const created = new Date(vendor.createdAt);
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
  }, [vendors, fromDate, toDate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dateFilteredVendors;
    return dateFilteredVendors.filter((v) =>
      [v.name, v.phone, v.email, v.address]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [query, dateFilteredVendors]);

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles size={14} />
              Vendor Workspace
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Vendors
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Manage supplier records and connect purchases to each vendor.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 flex-1 sm:min-w-72 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, phone, or email"
                className="h-11 rounded-xl border-slate-200 bg-white pl-9"
              />
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium hover:bg-slate-800"
            >
              <Plus size={16} />
              Add Vendor
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

      <Card className="overflow-hidden border border-slate-200/70 bg-white/90 p-0">
        <div className="hidden md:block">
          <div className="grid grid-cols-[90px_minmax(0,1.2fr)_minmax(0,1fr)_110px_130px_170px] border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>ID</div>
            <div>Vendor</div>
            <div>Contact</div>
            <div>Purchases</div>
            <div>Created</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-slate-200">
            {filtered.map((vendor) => (
              <div
                key={vendor.id}
                className="grid grid-cols-[90px_minmax(0,1.2fr)_minmax(0,1fr)_110px_130px_170px] items-center gap-4 px-6 py-4 hover:bg-slate-50/80"
              >
                <div className="text-sm font-semibold text-slate-700">
                  #{vendor.id}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {vendor.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {vendor.address || "No address"}
                  </p>
                </div>
                <div className="text-sm text-slate-600">
                  <p>{vendor.phone}</p>
                  <p className="text-xs text-slate-500">
                    {vendor.email || "No email"}
                  </p>
                </div>
                <div>
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {vendor._count.purchases}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  {new Date(vendor.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setEditingVendor(vendor)}
                  >
                    Edit
                  </Button>
                  <VendorDeleteButton vendorId={vendor.id} compact />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-4 md:hidden">
          {filtered.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900">
                    {vendor.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{vendor.phone}</p>
                </div>
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {vendor._count.purchases}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingVendor(vendor)}
                >
                  Edit Vendor
                </Button>
                <VendorDeleteButton vendorId={vendor.id} compact />
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/75 p-10 text-center text-slate-600">
              <Building2 className="mx-auto mb-2 text-slate-400" />
              {vendors.length === 0
                ? "No vendors found."
                : dateFilteredVendors.length === 0
                  ? "No vendors in selected date range."
                  : "No vendors match your search."}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Add Vendor
            </DialogTitle>
            <DialogDescription>
              Create a vendor for purchase tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <VendorForm
              onSuccess={() => setIsCreateOpen(false)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingVendor)}
        onOpenChange={(open) => !open && setEditingVendor(null)}
      >
        <DialogContent className="max-w-2xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Edit Vendor
            </DialogTitle>
            <DialogDescription>Update vendor details.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {editingVendor ? (
              <VendorForm
                mode="edit"
                vendor={editingVendor}
                onSuccess={() => setEditingVendor(null)}
                onCancel={() => setEditingVendor(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
