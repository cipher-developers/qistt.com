import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { parseWholeAmount } from "@/lib/utils";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const purchaseId = Number(id);

    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
        return NextResponse.json({ error: "Invalid purchase id" }, { status: 400 });
    }

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await prisma.purchase.findFirst({
            where: {
                id: purchaseId,
                tenantId: tenant.id,
            },
            select: { id: true, consumedQty: true },
        });

        if (!existing) {
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
        }

        const { vendorId, itemId, quantity, unitCost, purchasedAt, notes } =
            await request.json();

        const vendorIdValue = Number(vendorId);
        const itemIdValue = Number(itemId);
        const quantityValue = Number(quantity);
        const unitCostValue = parseWholeAmount(unitCost);
        const purchasedAtValue = purchasedAt ? new Date(purchasedAt) : new Date();

        if (
            !Number.isInteger(vendorIdValue) ||
            vendorIdValue <= 0 ||
            !Number.isInteger(itemIdValue) ||
            itemIdValue <= 0 ||
            !Number.isInteger(quantityValue) ||
            quantityValue <= 0 ||
            unitCostValue === null ||
            Number.isNaN(purchasedAtValue.getTime())
        ) {
            return NextResponse.json({ error: "Invalid purchase payload" }, { status: 400 });
        }

        if (quantityValue < existing.consumedQty) {
            return NextResponse.json(
                { error: "Quantity cannot be less than already consumed amount" },
                { status: 400 },
            );
        }

        const purchase = await prisma.purchase.update({
            where: { id: purchaseId },
            data: {
                vendorId: vendorIdValue,
                itemId: itemIdValue,
                quantity: quantityValue,
                unitCost: unitCostValue,
                purchasedAt: purchasedAtValue,
                notes: notes?.trim() ? notes.trim() : null,
            },
            include: {
                vendor: {
                    select: { id: true, name: true, phone: true },
                },
                item: {
                    select: { id: true, name: true, model: true, sku: true },
                },
            },
        });

        return NextResponse.json(purchase);
    } catch {
        return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const purchaseId = Number(id);

    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
        return NextResponse.json({ error: "Invalid purchase id" }, { status: 400 });
    }

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const purchase = await prisma.purchase.findFirst({
            where: {
                id: purchaseId,
                tenantId: tenant.id,
            },
            select: { id: true, consumedQty: true },
        });

        if (!purchase) {
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
        }

        if (purchase.consumedQty > 0) {
            return NextResponse.json(
                { error: "Cannot delete a purchase already linked to plans" },
                { status: 400 },
            );
        }

        await prisma.purchase.delete({ where: { id: purchaseId } });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete purchase" }, { status: 500 });
    }
}
