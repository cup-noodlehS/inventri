import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export function Tabs({ tabs, activeTab, onTabPress }) {
  return (
    <View style={styles.tabsContainer}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onTabPress(tab)}
        >
          <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#eee',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6D28D9',
  },
  tabText: {
    color: '#666',
  },
  activeTabText: {
    color: '#6D28D9',
  },
});
