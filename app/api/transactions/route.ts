import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installmentId, amount, description } = await request.json();

    const installmentIdValue = String(installmentId || "").trim();
    const amountValue = Number(amount);

    if (
      !installmentIdValue ||
      !Number.isFinite(amountValue) ||
      amountValue <= 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    const remainingInstallment = Math.max(
      installment.amount - installment.paidAmount,
      0,
    );

    if (remainingInstallment <= 0) {
      return NextResponse.json(
        { error: "This installment is already fully paid" },
        { status: 400 },
      );
    }

    // if (amountValue > remainingInstallment) {
    //   return NextResponse.json(
    //     {
    //       error: `Amount exceeds remaining installment balance (${remainingInstallment.toFixed(2)})`,
    //     },
    //     { status: 400 },
    //   );
    // }

    const transaction = await prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.transaction.create({
        data: {
          planId: installment.planId,
          installmentId: installment.id,
          customerId: installment.plan.customerId,
          tenantId: tenant.id,
          amount: amountValue,
          description: description || null,
          transactionDate: new Date(),
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

      const nextPaidAmount = installment.paidAmount + amountValue;
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

      return createdTransaction;
    });

    return NextResponse.json(
      { transaction, message: "Transaction recorded successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Failed to record transaction" },
      { status: 500 }
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
          include: { customer: true, item: true, account_number: true },
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
      { status: 500 }
    );
  }
}
