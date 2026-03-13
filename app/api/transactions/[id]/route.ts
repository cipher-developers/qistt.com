import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const transactionId = Number(id);

  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return NextResponse.json(
      { error: "Invalid transaction id" },
      { status: 400 },
    );
  }

  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        amount: true,
        description: true,
        transactionDate: true,
        createdAt: true,
        planId: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            cnic: true,
            email: true,
            address: true,
          },
        },
        plan: {
          select: {
            id: true,
            months: true,
            monthlyAmount: true,
            sellingPrice: true,
            status: true,
            item: {
              select: {
                id: true,
                name: true,
                model: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(transaction);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 },
    );
  }
}