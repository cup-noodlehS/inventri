import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getInventoryLedger } from '@/lib/api/transactions';
import { InventoryLedger } from '@/lib/types';
import { exportInventoryLedgerToCSV, exportInventoryLedgerToExcel, exportInventoryLedgerToPDF } from '@/lib/utils/exportData';

type ExportFormat = 'excel' | 'csv' | 'pdf';
type DateRangePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');

  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('month');
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [ledgerData, setLedgerData] = useState<InventoryLedger[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const datePresets = [
    { id: 'today' as DateRangePreset, label: 'Today', icon: 'today-outline' },
    { id: 'week' as DateRangePreset, label: 'This Week', icon: 'calendar-outline' },
    { id: 'month' as DateRangePreset, label: 'This Month', icon: 'calendar-outline' },
    { id: 'year' as DateRangePreset, label: 'This Year', icon: 'calendar-outline' },
    { id: 'custom' as DateRangePreset, label: 'Custom Range', icon: 'options-outline' },
  ];

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

  useEffect(() => {
    fetchLedgerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const { data, error } = await getInventoryLedger(startDate, endDate);

      if (error) {
        console.error('Error fetching ledger:', error);
        Alert.alert('Error', 'Failed to load inventory ledger data.');
        return;
      }

      if (data) {
        setLedgerData(data);
      }
    } catch (error) {
      console.error('Error in fetchLedgerData:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    const now = new Date();

    switch (preset) {
      case 'today':
        setStartDate(startOfDay(now));
        setEndDate(startOfDay(now));
        break;
      case 'week':
        setStartDate(startOfWeek(now));
        setEndDate(endOfWeek(now));
        break;
      case 'month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'year':
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
      case 'custom':
        // Keep current dates
        break;
    }
  };

  const handleExport = async (formatType: ExportFormat) => {
    if (ledgerData.length === 0) {
      Alert.alert('No Data', 'There is no inventory data to export for the selected date range.');
      return;
    }

    try {
      setExporting(true);
      let result;

      switch (formatType) {
        case 'csv':
          result = await exportInventoryLedgerToCSV(ledgerData, startDate, endDate);
          break;
        case 'excel':
          result = await exportInventoryLedgerToExcel(ledgerData, startDate, endDate);
          break;
        case 'pdf':
          result = await exportInventoryLedgerToPDF(ledgerData, startDate, endDate);
          break;
      }

      if (result.success) {
        Alert.alert('Success', `Inventory ledger exported to ${formatType.toUpperCase()} format successfully!`);
      } else {
        Alert.alert('Export Failed', result.error || 'Failed to export data.');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Error', error?.message || 'An unexpected error occurred during export.');
    } finally {
      setExporting(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      setSelectedPreset('custom');
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      setSelectedPreset('custom');
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Export Data</ThemedText>
          <ThemedText style={styles.subtitle}>Inventory ledger export</ThemedText>
        </View>

        {/* Date Range Presets */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Select Date Range</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {datePresets.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetButton,
                  selectedPreset === preset.id && { backgroundColor: tintColor, borderColor: tintColor }
                ]}
                onPress={() => handlePresetChange(preset.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={preset.icon as any}
                  size={18}
                  color={selectedPreset === preset.id ? '#fff' : tintColor}
                />
                <ThemedText
                  style={[
                    styles.presetText,
                    selectedPreset === preset.id && styles.presetTextActive
                  ]}
                >
                  {preset.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Custom Date Pickers */}
        {selectedPreset === 'custom' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Custom Date Range</ThemedText>
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: tintColor + '40' }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={tintColor} />
                <View style={styles.dateButtonText}>
                  <ThemedText style={styles.dateLabel}>Start Date</ThemedText>
                  <ThemedText style={styles.dateValue}>{format(startDate, 'MMM dd, yyyy')}</ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateButton, { borderColor: tintColor + '40' }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={tintColor} />
                <View style={styles.dateButtonText}>
                  <ThemedText style={styles.dateLabel}>End Date</ThemedText>
                  <ThemedText style={styles.dateValue}>{format(endDate, 'MMM dd, yyyy')}</ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Summary Card */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={{ marginTop: 16 }}>Loading ledger data...</ThemedText>
          </View>
        ) : (
          <ThemedView style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="document-text-outline" size={24} color={tintColor} />
              <ThemedText type="subtitle" style={styles.summaryTitle}>Ledger Summary</ThemedText>
            </View>
            <View style={styles.summaryContent}>
              <ThemedText style={styles.summaryValue}>{ledgerData.length}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Products in Ledger</ThemedText>
            </View>
            <View style={styles.dateRangeInfo}>
              <ThemedText style={styles.dateRangeText}>
                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {/* Export Format Buttons */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Select Export Format</ThemedText>
          <View style={styles.formatList}>
            {exportFormats.map((formatOption) => (
              <TouchableOpacity
                key={formatOption.id}
                style={[styles.formatButton, { backgroundColor: formatOption.color }]}
                onPress={() => handleExport(formatOption.id as ExportFormat)}
                activeOpacity={0.8}
                disabled={exporting || loading}
              >
                <View style={styles.formatContent}>
                  <View style={styles.formatLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={formatOption.icon as any} size={32} color="#fff" />
                    </View>
                    <View style={styles.formatInfo}>
                      <ThemedText style={styles.formatLabel}>
                        {formatOption.label}
                      </ThemedText>
                      <ThemedText style={styles.formatDescription}>
                        {formatOption.extension} • {formatOption.description}
                      </ThemedText>
                    </View>
                  </View>
                  {exporting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name="download-outline" size={24} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <ThemedView style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={tintColor} />
          <ThemedText style={styles.infoText}>
            Export includes inventory ledger with columns: Product | ML | Beg Inv | Deliveries | Sales | End Inv | Value
          </ThemedText>
        </ThemedView>
      </ScrollView>

      {/* Date Pickers */}
      {showStartPicker && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select Start Date</ThemedText>
                <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                  <Ionicons name="close" size={24} color={tintColor} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartDateChange}
                maximumDate={endDate}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.doneButton, { backgroundColor: tintColor }]}
                  onPress={() => setShowStartPicker(false)}
                >
                  <ThemedText style={styles.doneButtonText}>Done</ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>
          </View>
        </Modal>
      )}

      {showEndPicker && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Select End Date</ThemedText>
                <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                  <Ionicons name="close" size={24} color={tintColor} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndDateChange}
                minimumDate={startDate}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.doneButton, { backgroundColor: tintColor }]}
                  onPress={() => setShowEndPicker(false)}
                >
                  <ThemedText style={styles.doneButtonText}>Done</ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>
          </View>
        </Modal>
      )}
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
  presetScroll: {
    flexDirection: 'row',
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    marginRight: 10,
    gap: 6,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#fff',
  },
  datePickerContainer: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
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
    marginBottom: 12,
    width: '100%',
    paddingHorizontal: 24,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  dateRangeInfo: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dateRangeText: {
    fontSize: 13,
    opacity: 0.7,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.7,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
