import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProducts } from '@/lib/api/products';
import { getTransactions, TransactionWithItems } from '@/lib/api/transactions';
import { CurrentStock } from '@/lib/types';
import {
  exportProductsToCSV,
  exportProductsToExcel,
  exportProductsToPDF,
  exportTransactionsToCSV,
  exportTransactionsToExcel,
  exportTransactionsToPDF,
} from '@/lib/utils/exportData';

type ExportFormat = 'excel' | 'csv' | 'pdf';
type ExportScope = 'transactions' | 'products';
type DateRangeOption = '7' | '30' | '60' | 'custom';

const DATE_RANGE_CHOICES: { id: DateRangeOption; label: string }[] = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '60', label: 'Last 60 days' },
  { id: 'custom', label: 'Custom' },
];

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const successColor = useThemeColor({}, 'success');
  const infoColor = useThemeColor({}, 'info');
  const dangerColor = useThemeColor({}, 'danger');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'textMuted');

  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [scope, setScope] = useState<ExportScope>('transactions');
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [{ data: productData, error: productError }, { data: transactionData, error: txError }] =
          await Promise.all([getProducts(), getTransactions(200)]);

        if (productError || txError) {
          console.error('Export data fetch error', productError || txError);
          Alert.alert('Error', 'Unable to load export data. Please try again.');
          return;
        }

        setProducts(productData ?? []);
        setTransactions(transactionData ?? []);
      } catch (error) {
        console.error('Export load error:', error);
        Alert.alert('Error', 'Something went wrong while loading export data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const parsedCustomStart = useMemo(() => parseDateInput(customStartDate), [customStartDate]);
  const parsedCustomEnd = useMemo(() => parseDateInput(customEndDate, true), [customEndDate]);

  const dateBounds = useMemo(() => {
    if (dateRangeOption === 'custom') {
      return {
        start: parsedCustomStart,
        end: parsedCustomEnd,
      };
    }

    const days = Number(dateRangeOption);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, [dateRangeOption, parsedCustomStart, parsedCustomEnd]);

  const customRangeInvalid =
    dateRangeOption === 'custom' &&
    (!dateBounds.start || !dateBounds.end || dateBounds.start > dateBounds.end);

  const filteredTransactions = useMemo(() => {
    if (!dateBounds.start || !dateBounds.end) {
      return transactions;
    }

    return transactions.filter((txn) => {
      const timestamp = new Date(txn.timestamp);
      return timestamp >= dateBounds.start! && timestamp <= dateBounds.end!;
    });
  }, [transactions, dateBounds.start, dateBounds.end]);

  const summaryCount = scope === 'transactions' ? filteredTransactions.length : products.length;

  const handleExport = async (format: ExportFormat) => {
    if (exporting) {
      return;
    }

    if (scope === 'transactions' && filteredTransactions.length === 0) {
      Alert.alert('No data', 'No transactions match the selected date range.');
      return;
    }

    if (scope === 'products' && products.length === 0) {
      Alert.alert('No data', 'No products available to export.');
      return;
    }

    if (dateRangeOption === 'custom' && customRangeInvalid) {
      Alert.alert('Invalid dates', 'Please provide a valid custom date range before exporting.');
      return;
    }

    setExporting(format);

    try {
      let result:
        | Awaited<ReturnType<typeof exportTransactionsToCSV>>
        | Awaited<ReturnType<typeof exportProductsToCSV>>;

      if (scope === 'transactions') {
        if (format === 'csv') {
          result = await exportTransactionsToCSV(filteredTransactions);
        } else if (format === 'excel') {
          result = await exportTransactionsToExcel(filteredTransactions);
        } else {
          result = await exportTransactionsToPDF(filteredTransactions);
        }
      } else {
        if (format === 'csv') {
          result = await exportProductsToCSV(products);
        } else if (format === 'excel') {
          result = await exportProductsToExcel(products);
        } else {
          result = await exportProductsToPDF(products);
        }
      }

      if (!result.success) {
        Alert.alert('Export failed', result.error ?? 'Unable to export data.');
        return;
      }

      Alert.alert('Export complete', 'Your file is ready to share.');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export failed', 'Something went wrong while exporting.');
    } finally {
      setExporting(null);
    }
  };

  const formatButtonDisabled =
    loading || (scope === 'transactions' && (filteredTransactions.length === 0 || customRangeInvalid));

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Export Data
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
            Download your inventory history
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
              Preparing export data...
            </ThemedText>
          </View>
        ) : (
          <>
            <ThemedView style={[styles.scopeCard, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.scopeHeader}>
                <Ionicons name="swap-horizontal-outline" size={20} color={tintColor} />
                <ThemedText type="subtitle" style={styles.scopeTitle}>
                  Dataset
                </ThemedText>
              </View>
              <View style={styles.scopeSwitcher}>
                {(['transactions', 'products'] as ExportScope[]).map((option) => {
                  const isActive = scope === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.scopeChip,
                        {
                          backgroundColor: isActive ? tintColor : 'transparent',
                          borderColor,
                        },
                      ]}
                      onPress={() => setScope(option)}>
                      <ThemedText
                        style={[
                          styles.scopeChipText,
                          {
                            color: isActive ? '#fff' : mutedColor,
                          },
                        ]}>
                        {option === 'transactions' ? 'Transactions' : 'Products'}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ThemedView>

            <ThemedView style={[styles.summaryCard, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="document-text-outline" size={20} color={tintColor} />
                <ThemedText type="subtitle" style={styles.summaryTitle}>
                  {scope === 'transactions' ? 'Transactions' : 'Products'}
                </ThemedText>
              </View>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.summaryValue}>{summaryCount}</ThemedText>
                <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>
                  {scope === 'transactions' ? 'Records in range' : 'Products available'}
                </ThemedText>
              </View>
            </ThemedView>

            {scope === 'transactions' && (
              <ThemedView style={[styles.sectionCard, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Date Range
                </ThemedText>
                <View style={styles.rangeOptions}>
                  {DATE_RANGE_CHOICES.map((option) => {
                    const isActive = dateRangeOption === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.rangeChip,
                          {
                            backgroundColor: isActive ? tintColor : surfaceColor,
                            borderColor,
                          },
                        ]}
                        onPress={() => {
                          setDateRangeOption(option.id);
                          if (option.id !== 'custom') {
                            setCustomStartDate('');
                            setCustomEndDate('');
                          }
                        }}>
                        <ThemedText
                          style={[
                            styles.rangeChipText,
                            {
                              color: isActive ? '#fff' : mutedColor,
                            },
                          ]}>
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {dateRangeOption === 'custom' && (
                  <View style={styles.customRangeInputs}>
                    <View style={styles.dateInputGroup}>
                      <ThemedText style={styles.dateInputLabel}>Start date</ThemedText>
                      <TextInput
                        style={[
                          styles.dateInput,
                          {
                            borderColor,
                            backgroundColor: surfaceColor,
                            color: mutedColor,
                          },
                        ]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={mutedColor}
                        value={customStartDate}
                        onChangeText={setCustomStartDate}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <View style={styles.dateInputGroup}>
                      <ThemedText style={styles.dateInputLabel}>End date</ThemedText>
                      <TextInput
                        style={[
                          styles.dateInput,
                          {
                            borderColor,
                            backgroundColor: surfaceColor,
                            color: mutedColor,
                          },
                        ]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={mutedColor}
                        value={customEndDate}
                        onChangeText={setCustomEndDate}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                )}

                {customRangeInvalid && (
                  <ThemedText style={[styles.rangeError, { color: dangerColor }]}>
                    Please enter a valid date range (start before end).
                  </ThemedText>
                )}
              </ThemedView>
            )}

            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Select Export Format</ThemedText>
              <View style={styles.formatList}>
                {[
                  { id: 'excel', label: 'Excel', color: successColor, icon: 'document-text-outline' },
                  { id: 'csv', label: 'CSV', color: infoColor, icon: 'document-outline' },
                  { id: 'pdf', label: 'PDF', color: dangerColor, icon: 'document-attach-outline' },
                ].map((format) => {
                  const isExporting = exporting === format.id;
                  return (
                    <TouchableOpacity
                      key={format.id}
                      style={[styles.formatButton, { backgroundColor: format.color }]}
                      onPress={() => handleExport(format.id as ExportFormat)}
                      disabled={isExporting || formatButtonDisabled}>
                      <View style={styles.formatContent}>
                        <View style={styles.formatLeft}>
                          <View style={styles.iconCircle}>
                            <Ionicons name={format.icon as any} size={28} color="#fff" />
                          </View>
                          <View style={styles.formatInfo}>
                            <ThemedText style={styles.formatLabel}>{format.label}</ThemedText>
                            <ThemedText style={styles.formatDescription}>
                              {scope === 'transactions' ? 'Filtered transactions' : 'Product catalog'}
                            </ThemedText>
                          </View>
                        </View>
                        {isExporting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="download-outline" size={22} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <ThemedView style={[styles.infoCard, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
              <Ionicons name="information-circle-outline" size={18} color={tintColor} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.infoText}>
                  Exports include product details, quantities, and transaction values. For large ranges,
                  keep the app open until sharing completes.
                </ThemedText>
                <ThemedText style={[styles.infoSubtext, { color: mutedColor }]}>
                  Date filters apply to transactions only.
                </ThemedText>
              </View>
            </ThemedView>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function parseDateInput(value: string, isEndDate = false): Date | null {
  if (!value || value.trim().length < 10) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (isEndDate) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }
  return parsed;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  scopeCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scopeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  scopeTitle: {
    fontSize: 18,
  },
  scopeSwitcher: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scopeChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  scopeChipText: {
    fontWeight: '600',
  },
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: 18,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 48,
    minHeight: 48,
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: Spacing.xs / 2,
  },
  sectionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  rangeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rangeChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  rangeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customRangeInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rangeError: {
    marginTop: Spacing.sm,
    fontSize: 13,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  formatList: {
    gap: Spacing.sm,
  },
  formatButton: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
  },
  formatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatInfo: {
    flex: 1,
  },
  formatLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  formatDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    marginBottom: Spacing.xs / 2,
  },
  infoSubtext: {
    fontSize: 12,
  },
});
