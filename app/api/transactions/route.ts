import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installmentId, amount, receiptNumber, notes } = await request.json();

    if (!installmentId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify installment belongs to tenant
    const installment = await prisma.installment.findFirst({
      where: {
        id: installmentId,
        installmentPlan: { tenantId: tenant.id },
      },
      include: { installmentPlan: true },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Installment not found" },
        { status: 404 }
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        installmentId,
        amount: parseFloat(amount),
        receiptNumber: receiptNumber || null,
        notes: notes || null,
        transactionDate: new Date(),
      },
    });

    // Update installment
    const newPaidAmount = (installment.paidAmount || 0) + parseFloat(amount);
    const status =
      newPaidAmount >= installment.amount ? "PAID" : "PARTIAL";

    await prisma.installment.update({
      where: { id: installmentId },
      data: {
        paidAmount: newPaidAmount,
        status,
      },
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
        installment: {
          installmentPlan: { tenantId: tenant.id },
        },
      },
      include: {
        installment: {
          include: {
            installmentPlan: {
              include: { customer: true, item: true },
            },
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
