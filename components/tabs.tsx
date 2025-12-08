import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type TabsProps = {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
};

function TabsComponent({ tabs, activeTab, onTabPress }: TabsProps) {
  const frameColor = useThemeColor({}, 'surfaceAlt');
  const borderColor = useThemeColor({}, 'border');
  const activeTint = useThemeColor({}, 'tint');
  const textMuted = useThemeColor({}, 'textMuted');
  const surface = useThemeColor({}, 'surface');

  return (
    <View style={[styles.tabsContainer, { backgroundColor: frameColor, borderColor }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? surface : 'transparent',
                borderColor: isActive ? activeTint : 'transparent',
              },
            ]}
            onPress={() => onTabPress(tab)}>
            <ThemedText
              style={[
                styles.tabText,
                {
                  color: isActive ? activeTint : textMuted,
                },
              ]}>
              {tab}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const Tabs = memo(TabsComponent);

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
