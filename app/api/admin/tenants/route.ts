import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-helper";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const { name, subdomain, ownerEmail, logo } = await request.json();

    if (!name || !subdomain || !ownerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "Subdomain already in use" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain,
        ownerEmail,
        logo: logo || null,
        status: "active",
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("Create tenant error:", error);
    return NextResponse.json(
      { error: "Failed to create tenant" },
      { status: 500 }
    );
  }
}
