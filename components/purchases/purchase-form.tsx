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

function toDateInputValue(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

type Option = { id: number; name: string };

type PurchaseFormProps = {
  vendors: Option[];
  items: Option[];
  mode?: "create" | "edit";
  purchase?: {
    id: number;
    vendor: { id: number };
    item: { id: number };
    quantity: number;
    unitCost: number;
    purchasedAt: string | Date;
    notes: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

function buildFormState(
  vendors: Option[],
  items: Option[],
  purchase?: PurchaseFormProps["purchase"],
) {
  return {
    vendorId: purchase
      ? String(purchase.vendor.id)
      : vendors[0]?.id
        ? String(vendors[0].id)
        : "",
    itemId: purchase
      ? String(purchase.item.id)
      : items[0]?.id
        ? String(items[0].id)
        : "",
    quantity: purchase ? String(purchase.quantity) : "1",
    unitCost: purchase ? String(Math.round(purchase.unitCost)) : "",
    purchasedAt: purchase
      ? toDateInputValue(new Date(purchase.purchasedAt))
      : toDateInputValue(new Date()),
    notes: purchase?.notes || "",
  };
}

export function PurchaseForm({
  vendors,
  items,
  mode = "create",
  purchase,
  onSuccess,
  onCancel,
}: PurchaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(() =>
    buildFormState(vendors, items, purchase),
  );

  useEffect(() => {
    setFormData(buildFormState(vendors, items, purchase));
  }, [vendors, items, purchase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const quantity = Number(formData.quantity);
    const unitCost = Number(formData.unitCost);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isInteger(unitCost) ||
      unitCost <= 0
    ) {
      setError("Quantity and unit cost must be whole numbers greater than zero.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "edit" && purchase
          ? `/api/purchases/${purchase.id}`
          : "/api/purchases";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: Number(formData.vendorId),
          itemId: Number(formData.itemId),
          quantity,
          unitCost,
          purchasedAt: formData.purchasedAt,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.error ||
            `Failed to ${mode === "edit" ? "update" : "create"} purchase`,
        );
        return;
      }

      router.refresh();
      onSuccess?.();

      if (mode === "create") {
        setFormData(buildFormState(vendors, items));
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleUnitCostChange(value: string) {
    const wholeNumber = value.replace(/[^\d]/g, "");
    setFormData({ ...formData, unitCost: wholeNumber });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="font-medium text-slate-700">Vendor *</Label>
          <Select
            value={formData.vendorId}
            onValueChange={(value) =>
              setFormData({ ...formData, vendorId: value })
            }
          >
            <SelectTrigger className="mt-1 h-11 rounded-xl border-slate-200">
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={String(vendor.id)}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="font-medium text-slate-700">Item *</Label>
          <Select
            value={formData.itemId}
            onValueChange={(value) =>
              setFormData({ ...formData, itemId: value })
            }
          >
            <SelectTrigger className="mt-1 h-11 rounded-xl border-slate-200">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label className="font-medium text-slate-700">Quantity *</Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            className="mt-1 h-11 rounded-xl border-slate-200"
            required
          />
        </div>
        <div>
          <Label className="font-medium text-slate-700">Unit Cost *</Label>
          <Input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={formData.unitCost}
            onChange={(e) => handleUnitCostChange(e.target.value)}
            className="mt-1 h-11 rounded-xl border-slate-200"
            required
          />
        </div>
        <div>
          <Label className="font-medium text-slate-700">Purchase Date *</Label>
          <Input
            type="date"
            value={formData.purchasedAt}
            onChange={(e) =>
              setFormData({ ...formData, purchasedAt: e.target.value })
            }
            className="mt-1 h-11 rounded-xl border-slate-200"
            required
          />
        </div>
      </div>

      <div>
        <Label className="font-medium text-slate-700">Notes</Label>
        <Textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 rounded-xl border-slate-200"
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
          onClick={onCancel}
          className="rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 hover:bg-slate-800"
        >
          {loading
            ? "Saving..."
            : mode === "edit"
              ? "Save Changes"
              : "Record Purchase"}
        </Button>
      </div>
    </form>
  );
}
