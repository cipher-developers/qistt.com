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

interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  installmentPlan: {
    customer: { name: string };
    item: { name: string };
  };
}

export function TransactionForm({
  tenantId,
  installments,
}: {
  tenantId?: string;
  installments: Installment[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [formData, setFormData] = useState({
    installmentId: "",
    amount: "",
    receiptNumber: "",
    notes: "",
  });

  const selectedInstallment = installments.find(
    (i) => i.id === formData.installmentId
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
          ...formData,
          amount: parseFloat(formData.amount),
          tenantId,
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
          <Label htmlFor="installment" className="text-slate-700 font-medium">
            Select Installment *
          </Label>
          <Select
            value={formData.installmentId}
            onValueChange={(value) => {
              const inst = installments.find((i) => i.id === value);
              setFormData({
                ...formData,
                installmentId: value,
                amount: inst?.amount.toString() || "",
              });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select an installment" />
            </SelectTrigger>
            <SelectContent>
              {installments.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.installmentPlan.customer.name} - {inst.installmentPlan.item.name} (Installment #{inst.installmentNumber}) - ${inst.amount.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedInstallment && (
          <div className="bg-slate-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-700">Customer:</span>
              <span className="font-medium">{selectedInstallment.installmentPlan.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Item:</span>
              <span className="font-medium">{selectedInstallment.installmentPlan.item.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Due Date:</span>
              <span className="font-medium">
                {new Date(selectedInstallment.dueDate).toLocaleDateString()}
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
          <Label htmlFor="receiptNumber" className="text-slate-700 font-medium">
            Receipt Number
          </Label>
          <Input
            id="receiptNumber"
            placeholder="RCP-001"
            value={formData.receiptNumber}
            onChange={(e) =>
              setFormData({ ...formData, receiptNumber: e.target.value })
            }
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="notes" className="text-slate-700 font-medium">
            Notes
          </Label>
          <Input
            id="notes"
            placeholder="Payment notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
