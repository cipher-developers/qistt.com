import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user;
}

export async function getCurrentTenant() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: (session.user as any).tenantId },
  });

  return tenant;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireTenant() {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    redirect("/login");
  }
  return tenant;
}
