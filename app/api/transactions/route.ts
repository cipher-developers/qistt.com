import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, customerId, amount, description } = await request.json();

    const planIdValue = Number(planId);
    const customerIdValue = Number(customerId);
    const amountValue = Number(amount);

    if (
      !Number.isInteger(planIdValue) ||
      planIdValue <= 0 ||
      !Number.isInteger(customerIdValue) ||
      customerIdValue <= 0 ||
      !Number.isFinite(amountValue) ||
      amountValue <= 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify plan belongs to tenant
    const plan = await prisma.installmentPlan.findFirst({
      where: {
        id: planIdValue,
        tenantId: tenant.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        planId: planIdValue,
        customerId: customerIdValue,
        tenantId: tenant.id,
        amount: amountValue,
        description: description || null,
        transactionDate: new Date(),
      },
      include: {
        plan: {
          include: { customer: true, item: true },
        },
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
        tenantId: tenant.id,
      },
      include: {
        plan: {
          include: { customer: true, item: true },
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
