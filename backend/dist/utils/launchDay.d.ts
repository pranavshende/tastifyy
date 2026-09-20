export type LaunchDaySettings = {
    onlinePaymentEnabled: boolean;
    freeDeliveryEnabled: boolean;
    deliveryCharge: number;
    launchDayActive: boolean;
    launchDayEndDate: string;
};
export declare function getLaunchDaySettings(): Promise<LaunchDaySettings>;
//# sourceMappingURL=launchDay.d.ts.map