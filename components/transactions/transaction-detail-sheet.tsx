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
    months: number;
    monthlyAmount: number;
    sellingPrice: number;
    status: string;
    item: {
      id: number;
      name: string;
      model: string | null;
      sku: string | null;
    };
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

function printReceipt(detail: TransactionDetail) {
  const receiptNumber = `TX-${String(detail.id).padStart(6, "0")}`;
  const popup = window.open("", "_blank", "width=460,height=760");

  if (!popup) {
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Receipt ${receiptNumber}</title>
    <style>
      @page { size: 80mm auto; margin: 8mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        color: #0f172a;
        font-size: 12px;
        line-height: 1.35;
      }
      .receipt {
        width: 100%;
        max-width: 80mm;
        margin: 0 auto;
      }
      .title {
        text-align: center;
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .sub {
        text-align: center;
        font-size: 11px;
        color: #475569;
        margin-bottom: 12px;
      }
      .rule {
        border-top: 1px dashed #94a3b8;
        margin: 10px 0;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin: 4px 0;
      }
      .label { color: #475569; }
      .value { font-weight: 600; text-align: right; }
      .total {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #334155;
      }
      .total .label,
      .total .value {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }
      .note {
        margin-top: 8px;
        font-size: 11px;
        color: #334155;
      }
      .footer {
        text-align: center;
        margin-top: 14px;
        font-size: 10px;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="title">Payment Receipt</div>
      <div class="sub">${escapeHtml(receiptNumber)}</div>

      <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(
        formatDateTime(detail.transactionDate),
      )}</span></div>
      <div class="row"><span class="label">Customer</span><span class="value">${escapeHtml(
        detail.customer.name,
      )}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${escapeHtml(
        detail.customer.phone || "-",
      )}</span></div>
      <div class="row"><span class="label">Item</span><span class="value">${escapeHtml(
        detail.plan.item.name,
      )}</span></div>
      <div class="row"><span class="label">Plan ID</span><span class="value">#${escapeHtml(
        String(detail.plan.id),
      )}</span></div>

      <div class="rule"></div>

      <div class="row total">
        <span class="label">Amount Paid</span>
        <span class="value">${escapeHtml(formatCurrency(detail.amount))}</span>
      </div>
      <div class="row"><span class="label">Payment Note</span><span class="value">${escapeHtml(
        detail.description || "N/A",
      )}</span></div>

      <div class="note">This is a system-generated receipt.</div>
      <div class="footer">Printed ${escapeHtml(formatDateTime(new Date().toISOString()))}</div>
    </div>
    <script>
      window.onload = function() {
        window.print();
        window.onafterprint = function() { window.close(); };
      };
    </script>
  </body>
</html>`;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
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

    loadDetail();
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
            onClick={() => detail && printReceipt(detail)}
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
