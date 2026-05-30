import prisma from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/auth-helper";
import { VendorsView } from "@/components/vendors/vendors-view";

export const metadata = {
  title: "Vendors - Kistly",
};

export default async function VendorsPage() {
  const tenant = await getCurrentTenant();

  const vendors = await prisma.vendor.findMany({
    where: { tenantId: tenant?.id },
    include: {
      _count: {
        select: {
          purchases: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <VendorsView vendors={vendors} />;
}
