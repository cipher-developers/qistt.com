#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runMigration() {
  try {
    console.log('Generating Prisma Client...');
    await execPromise('npx prisma generate');
    
    console.log('Running database migration...');
    await execPromise('npx prisma migrate deploy');
    
    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
