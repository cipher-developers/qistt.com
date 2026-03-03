import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password, tenantName } = await request.json();

    if (!email || !password || !tenantName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        subdomain: tenantName.toLowerCase().replace(/\s+/g, "-"),
      },
    });

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user as admin
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: email.split("@")[0],
        role: "ADMIN",
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(
      {
        message: "Signup successful",
        user: { id: user.id, email: user.email },
        tenantId: tenant.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
