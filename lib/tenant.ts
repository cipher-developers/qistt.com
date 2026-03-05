import prisma from '@/lib/prisma';

export async function getTenantBySubdomain(subdomain: string) {
  if (!subdomain || subdomain === 'www') {
    return null;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logo: true,
        status: true,
      },
    });

    return tenant;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

export function extractSubdomain(hostname: string): string {
  if (!hostname) return '';
  
  const parts = hostname.split('.');
  
  // Handle localhost
  if (hostname.includes('localhost')) {
    return '';
  }

  // For qistt.com, no subdomain = landing page
  if (parts.length === 2) {
    return '';
  }

  // Get first part as subdomain (e.g., 'ar-corp' from 'ar-corp.qistt.com')
  return parts[0];
}
