import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vendors = await prisma.vendor.findMany({
            where: { tenantId: tenant.id },
            include: {
                _count: {
                    select: {
                        purchases: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(vendors);
    } catch {
        return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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

        const vendor = await prisma.vendor.create({
            data: {
                name: name.trim(),
                phone: phone.trim(),
                email: email?.trim() ? email.trim() : null,
                address: address?.trim() ? address.trim() : null,
                notes: notes?.trim() ? notes.trim() : null,
                tenantId: tenant.id,
            },
            include: {
                _count: {
                    select: {
                        purchases: true,
                    },
                },
            },
        });

        return NextResponse.json(vendor, { status: 201 });
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: "A vendor with this phone already exists" },
                { status: 409 },
            );
        }
        return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
    }
}
