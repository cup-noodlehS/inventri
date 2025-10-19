import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { transactions } from '@/data/transactions';
import { useThemeColor } from '@/hooks/use-theme-color';

type ExportFormat = 'excel' | 'csv' | 'pdf';

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');

  const exportFormats = [
    { 
      id: 'excel', 
      label: 'Excel', 
      extension: '.xlsx', 
      icon: 'document-text-outline',
      color: '#10B981',
      description: 'Best for data analysis'
    },
    { 
      id: 'csv', 
      label: 'CSV', 
      extension: '.csv', 
      icon: 'document-outline',
      color: '#3B82F6',
      description: 'Universal spreadsheet format'
    },
    { 
      id: 'pdf', 
      label: 'PDF', 
      extension: '.pdf', 
      icon: 'document-attach-outline',
      color: '#EF4444',
      description: 'Ready for printing'
    },
  ];

  const handleExport = (format: ExportFormat) => {
    const formatLabel = exportFormats.find(f => f.id === format)?.label;
    
    Alert.alert(
      'Export Successful! 🎉',
      `Transaction data exported to ${formatLabel} format\n\nFile saved to Downloads folder.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Export Data</ThemedText>
          <ThemedText style={styles.subtitle}>Download transaction history</ThemedText>
        </View>

        {/* Transaction Summary */}
        <ThemedView style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="document-text-outline" size={24} color={tintColor} />
            <ThemedText type="subtitle" style={styles.summaryTitle}>Transactions</ThemedText>
          </View>
          <View style={styles.summaryContent}>
            <ThemedText style={styles.summaryValue}>{transactions.length}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Total Records</ThemedText>
          </View>
        </ThemedView>

        {/* Export Format Buttons */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Select Export Format</ThemedText>
          <View style={styles.formatList}>
            {exportFormats.map((format) => (
              <TouchableOpacity
                key={format.id}
                style={[styles.formatButton, { backgroundColor: format.color }]}
                onPress={() => handleExport(format.id as ExportFormat)}
                activeOpacity={0.8}
              >
                <View style={styles.formatContent}>
                  <View style={styles.formatLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={format.icon as any} size={32} color="#fff" />
                    </View>
                    <View style={styles.formatInfo}>
                      <ThemedText style={styles.formatLabel}>
                        {format.label}
                      </ThemedText>
                      <ThemedText style={styles.formatDescription}>
                        {format.extension} • {format.description}
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons name="download-outline" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <ThemedView style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={tintColor} />
          <ThemedText style={styles.infoText}>
            Export includes all transaction records with product details, quantities, dates, and types.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryCard: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  formatList: {
    gap: 12,
  },
  formatButton: {
    borderRadius: 12,
    padding: 20,
  },
  formatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatInfo: {
    flex: 1,
  },
  formatLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formatDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.7,
    flex: 1,
  },
});
