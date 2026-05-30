import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const vendorId = Number(id);

    if (!Number.isInteger(vendorId) || vendorId <= 0) {
        return NextResponse.json({ error: "Invalid vendor id" }, { status: 400 });
    }

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, phone, email, address, notes } = await request.json();

        if (!name?.trim() || !phone?.trim()) {
            return NextResponse.json(
                { error: "Vendor name and phone are required" },
                { status: 400 },
            );
        }

        const vendor = await prisma.vendor.update({
            where: {
                id: vendorId,
                tenantId: tenant.id,
            },
            data: {
                name: name.trim(),
                phone: phone.trim(),
                email: email?.trim() ? email.trim() : null,
                address: address?.trim() ? address.trim() : null,
                notes: notes?.trim() ? notes.trim() : null,
            },
            include: {
                _count: {
                    select: {
                        purchases: true,
                    },
                },
            },
        });

        return NextResponse.json(vendor);
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: "A vendor with this phone already exists" },
                { status: 409 },
            );
        }
        return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const vendorId = Number(id);

    if (!Number.isInteger(vendorId) || vendorId <= 0) {
        return NextResponse.json({ error: "Invalid vendor id" }, { status: 400 });
    }

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.vendor.delete({
            where: {
                id: vendorId,
                tenantId: tenant.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
    }
}
