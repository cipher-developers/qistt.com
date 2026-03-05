import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-helper";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdminAuth();

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete this user" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tenant user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
