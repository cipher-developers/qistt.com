import prisma from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/auth-helper";
import { PurchasesView } from "@/components/purchases/purchases-view";

export const metadata = {
  title: "Purchases - Kistly",
};

export default async function PurchasesPage() {
  const tenant = await getCurrentTenant();

  const [purchases, vendors, items] = await Promise.all([
    prisma.purchase.findMany({
      where: { tenantId: tenant?.id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            model: true,
            sku: true,
          },
        },
      },
      orderBy: { purchasedAt: "desc" },
    }),
    prisma.vendor.findMany({
      where: { tenantId: tenant?.id },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { tenantId: tenant?.id },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PurchasesView purchases={purchases} vendors={vendors} items={items} />
  );
}
