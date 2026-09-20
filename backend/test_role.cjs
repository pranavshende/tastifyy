const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRoleIsolation() {
  const adminPhone = '+910000000001';
  try {
    await prisma.user.upsert({
      where: { phone: adminPhone },
      update: { role: 'admin' },
      create: {
        id: 'test-admin-id-1234',
        email: 'admin_test@tastifyy.app',
        name: 'Admin Tester',
        phone: adminPhone,
        role: 'admin'
      }
    });
    console.log('Fake admin created.');

    const res = await fetch('http://localhost:5000/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: adminPhone, role: 'customer' })
    });
    
    const data = await res.json();
    console.log('OTP Request Result for Admin Phone:', data);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleIsolation().catch(console.error);
