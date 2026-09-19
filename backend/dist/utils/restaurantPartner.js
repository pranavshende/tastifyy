import { prisma } from './prisma.js';
export async function findRestaurantPartner(user) {
    const identities = [
        ...(user.phone ? [{ phone: user.phone }] : []),
        ...(user.email ? [{ email: user.email }] : []),
    ];
    if (identities.length === 0)
        return null;
    return prisma.restaurantPartner.findFirst({
        where: { is_active: true, OR: identities },
        include: { restaurant: true },
    });
}
export async function findRestaurantPartnerUser(user) {
    const partner = await findRestaurantPartner(user);
    if (!partner)
        return null;
    const partnerUser = await prisma.user.findFirst({
        where: {
            role: 'restaurant_partner',
            OR: [
                { id: partner.id },
                ...(partner.phone ? [{ phone: partner.phone }] : []),
                ...(partner.email ? [{ email: partner.email }] : []),
            ],
        },
    });
    return partnerUser ? { partner, user: partnerUser } : { partner, user: null };
}
export async function findRestaurantUserByRestaurantId(restaurantId) {
    const partner = await prisma.restaurantPartner.findFirst({
        where: { restaurant_id: restaurantId, is_active: true },
    });
    if (!partner)
        return null;
    return prisma.user.findFirst({
        where: {
            role: 'restaurant_partner',
            OR: [
                ...(partner.phone ? [{ phone: partner.phone }] : []),
                ...(partner.email ? [{ email: partner.email }] : []),
            ],
        },
    });
}
//# sourceMappingURL=restaurantPartner.js.map