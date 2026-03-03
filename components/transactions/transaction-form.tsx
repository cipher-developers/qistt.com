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

interface Plan {
  id: string;
  customerId: string;
  itemId: string;
  sellingPrice: number;
  customer: { id: string; name: string };
  item: { id: string; name: string };
}

export function TransactionForm({
  tenantId,
  plans,
}: {
  tenantId?: string;
  plans: Plan[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [formData, setFormData] = useState({
    planId: "",
    customerId: "",
    amount: "",
    description: "",
  });

  const selectedPlan = plans.find(
    (p) => p.id === formData.planId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: formData.planId,
          customerId: selectedPlan?.customerId,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to record transaction");
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="plan" className="text-slate-700 font-medium">
            Select Installment Plan *
          </Label>
          <Select
            value={formData.planId}
            onValueChange={(value) => {
              const plan = plans.find((p) => p.id === value);
              setFormData({
                ...formData,
                planId: value,
                customerId: plan?.customerId || "",
              });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select an installment plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.customer.name} - {plan.item.name} - ${plan.sellingPrice.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPlan && (
          <div className="bg-slate-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-700">Customer:</span>
              <span className="font-medium">{selectedPlan.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Item:</span>
              <span className="font-medium">{selectedPlan.item.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Plan Amount:</span>
              <span className="font-medium">
                ${selectedPlan.sellingPrice.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="amount" className="text-slate-700 font-medium">
            Amount Paid *
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-slate-700 font-medium">
            Description
          </Label>
          <Input
            id="description"
            placeholder="Payment description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="mt-1"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Recording..." : "Record Payment"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
