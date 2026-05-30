import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await prisma.category.findMany({
            where: { tenantId: tenant.id },
            include: { _count: { select: { items: true } } },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(categories);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch categories" },
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
                { error: "Category name is required" },
                { status: 400 },
            );
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                tenantId: tenant.id,
            },
            include: { _count: { select: { items: true } } },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 409 },
            );
        }

        console.error("Create category error:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 },
        );
    }
}