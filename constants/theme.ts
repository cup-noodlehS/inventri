import { Platform } from 'react-native';

const Palette = {
  neutral100: '#FFFFFF',
  neutral150: '#F7F4EF',
  neutral200: '#EFE9E1',
  neutral300: '#E0D8CD',
  neutral400: '#CFC6BA',
  neutral500: '#A3998A',
  neutral600: '#7D7364',
  neutral700: '#5D5549',
  neutral900: '#211E18',
  primary400: '#978EF7',
  primary500: '#7B6EF6',
  primary600: '#5F54D6',
  accent500: '#4CB5AE',
  accent600: '#3B8F89',
  success500: '#43A977',
  warning500: '#C9973B',
  danger500: '#D6675E',
  info500: '#4F8BD8',
  darkSurface: '#1F1B24',
  darkSurfaceAlt: '#2A2531',
  darkBorder: '#3C3544',
};

export const Colors = {
  light: {
    text: Palette.neutral900,
    textMuted: Palette.neutral600,
    background: Palette.neutral150,
    surface: Palette.neutral100,
    surfaceAlt: Palette.neutral200,
    border: Palette.neutral300,
    tint: Palette.primary500,
    tintMuted: Palette.primary400,
    accent: Palette.accent500,
    success: Palette.success500,
    warning: Palette.warning500,
    danger: Palette.danger500,
    info: Palette.info500,
    icon: Palette.neutral600,
    tabIconDefault: Palette.neutral500,
    tabIconSelected: Palette.primary500,
  },
  dark: {
    text: Palette.neutral100,
    textMuted: Palette.neutral400,
    background: '#131116',
    surface: Palette.darkSurface,
    surfaceAlt: Palette.darkSurfaceAlt,
    border: Palette.darkBorder,
    tint: Palette.primary400,
    tintMuted: Palette.primary500,
    accent: Palette.accent500,
    success: Palette.success500,
    warning: Palette.warning500,
    danger: Palette.danger500,
    info: Palette.info500,
    icon: Palette.neutral400,
    tabIconDefault: Palette.neutral500,
    tabIconSelected: Palette.primary400,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const Typography = {
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  bodySemiBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Poppins-Regular',
    serif: 'Poppins-Regular',
    rounded: 'Poppins-Regular',
    mono: 'Poppins-Regular',
  },
  default: {
    sans: 'Poppins-Regular',
    serif: 'Poppins-Regular',
    rounded: 'Poppins-Regular',
    mono: 'Poppins-Regular',
  },
  web: {
    sans: 'Poppins, sans-serif',
    serif: 'Poppins, sans-serif',
    rounded: 'Poppins, sans-serif',
    mono: 'Poppins, sans-serif',
  },
});
