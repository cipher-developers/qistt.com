import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, model, description, sellingPrice, costPrice, sku, categoryId } =
      await request.json();

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        name,
        model: model || null,
        description: description || null,
        sellingPrice:
          sellingPrice === undefined || sellingPrice === ""
            ? null
            : Number(sellingPrice),
        costPrice:
          costPrice === undefined || costPrice === "" ? null : Number(costPrice),
        sku: sku || null,
        categoryId,
        tenantId: tenant.id,
      },
      include: { category: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.item.findMany({
      where: { tenantId: tenant.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
