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

        const category = await prisma.category.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
            include: { _count: { select: { items: true } } },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch category" },
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
                { error: "Category name is required" },
                { status: 400 },
            );
        }

        const existing = await prisma.category.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        const category = await prisma.category.update({
            where: { id },
            data: { name: name.trim() },
            include: { _count: { select: { items: true } } },
        });

        return NextResponse.json(category);
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 409 },
            );
        }

        console.error("Update category error:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
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

        const category = await prisma.category.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
            include: { _count: { select: { items: true } } },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        if (category._count.items > 0) {
            return NextResponse.json(
                { error: "This category cannot be deleted because it still has items assigned" },
                { status: 409 },
            );
        }

        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete category error:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 },
        );
    }
}