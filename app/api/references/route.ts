import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const references = await prisma.reference.findMany({
            where: { tenantId: tenant.id },
            include: { _count: { select: { customers: true } } },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(references);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch references" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
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

        const reference = await prisma.reference.create({
            data: {
                name: name.trim(),
                tenantId: tenant.id,
            },
            include: { _count: { select: { customers: true } } },
        });

        return NextResponse.json(reference, { status: 201 });
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: "A reference with this name already exists" },
                { status: 409 },
            );
        }

        console.error("Create reference error:", error);
        return NextResponse.json(
            { error: "Failed to create reference" },
            { status: 500 },
        );
    }
}
