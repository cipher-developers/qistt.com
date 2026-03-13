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

    const customerIdValue = Number(customerId);
    const itemIdValue = Number(itemId);
    const sellingPriceValue = Number(sellingPrice);
    const advancePaidValue = Number(advancePaid ?? 0);
    const monthsValue = Number(months);

    if (
      !Number.isInteger(customerIdValue) ||
      customerIdValue <= 0 ||
      !Number.isInteger(itemIdValue) ||
      itemIdValue <= 0 ||
      !Number.isFinite(sellingPriceValue) ||
      sellingPriceValue <= 0 ||
      !Number.isInteger(monthsValue) ||
      monthsValue <= 0 ||
      !Number.isFinite(advancePaidValue) ||
      advancePaidValue < 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (advancePaidValue > sellingPriceValue) {
      return NextResponse.json(
        { error: "Advance paid cannot be greater than selling price" },
        { status: 400 }
      );
    }

    const monthlyAmount =
      (sellingPriceValue - advancePaidValue) / monthsValue;

    // Create installment plan
    const plan = await prisma.installmentPlan.create({
      data: {
        customerId: customerIdValue,
        itemId: itemIdValue,
        sellingPrice: sellingPriceValue,
        advancePaid: advancePaidValue,
        months: monthsValue,
        monthlyAmount: parseFloat(monthlyAmount.toFixed(2)),
        startDate: new Date(),
        tenantId: tenant.id,
      },
    });

    // Generate installments
    const installments = [];
    const today = new Date();

    for (let i = 0; i < monthsValue; i++) {
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
