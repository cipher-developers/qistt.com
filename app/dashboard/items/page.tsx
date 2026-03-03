import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

export const metadata = {
  title: "Items - Kistly",
};

export default async function ItemsPage() {
  const tenant = await getCurrentTenant();
  
  const items = await prisma.item.findMany({
    where: { tenantId: tenant?.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Items</h1>
          <p className="text-slate-600 mt-1">Manage your items catalog</p>
        </div>
        <Link href="/dashboard/items/new">
          <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800">
            <Plus size={18} />
            Add Item
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">No items yet. Start by adding your first item.</p>
          <Link href="/dashboard/items/new">
            <Button className="mt-4 bg-slate-900 hover:bg-slate-800">Add Item</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">SKU</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.category?.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">${item.sellingPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.sku || "-"}</td>
                    <td className="px-6 py-4 text-sm space-x-2 flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit size={16} />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
