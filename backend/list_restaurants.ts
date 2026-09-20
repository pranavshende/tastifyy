import { prisma } from './src/utils/prisma.ts';
async function main() {
  const restaurants = await prisma.restaurant.findMany({ select: { id: true, name: true, email: true, phone: true } });
  console.log(JSON.stringify(restaurants, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
