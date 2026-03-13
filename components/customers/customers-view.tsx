"use client";

import { useMemo, useState } from "react";
import {
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

type CustomerRecord = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
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

type CustomersViewProps = {
  tenantId?: string;
  tenantName?: string;
  customers: CustomerRecord[];
};

export function CustomersView({
  tenantId,
  tenantName,
  customers,
}: CustomersViewProps) {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(
    null,
  );

  const filteredCustomers = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.address]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(value)),
    );
  }, [customers, query]);

  const totalPlans = customers.reduce(
    (sum, customer) => sum + customer._count.installmentPlans,
    0,
  );

  const customersWithEmail = customers.filter(
    (customer) => customer.email,
  ).length;

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
                placeholder="Search by name, email, phone, or address"
                className="h-11 rounded-xl border-slate-200 bg-white pl-9"
              />
            </div>
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Customers
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {customers.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-sky-50 p-2.5 text-sky-600">
              <Users size={20} />
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
                <div>ID</div>
                <div>Customer</div>
                <div>Contact</div>
                <div>Address</div>
                <div>Plans</div>
                <div>Created</div>
                <div>Actions</div>
              </div>
              <div className="divide-y divide-slate-200">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="grid grid-cols-[90px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_120px_130px_170px] items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                  >
                    <div className="text-sm font-semibold text-slate-700">
                      #{customer.id}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {customer.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Customer profile
                      </p>
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
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ID #{customer.id}
                      </p>
                      <p className="truncate text-base font-semibold text-slate-900">
                        {customer.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {customer.address || "No address added"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Created {formatDate(customer.createdAt)}
                      </p>
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
                customer={editingCustomer}
                mode="edit"
                onSuccess={() => setEditingCustomer(null)}
                onCancel={() => setEditingCustomer(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
