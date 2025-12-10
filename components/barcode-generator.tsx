import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { BarcodePreview, BarcodeWarnings, LabelQuantitySelector, ProductInfoCard, generateLabelHTML } from '@/components/barcode';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CurrentStock } from '@/lib/types';
import { getUnitPadding, safeParseInt } from '@/lib/utils/barcode';

interface BarcodeGeneratorProps {
  visible: boolean;
  onClose: () => void;
  product?: CurrentStock | null;
  value?: string; // Fallback if product not provided
  type?: 'CODE128' | 'EAN13' | 'EAN8';
  title?: string;
}

export function BarcodeGenerator({
  visible,
  onClose,
  product,
  value,
  type = 'CODE128',
  title = 'Barcode',
}: BarcodeGeneratorProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [downloading, setDownloading] = useState(false);
  const [labelQuantity, setLabelQuantity] = useState<string>('1');
  const [startingUnitNumber, setStartingUnitNumber] = useState<string>('1');
  const [labeledUnitsCount, setLabeledUnitsCount] = useState<number>(0);

  // Get storage key for last generated unit number - memoized with useCallback
  const getLastGeneratedUnitKey = useCallback(() => {
    if (!product) return null;
    return `barcode_last_unit_${product.sku}_${product.volume_ml}`;
  }, [product]);

  // Load last generated unit number when modal opens
  useEffect(() => {
    const loadLastUnitNumber = async () => {
      if (visible && product) {
        try {
          const key = getLastGeneratedUnitKey();
          if (key) {
            const lastUnit = await AsyncStorage.getItem(key);
            if (lastUnit) {
              const lastUnitNum = safeParseInt(lastUnit, 0);
              setLabeledUnitsCount(lastUnitNum);
              const nextUnit = lastUnitNum + 1;
              setStartingUnitNumber(String(nextUnit));
              // Calculate available units for labeling
              const available = product.quantity_on_hand - lastUnitNum;
              if (available > 0) {
                setLabelQuantity(String(Math.min(available, 10)));
              } else {
                setLabelQuantity('1');
              }
            } else {
              setLabeledUnitsCount(0);
              setStartingUnitNumber('1');
              // Default to stock quantity, but cap at reasonable number for printing
              const defaultQty = Math.min(product.quantity_on_hand, 10);
              setLabelQuantity(String(defaultQty));
            }
          }
        } catch (error) {
          console.error('Error loading last unit number:', error);
          setLabeledUnitsCount(0);
          setStartingUnitNumber('1');
          const defaultQty = Math.min(product.quantity_on_hand, 10);
          setLabelQuantity(String(defaultQty));
        }
      } else if (!visible) {
        // Reset all state when modal closes
        setStartingUnitNumber('1');
        setLabelQuantity('1');
        setLabeledUnitsCount(0);
      }
    };
    
    loadLastUnitNumber();
  }, [visible, product, getLastGeneratedUnitKey]);


  // Memoize parsed values to avoid repeated calculations
  const startUnitNum = useMemo(() => safeParseInt(startingUnitNumber, 1), [startingUnitNumber]);
  const quantityNum = useMemo(() => safeParseInt(labelQuantity, 1), [labelQuantity]);
  const lastUnitNum = useMemo(() => startUnitNum + quantityNum - 1, [startUnitNum, quantityNum]);

  // Check if approaching unit number limit
  const approachingLimit = useMemo(() => !!(product && startUnitNum >= 900), [product, startUnitNum]);
  const atLimit = useMemo(() => !!(product && startUnitNum >= 9999), [product, startUnitNum]);

  // Generate unique barcode value: SKU + volume + unit number (e.g., "DIOR-SAUVAGE-100-100ml-001")
  // This ensures each individual unit has a unique barcode
  const getBarcodeValue = useCallback((unitNum?: number): string => {
    const baseValue = product
      ? `${product.sku}-${product.volume_ml}ml`
      : value || '';
    
    if (unitNum !== undefined) {
      const actualUnitNum = startUnitNum + unitNum - 1;
      const padding = getUnitPadding(actualUnitNum);
      // Add unit number with zero padding (001, 002, etc. or 0001, 0002, etc.)
      return `${baseValue}-${String(actualUnitNum).padStart(padding, '0')}`;
    }
    return baseValue;
  }, [product, value, startUnitNum, getUnitPadding]);

  // For preview, show first unit from starting number
  const previewUnitNumber = startUnitNum;
  const previewBarcodeValue = useMemo(() => getBarcodeValue(1), [getBarcodeValue]);
  const barcodeValue = previewBarcodeValue;

  // Determine format for expo-barcode-generator (JSBarcode format names)
  const barcodeFormat = type === 'EAN13' ? 'EAN13' : type === 'EAN8' ? 'EAN8' : 'CODE128';

  // Calculate available units for labeling
  const availableForLabeling = useMemo(() => {
    return product ? Math.max(0, product.quantity_on_hand - labeledUnitsCount) : 0;
  }, [product, labeledUnitsCount]);
  
  // Check if there's a mismatch (stock decreased but labels already generated)
  const hasStockMismatch = useMemo(() => {
    return !!(product && labeledUnitsCount > 0 && product.quantity_on_hand < labeledUnitsCount);
  }, [product, labeledUnitsCount]);
  
  // Check if generating more than available
  const exceedsAvailable = useMemo(() => {
    return product && quantityNum > availableForLabeling;
  }, [product, quantityNum, availableForLabeling]);

  const handleDownload = useCallback(async (skipWarning: boolean = false) => {
    try {
      setDownloading(true);

      const quantity = quantityNum;
      const startUnit = startUnitNum;
      const lastUnit = lastUnitNum;
      const maxQuantity = product ? product.quantity_on_hand : 100;

      // Validation
      if (quantity < 1) {
        Alert.alert('Error', 'Quantity must be at least 1');
        setDownloading(false);
        return;
      }

      if (quantity > maxQuantity) {
        Alert.alert('Error', `Quantity cannot exceed stock quantity (${maxQuantity})`);
        setDownloading(false);
        return;
      }

      if (startUnit < 1) {
        Alert.alert('Error', 'Starting unit number must be at least 1');
        setDownloading(false);
        return;
      }

      if (lastUnit > 9999) {
        Alert.alert('Error', 'Unit numbers cannot exceed 9999');
        setDownloading(false);
        return;
      }

      // Warn if there's a stock mismatch or exceeding available (unless already confirmed)
      if (!skipWarning && (hasStockMismatch || exceedsAvailable)) {
        const message = hasStockMismatch
          ? `Warning: Stock has decreased since labels were generated.\n\n` +
            `Labeled units: ${labeledUnitsCount}\n` +
            `Current stock: ${product?.quantity_on_hand || 0}\n` +
            `Available for labeling: ${availableForLabeling}\n\n` +
            `You're about to generate ${quantity} labels starting from unit #${String(startUnit).padStart(getUnitPadding(startUnit), '0')}.\n\n` +
            `Continue anyway?`
          : `Warning: You're generating ${quantity} labels, but only ${availableForLabeling} units are available for labeling.\n\n` +
            `Labeled units: ${labeledUnitsCount}\n` +
            `Current stock: ${product?.quantity_on_hand || 0}\n\n` +
            `Continue anyway?`;
        
        Alert.alert(
          'Stock Mismatch Warning',
          message,
          [
            { 
              text: 'Cancel', 
              style: 'cancel', 
              onPress: () => {
                setDownloading(false);
              }
            },
            { 
              text: 'Continue', 
              style: 'default',
              onPress: () => {
                // Recursively call with skipWarning flag instead of setTimeout
                handleDownload(true);
              }
            }
          ]
        );
        return;
      }

      // Generate labels data
      const labels = [];
      for (let i = 1; i <= quantity; i++) {
        const unitBarcode = getBarcodeValue(i);
        labels.push({
          barcodeValue: unitBarcode,
          productName: product?.name,
          volumeMl: product?.volume_ml,
        });
      }

      // Generate HTML using the utility function
      const html = generateLabelHTML({
        labels,
        format: barcodeFormat,
        getBarcodeValue,
      });

      // Print the barcode
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save ${quantity} Barcode Label${quantity > 1 ? 's' : ''}`,
        });
        Alert.alert('Success', `${quantity} barcode label${quantity > 1 ? 's' : ''} saved! Each label has a unique unit number.`);
      } else {
        Alert.alert('Success', `Barcode saved to: ${uri}`);
      }

      // Save last generated unit number after successful generation
      const key = getLastGeneratedUnitKey();
      if (key && product && lastUnit > 0) {
        try {
          await AsyncStorage.setItem(key, String(lastUnit));
          setLabeledUnitsCount(lastUnit);
        } catch (storageError) {
          console.error('Error saving last unit number:', storageError);
          // Don't fail the whole operation if storage fails
        }
      }
    } catch (error: unknown) {
      console.error('Error downloading barcode:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save barcode';
      Alert.alert('Error', errorMessage);
    } finally {
      setDownloading(false);
    }
  }, [quantityNum, startUnitNum, lastUnitNum, product, hasStockMismatch, exceedsAvailable, labeledUnitsCount, availableForLabeling, getBarcodeValue, getUnitPadding, barcodeFormat, getLastGeneratedUnitKey]);

  // Early return must come AFTER all hooks
  if (!visible || !barcodeValue) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {product ? `${product.name} (${product.volume_ml}ml)` : title}
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={tintColor} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Product Info */}
            {product && <ProductInfoCard product={product} />}

            {/* Label Quantity Selector */}
            {product && (
              <>
                <LabelQuantitySelector
                  startingUnitNumber={startingUnitNumber}
                  labelQuantity={labelQuantity}
                  onStartingUnitChange={setStartingUnitNumber}
                  onQuantityChange={setLabelQuantity}
                  product={product}
                  startUnitNum={startUnitNum}
                  quantityNum={quantityNum}
                  lastUnitNum={lastUnitNum}
                  labeledUnitsCount={labeledUnitsCount}
                />
                <BarcodeWarnings
                  availableForLabeling={availableForLabeling}
                  hasStockMismatch={hasStockMismatch}
                  approachingLimit={approachingLimit}
                  atLimit={atLimit}
                  labeledUnitsCount={labeledUnitsCount}
                />
              </>
            )}
          </ScrollView>

          {/* Barcode Preview for Label */}
          <BarcodePreview
            barcodeValue={previewBarcodeValue}
            format={barcodeFormat}
            product={product}
            unitNumber={previewUnitNumber}
            quantity={quantityNum}
            startUnitNum={startUnitNum}
            lastUnitNum={lastUnitNum}
          />

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.downloadButton, { backgroundColor: tintColor }]}
              onPress={() => handleDownload(false)}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#fff" />
              )}
              <ThemedText style={styles.actionButtonText}>
                {downloading 
                  ? 'Saving...' 
                  : `Save & Print ${quantityNum > 1 ? `${quantityNum} Labels` : 'Label'}`}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButtonBottom, { borderColor: tintColor }]}
              onPress={onClose}
            >
              <ThemedText style={[styles.closeButtonText, { color: tintColor }]}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  downloadButton: {
    minHeight: 50,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButtonBottom: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
