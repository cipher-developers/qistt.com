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
      createdAt,
    } = await request.json();

    const customerIdValue = Number(customerId);
    const itemIdValue = Number(itemId);
    const sellingPriceValue = Number(sellingPrice);
    const advancePaidValue = Number(advancePaid ?? 0);
    const monthsValue = Number(months);
    const createdAtValue = createdAt ? new Date(createdAt) : new Date();

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
      advancePaidValue < 0 ||
      Number.isNaN(createdAtValue.getTime())
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

    const plan = await prisma.$transaction(async (tx) => {
      const createdPlan = await tx.installmentPlan.create({
        data: {
          customerId: customerIdValue,
          itemId: itemIdValue,
          sellingPrice: sellingPriceValue,
          advancePaid: advancePaidValue,
          months: monthsValue,
          monthlyAmount: parseFloat(monthlyAmount.toFixed(2)),
          startDate: createdAtValue,
          createdAt: createdAtValue,
          tenantId: tenant.id,
        },
      });

      const installments = [];
      let remainingAdvance = advancePaidValue;

      for (let i = 0; i < monthsValue; i++) {
        const dueDate = new Date(createdAtValue);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        dueDate.setDate(1);

        const installmentAmount = parseFloat(monthlyAmount.toFixed(2));
        const paidAmount = Math.min(remainingAdvance, installmentAmount);
        remainingAdvance = Math.max(remainingAdvance - paidAmount, 0);

        const status =
          paidAmount >= installmentAmount
            ? "paid"
            : paidAmount > 0
              ? "partial"
              : "pending";

        installments.push({
          planId: createdPlan.id,
          installmentNumber: i + 1,
          amount: installmentAmount,
          dueDate,
          paidAmount,
          status,
        });
      }

      await tx.installment.createMany({
        data: installments,
      });

      return createdPlan;
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
