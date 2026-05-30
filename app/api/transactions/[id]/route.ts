import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { parseWholeAmount } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const transactionId = Number(id);

  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return NextResponse.json(
      { error: "Invalid transaction id" },
      { status: 400 },
    );
  }

  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        amount: true,
        description: true,
        transactionDate: true,
        createdAt: true,
        planId: true,
        installmentId: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            cnic: true,
            email: true,
            address: true,
          },
        },
        plan: {
          select: {
            id: true,
            account_number: true,
            months: true,
            monthlyAmount: true,
            sellingPrice: true,
            advancePaid: true,
            status: true,
            item: {
              select: {
                id: true,
                name: true,
                model: true,
                sku: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            installments: {
              select: {
                id: true,
                installmentNumber: true,
                amount: true,
                paidAmount: true,
                status: true,
                dueDate: true,
              },
            },
            transactions: {
              select: {
                id: true,
                amount: true,
              },
            },
          },
        },
        installment: {
          select: {
            id: true,
            installmentNumber: true,
            amount: true,
            paidAmount: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(transaction);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const transactionId = Number(id);

  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return NextResponse.json(
      { error: "Invalid transaction id" },
      { status: 400 },
    );
  }

  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, description } = await request.json();
    const amountValue = parseWholeAmount(amount);

    if (amountValue === null) {
      return NextResponse.json(
        { error: "Amount must be a whole number greater than zero" },
        { status: 400 },
      );
    }

    const existing = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        amount: true,
        description: true,
        installmentId: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    const updateResult = await prisma.$transaction(
      async (tx) => {
        if (existing.installmentId) {
          const installment = await tx.installment.findUnique({
            where: { id: existing.installmentId },
            select: {
              id: true,
              amount: true,
              paidAmount: true,
            },
          });

          if (!installment) {
            throw new Error("Linked installment not found");
          }

          const nextPaidAmount =
            installment.paidAmount - existing.amount + amountValue;
          if (nextPaidAmount < 0) {
            return { ok: false as const };
          }

          const nextStatus =
            nextPaidAmount >= installment.amount
              ? "paid"
              : nextPaidAmount > 0
                ? "partial"
                : "pending";

          await tx.installment.update({
            where: { id: installment.id },
            data: {
              paidAmount: nextPaidAmount,
              status: nextStatus,
            },
          });
        }

        await tx.transaction.update({
          where: { id: existing.id },
          data: {
            amount: amountValue,
            description: description || null,
          },
        });

        return { ok: true as const };
      },
      {
        maxWait: 10_000,
        timeout: 15_000,
      },
    );

    if (!updateResult.ok) {
      return NextResponse.json(
        { error: "Updated amount results in an invalid installment balance" },
        { status: 400 },
      );
    }

    const updatedTransaction = await prisma.transaction.findFirst({
      where: {
        id: existing.id,
        tenantId: tenant.id,
      },
      include: {
        plan: {
          include: { customer: true, item: true },
        },
        installment: {
          select: {
            id: true,
            installmentNumber: true,
            status: true,
          },
        },
      },
    });

    if (!updatedTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      transaction: updatedTransaction,
      message: "Transaction updated successfully",
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}
