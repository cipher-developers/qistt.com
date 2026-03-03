import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

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
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Create Installment Plan
        </h1>
        <p className="text-slate-600 mt-1">
          Set up a new installment plan for a customer
        </p>
      </div>
      <OnboardingForm
        tenantId={tenant?.id}
        customers={customers}
        items={items}
      />
    </div>
  );
}
