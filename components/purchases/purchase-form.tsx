"use client";

import { useState } from "react";
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

export function PurchaseForm({
  vendors,
  items,
  onSuccess,
  onCancel,
}: {
  vendors: Option[];
  items: Option[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    vendorId: vendors[0]?.id ? String(vendors[0].id) : "",
    itemId: items[0]?.id ? String(items[0].id) : "",
    quantity: "1",
    unitCost: "",
    purchasedAt: toDateInputValue(new Date()),
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: Number(formData.vendorId),
          itemId: Number(formData.itemId),
          quantity: Number(formData.quantity),
          unitCost: Number(formData.unitCost),
          purchasedAt: formData.purchasedAt,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Failed to create purchase");
        return;
      }

      router.refresh();
      onSuccess?.();
      setFormData({
        vendorId: vendors[0]?.id ? String(vendors[0].id) : "",
        itemId: items[0]?.id ? String(items[0].id) : "",
        quantity: "1",
        unitCost: "",
        purchasedAt: toDateInputValue(new Date()),
        notes: "",
      });
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
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
            min="0"
            step="0.01"
            value={formData.unitCost}
            onChange={(e) =>
              setFormData({ ...formData, unitCost: e.target.value })
            }
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
          {loading ? "Saving..." : "Record Purchase"}
        </Button>
      </div>
    </form>
  );
}
