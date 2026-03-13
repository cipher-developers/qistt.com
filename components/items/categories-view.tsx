"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  Package,
  Plus,
  Search,
  Sparkles,
  Tags,
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
import { CategoryForm } from "@/components/items/category-form";
import { CategoryDeleteButton } from "@/components/items/category-delete-button";

type CategoryRecord = {
  id: string;
  name: string;
  createdAt: string | Date;
  _count: {
    items: number;
  };
};

type CategoriesViewProps = {
  tenantName?: string;
  categories: CategoryRecord[];
};

export function CategoriesView({
  tenantName,
  categories,
}: CategoriesViewProps) {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(
    null,
  );

  const filteredCategories = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(value),
    );
  }, [categories, query]);

  const totalItems = categories.reduce(
    (sum, category) => sum + category._count.items,
    0,
  );
  const activeCategories = categories.filter(
    (category) => category._count.items > 0,
  ).length;

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles size={14} />
              Category Workspace
            </p>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Categories
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Create, update, and manage item categories without leaving the
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
                placeholder="Search categories"
                className="h-11 rounded-xl border-slate-200 bg-white pl-9"
              />
            </div>
            <Button variant="outline" className="h-11 rounded-xl" asChild>
              <Link href="/dashboard/items">
                <ArrowLeft size={16} />
                Back to Items
              </Link>
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium hover:bg-slate-800"
            >
              <Plus size={16} />
              Add Category
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Categories
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {categories.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-sky-50 p-2.5 text-sky-600">
              <FolderKanban size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assigned Items
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {totalItems}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-2.5 text-emerald-600">
              <Package size={20} />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active Categories
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {activeCategories}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Categories currently in use
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-amber-50 p-2.5 text-amber-600">
              <Tags size={20} />
            </div>
          </div>
        </Card>
      </section>

      <section>
        {filteredCategories.length === 0 ? (
          <Card className="border border-dashed border-slate-300 bg-white/75 p-10 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FolderKanban size={22} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {categories.length === 0
                  ? "No categories yet"
                  : "No matching categories"}
              </h2>
              <p className="text-sm text-slate-600">
                {categories.length === 0
                  ? "Build your category structure first so item creation feels clean and organized."
                  : "Try a different search term or clear the current filter to see all categories."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {categories.length > 0 ? (
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear Search
                  </Button>
                ) : null}
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Category
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200/70 bg-white/90 p-0">
            <div className="hidden md:block">
              <div className="grid grid-cols-[minmax(0,1.5fr)_140px_160px_170px] border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Category</div>
                <div>Items</div>
                <div>Created</div>
                <div>Actions</div>
              </div>
              <div className="divide-y divide-slate-200">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="grid grid-cols-[minmax(0,1.5fr)_140px_160px_170px] items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {category.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Used to organize item inventory
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {category._count.items} items
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setEditingCategory(category)}
                      >
                        Edit
                      </Button>
                      <CategoryDeleteButton categoryId={category.id} compact />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {category.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Created{" "}
                        {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {category._count.items} items
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingCategory(category)}
                    >
                      Edit Category
                    </Button>
                    <CategoryDeleteButton categoryId={category.id} compact />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Add Category
            </DialogTitle>
            <DialogDescription>
              Create a new category and keep your item catalog organized.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <CategoryForm
              onSuccess={() => setIsCreateOpen(false)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingCategory)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCategory(null);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-2xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="text-xl text-slate-900">
              Edit Category
            </DialogTitle>
            <DialogDescription>
              Update category names without leaving the management screen.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {editingCategory ? (
              <CategoryForm
                mode="edit"
                category={editingCategory}
                onSuccess={() => setEditingCategory(null)}
                onCancel={() => setEditingCategory(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
