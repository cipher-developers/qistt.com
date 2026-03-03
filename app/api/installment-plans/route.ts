import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      customerId,
      itemId,
      sellingPrice,
      advancePaid,
      months,
    } = await request.json();

    if (!customerId || !itemId || !sellingPrice || !months) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create installment plan
    const plan = await prisma.installmentPlan.create({
      data: {
        customerId,
        itemId,
        sellingPrice: parseFloat(sellingPrice),
        advancePaid: parseFloat(advancePaid) || 0,
        months: parseInt(months),
        monthlyAmount: parseFloat(((sellingPrice - (advancePaid || 0)) / months).toFixed(2)),
        startDate: new Date(),
        tenantId: tenant.id,
      },
    });

    // Calculate monthly amount
    const monthlyAmount = (sellingPrice - (advancePaid || 0)) / months;

    // Generate installments
    const installments = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      dueDate.setDate(1); // Due on 1st of each month

      installments.push({
        planId: plan.id,
        installmentNumber: i + 1,
        amount: parseFloat(monthlyAmount.toFixed(2)),
        dueDate,
        paidAmount: 0,
        status: "pending",
      });
    }

    // Bulk create installments
    await prisma.installment.createMany({
      data: installments,
    });

    return NextResponse.json(
      { plan, message: "Installment plan created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create installment plan error:", error);
    return NextResponse.json(
      { error: "Failed to create installment plan" },
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

    const plans = await prisma.installmentPlan.findMany({
      where: { tenantId: tenant.id },
      include: {
        customer: true,
        item: true,
        installments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
