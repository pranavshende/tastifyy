import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const execute = process.argv.includes('--execute');
const confirmation = process.env.CONFIRM_PRODUCTION_RESET;
const databaseUrl = process.env.DATABASE_URL;

if (!execute || confirmation !== 'YES') {
  console.log('Dry run only. Review the target DATABASE_URL, then set CONFIRM_PRODUCTION_RESET=YES and pass --execute.');
  process.exit(0);
}
if (!databaseUrl) throw new Error('DATABASE_URL is required. Refusing to continue.');

const backupDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
mkdirSync(backupDir, { recursive: true });
const backupPath = join(backupDir, `tastifyy-before-launch-reset-${new Date().toISOString().replaceAll(':', '-')}.dump`);

console.log(`Creating database backup at ${backupPath}`);
execFileSync('pg_dump', ['--format=custom', '--file', backupPath, databaseUrl], { stdio: 'inherit' });

const { PrismaClient } = await import('@prisma/client');
const { PrismaPg } = await import('@prisma/adapter-pg');
const { default: pg } = await import('pg');
const pool = new pg.Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const [orders, assignments, notifications, auditLogs, tickets] = await Promise.all([
    prisma.order.count(),
    prisma.deliveryAssignment.count(),
    prisma.notification.count(),
    prisma.adminAuditLog.count(),
    prisma.supportTicket.count()
  ]);
  console.log(JSON.stringify({ orders, assignments, notifications, auditLogs, tickets }, null, 2));
  console.log('Preserved: users, restaurants, menus, partner profiles, coupons, admin_config, payment gateway configuration, and schema/migrations.');

  await prisma.$transaction(async tx => {
    await tx.rating.deleteMany();
    await tx.supportTicket.deleteMany();
    await tx.couponRedemption.deleteMany();
    await tx.deliveryAssignment.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.notification.deleteMany();
    await tx.adminAuditLog.deleteMany();
  });

  console.log('Launch reset complete. No users, restaurants, roles, menus, coupons, admin config, schema, or migrations were deleted.');
} finally {
  await prisma.$disconnect();
  await pool.end();
}
