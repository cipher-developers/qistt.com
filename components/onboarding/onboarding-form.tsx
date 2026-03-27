"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Package,
  User,
} from "lucide-react";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
};

type Vendor = {
  id: number;
  name: string;
  phone: string;
};

type Category = {
  id: string;
  name: string;
};

type Item = {
  id: number;
  name: string;
  category: {
    id: string;
    name: string;
  };
};

type Purchase = {
  id: number;
  quantity: number;
  consumedQty: number;
  unitCost: number;
  purchasedAt: string | Date;
  item: {
    id: number;
    name: string;
  };
  vendor: {
    id: number;
    name: string;
  };
};

function toDateInputValue(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function getInstallmentDueDate(startDate: Date, installmentNumber: number) {
  const dueDate = new Date(startDate);
  dueDate.setMonth(dueDate.getMonth() + installmentNumber);
  dueDate.setDate(1);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate;
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

type OnboardingFormProps = {
  tenantId?: string;
  customers: Customer[];
  vendors: Vendor[];
  categories: Category[];
  items: Item[];
  purchases: Purchase[];
};

type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
};

type SearchableSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  options: SearchableSelectOption[];
  triggerClassName?: string;
};

function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  options,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between font-normal ${triggerClassName || "h-11 rounded-xl border-slate-200"}`}
        >
          <span className="truncate text-left">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={`${option.label} ${option.searchText || ""}`}
                onSelect={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${value === option.value ? "opacity-100" : "opacity-0"}`}
                />
                <span className="truncate">{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OnboardingForm({
  tenantId,
  customers,
  vendors,
  categories,
  items,
  purchases,
}: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const stepTitles = [
    "Select or create records",
    "Set payment terms",
    "Review and create",
  ];

  const [customersState, setCustomersState] = useState(customers);
  const [vendorsState, setVendorsState] = useState(vendors);
  const [categoriesState, setCategoriesState] = useState(categories);
  const [itemsState, setItemsState] = useState(items);
  const [purchasesState, setPurchasesState] = useState(purchases);

  const [customerMode, setCustomerMode] = useState<"select" | "create">(
    customers.length > 0 ? "select" : "create",
  );
  const [vendorMode, setVendorMode] = useState<"select" | "create">(
    vendors.length > 0 ? "select" : "create",
  );
  const [itemMode, setItemMode] = useState<"select" | "create">(
    items.length > 0 ? "select" : "create",
  );
  const [purchaseMode, setPurchaseMode] = useState<"select" | "create">(
    purchases.length > 0 ? "select" : "create",
  );
  const [categoryMode, setCategoryMode] = useState<"select" | "create">(
    categories.length > 0 ? "select" : "create",
  );

  const [formData, setFormData] = useState({
    customerId: "",
    vendorId: "",
    itemId: "",
    purchaseId: "",
    categoryId: "",
    sellingPrice: "",
    advancePaid: "0",
    months: "12",
    createdAt: toDateInputValue(new Date()),
    account_number: "",
  });

  // Fetch next account number on mount
  useEffect(() => {
    let ignore = false;
    async function fetchNextAccountNumber() {
      if (!tenantId) return;
      try {
        const res = await fetch("/api/installment-plans/next-account-number");
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore && data.nextAccountNumber) {
          setFormData((prev) => ({
            ...prev,
            account_number: String(data.nextAccountNumber),
          }));
        }
      } catch {}
    }
    fetchNextAccountNumber();
    return () => {
      ignore = true;
    };
  }, [tenantId]);

  const [customerCreate, setCustomerCreate] = useState({
    name: "",
    phone: "",
    email: "",
    cnic: "",
    address: "",
    createdAt: toDateInputValue(new Date()),
  });

  const [vendorCreate, setVendorCreate] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [itemCreate, setItemCreate] = useState({
    name: "",
    model: "",
    description: "",
    sku: "",
    costPrice: "",
    sellingPrice: "",
    categoryName: "",
  });

  const [purchaseCreate, setPurchaseCreate] = useState({
    quantity: "1",
    unitCost: "",
    purchasedAt: toDateInputValue(new Date()),
    notes: "",
  });

  const selectedCustomer = customersState.find(
    (customer) => String(customer.id) === formData.customerId,
  );
  const selectedVendor = vendorsState.find(
    (vendor) => String(vendor.id) === formData.vendorId,
  );
  const selectedItem = itemsState.find(
    (item) => String(item.id) === formData.itemId,
  );

  const filteredPurchases = useMemo(() => {
    return purchasesState.filter((purchase) => {
      const remaining = purchase.quantity - purchase.consumedQty;
      if (remaining <= 0) {
        return false;
      }

      if (vendorMode === "select" && formData.vendorId) {
        if (purchase.vendor.id !== Number(formData.vendorId)) {
          return false;
        }
      }

      if (itemMode === "select" && formData.itemId) {
        if (purchase.item.id !== Number(formData.itemId)) {
          return false;
        }
      }

      return true;
    });
  }, [
    formData.itemId,
    formData.vendorId,
    itemMode,
    purchasesState,
    vendorMode,
  ]);

  const selectedPurchase = filteredPurchases.find(
    (purchase) => String(purchase.id) === formData.purchaseId,
  );

  const selectedPurchaseRemaining = selectedPurchase
    ? Math.max(selectedPurchase.quantity - selectedPurchase.consumedQty, 0)
    : 0;

  const sellingPrice = parseFloat(formData.sellingPrice || "0");
  const advancePaid = parseFloat(formData.advancePaid || "0");
  const months = parseInt(formData.months || "0", 10);
  const purchaseUnitCost = selectedPurchase?.unitCost ?? 0;
  const estimatedGrossProfit = sellingPrice - purchaseUnitCost;
  const remainingBalance = Math.max(sellingPrice - advancePaid, 0);
  const monthlyAmount = months > 0 ? remainingBalance / months : 0;
  const planCreatedDate = new Date(formData.createdAt || new Date());

  const installmentsPreview = useMemo(() => {
    if (!months || Number.isNaN(planCreatedDate.getTime())) {
      return [] as {
        installmentNumber: number;
        dueDate: Date;
        monthLabel: string;
      }[];
    }

    return Array.from({ length: months }, (_, index) => {
      const installmentNumber = index + 1;
      const dueDate = getInstallmentDueDate(planCreatedDate, installmentNumber);
      return {
        installmentNumber,
        dueDate,
        monthLabel: dueDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    });
  }, [months, planCreatedDate]);

  async function createCustomerNow() {
    setError("");
    if (!customerCreate.name.trim() || !customerCreate.phone.trim()) {
      setError("Customer name and phone are required.");
      return;
    }

    setActionLoading("customer");
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customerCreate,
          tenantId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Failed to create customer.");
        return;
      }

      const created: Customer = {
        id: data.id,
        name: data.name,
        phone: data.phone,
      };

      setCustomersState((current) => [created, ...current]);
      setFormData((current) => ({
        ...current,
        customerId: String(created.id),
      }));
      setCustomerMode("select");
    } catch {
      setError("An unexpected error occurred while creating customer.");
    } finally {
      setActionLoading(null);
    }
  }

  async function createVendorNow() {
    setError("");
    if (!vendorCreate.name.trim() || !vendorCreate.phone.trim()) {
      setError("Vendor name and phone are required.");
      return;
    }

    setActionLoading("vendor");
    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorCreate),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Failed to create vendor.");
        return;
      }

      const created: Vendor = {
        id: data.id,
        name: data.name,
        phone: data.phone,
      };

      setVendorsState((current) => [created, ...current]);
      setFormData((current) => ({
        ...current,
        vendorId: String(created.id),
        purchaseId: "",
      }));
      setVendorMode("select");
    } catch {
      setError("An unexpected error occurred while creating vendor.");
    } finally {
      setActionLoading(null);
    }
  }

  async function createItemNow() {
    setError("");
    if (!itemCreate.name.trim()) {
      setError("Item name is required.");
      return;
    }

    let categoryId = formData.categoryId;
    setActionLoading("item");

    try {
      if (categoryMode === "create") {
        if (!itemCreate.categoryName.trim()) {
          setError("Category name is required.");
          return;
        }

        const categoryResponse = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: itemCreate.categoryName }),
        });

        const categoryData = await categoryResponse.json();
        if (!categoryResponse.ok) {
          setError(categoryData?.error || "Failed to create category.");
          return;
        }

        const createdCategory: Category = {
          id: categoryData.id,
          name: categoryData.name,
        };

        setCategoriesState((current) => [createdCategory, ...current]);
        categoryId = createdCategory.id;
      }

      if (!categoryId) {
        setError("Please select or create a category first.");
        return;
      }

      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemCreate.name,
          model: itemCreate.model,
          description: itemCreate.description,
          sku: itemCreate.sku,
          costPrice: itemCreate.costPrice,
          sellingPrice: itemCreate.sellingPrice,
          categoryId,
          tenantId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Failed to create item.");
        return;
      }

      const created: Item = {
        id: data.id,
        name: data.name,
        category: {
          id: data.category.id,
          name: data.category.name,
        },
      };

      setItemsState((current) => [created, ...current]);
      setFormData((current) => ({
        ...current,
        itemId: String(created.id),
        categoryId,
        purchaseId: "",
      }));
      setItemMode("select");
    } catch {
      setError("An unexpected error occurred while creating item.");
    } finally {
      setActionLoading(null);
    }
  }

  async function createPurchaseNow() {
    setError("");
    if (!formData.vendorId || !formData.itemId) {
      setError("Select or create vendor and item before creating purchase.");
      return;
    }

    const quantity = Number(purchaseCreate.quantity);
    const unitCost = Number(purchaseCreate.unitCost);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Purchase quantity must be greater than 0.");
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost <= 0) {
      setError("Unit cost must be greater than 0.");
      return;
    }

    setActionLoading("purchase");
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: Number(formData.vendorId),
          itemId: Number(formData.itemId),
          quantity,
          unitCost,
          purchasedAt: purchaseCreate.purchasedAt,
          notes: purchaseCreate.notes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Failed to create purchase.");
        return;
      }

      const created: Purchase = {
        id: data.id,
        quantity: data.quantity,
        consumedQty: data.consumedQty,
        unitCost: data.unitCost,
        purchasedAt: data.purchasedAt,
        item: {
          id: data.item.id,
          name: data.item.name,
        },
        vendor: {
          id: data.vendor.id,
          name: data.vendor.name,
        },
      };

      setPurchasesState((current) => [created, ...current]);
      setFormData((current) => ({
        ...current,
        purchaseId: String(created.id),
      }));
      setPurchaseMode("select");
    } catch {
      setError("An unexpected error occurred while creating purchase.");
    } finally {
      setActionLoading(null);
    }
  }

  function canProceedFromCurrentStep() {
    if (step === 1) {
      return Boolean(formData.customerId && selectedPurchase);
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
    if (step === 1) {
      if (!formData.customerId) {
        return "Please select or create a customer first.";
      }

      if (!selectedPurchase) {
        return "Please select an available purchase lot or create a new one.";
      }
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
          customerId: Number(formData.customerId),
          purchaseId: Number(formData.purchaseId),
          itemId: Number(selectedPurchase?.item.id || formData.itemId),
          sellingPrice: parseFloat(formData.sellingPrice),
          advancePaid: parseFloat(formData.advancePaid),
          months: parseInt(formData.months, 10),
          createdAt: formData.createdAt,
          tenantId,
          account_number: formData.account_number
            ? parseInt(formData.account_number)
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create plan");
      } else {
        router.push("/dashboard/ledger?created=1");
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
        className={`grid gap-6 ${step === 1 ? "grid-cols-1" : "lg:grid-cols-[1.2fr_0.8fr]"}`}
      >
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          {step === 1 ? (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-slate-900">
                Step 1: Select or create customer, vendor, item, and purchase
              </h3>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      Customer
                    </p>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 ${customerMode === "select" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                        onClick={() => setCustomerMode("select")}
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 ${customerMode === "create" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                        onClick={() => setCustomerMode("create")}
                      >
                        Create
                      </button>
                    </div>
                  </div>

                  {customerMode === "select" ? (
                    <SearchableSelect
                      value={formData.customerId}
                      onValueChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          customerId: value,
                        }))
                      }
                      placeholder="Select customer"
                      searchPlaceholder="Search customer..."
                      emptyMessage="No customer found."
                      options={customersState.map((customer) => ({
                        value: String(customer.id),
                        label: `${customer.name}${customer.phone ? ` (${customer.phone})` : ""}`,
                        searchText: `${customer.name} ${customer.phone || ""}`,
                      }))}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Customer name *"
                        value={customerCreate.name}
                        onChange={(event) =>
                          setCustomerCreate((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Phone *"
                        value={customerCreate.phone}
                        onChange={(event) =>
                          setCustomerCreate((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={customerCreate.email}
                        onChange={(event) =>
                          setCustomerCreate((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="CNIC (12345-1234567-1)"
                        maxLength={15}
                        value={customerCreate.cnic}
                        onChange={(event) =>
                          setCustomerCreate((current) => ({
                            ...current,
                            cnic: formatCnicInput(event.target.value),
                          }))
                        }
                      />
                      <Input
                        type="date"
                        value={customerCreate.createdAt}
                        onChange={(event) =>
                          setCustomerCreate((current) => ({
                            ...current,
                            createdAt: event.target.value,
                          }))
                        }
                      />
                      <Textarea
                        rows={3}
                        placeholder="Address"
                        value={customerCreate.address}
                        onChange={(event) =>
                          setCustomerCreate((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={createCustomerNow}
                        disabled={actionLoading === "customer"}
                      >
                        {actionLoading === "customer"
                          ? "Creating customer..."
                          : "Create and Select Customer"}
                      </Button>
                    </div>
                  )}
                </Card>

                <Card className="border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      Vendor
                    </p>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 ${vendorMode === "select" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                        onClick={() => setVendorMode("select")}
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 ${vendorMode === "create" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                        onClick={() => {
                          setVendorMode("create");
                          setPurchaseMode("create");
                          setFormData((current) => ({
                            ...current,
                            purchaseId: "",
                          }));
                        }}
                      >
                        Create
                      </button>
                    </div>
                  </div>

                  {vendorMode === "select" ? (
                    <SearchableSelect
                      value={formData.vendorId}
                      onValueChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          vendorId: value,
                          purchaseId: "",
                        }))
                      }
                      placeholder="Select vendor"
                      searchPlaceholder="Search vendor..."
                      emptyMessage="No vendor found."
                      options={vendorsState.map((vendor) => ({
                        value: String(vendor.id),
                        label: `${vendor.name} (${vendor.phone})`,
                        searchText: `${vendor.name} ${vendor.phone}`,
                      }))}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Vendor name *"
                        value={vendorCreate.name}
                        onChange={(event) =>
                          setVendorCreate((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Phone *"
                        value={vendorCreate.phone}
                        onChange={(event) =>
                          setVendorCreate((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={vendorCreate.email}
                        onChange={(event) =>
                          setVendorCreate((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Address"
                        value={vendorCreate.address}
                        onChange={(event) =>
                          setVendorCreate((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                      />
                      <Textarea
                        rows={3}
                        placeholder="Notes"
                        value={vendorCreate.notes}
                        onChange={(event) =>
                          setVendorCreate((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={createVendorNow}
                        disabled={actionLoading === "vendor"}
                      >
                        {actionLoading === "vendor"
                          ? "Creating vendor..."
                          : "Create and Select Vendor"}
                      </Button>
                    </div>
                  )}
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Item</p>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 ${itemMode === "select" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                        onClick={() => setItemMode("select")}
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 ${itemMode === "create" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                        onClick={() => {
                          setItemMode("create");
                          setPurchaseMode("create");
                          setFormData((current) => ({
                            ...current,
                            purchaseId: "",
                          }));
                        }}
                      >
                        Create
                      </button>
                    </div>
                  </div>

                  {itemMode === "select" ? (
                    <SearchableSelect
                      value={formData.itemId}
                      onValueChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          itemId: value,
                          purchaseId: "",
                        }))
                      }
                      placeholder="Select item"
                      searchPlaceholder="Search item..."
                      emptyMessage="No item found."
                      options={itemsState.map((item) => ({
                        value: String(item.id),
                        label: `${item.name} (${item.category.name})`,
                        searchText: `${item.name} ${item.category.name}`,
                      }))}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Item name *"
                        value={itemCreate.name}
                        onChange={(event) =>
                          setItemCreate((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Model"
                        value={itemCreate.model}
                        onChange={(event) =>
                          setItemCreate((current) => ({
                            ...current,
                            model: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="SKU"
                        value={itemCreate.sku}
                        onChange={(event) =>
                          setItemCreate((current) => ({
                            ...current,
                            sku: event.target.value,
                          }))
                        }
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Cost price"
                          value={itemCreate.costPrice}
                          onChange={(event) =>
                            setItemCreate((current) => ({
                              ...current,
                              costPrice: event.target.value,
                            }))
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Selling price"
                          value={itemCreate.sellingPrice}
                          onChange={(event) =>
                            setItemCreate((current) => ({
                              ...current,
                              sellingPrice: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="text-xs uppercase tracking-wide text-slate-500">
                            Category
                          </Label>
                          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
                            <button
                              type="button"
                              className={`rounded-md px-2 py-1 ${categoryMode === "select" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                              onClick={() => setCategoryMode("select")}
                            >
                              Select
                            </button>
                            <button
                              type="button"
                              className={`rounded-md px-2 py-1 ${categoryMode === "create" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                              onClick={() => setCategoryMode("create")}
                            >
                              Create
                            </button>
                          </div>
                        </div>

                        {categoryMode === "select" ? (
                          <SearchableSelect
                            value={formData.categoryId}
                            onValueChange={(value) =>
                              setFormData((current) => ({
                                ...current,
                                categoryId: value,
                              }))
                            }
                            placeholder="Select category"
                            searchPlaceholder="Search category..."
                            emptyMessage="No category found."
                            triggerClassName="h-10 rounded-lg border-slate-200 bg-white"
                            options={categoriesState.map((category) => ({
                              value: category.id,
                              label: category.name,
                              searchText: category.name,
                            }))}
                          />
                        ) : (
                          <Input
                            placeholder="New category name"
                            value={itemCreate.categoryName}
                            onChange={(event) =>
                              setItemCreate((current) => ({
                                ...current,
                                categoryName: event.target.value,
                              }))
                            }
                            className="h-10 rounded-lg border-slate-200 bg-white"
                          />
                        )}
                      </div>

                      <Textarea
                        rows={3}
                        placeholder="Description"
                        value={itemCreate.description}
                        onChange={(event) =>
                          setItemCreate((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={createItemNow}
                        disabled={actionLoading === "item"}
                      >
                        {actionLoading === "item"
                          ? "Creating item..."
                          : "Create and Select Item"}
                      </Button>
                    </div>
                  )}
                </Card>

                <Card className="border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      Purchase Lot
                    </p>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 ${purchaseMode === "select" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                        onClick={() => setPurchaseMode("select")}
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 ${purchaseMode === "create" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
                        onClick={() => setPurchaseMode("create")}
                      >
                        Create
                      </button>
                    </div>
                  </div>

                  {purchaseMode === "select" ? (
                    <div className="space-y-2">
                      <SearchableSelect
                        value={formData.purchaseId}
                        onValueChange={(value) => {
                          const chosen = filteredPurchases.find(
                            (purchase) => String(purchase.id) === value,
                          );
                          setFormData((current) => ({
                            ...current,
                            purchaseId: value,
                            itemId: chosen
                              ? String(chosen.item.id)
                              : current.itemId,
                            vendorId: chosen
                              ? String(chosen.vendor.id)
                              : current.vendorId,
                          }));
                        }}
                        placeholder="Select purchase lot"
                        searchPlaceholder="Search lot, item, or vendor..."
                        emptyMessage="No purchase lot found."
                        options={filteredPurchases.map((purchase) => ({
                          value: String(purchase.id),
                          label: `#${purchase.id} ${purchase.item.name} • ${purchase.vendor.name}`,
                          searchText: `${purchase.id} ${purchase.item.name} ${purchase.vendor.name}`,
                        }))}
                      />
                      {selectedPurchase ? (
                        <p className="text-xs text-slate-500">
                          Remaining {selectedPurchaseRemaining} out of{" "}
                          {selectedPurchase.quantity} @{" "}
                          {formatCurrency(selectedPurchase.unitCost)}
                        </p>
                      ) : null}
                      {filteredPurchases.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No lot found for current vendor/item filter. Switch to
                          create mode to record a new purchase instantly.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Quantity *"
                          value={purchaseCreate.quantity}
                          onChange={(event) =>
                            setPurchaseCreate((current) => ({
                              ...current,
                              quantity: event.target.value,
                            }))
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Unit cost *"
                          value={purchaseCreate.unitCost}
                          onChange={(event) =>
                            setPurchaseCreate((current) => ({
                              ...current,
                              unitCost: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <Input
                        type="date"
                        value={purchaseCreate.purchasedAt}
                        onChange={(event) =>
                          setPurchaseCreate((current) => ({
                            ...current,
                            purchasedAt: event.target.value,
                          }))
                        }
                      />
                      <Textarea
                        rows={3}
                        placeholder="Notes"
                        value={purchaseCreate.notes}
                        onChange={(event) =>
                          setPurchaseCreate((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={createPurchaseNow}
                        disabled={actionLoading === "purchase"}
                      >
                        {actionLoading === "purchase"
                          ? "Creating purchase..."
                          : "Create and Select Purchase Lot"}
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="account_number"
                  className="text-slate-700 font-medium"
                >
                  Account Number
                </Label>
                <Input
                  id="account_number"
                  type="number"
                  min="0"
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value })
                  }
                  className="mt-1 h-11 rounded-xl border-slate-200 font-mono text-lg"
                  placeholder="Account number"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This will be the unique account number for this plan. Default
                  is next available, but you can edit it.
                </p>
              </div>
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

              <div>
                <Label
                  htmlFor="createdAt"
                  className="text-slate-700 font-medium"
                >
                  Plan Created Date
                </Label>
                <Input
                  id="createdAt"
                  type="date"
                  value={formData.createdAt}
                  onChange={(e) =>
                    setFormData({ ...formData, createdAt: e.target.value })
                  }
                  className="mt-1 h-11 rounded-xl border-slate-200"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Default is today. Use this when backfilling older plans.
                </p>
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
                    <span className="text-slate-600">Account Number</span>
                    <span className="font-medium text-slate-900">
                      {formData.account_number || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Item</span>
                    <span className="font-medium text-slate-900">
                      {selectedPurchase?.item.name || selectedItem?.name || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Purchase Lot</span>
                    <span className="font-medium text-slate-900">
                      {selectedPurchase ? `#${selectedPurchase.id}` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Vendor</span>
                    <span className="font-medium text-slate-900">
                      {selectedPurchase?.vendor.name ||
                        selectedVendor?.name ||
                        "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Unit Purchase Cost</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(purchaseUnitCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                    <span className="text-slate-600">Total Price</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(sellingPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Estimated Gross P/L</span>
                    <span
                      className={`font-semibold ${estimatedGrossProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                    >
                      {formatCurrency(estimatedGrossProfit)}
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
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Plan Created</span>
                    <span className="font-medium text-slate-900">
                      {Number.isNaN(planCreatedDate.getTime())
                        ? "-"
                        : planCreatedDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Installment Schedule Preview
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  First installment starts on the 1st day of the next month.
                </p>
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {installmentsPreview.map((entry) => (
                    <div
                      key={entry.installmentNumber}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        Installment #{entry.installmentNumber}
                      </span>
                      <span className="text-slate-600">
                        {entry.monthLabel} (
                        {entry.dueDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        )
                      </span>
                    </div>
                  ))}
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

        {step !== 1 ? (
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
                  <User size={15} className="text-slate-500" />
                  <span className="truncate">
                    {selectedPurchase?.vendor.name ||
                      selectedVendor?.name ||
                      "No vendor selected"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Package size={15} className="text-slate-500" />
                  <span className="truncate">
                    {selectedItem?.name || "No item selected"}
                    {selectedPurchase
                      ? ` (Lot #${selectedPurchase.id}, ${selectedPurchaseRemaining} left)`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CreditCard size={15} className="text-slate-500" />
                  <span>
                    {months > 0
                      ? `${months} month duration`
                      : "Duration not set"}
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
        ) : null}
      </form>
    </Card>
  );
}
