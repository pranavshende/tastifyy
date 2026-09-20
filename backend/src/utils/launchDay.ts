import { prisma } from './prisma.js';

export type LaunchDaySettings = {
  onlinePaymentEnabled: boolean;
  freeDeliveryEnabled: boolean;
  deliveryCharge: number;
  launchDayActive: boolean;
  launchDayEndDate: string;
};

const DEFAULT_LAUNCH_DAY_END_DATE = '2026-09-20';

function indiaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'on';
}

export async function getLaunchDaySettings(): Promise<LaunchDaySettings> {
  const configs = await prisma.adminConfig.findMany({
    where: { key: { in: ['ONLINE_PAYMENT_ENABLED', 'FREE_DELIVERY_ENABLED', 'DELIVERY_BASE_FEE', 'LAUNCH_DAY_END_DATE'] } }
  });
  const values = Object.fromEntries(configs.map(config => [config.key, config.value]));
  const today = indiaDateKey();
  const launchDayEndDate = values.LAUNCH_DAY_END_DATE || process.env.LAUNCH_DAY_END_DATE || DEFAULT_LAUNCH_DAY_END_DATE;
  const launchDayActive = today <= launchDayEndDate;

  return {
    launchDayActive,
    launchDayEndDate,
    onlinePaymentEnabled: launchDayActive
      ? parseBoolean(values.ONLINE_PAYMENT_ENABLED, false)
      : parseBoolean(values.ONLINE_PAYMENT_ENABLED, true),
    freeDeliveryEnabled: launchDayActive
      ? parseBoolean(values.FREE_DELIVERY_ENABLED, true)
      : parseBoolean(values.FREE_DELIVERY_ENABLED, false),
    deliveryCharge: launchDayActive && parseBoolean(values.FREE_DELIVERY_ENABLED, true)
      ? 0
      : Math.max(0, Number(values.DELIVERY_BASE_FEE || 20)),
  };
}
