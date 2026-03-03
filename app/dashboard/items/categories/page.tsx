import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-600 mt-1">Manage item categories</p>
        </div>
        <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800">
          <Plus size={18} />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">No categories yet. Create your first category.</p>
          <Button className="mt-4 bg-slate-900 hover:bg-slate-800">Add Category</Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cat._count.items}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(cat.createdAt).toLocaleDateString()}
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
