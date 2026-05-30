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

function formatCnicInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  const first = digits.slice(0, 5);
  const second = digits.slice(5, 12);
  const third = digits.slice(12, 13);

  if (digits.length <= 5) {
    return first;
  }

  if (digits.length <= 12) {
    return `${first}-${second}`;
  }

  return `${first}-${second}-${third}`;
}

type ReferenceOption = {
  id: string;
  name: string;
};

type CustomerFormProps = {
  tenantId?: string;
  references?: ReferenceOption[];
  mode?: "create" | "edit";
  customer?: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    cnic: string | null;
    address: string | null;
    referenceId?: string | null;
    createdAt?: string | Date;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CustomerForm({
  tenantId,
  references = [],
  mode = "create",
  customer,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [referenceId, setReferenceId] = useState(
    customer?.referenceId || "none",
  );
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    cnic: customer?.cnic || "",
    address: customer?.address || "",
  });

  useEffect(() => {
    setReferenceId(customer?.referenceId || "none");
    setFormData({
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      cnic: customer?.cnic || "",
      address: customer?.address || "",
    });
  }, [customer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "edit" && customer
          ? `/api/customers/${customer.id}`
          : "/api/customers";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          referenceId: referenceId === "none" ? null : referenceId,
          tenantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error ||
            `Failed to ${mode === "edit" ? "update" : "create"} customer`,
        );
      } else {
        router.refresh();
        onSuccess?.();

        if (mode === "create") {
          setReferenceId("none");
          setCreatedAt(toDateInputValue(new Date()));
          setFormData({
            name: "",
            email: "",
            phone: "",
            cnic: "",
            address: "",
          });
        }
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name" className="text-slate-700 font-medium">
          Name *
        </Label>
        <Input
          id="name"
          placeholder="Customer Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-1 h-11 rounded-xl border-slate-200"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="email" className="text-slate-700 font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="customer@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="mt-1 h-11 rounded-xl border-slate-200"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-slate-700 font-medium">
            Phone
          </Label>
          <Input
            id="phone"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="mt-1 h-11 rounded-xl border-slate-200"
          />
        </div>
        <div>
          <Label htmlFor="cnic" className="text-slate-700 font-medium">
            CNIC
          </Label>
          <Input
            id="cnic"
            inputMode="numeric"
            placeholder="12345-1234567-1"
            value={formData.cnic}
            onChange={(e) =>
              setFormData({
                ...formData,
                cnic: formatCnicInput(e.target.value),
              })
            }
            maxLength={15}
            className="mt-1 h-11 rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="reference" className="font-medium text-slate-700">
          Reference
        </Label>
        <Select value={referenceId} onValueChange={setReferenceId}>
          <SelectTrigger
            id="reference"
            className="mt-1 h-11 rounded-xl border-slate-200"
          >
            <SelectValue placeholder="Others (no reference)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Others</SelectItem>
            {references.map((ref) => (
              <SelectItem key={ref.id} value={ref.id}>
                {ref.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1.5 text-xs text-slate-500">
          How or where was this customer referred?{" "}
          <a
            href="/dashboard/customers/references"
            className="text-slate-700 underline underline-offset-2 hover:text-slate-900"
          >
            Manage references
          </a>
        </p>
      </div>
      <div>
        <Label htmlFor="address" className="text-slate-700 font-medium">
          Address
        </Label>
        <Textarea
          id="address"
          placeholder="Customer address"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          rows={4}
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
              : "Save Customer"}
        </Button>
      </div>
    </form>
  );
}
