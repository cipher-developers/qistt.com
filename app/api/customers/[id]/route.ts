import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

const CNIC_PATTERN = /^\d{5}-\d{7}-\d{1}$/;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customerId = Number(id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.delete({
      where: {
        id: customerId,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customerId = Number(id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        cnic: true,
        email: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            installmentPlans: true,
            transactions: true,
          },
        },
        installmentPlans: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            account_number: true,
            status: true,
            sellingPrice: true,
            advancePaid: true,
            monthlyAmount: true,
            months: true,
            createdAt: true,
            item: {
              select: {
                id: true,
                name: true,
                model: true,
              },
            },
            transactions: {
              select: {
                id: true,
                amount: true,
              },
            },
          },
        },
        transactions: {
          orderBy: { transactionDate: "desc" },
          take: 8,
          select: {
            id: true,
            amount: true,
            description: true,
            transactionDate: true,
            planId: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customerId = Number(id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }

  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, cnic, address, referenceId, createdAt } =
      await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (cnic && !CNIC_PATTERN.test(cnic)) {
      return NextResponse.json(
        { error: "CNIC must match the format 12345-1234567-1" },
        { status: 400 }
      );
    }

    const createdAtValue = createdAt ? new Date(createdAt) : null;
    if (createdAt && (!createdAtValue || Number.isNaN(createdAtValue.getTime()))) {
      return NextResponse.json(
        { error: "Invalid created date" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: {
        id: customerId,
        tenantId: tenant.id,
      },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        cnic: cnic || null,
        address: address || null,
        referenceId: referenceId || null,
        ...(createdAtValue ? { createdAt: createdAtValue } : {}),
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const target = Array.isArray(error?.meta?.target)
        ? error.meta.target
        : [];
      if (target.includes("phone")) {
        return NextResponse.json(
          { error: "A customer with this phone number already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "A customer with the same unique details already exists" },
        { status: 409 }
      );
    }

    console.error("Update customer error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
