import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { CategoriesView } from "@/components/items/categories-view";

export const metadata = {
  title: "Categories - Kistly",
};

export default async function CategoriesPage() {
  const tenant = await getCurrentTenant();

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant?.id },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <CategoriesView tenantName={tenant?.name} categories={categories} />;
}
