import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding default admin user...');

    // Create default tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'default' },
      update: {},
      create: {
        name: 'Default Tenant',
        slug: 'default',
        email: 'admin@kistly.local',
      },
    });

    console.log(`Tenant created/found: ${tenant.name}`);

    // Hash password
    const hashedPassword = await hash('admin123', 12);

    // Create default admin user
    const user = await prisma.user.upsert({
      where: { email: 'admin@kistly.local' },
      update: {},
      create: {
        email: 'admin@kistly.local',
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    });

    console.log(`Admin user created/found: ${user.email}`);
    console.log('\n--- LOGIN CREDENTIALS ---');
    console.log('Email: admin@kistly.local');
    console.log('Password: admin123');
    console.log('--- END CREDENTIALS ---\n');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
