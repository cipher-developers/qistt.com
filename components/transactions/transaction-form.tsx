"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Plan {
  id: number;
  customerId: number;
  customer: { id: number; name: string };
  item: { id: number; name: string };
  sellingPrice: number;
  advancePaid: number;
  monthlyAmount: number;
  months: number;
  transactions: { amount: number }[];
}

export function TransactionForm({
  tenantId,
  plans,
  initialPlanId,
  lockPlan,
  submitLabel,
  onSuccess,
  onCancel,
}: {
  tenantId?: string;
  plans: Plan[];
  initialPlanId?: number;
  lockPlan?: boolean;
  submitLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [formData, setFormData] = useState({
    planId: initialPlanId ? String(initialPlanId) : "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    if (initialPlanId) {
      setFormData((prev) => ({ ...prev, planId: String(initialPlanId) }));
    }
  }, [initialPlanId]);

  const selectedPlan = plans.find((p) => String(p.id) === formData.planId);

  // Remaining balance: total price minus advance and all recorded transactions
  const totalPaidOnPlan = selectedPlan
    ? selectedPlan.transactions.reduce((sum, t) => sum + t.amount, 0) +
      selectedPlan.advancePaid
    : 0;
  const remainingBalance = selectedPlan
    ? Math.max(selectedPlan.sellingPrice - totalPaidOnPlan, 0)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.planId) {
      setError("Please select a plan");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: Number(formData.planId),
          customerId: selectedPlan?.customerId,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to record transaction");
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/transactions");
        }
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Plan selector */}
      {!lockPlan ? (
        <div>
          <Label className="text-slate-700 font-medium text-sm">
            Installment Plan <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.planId}
            onValueChange={(value) =>
              setFormData({ ...formData, planId: value, amount: "" })
            }
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select a plan…" />
            </SelectTrigger>
            <SelectContent>
              {plans.length === 0 ? (
                <div className="px-3 py-4 text-sm text-center text-slate-500">
                  No active plans available
                </div>
              ) : (
                plans.map((plan) => (
                  <SelectItem key={plan.id} value={String(plan.id)}>
                    {plan.customer.name} — {plan.item.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Plan summary card */}
      {selectedPlan && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer</span>
            <span className="font-medium text-slate-900">
              {selectedPlan.customer.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Item</span>
            <span className="font-medium text-slate-900">
              {selectedPlan.item.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Monthly Amount</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(selectedPlan.monthlyAmount)}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="text-slate-500">Remaining Balance</span>
            <span
              className={`font-bold ${
                remainingBalance <= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {remainingBalance <= 0
                ? "Fully paid!"
                : formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>
      )}

      {/* Amount field with quick-fill */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-slate-700 font-medium text-sm">
            Amount <span className="text-red-500">*</span>
          </Label>
          {selectedPlan && selectedPlan.monthlyAmount > 0 && (
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  amount: selectedPlan.monthlyAmount.toFixed(2),
                })
              }
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <Zap size={11} />
              Fill monthly ({formatCurrency(selectedPlan.monthlyAmount)})
            </button>
          )}
        </div>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
      </div>

      {/* Note / description */}
      <div>
        <Label className="text-slate-700 font-medium text-sm">
          Note <span className="text-slate-400 font-normal">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. Monthly installment #3"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="mt-1.5"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-slate-900 hover:bg-slate-800"
        >
          {loading ? "Recording…" : submitLabel || "Record Payment"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
