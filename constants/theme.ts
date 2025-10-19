import { Platform } from 'react-native';

const tintColorLight = '#6D28D9';
const tintColorDark = '#A78BFA';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F3F4F6',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#1F2937',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
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
