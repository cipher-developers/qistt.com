"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Package,
  User,
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
}

interface Item {
  id: number;
  name: string;
  sellingPrice: number | null;
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
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isItemOpen, setIsItemOpen] = useState(false);
  const router = useRouter();
  const stepTitles = [
    "Select customer and item",
    "Set payment terms",
    "Review and create",
  ];

  const [formData, setFormData] = useState({
    customerId: "",
    itemId: "",
    sellingPrice: "",
    advancePaid: "0",
    months: "12",
  });

  const selectedItem = items.find((i) => String(i.id) === formData.itemId);
  const selectedCustomer = customers.find(
    (c) => String(c.id) === formData.customerId,
  );
  const sellingPrice = parseFloat(formData.sellingPrice || "0");
  const advancePaid = parseFloat(formData.advancePaid || "0");
  const months = parseInt(formData.months || "0", 10);
  const remainingBalance = Math.max(sellingPrice - advancePaid, 0);
  const monthlyAmount = months > 0 ? remainingBalance / months : 0;

  const noDataAvailable = customers.length === 0 || items.length === 0;

  function canProceedFromCurrentStep() {
    if (step === 1) {
      return Boolean(formData.customerId && formData.itemId);
    }

    if (step === 2) {
      return (
        sellingPrice > 0 &&
        months > 0 &&
        advancePaid >= 0 &&
        advancePaid <= sellingPrice
      );
    }

    return true;
  }

  function getStepError() {
    if (step === 1 && (!formData.customerId || !formData.itemId)) {
      return "Please select both a customer and an item to continue.";
    }

    if (step === 2) {
      if (sellingPrice <= 0) {
        return "Total price must be greater than zero.";
      }
      if (months <= 0) {
        return "Installment duration must be at least 1 month.";
      }
      if (advancePaid < 0) {
        return "Advance paid cannot be negative.";
      }
      if (advancePaid > sellingPrice) {
        return "Advance paid cannot be greater than total price.";
      }
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const stepError = getStepError();
    if (stepError) {
      setError(stepError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/installment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          customerId: Number(formData.customerId),
          itemId: Number(formData.itemId),
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
        router.push("/dashboard/transactions?created=1");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleNextStep() {
    const stepError = getStepError();
    if (stepError) {
      setError(stepError);
      return;
    }

    setError("");
    setStep((current) => Math.min(3, current + 1));
  }

  function handlePreviousStep() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  }

  if (noDataAvailable) {
    return null;
  }

  return (
    <Card className="border border-slate-200/70 bg-white/90 p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.45)] sm:p-6">
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Guided Plan Setup
          </h2>
          <p className="text-sm text-slate-500">Step {step} of 3</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === step;
            const isCompleted = stepNumber < step;

            return (
              <div
                key={title}
                className={`rounded-xl border px-3 py-2 text-xs sm:text-sm ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <span className="font-semibold">{stepNumber}.</span>
                  )}
                  <span className="truncate">{title}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          {step === 1 ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                Choose customer and item
              </h3>

              <div>
                <Label
                  htmlFor="customer"
                  className="text-slate-700 font-medium"
                >
                  Customer *
                </Label>
                <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCustomerOpen}
                      className="mt-1 h-11 w-full justify-between rounded-xl border-slate-200 bg-white font-normal"
                    >
                      <span className="truncate">
                        {selectedCustomer?.name || "Search and select customer"}
                      </span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-(--radix-popover-trigger-width) p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search customers..." />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                customerId: String(customer.id),
                              });
                              setIsCustomerOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 size-4 ${
                                formData.customerId === String(customer.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="mt-1 text-xs text-slate-500">
                  Need a new customer?{" "}
                  <Link
                    href="/dashboard/customers"
                    className="text-slate-900 underline"
                  >
                    Manage customers
                  </Link>
                </p>
              </div>

              <div>
                <Label htmlFor="item" className="text-slate-700 font-medium">
                  Item *
                </Label>
                <Popover open={isItemOpen} onOpenChange={setIsItemOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isItemOpen}
                      className="mt-1 h-11 w-full justify-between rounded-xl border-slate-200 bg-white font-normal"
                    >
                      <span className="truncate">
                        {selectedItem
                          ? `${selectedItem.name} - ${formatCurrency(selectedItem.sellingPrice || 0)}`
                          : "Search and select item"}
                      </span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-(--radix-popover-trigger-width) p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search items..." />
                      <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        {items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.name} ${item.sellingPrice || 0}`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                itemId: String(item.id),
                                sellingPrice: item.sellingPrice
                                  ? String(item.sellingPrice)
                                  : "",
                              });
                              setIsItemOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 size-4 ${
                                formData.itemId === String(item.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <span className="flex-1 truncate">{item.name}</span>
                            <span className="text-xs text-slate-500">
                              {formatCurrency(item.sellingPrice || 0)}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="mt-1 text-xs text-slate-500">
                  Need an item first?{" "}
                  <Link
                    href="/dashboard/items"
                    className="text-slate-900 underline"
                  >
                    Manage items
                  </Link>
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                Set payment terms
              </h3>

              <div>
                <Label
                  htmlFor="sellingPrice"
                  className="text-slate-700 font-medium"
                >
                  Total Price *
                </Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: e.target.value })
                  }
                  required
                  className="mt-1 h-11 rounded-xl border-slate-200"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor="advancePaid"
                    className="text-slate-700 font-medium"
                  >
                    Advance Paid
                  </Label>
                  <Input
                    id="advancePaid"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.advancePaid}
                    onChange={(e) =>
                      setFormData({ ...formData, advancePaid: e.target.value })
                    }
                    className="mt-1 h-11 rounded-xl border-slate-200"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="months"
                    className="text-slate-700 font-medium"
                  >
                    Duration (Months) *
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
                    className="mt-1 h-11 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[6, 12, 18, 24].map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={
                      String(option) === formData.months ? "default" : "outline"
                    }
                    className={
                      String(option) === formData.months
                        ? "bg-slate-900 hover:bg-slate-800"
                        : ""
                    }
                    onClick={() =>
                      setFormData({ ...formData, months: String(option) })
                    }
                  >
                    {option} months
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                Review and confirm
              </h3>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Customer</span>
                    <span className="font-medium text-slate-900">
                      {selectedCustomer?.name || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Item</span>
                    <span className="font-medium text-slate-900">
                      {selectedItem?.name || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                    <span className="text-slate-600">Total Price</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(sellingPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Advance Paid</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(advancePaid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Remaining Balance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
                    <span className="font-medium text-cyan-800">
                      Monthly Installment
                    </span>
                    <span className="text-lg font-semibold text-cyan-900">
                      {formatCurrency(monthlyAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>

            {step < 3 ? (
              <Button
                key="next-step"
                type="button"
                onClick={handleNextStep}
                disabled={!canProceedFromCurrentStep()}
                className="gap-2 bg-slate-900 hover:bg-slate-800"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                key="create-plan"
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? "Creating Plan..." : "Create Installment Plan"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Live Summary
            </h4>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <User size={15} className="text-slate-500" />
                <span className="truncate">
                  {selectedCustomer?.name || "No customer selected"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Package size={15} className="text-slate-500" />
                <span className="truncate">
                  {selectedItem?.name || "No item selected"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CreditCard size={15} className="text-slate-500" />
                <span>
                  {months > 0 ? `${months} month duration` : "Duration not set"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Payment Breakdown
            </h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(sellingPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Advance</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(advancePaid)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600">Remaining</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
              <div className="mt-3 rounded-lg bg-cyan-50 px-3 py-2 text-cyan-900">
                <div className="text-xs uppercase tracking-wide text-cyan-700">
                  Monthly Installment
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(monthlyAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}
