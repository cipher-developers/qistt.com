import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { ItemsView } from "@/components/items/items-view";

export const metadata = {
  title: "Items - Kistly",
};

export default async function ItemsPage() {
  const tenant = await getCurrentTenant();

  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      where: { tenantId: tenant?.id },
      include: {
        category: true,
        purchases: {
          select: {
            quantity: true,
            consumedQty: true,
          },
        },
        _count: { select: { installmentPlans: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { tenantId: tenant?.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ItemsView
      tenantId={tenant?.id}
      tenantName={tenant?.name}
      items={items}
      categories={categories}
    />
  );
}
