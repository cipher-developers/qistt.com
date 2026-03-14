import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reference = await prisma.reference.findFirst({
            where: { id, tenantId: tenant.id },
            include: { _count: { select: { customers: true } } },
        });

        if (!reference) {
            return NextResponse.json({ error: "Reference not found" }, { status: 404 });
        }

        return NextResponse.json(reference);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch reference" },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json(
                { error: "Reference name is required" },
                { status: 400 },
            );
        }

        const existing = await prisma.reference.findFirst({
            where: { id, tenantId: tenant.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Reference not found" }, { status: 404 });
        }

        const reference = await prisma.reference.update({
            where: { id },
            data: { name: name.trim() },
            include: { _count: { select: { customers: true } } },
        });

        return NextResponse.json(reference);
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: "A reference with this name already exists" },
                { status: 409 },
            );
        }

        console.error("Update reference error:", error);
        return NextResponse.json(
            { error: "Failed to update reference" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await prisma.reference.findFirst({
            where: { id, tenantId: tenant.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Reference not found" }, { status: 404 });
        }

        await prisma.reference.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to delete reference" },
            { status: 500 },
        );
    }
}
