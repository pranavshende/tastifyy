/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const BrandColors = {
  primary: '#FF7900',
  primaryDark: '#E36D00',
  primaryLight: '#FFE4C2',
  primaryAlpha12: '#FF790020',
  secondary: '#269B24',
  secondaryDark: '#1F7D1D',
  secondaryLight: '#EAF7E8',
  secondaryBorder: '#B2DDA9',
  background: '#FFF5E8',
  backgroundMuted: '#FFF1E4',
  surface: '#FFFFFF',
  border: '#EFE4D7',
  text: '#171717',
  textSecondary: '#555555',
  textMuted: '#777777',
  danger: '#DC2626',
  dangerLight: '#FFF1F2',
  warning: '#D97706',
  info: '#2563EB',
} as const;

export const Colors = {
  light: {
    primary: BrandColors.primary,
    text: BrandColors.text,
    background: BrandColors.background,
    tint: BrandColors.primary,
    icon: BrandColors.textSecondary,
    tabIconDefault: BrandColors.textMuted,
    tabIconSelected: BrandColors.primary,
    card: BrandColors.surface,
    border: BrandColors.border,
    error: BrandColors.danger,
    success: BrandColors.secondary,
    warning: BrandColors.warning,
  },
  dark: {
    primary: BrandColors.primary,
    text: '#ECEDEE',
    background: '#151718',
    tint: BrandColors.primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: BrandColors.primary,
    card: '#1E1E1E',
    border: '#333333',
    error: '#EF4444',
    success: BrandColors.secondary,
    warning: BrandColors.warning,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
