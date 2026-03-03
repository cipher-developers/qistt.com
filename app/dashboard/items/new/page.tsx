import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { ItemForm } from "@/components/items/item-form";

export const metadata = {
  title: "Add Item - Kistly",
};

export default async function NewItemPage() {
  const tenant = await getCurrentTenant();
  
  const categories = await prisma.category.findMany({
    where: { tenantId: tenant?.id },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Add Item</h1>
        <p className="text-slate-600 mt-1">Create a new item in your catalog</p>
      </div>
      <ItemForm tenantId={tenant?.id} categories={categories} />
    </div>
  );
}
