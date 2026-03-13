"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CategoryFormProps = {
  mode?: "create" | "edit";
  category?: {
    id: string;
    name: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CategoryForm({
  mode = "create",
  category,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(category?.name || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(category?.name || "");
  }, [category]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "edit" && category
          ? `/api/categories/${category.id}`
          : "/api/categories";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.error ||
            `Failed to ${mode === "edit" ? "update" : "create"} category`,
        );
        return;
      }

      router.refresh();
      onSuccess?.();

      if (mode === "create") {
        setName("");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name" className="text-slate-700 font-medium">
          Category Name *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="For example: Electronics"
          required
          className="mt-1 h-11 rounded-xl border-slate-200"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            if (onCancel) {
              onCancel();
              return;
            }

            router.back();
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 hover:bg-slate-800"
        >
          {loading
            ? mode === "edit"
              ? "Saving Changes..."
              : "Saving..."
            : mode === "edit"
              ? "Save Changes"
              : "Save Category"}
        </Button>
      </div>
    </form>
  );
}
