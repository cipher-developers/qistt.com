import { NextResponse } from "next/server";
import path from "node:path";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/auth-helper";

export const runtime = "nodejs";

type InstallmentRow = {
  srNo: number;
  month: string;
  method: string;
  date: string;
  invoiceNo: string;
  received: number | "";
  remain: number | "";
  outstandingBalance: number | "";
};

function sanitizeForFilename(value: string) {
  return value
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-GB");
}

function formatMonthYear(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function toWholeAmount(value: number) {
  return Math.round(value);
}

function setInstallmentRow(
  worksheet: ExcelJS.Worksheet,
  startColumn: number,
  rowNumber: number,
  row: InstallmentRow,
) {
  worksheet.getCell(rowNumber, startColumn).value = row.srNo || "";
  worksheet.getCell(rowNumber, startColumn + 1).value = row.month;
  worksheet.getCell(rowNumber, startColumn + 2).value = row.method;
  worksheet.getCell(rowNumber, startColumn + 3).value = row.date;
  worksheet.getCell(rowNumber, startColumn + 4).value = row.invoiceNo;
  worksheet.getCell(rowNumber, startColumn + 5).value = row.received;
  // worksheet.getCell(rowNumber, startColumn + 6).value = row.remain;
  worksheet.getCell(rowNumber, startColumn + 6).value = row.outstandingBalance;
  worksheet.getCell(rowNumber, startColumn + 8).value = "";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const planId = Number(id);

    if (!Number.isInteger(planId) || planId <= 0) {
      return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });
    }

    const plan = await prisma.installmentPlan.findFirst({
      where: {
        id: planId,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        startDate: true,
        sellingPrice: true,
        advancePaid: true,
        monthlyAmount: true,
        account_number: true,
        months: true,
        customer: {
          select: {
            name: true,
            phone: true,
            cnic: true,
            id: true,
            reference: {
              select: {
                name: true,
              },
            },
          },
        },
        item: {
          select: {
            name: true,
            model: true,
          },
        },
        installments: {
          orderBy: {
            installmentNumber: "asc",
          },
          select: {
            installmentNumber: true,
            dueDate: true,
            amount: true,
            paidAmount: true,
            status: true,
            transactions: {
              orderBy: {
                transactionDate: "desc",
              },
              select: {
                id: true,
                transactionDate: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const templatePath = path.join(process.cwd(), "public", "card.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json(
        { error: "Template worksheet not found" },
        { status: 500 },
      );
    }

    const totalPaid = toWholeAmount(
      plan.installments.reduce(
        (sum, installment) => sum + installment.paidAmount,
        0,
      ),
    );
    const remainingAmount = toWholeAmount(
      Math.max(plan.sellingPrice - totalPaid, 0),
    );
    const lastInstallment = plan.installments[plan.installments.length - 1];
    const endDate = lastInstallment
      ? lastInstallment.dueDate
      : new Date(
          new Date(plan.startDate).getFullYear(),
          new Date(plan.startDate).getMonth() + plan.months,
          1,
        );

    worksheet.getCell("B4").value = plan.account_number || "";
    worksheet.getCell("E4").value = plan.item.name;
    worksheet.getCell("E6").value = plan.customer.cnic;
    worksheet.getCell("H4").value = formatDate(plan.startDate);
    worksheet.getCell("B6").value = plan.customer.name;
    worksheet.getCell("H6").value = plan.item.model || "";
    worksheet.getCell("B8").value = plan.customer.reference?.name || "Others";
    worksheet.getCell("E8").value = plan.customer.phone || "";
    worksheet.getCell("A10").value = toWholeAmount(plan.sellingPrice);
    worksheet.getCell("D10").value = toWholeAmount(plan.advancePaid);
    worksheet.getCell("G10").value = toWholeAmount(plan.monthlyAmount);

    worksheet.getCell("C14").value = formatMonthYear(endDate);
    worksheet.getCell("E14").value = totalPaid;
    worksheet.getCell("F14").value = toWholeAmount(plan.advancePaid);
    worksheet.getCell("G14").value = remainingAmount;
    worksheet.getCell("I14").value = toWholeAmount(plan.monthlyAmount);

    const installmentRows: InstallmentRow[] = [];
    let runningOutstanding = toWholeAmount(plan.sellingPrice);

    for (let index = 0; index < 12; index += 1) {
      const installment = plan.installments[index];

      if (!installment) {
        installmentRows.push({
          srNo: index + 1,
          month: "",
          method: "",
          date: "",
          invoiceNo: "",
          received: "",
          remain: "",
          outstandingBalance: "",
        });
        continue;
      }

      const remain = toWholeAmount(
        Math.max(installment.amount - installment.paidAmount, 0),
      );
      runningOutstanding = toWholeAmount(
        Math.max(runningOutstanding - installment.paidAmount, 0),
      );

      installmentRows.push({
        srNo: installment.installmentNumber,
        month: formatMonthYear(installment.dueDate),
        method: installment.status,
        date: installment.transactions[0]
          ? formatDate(installment.transactions[0].transactionDate)
          : "",
        invoiceNo: installment.transactions[0]
          ? String(installment.transactions[0].id)
          : "",
        received: toWholeAmount(installment.paidAmount),
        remain,
        outstandingBalance: runningOutstanding,
      });
    }

    for (let i = 0; i < 6; i += 1) {
      setInstallmentRow(worksheet, 1, 16 + i, installmentRows[i]);
      setInstallmentRow(worksheet, 11, 11 + i, installmentRows[i + 6]);
    }

    const totalReceivedSum = toWholeAmount(
      installmentRows.reduce(
        (sum, row) =>
          sum + (typeof row.received === "number" ? row.received : 0),
        0,
      ),
    );
    const totalRemainSum = toWholeAmount(
      installmentRows.reduce(
        (sum, row) => sum + (typeof row.remain === "number" ? row.remain : 0),
        0,
      ),
    );
    const totalOutstandingSum = toWholeAmount(
      installmentRows.reduce(
        (sum, row) =>
          sum +
          (typeof row.outstandingBalance === "number"
            ? row.outstandingBalance
            : 0),
        0,
      ),
    );

    worksheet.getCell("P19").value = totalReceivedSum;
    worksheet.getCell("Q19").value = totalRemainSum;
    worksheet.getCell("R19").value = totalOutstandingSum;

    const outputBuffer = await workbook.xlsx.writeBuffer();
    const safeCustomerName =
      sanitizeForFilename(plan.customer.name) ||
      `customer-${plan.account_number}`;
    const fileName = `${safeCustomerName}-plan-${plan.account_number}-card.xlsx`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Generate plan card error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan card" },
      { status: 500 },
    );
  }
}
