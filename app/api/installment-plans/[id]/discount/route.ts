import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import { DISCOUNT_DESCRIPTION } from "@/lib/plan-transactions";
import prisma from "@/lib/prisma";
import { parseNonNegativeWholeAmount } from "@/lib/utils";

async function getPlanForTenant(planId: number, tenantId: string) {
  return prisma.installmentPlan.findFirst({
    where: { id: planId, tenantId },
    select: {
      id: true,
      customerId: true,
      sellingPrice: true,
      advancePaid: true,
      discount: true,
      startDate: true,
      createdAt: true,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const planId = Number(id);

  if (!Number.isInteger(planId) || planId <= 0) {
    return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });
  }

  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discount } = await request.json();
    const discountValue = parseNonNegativeWholeAmount(discount);

    if (discountValue === null) {
      return NextResponse.json(
        { error: "Discount must be a whole number zero or greater" },
        { status: 400 },
      );
    }

    const plan = await getPlanForTenant(planId, tenant.id);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (discountValue > plan.sellingPrice) {
      return NextResponse.json(
        { error: "Discount cannot exceed selling price" },
        { status: 400 },
      );
    }

    const maxDiscount = plan.sellingPrice - plan.advancePaid;
    if (discountValue > maxDiscount) {
      return NextResponse.json(
        { error: "Discount cannot exceed selling price minus advance paid" },
        { status: 400 },
      );
    }

    const updatedPlan = await prisma.$transaction(async (tx) => {
      const discountTransaction = await tx.transaction.findFirst({
        where: {
          planId: plan.id,
          tenantId: tenant.id,
          installmentId: null,
          description: DISCOUNT_DESCRIPTION,
        },
        select: { id: true },
      });

      if (discountValue > 0) {
        const transactionDate = plan.startDate ?? plan.createdAt;
        const transactionData = {
          amount: discountValue,
          description: DISCOUNT_DESCRIPTION,
          transactionDate,
        };

        if (discountTransaction) {
          await tx.transaction.update({
            where: { id: discountTransaction.id },
            data: transactionData,
          });
        } else {
          await tx.transaction.create({
            data: {
              planId: plan.id,
              installmentId: null,
              customerId: plan.customerId,
              tenantId: tenant.id,
              ...transactionData,
            },
          });
        }
      } else if (discountTransaction) {
        await tx.transaction.delete({
          where: { id: discountTransaction.id },
        });
      }

      return tx.installmentPlan.update({
        where: { id: plan.id },
        data: { discount: discountValue },
        select: {
          id: true,
          discount: true,
        },
      });
    });

    return NextResponse.json({
      plan: updatedPlan,
      message: "Discount updated successfully",
    });
  } catch (error) {
    console.error("Update plan discount error:", error);
    return NextResponse.json(
      { error: "Failed to update discount" },
      { status: 500 },
    );
  }
}
