export async function GET(request: NextRequest) {
    try {
        const tenant = await getCurrentTenant();
        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Only return public company info fields needed for receipts/settings
        return NextResponse.json({
            name: tenant.name || "",
            logo: tenant.logo || "",
            companyAddress: tenant.companyAddress || "",
            companyEmail: tenant.companyEmail || "",
            companyPhone: tenant.companyPhone || "",
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
    try {
        const tenant = await getCurrentTenant();

        if (!tenant) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, ownerEmail, logo, companyAddress, companyEmail, companyPhone } = await request.json();

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
                companyAddress: companyAddress ? String(companyAddress).trim() : null,
                companyEmail: companyEmail ? String(companyEmail).trim() : null,
                companyPhone: companyPhone ? String(companyPhone).trim() : null,
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