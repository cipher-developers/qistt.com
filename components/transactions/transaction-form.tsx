"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, wholeNumberInput } from "@/lib/utils";
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
  transactionId,
  mode = "create",
  lockInstallment,
  submitLabel,
  onSuccess,
  onCancel,
}: {
  installments: InstallmentOption[];
  initialInstallmentId?: string;
  transactionId?: number;
  mode?: "create" | "edit";
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
    description: "Installment payment",
  });

  useEffect(() => {
    if (initialInstallmentId) {
      setFormData((prev) => ({
        ...prev,
        installmentId: initialInstallmentId,
      }));
    }
  }, [initialInstallmentId]);

  useEffect(() => {
    if (mode !== "edit" || !transactionId) {
      return;
    }

    let ignore = false;

    async function loadTransaction() {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error || "Failed to load transaction");
          return;
        }

        if (!ignore) {
          setFormData((prev) => ({
            ...prev,
            installmentId: payload.installmentId || prev.installmentId,
            amount: String(Math.round(payload.amount ?? 0)),
            description: payload.description || "",
          }));
        }
      } catch {
        if (!ignore) {
          setError("Failed to load transaction");
        }
      }
    }

    loadTransaction();

    return () => {
      ignore = true;
    };
  }, [mode, transactionId]);

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
    if (!Number.isInteger(amountValue) || amountValue <= 0) {
      setError("Please enter a valid whole-number amount");
      return;
    }

    // if (selectedInstallment && amountValue > remainingBalance) {
    //   setError("Amount cannot exceed remaining installment balance");
    //   return;
    // }

    setError("");
    setLoading(true);

    try {
      const isEdit = mode === "edit" && transactionId;
      const response = await fetch(
        isEdit ? `/api/transactions/${transactionId}` : "/api/transactions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            installmentId: formData.installmentId,
            amount: amountValue,
            description: formData.description || null,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save transaction");
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
                  amount: String(Math.round(remainingBalance)),
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
          step="1"
          min="1"
          inputMode="numeric"
          placeholder="0"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: wholeNumberInput(e.target.value) })
          }
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
          {loading
            ? mode === "edit"
              ? "Saving..."
              : "Recording..."
            : submitLabel ||
              (mode === "edit" ? "Save Changes" : "Record Payment")}
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
