"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Calendar,
  FileDown,
  FileSpreadsheet,
  Search,
  Plus,
  Users,
  Wallet,
  Sparkles,
  Mail,
  Phone,
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
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerDeleteButton } from "@/components/customers/delete-button";
import { CustomerDetailSheet } from "@/components/customers/customer-detail-sheet";
import { EntityViewButton } from "@/components/shared/entity-view-button";

type ReferenceOption = {
  id: string;
  name: string;
};

type CustomerRecord = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  cnic: string | null;
  address: string | null;
  referenceId?: string | null;
  reference?: { id: string; name: string } | null;
  createdAt: string | Date;
  _count: {
    installmentPlans: number;
  };
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

type CustomersViewProps = {
  tenantId?: string;
  tenantName?: string;
  customers: CustomerRecord[];
  references?: ReferenceOption[];
};

export function CustomersView({
  tenantId,
  tenantName,
  customers,
  references = [],
}: CustomersViewProps) {
  const [query, setQuery] = useState("");
  // Date filtering removed: always show all customers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(
    null,
  );
  const [viewingCustomerId, setViewingCustomerId] = useState<number | null>(
    null,
  );

  // Date preset logic removed

  // Always show all customers (no date filtering)
  const dateFilteredCustomers = customers;

  const filteredCustomers = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return dateFilteredCustomers;
    }

    return dateFilteredCustomers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.cnic,
        customer.address,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(value)),
    );
  }, [dateFilteredCustomers, query]);

  const exportRows = useMemo(
    () =>
      [...filteredCustomers]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map((customer) => ({
          customerId: customer.id,
          name: customer.name,
          phone: customer.phone || "",
          email: customer.email || "",
          cnic: customer.cnic || "",
          reference: customer.reference?.name || "Others",
          address: customer.address || "",
          plans: customer._count.installmentPlans,
          createdDate: new Date(customer.createdAt).toISOString().slice(0, 10),
        })),
    [filteredCustomers],
  );

  const totalPlans = dateFilteredCustomers.reduce(
    (sum, customer) => sum + customer._count.installmentPlans,
    0,
  );

  const customersWithEmail = dateFilteredCustomers.filter(
    (customer) => customer.email,
  ).length;

  function exportToCsv() {
    if (exportRows.length === 0) return;

    const headers = [
      "Customer #",
      "Name",
      "Phone",
      "Email",
      "CNIC",
      "Reference",
      "Address",
      "Plans",
      "Created Date",
    ];

    const lines = [
      headers.join(","),
      ...exportRows.map((row) =>
        [
          row.customerId,
          row.name,
          row.phone,
          row.email,
          row.cnic,
          row.reference,
          row.address,
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
      `customers-export-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  function exportToExcel() {
    if (exportRows.length === 0) return;

    const headerCells = [
      "Customer #",
      "Name",
      "Phone",
      "Email",
      "CNIC",
      "Reference",
      "Address",
      "Plans",
      "Created Date",
    ]
      .map((header) => `<th>${header}</th>`)
      .join("");

    const rowsHtml = exportRows
      .map(
        (row) => `
      <tr>
        <td>${row.customerId}</td>
        <td>${row.name}</td>
        <td>${row.phone}</td>
        <td>${row.email}</td>
        <td>${row.cnic}</td>
        <td>${row.reference}</td>
        <td>${row.address}</td>
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
      `customers-export-${new Date().toISOString().slice(0, 10)}.xls`,
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles size={14} />
              Customer Workspace
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Customers
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Search, create, update, and manage customer profiles without
                leaving the dashboard.
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
                placeholder="Search by name, CNIC, email, phone, or address"
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
              <Link href="/dashboard/customers/references">
                <Bookmark size={16} />
                Manage References
              </Link>
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium hover:bg-slate-800"
            >
              <Plus size={16} />
              Add Customer
            </Button>
          </div>
        </div>
      </section>

      {/* Date range filter removed: always show all customers */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Customers
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {dateFilteredCustomers.length}
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
                Active Plans
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {totalPlans}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-2.5 text-emerald-600">
              <Wallet size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reachable Profiles
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {customersWithEmail}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Profiles with email on file
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-amber-50 p-2.5 text-amber-600">
              <Mail size={20} />
            </div>
          </div>
        </Card>
      </section>

      <section>
        {filteredCustomers.length === 0 ? (
          <Card className="border border-dashed border-slate-300 bg-white/75 p-10 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Users size={22} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {customers.length === 0
                  ? "No customers yet"
                  : "No matching customers"}
              </h2>
              <p className="text-sm text-slate-600">
                {customers.length === 0
                  ? "Start building your customer base with a polished in-dashboard create flow."
                  : "Try another keyword or clear your search to see the full customer list."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {customers.length > 0 ? (
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear Search
                  </Button>
                ) : null}
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Customer
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200/70 bg-white/90 p-0">
            <div className="hidden md:block">
              <div className="grid grid-cols-[90px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_120px_130px_170px] border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Serial #</div>
                <div>Customer</div>
                <div>Contact</div>
                <div>Address</div>
                <div>Plans</div>
                <div>Created</div>
                <div>Actions</div>
              </div>
              <div className="divide-y divide-slate-200">
                {filteredCustomers.map((customer, idx) => (
                  <div
                    key={customer.id}
                    className="grid grid-cols-[90px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_120px_130px_170px] items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                  >
                    <div className="text-sm font-semibold text-slate-700">
                      {idx + 1}
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {customer.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {customer.cnic || "No CNIC"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          <Bookmark size={10} className="mr-1 inline" />
                          {customer.reference?.name ?? "Others"}
                        </p>
                      </div>
                      <EntityViewButton
                        label={`customer ${customer.name}`}
                        className="mt-0.5 shrink-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          setViewingCustomerId(customer.id);
                        }}
                      />
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p className="flex items-center gap-2 truncate">
                        <Mail size={14} className="text-slate-400" />
                        {customer.email || "No email"}
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <Phone size={14} className="text-slate-400" />
                        {customer.phone || "No phone"}
                      </p>
                    </div>
                    <div className="truncate text-sm text-slate-600">
                      {customer.address || "No address added"}
                    </div>
                    <div>
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {customer._count.installmentPlans} plans
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {formatDate(customer.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setEditingCustomer(customer)}
                      >
                        Edit
                      </Button>
                      <CustomerDeleteButton customerId={customer.id} compact />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {filteredCustomers.map((customer, idx) => (
                <div
                  key={customer.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Serial {idx + 1}
                      </p>
                      <div className="mt-1 flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {customer.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {customer.cnic || "No CNIC"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            <Bookmark size={10} className="mr-1 inline" />
                            {customer.reference?.name ?? "Others"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {customer.address || "No address added"}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Created {formatDate(customer.createdAt)}
                          </p>
                        </div>
                        <EntityViewButton
                          label={`customer ${customer.name}`}
                          className="mt-0.5 shrink-0"
                          onClick={() => setViewingCustomerId(customer.id)}
                        />
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {customer._count.installmentPlans} plans
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      {customer.email || "No email"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {customer.phone || "No phone"}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingCustomer(customer)}
                    >
                      Edit Customer
                    </Button>
                    <CustomerDeleteButton customerId={customer.id} compact />
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
              Add Customer
            </DialogTitle>
            <DialogDescription>
              Create a customer profile without leaving the list view.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <CustomerForm
              tenantId={tenantId}
              references={references}
              onSuccess={() => setIsCreateOpen(false)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingCustomer)}
        onOpenChange={(open) => (!open ? setEditingCustomer(null) : undefined)}
      >
        <DialogContent className="max-w-2xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Edit Customer
            </DialogTitle>
            <DialogDescription>
              Update contact details and keep records accurate in real time.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {editingCustomer ? (
              <CustomerForm
                tenantId={tenantId}
                references={references}
                customer={editingCustomer}
                mode="edit"
                onSuccess={() => setEditingCustomer(null)}
                onCancel={() => setEditingCustomer(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <CustomerDetailSheet
        open={Boolean(viewingCustomerId)}
        customerId={viewingCustomerId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingCustomerId(null);
          }
        }}
      />
    </div>
  );
}
