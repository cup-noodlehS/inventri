import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function CircularTabButton({ children, onPress }: BottomTabBarButtonProps) {
  const colorScheme = useColorScheme();

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
    >
      <View style={[
        styles.circle,
        {
          backgroundColor: Colors[colorScheme ?? 'light'].tint,
          shadowColor: Colors[colorScheme ?? 'light'].tint,
        }
      ]}>
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

