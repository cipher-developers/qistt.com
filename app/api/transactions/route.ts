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

    if (!planId || !customerId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify plan belongs to tenant
    const plan = await prisma.installmentPlan.findFirst({
      where: {
        id: planId,
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
        planId,
        customerId,
        tenantId: tenant.id,
        amount: parseFloat(amount),
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
