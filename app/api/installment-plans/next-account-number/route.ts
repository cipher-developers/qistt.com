import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
    const tenant = await getCurrentTenant();
    if (!tenant) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the max account_number for this tenant
    const lastPlan = await prisma.installmentPlan.findFirst({
        where: { tenantId: tenant.id, account_number: { not: null } },
        orderBy: [{ account_number: "desc" }],
        select: { account_number: true },
    });

    const nextAccountNumber = lastPlan?.account_number ? lastPlan.account_number + 1 : 1;
    return NextResponse.json({ nextAccountNumber });
}
