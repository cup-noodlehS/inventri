import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface BarcodeWarningsProps {
  availableForLabeling: number;
  hasStockMismatch: boolean;
  approachingLimit: boolean;
  atLimit: boolean;
  labeledUnitsCount: number;
}

export function BarcodeWarnings({
  availableForLabeling,
  hasStockMismatch,
  approachingLimit,
  atLimit,
  labeledUnitsCount,
}: BarcodeWarningsProps) {
  return (
    <>
      {availableForLabeling >= 0 && (
        <ThemedText style={[styles.quantityInfo, availableForLabeling === 0 && styles.warningText]}>
          Available for labeling: {availableForLabeling} unit{availableForLabeling !== 1 ? 's' : ''}
        </ThemedText>
      )}
      {hasStockMismatch && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color="#EF4444" />
          <ThemedText style={styles.warningText}>
            Stock decreased since labels were generated. Some labeled units may have been sold.
          </ThemedText>
        </View>
      )}
      {approachingLimit && !atLimit && (
        <View style={[styles.warningContainer, styles.infoWarningContainer]}>
          <Ionicons name="information-circle" size={16} color="#FBBF24" />
          <ThemedText style={[styles.warningText, styles.infoWarningText]}>
            Approaching unit number limit. Format will switch to 4 digits (0001+) at unit 1000.
          </ThemedText>
        </View>
      )}
      {atLimit && (
        <View style={styles.warningContainer}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <ThemedText style={styles.warningText}>
            Maximum unit number reached (9999). Cannot generate more labels for this product.
          </ThemedText>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  quantityInfo: {
    fontSize: 11,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  infoWarningContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warningText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  infoWarningText: {
    color: '#FBBF24',
  },
});

