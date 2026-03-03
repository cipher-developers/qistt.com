"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Customer {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  sellingPrice: number;
}

export function OnboardingForm({
  tenantId,
  customers,
  items,
}: {
  tenantId?: string;
  customers: Customer[];
  items: Item[];
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerId: "",
    itemId: "",
    sellingPrice: "",
    advancePaid: "0",
    months: "12",
  });

  const selectedItem = items.find((i) => i.id === formData.itemId);
  const monthlyAmount = formData.sellingPrice
    ? (
        (parseFloat(formData.sellingPrice) - parseFloat(formData.advancePaid)) /
        parseInt(formData.months)
      ).toFixed(2)
    : "0.00";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/installment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sellingPrice: parseFloat(formData.sellingPrice),
          advancePaid: parseFloat(formData.advancePaid),
          months: parseInt(formData.months),
          tenantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create plan");
      } else {
        router.push("/dashboard/transactions");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                s <= step
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-1 ${
                  s < step ? "bg-slate-900" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer & Item Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Select Customer & Item</h2>
            
            <div>
              <Label htmlFor="customer" className="text-slate-700 font-medium">
                Customer *
              </Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, customerId: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item" className="text-slate-700 font-medium">
                Item *
              </Label>
              <Select
                value={formData.itemId}
                onValueChange={(value) => {
                  const item = items.find((i) => i.id === value);
                  setFormData({
                    ...formData,
                    itemId: value,
                    sellingPrice: item?.sellingPrice.toString() || "",
                  });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} - ${i.sellingPrice.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Payment Terms */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Payment Terms</h2>

            <div>
              <Label htmlFor="sellingPrice" className="text-slate-700 font-medium">
                Total Price *
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPrice: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="advancePaid" className="text-slate-700 font-medium">
                  Advance Paid
                </Label>
                <Input
                  id="advancePaid"
                  type="number"
                  step="0.01"
                  value={formData.advancePaid}
                  onChange={(e) =>
                    setFormData({ ...formData, advancePaid: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="months" className="text-slate-700 font-medium">
                  Months *
                </Label>
                <Input
                  id="months"
                  type="number"
                  min="1"
                  value={formData.months}
                  onChange={(e) =>
                    setFormData({ ...formData, months: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Review Plan</h2>

            <div className="bg-slate-50 p-4 rounded-md space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-700">Customer:</span>
                <span className="font-medium">
                  {customers.find((c) => c.id === formData.customerId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Item:</span>
                <span className="font-medium">
                  {selectedItem?.name}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-slate-700">Total Price:</span>
                <span className="font-medium">${parseFloat(formData.sellingPrice || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Advance Paid:</span>
                <span className="font-medium">${parseFloat(formData.advancePaid || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Remaining:</span>
                <span className="font-medium">
                  ${(
                    parseFloat(formData.sellingPrice || "0") -
                    parseFloat(formData.advancePaid || "0")
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 bg-blue-50 p-2 rounded">
                <span className="text-slate-700 font-medium">Monthly Payment:</span>
                <span className="font-bold text-lg">${monthlyAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Duration:</span>
                <span className="font-medium">{formData.months} months</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft size={18} />
            Previous
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="gap-2 bg-slate-900 hover:bg-slate-800"
            >
              Next
              <ChevronRight size={18} />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Creating..." : "Create Plan"}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
