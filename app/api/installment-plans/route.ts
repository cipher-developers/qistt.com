import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import {
  parseNonNegativeWholeAmount,
  parseWholeAmount,
  splitWholeAmount,
} from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      customerId,
      itemId,
      purchaseId,
      sellingPrice,
      advancePaid,
      months,
      createdAt,
      account_number,
    } = await request.json();

    const customerIdValue = Number(customerId);
    const itemIdValue = Number(itemId);
    const purchaseIdValue = Number(purchaseId);
    const sellingPriceValue = parseWholeAmount(sellingPrice);
    const advancePaidValue = parseNonNegativeWholeAmount(advancePaid ?? 0);
    const monthsValue = Number(months);
    const createdAtValue = createdAt ? new Date(createdAt) : new Date();
    const accountNumberValue = account_number !== undefined && account_number !== null && account_number !== "" ? Number(account_number) : undefined;

    if (
      !Number.isInteger(customerIdValue) ||
      customerIdValue <= 0 ||
      !Number.isInteger(itemIdValue) ||
      itemIdValue <= 0 ||
      !Number.isInteger(purchaseIdValue) ||
      purchaseIdValue <= 0 ||
      sellingPriceValue === null ||
      advancePaidValue === null ||
      !Number.isInteger(monthsValue) ||
      monthsValue <= 0 ||
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

    const remainingBalance = sellingPriceValue - advancePaidValue;
    const installmentAmounts = splitWholeAmount(remainingBalance, monthsValue);
    const monthlyAmountValue = installmentAmounts[0] ?? 0;

    const plan = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: {
          id: purchaseIdValue,
          tenantId: tenant.id,
        },
        select: {
          id: true,
          itemId: true,
          quantity: true,
          consumedQty: true,
        },
      });

      if (!purchase) {
        throw new Error("PURCHASE_NOT_FOUND");
      }

      if (purchase.itemId !== itemIdValue) {
        throw new Error("PURCHASE_ITEM_MISMATCH");
      }

      if (purchase.consumedQty >= purchase.quantity) {
        throw new Error("PURCHASE_OUT_OF_STOCK");
      }

      const createdPlan = await tx.installmentPlan.create({
        data: {
          customerId: customerIdValue,
          itemId: itemIdValue,
          purchaseId: purchaseIdValue,
          sellingPrice: sellingPriceValue,
          advancePaid: advancePaidValue,
          months: monthsValue,
          monthlyAmount: monthlyAmountValue,
          startDate: createdAtValue,
          createdAt: createdAtValue,
          tenantId: tenant.id,
          account_number: accountNumberValue,
        },
      });

      const installments = [];

      for (let i = 0; i < monthsValue; i++) {
        const dueDate = new Date(createdAtValue);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        dueDate.setDate(1);

        installments.push({
          planId: createdPlan.id,
          installmentNumber: i + 1,
          amount: installmentAmounts[i] ?? 0,
          dueDate,
          paidAmount: 0,
          status: "pending",
        });
      }

      await tx.installment.createMany({
        data: installments,
      });

      if (advancePaidValue > 0) {
        await tx.transaction.create({
          data: {
            planId: createdPlan.id,
            installmentId: null,
            customerId: customerIdValue,
            tenantId: tenant.id,
            amount: advancePaidValue,
            description: "Advance Payment",
            transactionDate: createdAtValue,
          },
        });
      }

      await tx.purchase.update({
        where: { id: purchaseIdValue },
        data: {
          consumedQty: {
            increment: 1,
          },
        },
      });

      return createdPlan;
    });

    return NextResponse.json(
      { plan, message: "Installment plan created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PURCHASE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Selected purchase record was not found" },
          { status: 400 }
        );
      }
      if (error.message === "PURCHASE_ITEM_MISMATCH") {
        return NextResponse.json(
          { error: "Selected purchase does not match the selected item" },
          { status: 400 }
        );
      }
      if (error.message === "PURCHASE_OUT_OF_STOCK") {
        return NextResponse.json(
          { error: "Selected purchase is out of stock" },
          { status: 400 }
        );
      }
    }

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
        purchase: {
          include: {
            vendor: true,
          },
        },
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
