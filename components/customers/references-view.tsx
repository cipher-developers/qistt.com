"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Plus,
  Search,
  Sparkles,
  Users,
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
import { ReferenceForm } from "@/components/customers/reference-form";
import { ReferenceDeleteButton } from "@/components/customers/reference-delete-button";

type ReferenceRecord = {
  id: string;
  name: string;
  createdAt: string | Date;
  _count: {
    customers: number;
  };
};

type ReferencesViewProps = {
  tenantName?: string;
  references: ReferenceRecord[];
};

export function ReferencesView({
  tenantName,
  references,
}: ReferencesViewProps) {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReference, setEditingReference] =
    useState<ReferenceRecord | null>(null);

  const filteredReferences = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return references;
    return references.filter((r) => r.name.toLowerCase().includes(value));
  }, [references, query]);

  const totalCustomers = references.reduce(
    (sum, r) => sum + r._count.customers,
    0,
  );
  const activeReferences = references.filter(
    (r) => r._count.customers > 0,
  ).length;

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Hero */}
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles size={14} />
              Reference Workspace
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                References
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Create, update, and manage customer references. Use references
                to track where customers were referred from.
                {tenantName ? ` Workspace: ${tenantName}.` : ""}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 flex-1 sm:min-w-72 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search references"
                className="h-11 rounded-xl border-slate-200 bg-white pl-9"
              />
            </div>
            <Button variant="outline" className="h-11 rounded-xl" asChild>
              <Link href="/dashboard/customers">
                <ArrowLeft size={16} />
                Back to Customers
              </Link>
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium hover:bg-slate-800"
            >
              <Plus size={16} />
              Add Reference
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total References
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {references.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-sky-50 p-2.5 text-sky-600">
              <Bookmark size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assigned Customers
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {totalCustomers}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-2.5 text-emerald-600">
              <Users size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active References
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {activeReferences}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                References currently in use
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-amber-50 p-2.5 text-amber-600">
              <Bookmark size={20} />
            </div>
          </div>
        </Card>
      </section>

      {/* List */}
      <section>
        {filteredReferences.length === 0 ? (
          <Card className="border border-dashed border-slate-300 bg-white/75 p-10 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Bookmark size={22} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {references.length === 0
                  ? "No references yet"
                  : "No matching references"}
              </h2>
              <p className="text-sm text-slate-600">
                {references.length === 0
                  ? 'Add references like "Walk-in", "Referral", or "Online" to categorize your customers.'
                  : "Try a different search term or clear the current filter."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {references.length > 0 ? (
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear Search
                  </Button>
                ) : null}
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Reference
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200/70 bg-white/90 p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[minmax(0,1.5fr)_140px_160px_170px] border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Reference</div>
                <div>Customers</div>
                <div>Created</div>
                <div>Actions</div>
              </div>
              <div className="divide-y divide-slate-200">
                {filteredReferences.map((reference) => (
                  <div
                    key={reference.id}
                    className="grid grid-cols-[minmax(0,1.5fr)_140px_160px_170px] items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {reference.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Customer acquisition source
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {reference._count.customers} customers
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {new Date(reference.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setEditingReference(reference)}
                      >
                        Edit
                      </Button>
                      <ReferenceDeleteButton
                        referenceId={reference.id}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div className="grid gap-4 p-4 md:hidden">
              {filteredReferences.map((reference) => (
                <div
                  key={reference.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {reference.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Created{" "}
                        {new Date(reference.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {reference._count.customers} customers
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingReference(reference)}
                    >
                      Edit Reference
                    </Button>
                    <ReferenceDeleteButton referenceId={reference.id} compact />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Add Reference
            </DialogTitle>
            <DialogDescription>
              Create a new customer reference to track acquisition sources.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <ReferenceForm
              mode="create"
              onSuccess={() => setIsCreateOpen(false)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingReference}
        onOpenChange={(open) => {
          if (!open) setEditingReference(null);
        }}
      >
        <DialogContent className="max-w-xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Edit Reference
            </DialogTitle>
            <DialogDescription>
              Update the name of this customer reference.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {editingReference && (
              <ReferenceForm
                mode="edit"
                reference={editingReference}
                onSuccess={() => setEditingReference(null)}
                onCancel={() => setEditingReference(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
