import { execSync } from 'child_process';

console.log('[v0] Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('[v0] Prisma client generated successfully');
} catch (error) {
  console.error('[v0] Failed to generate Prisma client:', error.message);
  process.exit(1);
}

console.log('[v0] Running seed script...');
try {
  execSync('node /vercel/share/v0-project/scripts/seed-admin.js', { stdio: 'inherit' });
  console.log('[v0] Seed script completed successfully');
} catch (error) {
  console.error('[v0] Failed to run seed script:', error.message);
  process.exit(1);
}
