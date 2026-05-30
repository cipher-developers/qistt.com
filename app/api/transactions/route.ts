import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { parseWholeAmount } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installmentId, amount, description } = await request.json();

    const installmentIdValue = String(installmentId || "").trim();
    const amountValue = parseWholeAmount(amount);

    if (!installmentIdValue || amountValue === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const installment = await prisma.installment.findFirst({
      where: {
        id: installmentIdValue,
        plan: {
          tenantId: tenant.id,
        },
      },
      include: {
        plan: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Installment not found" },
        { status: 404 },
      );
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          installmentId: installment.id,
          tenantId: tenant.id,
        },
        select: {
          id: true,
        },
      });

      const transactionData = {
        planId: installment.planId,
        installmentId: installment.id,
        customerId: installment.plan.customerId,
        tenantId: tenant.id,
        amount: amountValue,
        description: description || null,
        transactionDate: new Date(),
      };

      const savedTransaction = existingTransaction
        ? await tx.transaction.update({
            where: { id: existingTransaction.id },
            data: transactionData,
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
          })
        : await tx.transaction.create({
            data: transactionData,
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

      const nextPaidAmount = amountValue;
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

      return savedTransaction;
    });

    return NextResponse.json(
      { transaction, message: "Transaction recorded successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Failed to record transaction" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
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
      orderBy: { transactionDate: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
