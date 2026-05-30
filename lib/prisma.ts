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

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaSchemaHash?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log: ['warn', 'error'],
  });
}

const schemaHash = getSchemaHash();
const cachedClient =
  globalForPrisma.prismaSchemaHash === schemaHash
    ? globalForPrisma.prisma
    : undefined;

export const prisma = cachedClient ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaHash = schemaHash;
}

export default prisma;
