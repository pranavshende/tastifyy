import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

dotenv.config();

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const phone = String(process.env.ADMIN_PHONE || '').trim();
const confirmed = process.env.CONFIRM_ADMIN_SYNC === 'YES';

if (!email || !password || !process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !process.env.DATABASE_URL) {
  throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD, Supabase credentials, and DATABASE_URL are required.');
}
if (!confirmed) throw new Error('Dry run only. Set CONFIRM_ADMIN_SYNC=YES to apply the admin credential sync.');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  let authUser: { id: string; email?: string | null } | null = null;
  let page = 1;
  while (!authUser) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    authUser = data.users.find(user => user.email?.toLowerCase() === email) || null;
    if (data.users.length < 1000) break;
    page += 1;
  }

  if (authUser) {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
      email,
      email_confirm: true
    });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error || !data.user) throw error || new Error('Supabase admin user was not created.');
    authUser = { id: data.user.id, email: data.user.email };
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail && existingByEmail.id !== authUser.id) {
    throw new Error('Local profile email belongs to a different user ID. No local profile was changed.');
  }

  const existingById = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existingById) {
    await prisma.user.update({
      where: { id: authUser.id },
      data: { email, role: 'admin', is_active: true }
    });
  } else {
    if (!phone) throw new Error('ADMIN_PHONE is required when creating a missing local admin profile.');
    const existingByPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingByPhone) throw new Error('ADMIN_PHONE belongs to another local user. No local profile was changed.');
    await prisma.user.create({
      data: { id: authUser.id, email, phone, name: process.env.ADMIN_NAME || 'Tastifyy Admin', role: 'admin', is_active: true }
    });
  }

  console.log(`Admin credentials synchronized for ${email}. Password was not written to source control.`);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
