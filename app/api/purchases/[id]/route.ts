import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

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
