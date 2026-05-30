import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata = {
  title: "Settings - Kistly",
};

export default async function SettingsPage() {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    return null;
  }

  const [customers, items, activePlans, transactions] = await Promise.all([
    prisma.customer.count({ where: { tenantId: tenant.id } }),
    prisma.item.count({ where: { tenantId: tenant.id } }),
    prisma.installmentPlan.count({
      where: { tenantId: tenant.id, status: "active" },
    }),
    prisma.transaction.count({ where: { tenantId: tenant.id } }),
  ]);

  return (
    <SettingsView
      tenant={tenant}
      metrics={{
        customers,
        items,
        activePlans,
        transactions,
      }}
    />
  );
}
