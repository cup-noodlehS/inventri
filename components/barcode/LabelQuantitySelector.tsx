import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CurrentStock } from '@/lib/types';
import { getUnitPadding, safeParseInt } from '@/lib/utils/barcode';

interface LabelQuantitySelectorProps {
  startingUnitNumber: string;
  labelQuantity: string;
  onStartingUnitChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  product: CurrentStock;
  startUnitNum: number;
  quantityNum: number;
  lastUnitNum: number;
  labeledUnitsCount: number;
}

export function LabelQuantitySelector({
  startingUnitNumber,
  labelQuantity,
  onStartingUnitChange,
  onQuantityChange,
  product,
  startUnitNum,
  quantityNum,
  lastUnitNum,
  labeledUnitsCount,
}: LabelQuantitySelectorProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.quantityLabel}>Starting Unit Number:</ThemedText>
      <View style={styles.quantityInputContainer}>
        <TouchableOpacity
          style={[styles.quantityButton, { backgroundColor: tintColor }]}
          onPress={() => {
            const num = Math.max(1, startUnitNum - 1);
            onStartingUnitChange(String(num));
          }}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        <TextInput
          style={[styles.quantityInput, { borderColor: tintColor + '40', color: textColor }]}
          value={startingUnitNumber}
          onChangeText={(text) => {
            if (text === '') {
              onStartingUnitChange('');
              return;
            }
            const num = safeParseInt(text, 1);
            const maxUnit = 9999;
            if (num >= 1 && num <= maxUnit) {
              onStartingUnitChange(text);
            }
          }}
          keyboardType="numeric"
          placeholder="1"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={[styles.quantityButton, { backgroundColor: tintColor }]}
          onPress={() => {
            const num = Math.min(9999, startUnitNum + 1);
            onStartingUnitChange(String(num));
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ThemedText style={styles.quantityLabel}>Generate Labels:</ThemedText>
      <View style={styles.quantityInputContainer}>
        <TouchableOpacity
          style={[styles.quantityButton, { backgroundColor: tintColor }]}
          onPress={() => {
            const qty = Math.max(1, quantityNum - 1);
            onQuantityChange(String(qty));
          }}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        <TextInput
          style={[styles.quantityInput, { borderColor: tintColor + '40', color: textColor }]}
          value={labelQuantity}
          onChangeText={(text) => {
            if (text === '') {
              onQuantityChange('');
              return;
            }
            const num = safeParseInt(text, 1);
            const maxQty = product.quantity_on_hand;
            if (num >= 1 && num <= maxQty) {
              onQuantityChange(text);
            }
          }}
          keyboardType="numeric"
          placeholder="1"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={[styles.quantityButton, { backgroundColor: tintColor }]}
          onPress={() => {
            const qty = Math.min(product.quantity_on_hand, quantityNum + 1);
            onQuantityChange(String(qty));
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.quantityHint}>
        {product.quantity_on_hand} unit{product.quantity_on_hand !== 1 ? 's' : ''} in stock
        {labeledUnitsCount > 0 && (
          <ThemedText style={styles.warningText}>
            {' • '}{labeledUnitsCount} already labeled
          </ThemedText>
        )}
      </ThemedText>
      <ThemedText style={styles.quantityInfo}>
        Will generate units {String(startUnitNum).padStart(getUnitPadding(startUnitNum), '0')} to {String(lastUnitNum).padStart(getUnitPadding(lastUnitNum), '0')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    flex: 1,
    height: 40,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  quantityHint: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  quantityInfo: {
    fontSize: 11,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
});

