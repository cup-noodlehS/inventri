import { Barcode } from 'expo-barcode-generator';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CurrentStock } from '@/lib/types';
import { getUnitPadding } from '@/lib/utils/barcode';

interface BarcodePreviewProps {
  barcodeValue: string;
  format: string;
  product?: CurrentStock | null;
  unitNumber: number;
  quantity: number;
  startUnitNum: number;
  lastUnitNum: number;
}

export function BarcodePreview({
  barcodeValue,
  format,
  product,
  unitNumber,
  quantity,
  startUnitNum,
  lastUnitNum,
}: BarcodePreviewProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.previewLabel}>
        Label Preview (Unit #{String(unitNumber).padStart(getUnitPadding(unitNumber), '0')}):
      </ThemedText>
      <View style={styles.barcodeContainer}>
        <View style={styles.barcodeWrapper}>
          <Barcode
            value={barcodeValue}
            options={{
              format,
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 8,
              textAlign: 'center',
              textPosition: 'bottom',
              textMargin: 3,
              background: '#ffffff',
              lineColor: '#000000',
            }}
          />
        </View>
        {product && (
          <View style={styles.productInfo}>
            <ThemedText style={styles.productName} numberOfLines={1}>
              {product.name}
            </ThemedText>
            <ThemedText style={styles.productVolume}>
              {product.volume_ml}ml
            </ThemedText>
          </View>
        )}
      </View>
      {quantity > 1 && (
        <ThemedText style={styles.previewNote}>
          {quantity} labels will be generated ({String(startUnitNum).padStart(getUnitPadding(startUnitNum), '0')}-{String(lastUnitNum).padStart(getUnitPadding(lastUnitNum), '0')})
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 8,
    fontWeight: '600',
  },
  barcodeContainer: {
    width: '100%',
    maxWidth: 200,
    alignItems: 'center',
    overflow: 'hidden',
  },
  barcodeWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
    maxHeight: 80,
  },
  productInfo: {
    alignItems: 'center',
    width: '100%',
  },
  productName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  productVolume: {
    fontSize: 9,
    opacity: 0.7,
    textAlign: 'center',
  },
  previewNote: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

