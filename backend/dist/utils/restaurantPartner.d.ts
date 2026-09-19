type PartnerIdentity = {
    phone?: string | null;
    email?: string | null;
};
export declare function findRestaurantPartner(user: PartnerIdentity): Promise<any>;
export declare function findRestaurantPartnerUser(user: PartnerIdentity): Promise<{
    partner: any;
    user: any;
}>;
export declare function findRestaurantUserByRestaurantId(restaurantId: string): Promise<any>;
export {};
//# sourceMappingURL=restaurantPartner.d.ts.map