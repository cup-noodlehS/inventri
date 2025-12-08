import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type ViewVariant = 'background' | 'surface' | 'surfaceAlt' | 'transparent';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: ViewVariant;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'background',
  ...otherProps
}: ThemedViewProps) {
  const paletteKey = variant === 'surface' || variant === 'surfaceAlt' ? variant : 'background';
  const themedColor = useThemeColor({ light: lightColor, dark: darkColor }, paletteKey as any);
  const backgroundColor = variant === 'transparent' ? 'transparent' : themedColor;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
