// Prisma 7 exposes the generated client through a CommonJS entrypoint.
import prismaClient from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
// Initialize the driver adapter with a connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const { PrismaClient } = prismaClient;
export const prisma = new PrismaClient({ adapter });
//# sourceMappingURL=prisma.js.map