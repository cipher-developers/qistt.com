import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Create Installment Plan - Kistly",
};

export default async function OnboardingPage() {
  const tenant = await getCurrentTenant();

  const [customers, vendors, categories, items, purchases] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId: tenant?.id },
      select: { id: true, name: true, phone: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendor.findMany({
      where: { tenantId: tenant?.id },
      select: { id: true, name: true, phone: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { tenantId: tenant?.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { tenantId: tenant?.id },
      select: {
        id: true,
        name: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchase.findMany({
      where: { tenantId: tenant?.id },
      select: {
        id: true,
        quantity: true,
        consumedQty: true,
        unitCost: true,
        purchasedAt: true,
        item: {
          select: {
            id: true,
            name: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { purchasedAt: "desc" },
    }),
  ]);

  const availablePurchases = purchases.filter(
    (row) => row.quantity - row.consumedQty > 0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 md:space-y-7">
      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Plan Onboarding
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Create a new installment plan
            </h1>
            <p className="text-sm text-slate-600 sm:text-base">
              Configure customer, item, and payment terms in one guided
              workflow.
            </p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/dashboard/ledger">
              <ArrowLeft size={16} />
              Back to Plans
            </Link>
          </Button>
        </div>
      </section>

      <div>
        <OnboardingForm
          tenantId={tenant?.id}
          customers={customers}
          vendors={vendors}
          categories={categories}
          items={items}
          purchases={availablePurchases}
        />
      </div>
    </div>
  );
}
