"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CreditCard,
  Printer,
  Receipt,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";

type TransactionDetail = {
  id: number;
  amount: number;
  description: string | null;
  transactionDate: string;
  createdAt: string;
  planId: number;
  customer: {
    id: number;
    name: string;
    phone: string;
    cnic: string | null;
    email: string | null;
    address: string | null;
  };
  plan: {
    id: number;
    account_number?: string;
    months: number;
    monthlyAmount: number;
    sellingPrice: number;
    advancePaid: number;
    status: string;
    item: {
      id: number;
      name: string;
      model: string | null;
      sku: string | null;
      category?: { id: string; name: string } | null;
    };
    installments: {
      id: string;
      installmentNumber: number;
      amount: number;
      paidAmount: number;
      status: string;
      dueDate: string;
    }[];
    transactions: {
      id: number;
      amount: number;
    }[];
  };
  installment?: {
    id: string;
    installmentNumber: number;
    amount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
  };
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printReceipt(detail: TransactionDetail, company: any) {
  const receiptNumber = `TX-${String(detail.id).padStart(6, "0")}`;
  const popup = window.open("", "_blank", "width=900,height=1400");
  if (!popup) return;

  const planAccount = detail.plan.account_number || detail.plan.id;
  const plan = detail.plan;
  const item = plan.item;
  const category = item.category?.name || "-";
  const model = item.model || "-";
  const sku = item.sku || "-";
  const totalPaid =
    plan.transactions?.reduce(
      (sum, t) => sum + t.amount,
      plan.advancePaid || 0,
    ) ?? 0;
  const remaining = Math.max((plan.sellingPrice ?? 0) - totalPaid, 0);
  const paidInstallments =
    plan.installments?.filter((i) => i.status === "paid").length ?? 0;
  const totalInstallments = plan.installments?.length ?? 0;
  const currentInstallment = detail.installment;

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt ${receiptNumber}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        @page { margin: 0; size: auto; }
        
        :root {
            --primary: #4f46e5;
            --primary-dark: #3730a3;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-400: #94a3b8;
            --slate-600: #475569;
            --slate-900: #0f172a;
            --emerald: #10b981;
        }

        body {
            margin: 0;
            padding: 20px;
            font-family: 'Inter', sans-serif;
            background: #f1f5f9;
            color: var(--slate-900);
            -webkit-print-color-adjust: exact;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            overflow: hidden;
            border: 1px solid var(--slate-200);
            position: relative;
        }

        /* Top Accent Bar */
        .top-accent {
            height: 6px;
            background: linear-gradient(90deg, var(--primary), #06b6d4);
        }

        /* Header Area */
        .header {
            padding: 32px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--slate-100);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo {
            width: 50px;
            height: 50px;
            background: var(--slate-100);
            border-radius: 10px;
            object-fit: contain;
        }

        .company-name {
            font-size: 18px;
            font-weight: 800;
            margin: 0;
            color: var(--slate-900);
        }

        .company-contact {
            font-size: 12px;
            color: var(--slate-400);
        }

        .receipt-info {
            text-align: right;
        }

        .receipt-title {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            margin: 0;
            color: var(--primary);
        }

        .receipt-no {
            font-family: monospace;
            font-size: 13px;
            color: var(--slate-600);
        }

        /* Hero Payment Section */
        .hero {
            padding: 30px 40px;
            background: var(--slate-50);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--slate-100);
        }

        .amount-box label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--slate-400);
            display: block;
            margin-bottom: 4px;
        }

        .amount-value {
            font-size: 36px;
            font-weight: 800;
            color: var(--slate-900);
        }

        /* Main Content Layout */
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 280px;
            gap: 32px;
            padding: 32px 40px;
        }

        .section-header {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--slate-400);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-header::after {
            content: "";
            flex: 1;
            height: 1px;
            background: var(--slate-100);
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
        }

        .info-label { color: var(--slate-600); }
        .info-value { font-weight: 600; color: var(--slate-900); }

        /* Status Badge */
        .badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .paid { background: #dcfce7; color: #16a34a; }
        .pending { background: #fef9c3; color: #b45309; }

        /* Sidebar Summary */
        .summary-card {
            background: var(--slate-100);
            padding: 20px;
            border-radius: 12px;
            height: fit-content;
        }

        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
            border-bottom: 1px solid var(--slate-200);
        }

        .summary-item:last-child { border: none; }
        .total-row {
            margin-top: 8px;
            color: var(--primary);
            font-weight: 700;
        }

        /* Terms & Footer */
        .terms-container {
            padding: 0 40px;
            margin-bottom: 24px;
        }

        .terms-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 30px;
            background: #fff;
            padding: 15px;
            border: 1px dashed var(--slate-200);
            border-radius: 8px;
        }

        .term-text {
            font-size: 10px;
            color: var(--slate-400);
            line-height: 1.4;
            position: relative;
            padding-left: 12px;
        }

        .term-text::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--primary);
        }

        .footer {
            padding: 20px 40px;
            background: var(--slate-50);
            text-align: center;
            font-size: 11px;
            color: var(--slate-400);
            border-top: 1px solid var(--slate-100);
        }

        /* Printing Adjustments */
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border: none; width: 100%; max-width: 100%; }
            .top-accent { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="top-accent"></div>

    <div class="header">
        <div class="brand">
            ${company.logo ? `<img src="${company.logo}" class="logo"/>` : `<div class="logo"></div>`}
            <div>
                <h2 class="company-name">${escapeHtml(company.name)}</h2>
                <div class="company-contact">${escapeHtml(company.companyEmail)} • ${escapeHtml(company.companyPhone)}</div>
            </div>
        </div>
        <div class="receipt-info">
            <h1 class="receipt-title">Payment Receipt</h1>
            <div class="receipt-no">Transaction ID: #${escapeHtml(receiptNumber)}</div>
        </div>
    </div>

    <div class="hero">
        <div class="amount-box">
            <label>Amount Collected</label>
            <div class="amount-value">${escapeHtml(formatCurrency(detail.amount))}</div>
        </div>
        <div style="text-align: right">
            <label>Payment Date</label>
            <div style="font-weight: 700; font-size: 16px;">${formatDate(new Date())}</div>
        </div>
    </div>

    <div class="content-grid">
        <div class="main-details">
            <div class="section-header">Plan & Item Details</div>
            <div class="info-row"><span class="info-label">Account</span><span class="info-value">${planAccount}</span></div>
            <div class="info-row"><span class="info-label">Item / Model</span><span class="info-value">${item.name} (${model})</span></div>
            <div class="info-row"><span class="info-label">Tenure</span><span class="info-value">${plan.months} Months</span></div>
            <div class="info-row"><span class="info-label">Monthly Rate</span><span class="info-value">${formatCurrency(plan.monthlyAmount)}</span></div>

            <div class="section-header" style="margin-top: 24px;">Current Installment</div>
            <div class="info-row"><span class="info-label">Serial Number</span><span class="info-value">#${currentInstallment?.installmentNumber || "-"}</span></div>
            <div class="info-row"><span class="info-label">Due Date</span><span class="info-value">${currentInstallment ? formatDate(currentInstallment.dueDate) : "-"}</span></div>
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="badge ${currentInstallment?.status}">${currentInstallment?.status || "N/A"}</span>
            </div>

            <div class="section-header" style="margin-top: 24px;">Customer Details</div>
            <div class="info-row"><span class="info-label">Customer Name</span><span class="info-value">${detail.customer.name}</span></div>
            <div class="info-row"><span class="info-label">Contact / ID</span><span class="info-value">${detail.customer.phone || "-"} / ${detail.customer.cnic || "-"}</span></div>
        </div>

        <div class="side-panel">
            <div class="summary-card">
                <div class="section-header">Financial Summary</div>
                <div class="summary-item"><span class="info-label">Selling Price</span><span class="info-value">${formatCurrency(plan.sellingPrice)}</span></div>
                <div class="summary-item"><span class="info-label">Total Paid</span><span class="info-value" style="color: var(--emerald);">${formatCurrency(totalPaid)}</span></div>
                <div class="summary-item"><span class="info-label">Installments</span><span class="info-value">${paidInstallments} / ${totalInstallments}</span></div>
                <div class="summary-item total-row"><span style="color: var(--primary);">Remaining</span><span>${formatCurrency(remaining)}</span></div>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <div style="border-top: 1px solid var(--slate-200); width: 150px; margin: 0 auto 8px auto;"></div>
                <div style="font-size: 10px; font-weight: 700; color: var(--slate-400); text-transform: uppercase;">Authorized Signatory</div>
            </div>
        </div>
    </div>

    <div class="terms-container">
        <div class="section-header">Terms & Important Notices</div>
        <div class="terms-grid">
            <div class="term-text">Item(s) remain a trust (rented) in your possession. Ownership transfers only upon full payment completion.</div>
            <div class="term-text">Installments must be paid by the due date. No waivers are granted on the final installment per company rules.</div>
            <div class="term-text">Prices are fixed; no adjustments permitted. Errors and omissions are subject to correction by the company.</div>
            <div class="term-text">If no SMS/Receipt is received after payment, please contact: <strong>${escapeHtml(company.companyPhone)}</strong>.</div>
        </div>
    </div>

    <div class="footer">
        Generated on ${formatDateTime(new Date().toISOString())} • This is a computer-generated document.
    </div>
</div>

<script>
    window.onload = () => {
        window.print();
        window.onafterprint = () => window.close();
    };
</script>

</body>
</html>
`;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  type CompanyDetails = {
    name: string;
    logo: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone: string;
  };
}

export function TransactionDetailSheet({
  open,
  transactionId,
  onOpenChange,
}: {
  open: boolean;
  transactionId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyDetails>({
    name: "",
    logo: "",
    companyAddress: "",
    companyEmail: "",
    companyPhone: "",
  });

  useEffect(() => {
    if (!open || !transactionId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function loadDetail() {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load transaction");
        }

        setDetail(payload);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }
        setDetail(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load transaction",
        );
      } finally {
        setLoading(false);
      }
    }

    async function loadCompany() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setCompany({
            name: data.name || "",
            logo: data.logo || "",
            companyAddress: data.companyAddress || "",
            companyEmail: data.companyEmail || "",
            companyPhone: data.companyPhone || "",
          });
        }
      } catch {}
    }

    loadDetail();
    loadCompany();
    return () => controller.abort();
  }, [open, transactionId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-l border-slate-200 bg-slate-50 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-slate-200 bg-white px-6 py-5 text-left">
          <div className="inline-flex w-fit items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Transaction Detail
          </div>
          <div className="space-y-2">
            <SheetTitle className="text-xl text-slate-900">
              {detail
                ? `Transaction #${detail.id}`
                : transactionId
                  ? `Transaction #${transactionId}`
                  : "Transaction"}
            </SheetTitle>
            <SheetDescription className="text-sm leading-relaxed text-slate-500">
              Review exact payment details and print a compact receipt.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex h-full min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <Spinner className="size-4" />
                Loading transaction details
              </div>
            </div>
          ) : error ? (
            <Card className="border border-rose-200 bg-rose-50 p-5 text-rose-700">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    Unable to load transaction
                  </p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </Card>
          ) : detail ? (
            <div className="space-y-4">
              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount Received
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-600">
                      {formatCurrency(detail.amount)}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Plan #{detail.plan.id}
                  </span>
                </div>
              </Card>

              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <UserRound size={15} className="text-slate-500" />
                  Customer
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {detail.customer.name}
                  </p>
                  <p>{detail.customer.phone || "No phone"}</p>
                  <p>{detail.customer.cnic || "No CNIC"}</p>
                </div>
              </Card>

              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CreditCard size={15} className="text-slate-500" />
                  Plan & Item
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {detail.plan.item.name}
                  </p>
                  <p>{detail.plan.item.model || "No model"}</p>
                  <p>SKU: {detail.plan.item.sku || "Not set"}</p>
                  <p>
                    Plan #{detail.plan.id} · {detail.plan.months} months
                  </p>
                  <p>Monthly {formatCurrency(detail.plan.monthlyAmount)}</p>
                </div>
              </Card>

              <Card className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarClock size={15} className="text-slate-500" />
                  Timeline
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>
                    Transaction date: {formatDateTime(detail.transactionDate)}
                  </p>
                  <p>Recorded on: {formatDate(detail.createdAt)}</p>
                  <p>Note: {detail.description || "N/A"}</p>
                </div>
              </Card>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            Print-ready compact receipt for customer handover.
          </p>
          <Button
            type="button"
            disabled={!detail}
            onClick={() => detail && printReceipt(detail, company)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Printer size={14} />
            Print Receipt
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
