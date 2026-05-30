import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { parseWholeAmount } from "@/lib/utils";

export async function GET() {
    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const purchases = await prisma.purchase.findMany({
            where: { tenantId: tenant.id },
            include: {
                vendor: {
                    select: { id: true, name: true, phone: true },
                },
                item: {
                    select: { id: true, name: true, model: true, sku: true },
                },
            },
            orderBy: { purchasedAt: "desc" },
        });

        return NextResponse.json(purchases);
    } catch {
        return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        const purchase = await prisma.purchase.create({
            data: {
                vendorId: vendorIdValue,
                itemId: itemIdValue,
                quantity: quantityValue,
                unitCost: unitCostValue,
                purchasedAt: purchasedAtValue,
                notes: notes?.trim() ? notes.trim() : null,
                tenantId: tenant.id,
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

        return NextResponse.json(purchase, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
    }
}
