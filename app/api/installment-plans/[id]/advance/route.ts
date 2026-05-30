import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import { ADVANCE_PAYMENT_DESCRIPTION } from "@/lib/plan-transactions";
import prisma from "@/lib/prisma";
import { parseNonNegativeWholeAmount } from "@/lib/utils";

async function getPlanForTenant(planId: number, tenantId: string) {
  return prisma.installmentPlan.findFirst({
    where: { id: planId, tenantId },
    select: {
      id: true,
      customerId: true,
      sellingPrice: true,
      discount: true,
      advancePaid: true,
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

    const { advancePaid } = await request.json();
    const advancePaidValue = parseNonNegativeWholeAmount(advancePaid);

    if (advancePaidValue === null) {
      return NextResponse.json(
        { error: "Advance must be a whole number zero or greater" },
        { status: 400 },
      );
    }

    const plan = await getPlanForTenant(planId, tenant.id);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const maxAdvance = plan.sellingPrice - plan.discount;
    if (advancePaidValue > maxAdvance) {
      return NextResponse.json(
        { error: "Advance cannot exceed selling price minus discount" },
        { status: 400 },
      );
    }

    const updatedPlan = await prisma.$transaction(async (tx) => {
      const advanceTransaction = await tx.transaction.findFirst({
        where: {
          planId: plan.id,
          tenantId: tenant.id,
          installmentId: null,
          description: ADVANCE_PAYMENT_DESCRIPTION,
        },
        select: { id: true },
      });

      if (advancePaidValue > 0) {
        const transactionDate = plan.startDate ?? plan.createdAt;
        const transactionData = {
          amount: advancePaidValue,
          description: ADVANCE_PAYMENT_DESCRIPTION,
          transactionDate,
        };

        if (advanceTransaction) {
          await tx.transaction.update({
            where: { id: advanceTransaction.id },
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
      } else if (advanceTransaction) {
        await tx.transaction.delete({
          where: { id: advanceTransaction.id },
        });
      }

      return tx.installmentPlan.update({
        where: { id: plan.id },
        data: { advancePaid: advancePaidValue },
        select: {
          id: true,
          advancePaid: true,
        },
      });
    });

    return NextResponse.json({
      plan: updatedPlan,
      message: "Advance updated successfully",
    });
  } catch (error) {
    console.error("Update plan advance error:", error);
    return NextResponse.json(
      { error: "Failed to update advance" },
      { status: 500 },
    );
  }
}
