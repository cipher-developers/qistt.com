"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VendorFormProps = {
  mode?: "create" | "edit";
  vendor?: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    notes: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function VendorForm({
  mode = "create",
  vendor,
  onSuccess,
  onCancel,
}: VendorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: vendor?.name || "",
    phone: vendor?.phone || "",
    email: vendor?.email || "",
    address: vendor?.address || "",
    notes: vendor?.notes || "",
  });

  useEffect(() => {
    setFormData({
      name: vendor?.name || "",
      phone: vendor?.phone || "",
      email: vendor?.email || "",
      address: vendor?.address || "",
      notes: vendor?.notes || "",
    });
  }, [vendor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "edit" && vendor
          ? `/api/vendors/${vendor.id}`
          : "/api/vendors";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.error ||
            `Failed to ${mode === "edit" ? "update" : "create"} vendor`,
        );
        return;
      }

      router.refresh();
      onSuccess?.();

      if (mode === "create") {
        setFormData({
          name: "",
          phone: "",
          email: "",
          address: "",
          notes: "",
        });
      }
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
          <Label htmlFor="name" className="font-medium text-slate-700">
            Vendor Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mt-1 h-11 rounded-xl border-slate-200"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="font-medium text-slate-700">
            Phone *
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
            className="mt-1 h-11 rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email" className="font-medium text-slate-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="mt-1 h-11 rounded-xl border-slate-200"
          />
        </div>
        <div>
          <Label htmlFor="address" className="font-medium text-slate-700">
            Address
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="mt-1 h-11 rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="font-medium text-slate-700">
          Notes
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
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
            ? mode === "edit"
              ? "Saving..."
              : "Adding..."
            : mode === "edit"
              ? "Save Changes"
              : "Add Vendor"}
        </Button>
      </div>
    </form>
  );
}
