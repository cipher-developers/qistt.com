import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, Package } from "lucide-react";

export const metadata = {
  title: "Create Installment Plan - Kistly",
};

export default async function OnboardingPage() {
  const tenant = await getCurrentTenant();

  const [customers, items] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId: tenant?.id },
      select: { id: true, name: true },
    }),
    prisma.item.findMany({
      where: { tenantId: tenant?.id },
      select: { id: true, name: true, sellingPrice: true },
    }),
  ]);

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

      {customers.length === 0 || items.length === 0 ? (
        <Card className="border border-dashed border-slate-300 bg-white/80 p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Setup required before onboarding
            </h2>
            <p className="text-sm text-slate-600">
              You need at least one customer and one item before creating
              installment plans.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="bg-slate-900 hover:bg-slate-800" asChild>
                <Link href="/dashboard/customers">
                  <Users size={16} />
                  Manage Customers
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/items">
                  <Package size={16} />
                  Manage Items
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div>
        <OnboardingForm
          tenantId={tenant?.id}
          customers={customers}
          items={items}
        />
      </div>
    </div>
  );
}
