"use client";

import { useEffect, useMemo, useState } from "react";
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

interface InstallmentOption {
  id: string;
  installmentNumber: number;
  amount: number;
  paidAmount: number;
  status: string;
  plan: {
    id: number;
    customer: { id: number; name: string };
    item: { id: number; name: string };
  };
}

export function TransactionForm({
  installments,
  initialInstallmentId,
  lockInstallment,
  submitLabel,
  onSuccess,
  onCancel,
}: {
  installments: InstallmentOption[];
  initialInstallmentId?: string;
  lockInstallment?: boolean;
  submitLabel?: string;
  onSuccess?: (createdTransaction: { id: number }) => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [formData, setFormData] = useState({
    installmentId: initialInstallmentId || "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    if (initialInstallmentId) {
      setFormData((prev) => ({
        ...prev,
        installmentId: initialInstallmentId,
      }));
    }
  }, [initialInstallmentId]);

  const selectedInstallment = useMemo(
    () => installments.find((i) => i.id === formData.installmentId),
    [installments, formData.installmentId],
  );

  const remainingBalance = selectedInstallment
    ? Math.max(selectedInstallment.amount - selectedInstallment.paidAmount, 0)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.installmentId) {
      setError("Please select an installment");
      return;
    }

    const amountValue = Number(formData.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (selectedInstallment && amountValue > remainingBalance) {
      setError("Amount cannot exceed remaining installment balance");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentId: formData.installmentId,
          amount: amountValue,
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to record transaction");
      } else {
        const data = await response.json();
        const createdTransaction = data?.transaction as { id: number };

        if (onSuccess) {
          onSuccess(createdTransaction);
        } else {
          router.push(
            `/dashboard/transactions?transaction=${createdTransaction.id}`,
          );
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
      {!lockInstallment ? (
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Installment <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.installmentId}
            onValueChange={(value) =>
              setFormData({ ...formData, installmentId: value, amount: "" })
            }
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select an installment..." />
            </SelectTrigger>
            <SelectContent>
              {installments.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  No pending installments available
                </div>
              ) : (
                installments.map((installment) => (
                  <SelectItem key={installment.id} value={installment.id}>
                    Plan #{installment.plan.id} -{" "}
                    {installment.plan.customer.name} -{" "}
                    {installment.plan.item.name} - Inst #
                    {installment.installmentNumber}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {selectedInstallment ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Plan</span>
            <span className="font-medium text-slate-900">
              #{selectedInstallment.plan.id}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Customer</span>
            <span className="font-medium text-slate-900">
              {selectedInstallment.plan.customer.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Item</span>
            <span className="font-medium text-slate-900">
              {selectedInstallment.plan.item.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Installment</span>
            <span className="font-semibold text-slate-900">
              #{selectedInstallment.installmentNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Installment Amount</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(selectedInstallment.amount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-500">Remaining</span>
            <span
              className={`font-bold ${
                remainingBalance <= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {remainingBalance <= 0
                ? "Fully paid"
                : formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">
            Amount <span className="text-red-500">*</span>
          </Label>
          {selectedInstallment && remainingBalance > 0 ? (
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  amount: remainingBalance.toFixed(2),
                })
              }
              className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-800"
            >
              <Zap size={11} />
              Fill remaining ({formatCurrency(remainingBalance)})
            </button>
          ) : null}
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

      <div>
        <Label className="text-sm font-medium text-slate-700">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. Installment payment"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="mt-1.5"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-slate-900 hover:bg-slate-800"
        >
          {loading ? "Recording..." : submitLabel || "Record Payment"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
