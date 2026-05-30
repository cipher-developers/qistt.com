import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

function getSchemaHash() {
  try {
    return createHash('md5')
      .update(readFileSync(join(process.cwd(), 'prisma/schema.prisma')))
      .digest('hex');
  } catch {
    return 'unknown';
  }
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return url;
  }

  // Neon/PgBouncer poolers cache prepared plans; disable them for Prisma.
  if (url.includes('-pooler') && !url.includes('pgbouncer=true')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}pgbouncer=true`;
  }

  return url;
}

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaSchemaHash?: string;
};

function createPrismaClient() {
  const databaseUrl = getDatabaseUrl();

  return new PrismaClient({
    log: ['warn', 'error'],
    ...(databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : {}),
  });
}

const schemaHash = getSchemaHash();

if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaHash &&
  globalForPrisma.prismaSchemaHash !== schemaHash
) {
  void globalForPrisma.prisma.$disconnect();
  delete globalForPrisma.prisma;
}

export const prisma =
  globalForPrisma.prismaSchemaHash === schemaHash && globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaHash = schemaHash;
}

export default prisma;
