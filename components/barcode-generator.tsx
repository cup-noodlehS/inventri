import { Ionicons } from '@expo/vector-icons';
import { Barcode } from 'expo-barcode-generator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CurrentStock } from '@/lib/types';

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

  // Reset quantity when modal opens/closes or product changes
  useEffect(() => {
    if (visible && product) {
      // Default to stock quantity, but cap at reasonable number for printing
      const defaultQty = Math.min(product.quantity_on_hand, 10);
      setLabelQuantity(String(defaultQty));
    } else if (!visible) {
      setLabelQuantity('1');
    }
  }, [visible, product]);

  // Generate unique barcode value: SKU + volume + unit number (e.g., "DIOR-SAUVAGE-100-100ml-001")
  // This ensures each individual unit has a unique barcode
  const getBarcodeValue = (unitNum?: number) => {
    const baseValue = product
      ? `${product.sku}-${product.volume_ml}ml`
      : value || '';
    
    if (unitNum !== undefined) {
      // Add unit number with zero padding (001, 002, etc.)
      return `${baseValue}-${String(unitNum).padStart(3, '0')}`;
    }
    return baseValue;
  };

  // For preview, show first unit (001)
  const previewBarcodeValue = getBarcodeValue(1);
  const barcodeValue = previewBarcodeValue;

  if (!visible || !barcodeValue) return null;

  // Determine format for expo-barcode-generator (JSBarcode format names)
  const barcodeFormat = type === 'EAN13' ? 'EAN13' : type === 'EAN8' ? 'EAN8' : 'CODE128';

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const quantity = parseInt(labelQuantity) || 1;
      const maxQuantity = product ? product.quantity_on_hand : 100;

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

      // Generate HTML for printing multiple labels
      const labels = [];
      for (let i = 1; i <= quantity; i++) {
        const unitBarcode = getBarcodeValue(i);
        labels.push(`
          <div class="label-page">
            <div class="barcode-container">
              ${product ? `<div class="product-info">${product.name}<br>${product.volume_ml}ml</div>` : ''}
              <svg id="barcode-svg-${i}" width="100%" height="60"></svg>
              <div class="barcode-value">${unitBarcode}</div>
            </div>
          </div>
        `);
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page {
                size: 2in 1in;
                margin: 0.1in;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              .label-page {
                page-break-after: always;
                width: 2in;
                height: 1in;
                padding: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
              }
              .label-page:last-child {
                page-break-after: auto;
              }
              .barcode-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
              }
              .product-info {
                text-align: center;
                margin-bottom: 4px;
                font-size: 10px;
                font-weight: bold;
              }
              .barcode-value {
                text-align: center;
                margin-top: 4px;
                font-size: 9px;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            ${labels.join('')}
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
            <script>
              ${labels.map((_, i) => {
                const barcodeVal = getBarcodeValue(i + 1);
                // Escape any special characters in the barcode value for JavaScript
                const escapedValue = barcodeVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
                return `
                try {
                  JsBarcode("#barcode-svg-${i + 1}", "${escapedValue}", {
                    format: "${barcodeFormat}",
                    width: 2,
                    height: 50,
                    displayValue: false,
                    background: "#ffffff",
                    lineColor: "#000000",
                    valid: function(valid) {
                      if (!valid) {
                        console.error("Invalid barcode value for label ${i + 1}: ${escapedValue}");
                      }
                    }
                  });
                } catch (e) {
                  console.error("Error generating barcode ${i + 1}:", e);
                }
              `;
              }).join('')}
            </script>
          </body>
        </html>
      `;

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
    } catch (error: any) {
      console.error('Error downloading barcode:', error);
      Alert.alert('Error', error?.message || 'Failed to save barcode');
    } finally {
      setDownloading(false);
    }
  };

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
            {product && (
              <View style={styles.productInfoContainer}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <ThemedText style={styles.productDetails}>
                  SKU: {product.sku} • {product.volume_ml}ml • ₱{product.price.toFixed(2)}
                </ThemedText>
              </View>
            )}


            {/* Label Quantity Selector */}
            {product && (
              <View style={styles.quantityContainer}>
                <ThemedText style={styles.quantityLabel}>Generate Labels:</ThemedText>
                <View style={styles.quantityInputContainer}>
                  <TouchableOpacity
                    style={[styles.quantityButton, { backgroundColor: tintColor }]}
                    onPress={() => {
                      const qty = Math.max(1, parseInt(labelQuantity) - 1);
                      setLabelQuantity(String(qty));
                    }}
                  >
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.quantityInput, { borderColor: tintColor + '40', color: textColor }]}
                    value={labelQuantity}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      const maxQty = product.quantity_on_hand;
                      if (text === '' || (num >= 1 && num <= maxQty)) {
                        setLabelQuantity(text);
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    style={[styles.quantityButton, { backgroundColor: tintColor }]}
                    onPress={() => {
                      const qty = Math.min(product.quantity_on_hand, parseInt(labelQuantity) + 1);
                      setLabelQuantity(String(qty));
                    }}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.quantityHint}>
                  {product.quantity_on_hand} unit{product.quantity_on_hand !== 1 ? 's' : ''} in stock
                </ThemedText>
                <ThemedText style={styles.quantityInfo}>
                  Each label will have a unique unit number (001, 002, 003...)
                </ThemedText>
              </View>
            )}
          </ScrollView>

          {/* Barcode Preview for Label */}
          <View style={styles.previewContainer}>
            <ThemedText style={styles.previewLabel}>
              Label Preview (Unit #001):
            </ThemedText>
            <View style={styles.previewBarcodeContainer}>
              <View style={styles.previewBarcodeWrapper}>
                <Barcode
                  value={previewBarcodeValue}
                  options={{
                    format: barcodeFormat,
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
                <View style={styles.previewProductInfo}>
                  <ThemedText style={styles.previewProductName} numberOfLines={1}>
                    {product.name}
                  </ThemedText>
                  <ThemedText style={styles.previewProductVolume}>
                    {product.volume_ml}ml
                  </ThemedText>
                </View>
              )}
            </View>
            {parseInt(labelQuantity) > 1 && (
              <ThemedText style={styles.previewNote}>
                {parseInt(labelQuantity)} labels will be generated (001-{String(parseInt(labelQuantity)).padStart(3, '0')})
              </ThemedText>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.downloadButton, { backgroundColor: tintColor }]}
              onPress={handleDownload}
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
                  : `Save & Print ${parseInt(labelQuantity) > 1 ? `${labelQuantity} Labels` : 'Label'}`}
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
  productInfoContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  productDetails: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  barcodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  barcodeWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    maxHeight: 150,
  },
  valueContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
    flex: 1,
  },
  previewContainer: {
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
  previewBarcodeContainer: {
    width: '100%',
    maxWidth: 200,
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewBarcodeWrapper: {
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
  previewProductInfo: {
    alignItems: 'center',
    width: '100%',
  },
  previewProductName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  previewProductVolume: {
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
  quantityContainer: {
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
