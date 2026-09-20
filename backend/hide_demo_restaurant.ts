import { prisma } from './src/utils/prisma.ts';
async function main() {
  const result = await prisma.restaurant.updateMany({
    where: { email: 'restaurant@gmail.com' },
    data: { 
      approval_status: 'suspended',
      visibility_status: 'hidden'
    }
  });
  console.log("Updated demo restaurant:", result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
