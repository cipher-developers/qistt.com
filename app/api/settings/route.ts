import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
    try {
        const tenant = await getCurrentTenant();

        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, ownerEmail, logo } = await request.json();

        if (!name || !ownerEmail) {
            return NextResponse.json(
                { error: "Workspace name and owner email are required." },
                { status: 400 }
            );
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
                name: String(name).trim(),
                ownerEmail: String(ownerEmail).trim(),
                logo: logo ? String(logo).trim() : null,
            },
        });

        return NextResponse.json(updatedTenant);
    } catch (error) {
        console.error("Update settings error:", error);
        return NextResponse.json(
            { error: "Failed to update settings." },
            { status: 500 }
        );
    }
}