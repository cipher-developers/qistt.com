import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
        return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const item = await prisma.item.findFirst({
            where: {
                id: itemId,
                tenantId: tenant.id,
            },
            select: {
                id: true,
                name: true,
                model: true,
                description: true,
                sku: true,
                costPrice: true,
                sellingPrice: true,
                createdAt: true,
                updatedAt: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        installmentPlans: true,
                    },
                },
                installmentPlans: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        status: true,
                        sellingPrice: true,
                        advancePaid: true,
                        monthlyAmount: true,
                        months: true,
                        createdAt: true,
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            },
                        },
                        transactions: {
                            select: {
                                id: true,
                                amount: true,
                            },
                        },
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch {
        return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
        return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, model, description, sellingPrice, costPrice, sku, categoryId } = await request.json();

        if (!name || !categoryId || sellingPrice === undefined || costPrice === undefined) {
            return NextResponse.json(
                { error: "Name, category, selling price, and cost price are required" },
                { status: 400 }
            );
        }

        const item = await prisma.item.update({
            where: {
                id: itemId,
                tenantId: tenant.id,
            },
            data: {
                name,
                model: model || null,
                description: description || null,
                sellingPrice: Number(sellingPrice),
                costPrice: Number(costPrice),
                sku: sku || null,
                categoryId,
            },
            include: { category: true },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Update item error:", error);
        return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
        return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const item = await prisma.item.delete({
            where: {
                id: itemId,
                tenantId: tenant.id,
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Delete item error:", error);
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}