import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function GET(
    _request: NextRequest,
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

        const plan = await prisma.installmentPlan.findFirst({
            where: { id: planId, tenantId: tenant.id },
            select: {
                id: true,
                sellingPrice: true,
                advancePaid: true,
                monthlyAmount: true,
                months: true,
                startDate: true,
                status: true,
                createdAt: true,
                updatedAt: true,
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
                item: {
                    select: {
                        id: true,
                        name: true,
                        model: true,
                        sku: true,
                        category: { select: { name: true } },
                    },
                },
                installments: {
                    orderBy: { installmentNumber: "asc" },
                    select: {
                        id: true,
                        installmentNumber: true,
                        dueDate: true,
                        amount: true,
                        paidAmount: true,
                        status: true,
                    },
                },
                transactions: {
                    orderBy: { transactionDate: "desc" },
                    select: {
                        id: true,
                        amount: true,
                        description: true,
                        transactionDate: true,
                    },
                },
            },
        });

        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Get plan detail error:", error);
        return NextResponse.json(
            { error: "Failed to load plan details" },
            { status: 500 },
        );
    }
}
