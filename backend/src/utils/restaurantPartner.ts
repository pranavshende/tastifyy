import { prisma } from './prisma.js';

type PartnerIdentity = {
  phone?: string | null;
  email?: string | null;
};

export async function findRestaurantPartner(user: PartnerIdentity) {
  const identities = [
    ...(user.phone ? [{ phone: user.phone }] : []),
    ...(user.email ? [{ email: user.email }] : []),
  ];

  if (identities.length === 0) return null;

  return prisma.restaurantPartner.findFirst({
    where: { is_active: true, OR: identities },
    include: { restaurant: true },
  });
}
