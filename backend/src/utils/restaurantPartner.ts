import { prisma } from './prisma.js';

type PartnerIdentity = {
  id?: string | null;
  phone?: string | null;
  email?: string | null;
};

export async function findRestaurantPartner(user: PartnerIdentity) {
  if (!user.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, phone: true, email: true, role: true }
  });
  if (!dbUser || dbUser.role !== 'restaurant_partner') return null;

  const candidates = await prisma.restaurantPartner.findMany({
    where: {
      is_active: true,
      OR: [
        { phone: dbUser.phone },
        ...(dbUser.email ? [{ email: dbUser.email }] : [])
      ]
    },
    include: { restaurant: true }
  });

  const exactMatches = candidates.filter(partner => {
    const phoneMatches = partner.phone === dbUser.phone;
    const emailConflicts = Boolean(dbUser.email && partner.email && partner.email !== dbUser.email);
    return phoneMatches && !emailConflicts;
  });
  if (exactMatches.length !== 1) {
    if (exactMatches.length > 1) {
      console.warn(`[ProfileIdentity] Ambiguous restaurant partner mapping for user ${dbUser.id}`);
    }
    return null;
  }
  return exactMatches[0];
}

export async function findRestaurantPartnerUser(user: PartnerIdentity) {
  const partner = await findRestaurantPartner(user);
  if (!partner) return null;
  const partnerUser = await prisma.user.findUnique({ where: { id: user.id as string } });
  return partnerUser ? { partner, user: partnerUser } : null;
}

export async function findRestaurantUserByRestaurantId(restaurantId: string) {
  const partner = await prisma.restaurantPartner.findFirst({
    where: { restaurant_id: restaurantId, is_active: true },
  });
  if (!partner) return null;

  const users = await prisma.user.findMany({
    where: {
      role: 'restaurant_partner',
      OR: [
        ...(partner.phone ? [{ phone: partner.phone }] : []),
        ...(partner.email ? [{ email: partner.email }] : []),
      ],
    },
  });
  if (users.length !== 1) {
    if (users.length > 1) console.warn(`[ProfileIdentity] Ambiguous restaurant user mapping for restaurant ${restaurantId}`);
    return null;
  }
  return users[0];
}
