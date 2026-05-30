"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

type ItemFormProps = {
  tenantId?: string;
  categories: Category[];
  mode?: "create" | "edit";
  item?: {
    id: number;
    name: string;
    model: string | null;
    description: string | null;
    sku: string | null;
    categoryId: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ItemForm({
  tenantId,
  categories,
  mode = "create",
  item,
  onSuccess,
  onCancel,
}: ItemFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: item?.name || "",
    model: item?.model || "",
    description: item?.description || "",
    sku: item?.sku || "",
    categoryId: item?.categoryId || categories[0]?.id || "",
  });

  useEffect(() => {
    setFormData({
      name: item?.name || "",
      model: item?.model || "",
      description: item?.description || "",
      sku: item?.sku || "",
      categoryId: item?.categoryId || categories[0]?.id || "",
    });
  }, [categories, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.categoryId) {
      setError("Please select a category before saving this item.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "edit" && item ? `/api/items/${item.id}` : "/api/items";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tenantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error ||
            `Failed to ${mode === "edit" ? "update" : "create"} item`,
        );
      } else {
        router.refresh();
        onSuccess?.();

        if (mode === "create") {
          setFormData({
            name: "",
            model: "",
            description: "",
            sku: "",
            categoryId: categories[0]?.id || "",
          });
        }
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name" className="text-slate-700 font-medium">
          Item Name *
        </Label>
        <Input
          id="name"
          placeholder="Item Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-1 h-11 rounded-xl border-slate-200"
        />
      </div>

      <div>
        <Label htmlFor="model" className="text-slate-700 font-medium">
          Model
        </Label>
        <Input
          id="model"
          placeholder="Item model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="mt-1 h-11 rounded-xl border-slate-200"
        />
      </div>

      <div>
        <Label htmlFor="category" className="text-slate-700 font-medium">
          Category *
        </Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) =>
            setFormData({ ...formData, categoryId: value })
          }
        >
          <SelectTrigger className="mt-1 h-11 rounded-xl border-slate-200">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description" className="text-slate-700 font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Item description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="mt-1 rounded-xl border-slate-200"
        />
      </div>

      <div>
        <Label htmlFor="sku" className="text-slate-700 font-medium">
          SKU
        </Label>
        <Input
          id="sku"
          placeholder="SKU code"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          className="mt-1 h-11 rounded-xl border-slate-200"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
              : "Save Item"}
        </Button>
      </div>
    </form>
  );
}
