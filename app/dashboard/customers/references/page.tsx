import { getCurrentTenant } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { ReferencesView } from "@/components/customers/references-view";

export const metadata = {
  title: "References - Kistly",
};

export default async function ReferencesPage() {
  const tenant = await getCurrentTenant();

  const references = await prisma.reference.findMany({
    where: { tenantId: tenant?.id },
    include: { _count: { select: { customers: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <ReferencesView tenantName={tenant?.name} references={references} />;
}
