import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeScanner } from '@/components/barcode-scanner';
import { Tabs } from '@/components/tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProducts } from '@/lib/api/products';
import { createTransaction, getRecentTransactions, TransactionWithItems } from '@/lib/api/transactions';
import { CreateTransactionInput, CurrentStock, TransactionType } from '@/lib/types';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TransactionType>('Delivery');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await getProducts();

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      if (data) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const { data, error } = await getRecentTransactions(20);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(prev => prev + 1);
    } else {
      setQuantity(prev => Math.max(1, prev - 1));
    }
  };

  const handleSave = async () => {
    // Validation
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare transaction input
      const input: CreateTransactionInput & { userId: string } = {
        transaction_type: activeTab,
        reference: `TXN-${Date.now()}`,
        notes: notes.trim() || null,
        customer_name: activeTab === 'Sale' && customerName.trim() ? customerName.trim() : null,
        userId: user.id,
        items: [
          {
            sku: selectedProduct,
            quantity: quantity,
          },
        ],
      };

      // Call API
      const { data, error } = await createTransaction(input);

      if (error) {
        const errorMessage = error?.message || error?.toString() || 'Failed to save transaction';
        Alert.alert('Error', errorMessage);
        return;
      }

      // Success
      Alert.alert('Success', 'Transaction saved successfully!');

      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setCustomerName('');
      setNotes('');

      // Refresh transactions list
      fetchTransactions();
    } catch (err) {
      console.error('Transaction error:', err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'Delivery':
        return 'arrow-down-circle';
      case 'Sale':
        return 'arrow-up-circle';
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'Delivery':
        return '#10B981';
      case 'Sale':
        return '#EF4444';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedProductData = products.find(p => p.sku === selectedProduct);

  const handleBarcodeScan = (scannedData: string) => {
    // Barcode format: SKU-VOLUMEml-UNIT (e.g., "LE-MALE-65-65ml-001")
    // Extract base barcode (SKU + volume) by removing unit number if present
    const unitMatch = scannedData.match(/-(\d{3})$/); // Match -001, -002, etc.
    const baseBarcode = unitMatch ? scannedData.replace(/-(\d{3})$/, '') : scannedData;
    
    // Try to find product by base barcode match (SKU + volume)
    const productByBarcode = products.find(
      p => `${p.sku}-${p.volume_ml}ml` === baseBarcode
    );
    
    if (productByBarcode) {
      const unitNum = unitMatch ? unitMatch[1] : null;
      const message = unitNum 
        ? `Selected: ${productByBarcode.name} (${productByBarcode.volume_ml}ml) - Unit #${unitNum}`
        : `Selected: ${productByBarcode.name} (${productByBarcode.volume_ml}ml)`;
      setSelectedProduct(productByBarcode.sku);
      setShowProductModal(false);
      Alert.alert('Product Selected', message);
      return;
    }

    // Try to extract SKU and volume from barcode
    const volumeMatch = baseBarcode.match(/-(\d+)ml$/);
    const skuPart = volumeMatch ? baseBarcode.replace(/-(\d+)ml$/, '') : baseBarcode;
    const product = products.find(p => p.sku.toLowerCase() === skuPart.toLowerCase());
    
    if (product) {
      setSelectedProduct(product.sku);
      setShowProductModal(false);
      Alert.alert('Product Selected', `Selected: ${product.name}`);
    } else {
      // Try partial match
      const productMatch = products.find(
        p => p.sku.toLowerCase().includes(scannedData.toLowerCase()) ||
             p.name.toLowerCase().includes(scannedData.toLowerCase())
      );

      if (productMatch) {
        setSelectedProduct(productMatch.sku);
        setShowProductModal(false);
        Alert.alert('Product Selected', `Selected: ${productMatch.name}`);
      } else {
        Alert.alert('Product Not Found', `No product found with barcode: ${scannedData}`);
      }
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Transactions</ThemedText>
        <ThemedText style={styles.subtitle}>Track deliveries and sales</ThemedText>
      </View>

      {/* Tabs */}
      <Tabs
        tabs={['Delivery', 'Sale']}
        activeTab={activeTab}
        onTabPress={(tab: string) => setActiveTab(tab as TransactionType)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Transaction Form */}
        <ThemedView style={[styles.formCard, styles.card]}>
          <View style={styles.formHeader}>
            <Ionicons
              name={getTransactionIcon(activeTab)}
              size={24}
              color={getTransactionColor(activeTab)}
            />
            <ThemedText type="subtitle" style={styles.formTitle}>
              New {activeTab}
            </ThemedText>
          </View>

          {/* Product Selection */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Product</ThemedText>
            <TouchableOpacity
              style={[styles.picker, { borderColor: tintColor + '40' }]}
              onPress={() => setShowProductModal(true)}
            >
              <View style={styles.pickerContent}>
                <Ionicons name="cube-outline" size={20} color={tintColor} />
                <ThemedText style={styles.pickerText}>
                  {selectedProductData
                    ? `${selectedProductData.name} (${selectedProductData.volume_ml}ml)`
                    : 'Select a product'}
                </ThemedText>
              </View>
              <Ionicons
                name="search-outline"
                size={20}
                color={tintColor}
              />
            </TouchableOpacity>
          </View>

          {/* Quantity Stepper */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Quantity</ThemedText>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepperButton, { backgroundColor: tintColor }]}
                onPress={() => handleQuantityChange(false)}
              >
                <Ionicons name="remove" size={24} color="#fff" />
              </TouchableOpacity>
              <ThemedView style={styles.quantityDisplay}>
                <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
              </ThemedView>
              <TouchableOpacity
                style={[styles.stepperButton, { backgroundColor: tintColor }]}
                onPress={() => handleQuantityChange(true)}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer Name - Only for Sales */}
          {activeTab === 'Sale' && (
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Customer Name (Optional)</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: tintColor + '40', color: textColor }]}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter customer name"
                placeholderTextColor="#999"
              />
            </View>
          )}

          {/* Notes */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Notes (Optional)</ThemedText>
            <TextInput
              style={[styles.textInput, styles.notesInput, { borderColor: tintColor + '40', color: textColor }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes or remarks"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: getTransactionColor(activeTab) },
              submitting && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            )}
            <ThemedText style={styles.saveButtonText}>
              {submitting ? 'Saving...' : 'Save Transaction'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Transaction History */}
        <View style={styles.historyHeader}>
          <Ionicons name="time-outline" size={24} color={tintColor} />
          <ThemedText type="subtitle" style={styles.historyTitle}>
            Transaction History
          </ThemedText>
        </View>

        {loadingTransactions ? (
          <ThemedView style={[styles.emptyState, styles.card]}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={{ marginTop: 16 }}>Loading transactions...</ThemedText>
          </ThemedView>
        ) : transactions.length === 0 ? (
          <ThemedView style={[styles.emptyState, styles.card]}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Create your first transaction above
            </ThemedText>
          </ThemedView>
        ) : (
          <View style={styles.historyList}>
            {transactions.map((transaction) => {
              const transactionDate = new Date(transaction.timestamp);
              const firstItem = transaction.transaction_item?.[0];
              const productName = firstItem ? products.find(p => p.sku === firstItem.sku)?.name || firstItem.sku : 'Unknown';
              const totalQuantity = transaction.transaction_item?.reduce((sum, item) => sum + Math.abs(item.quantity), 0) || 0;

              return (
                <ThemedView key={transaction.id} style={[styles.transactionItem, styles.card]}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        { backgroundColor: getTransactionColor(transaction.transaction_type) + '20' }
                      ]}
                    >
                      <Ionicons
                        name={getTransactionIcon(transaction.transaction_type)}
                        size={24}
                        color={getTransactionColor(transaction.transaction_type)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <ThemedText style={styles.transactionProduct}>
                        {productName}
                      </ThemedText>
                      <ThemedText style={styles.transactionMeta}>
                        {transaction.transaction_type}
                        {transaction.customer_name && ` • ${transaction.customer_name}`}
                      </ThemedText>
                      <ThemedText style={styles.transactionDate}>
                        {formatDate(transactionDate)} at {formatTime(transactionDate)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <ThemedText
                      style={[
                        styles.transactionQuantity,
                        { color: getTransactionColor(transaction.transaction_type) }
                      ]}
                    >
                      {transaction.transaction_type === 'Delivery' ? '+' : '-'}{totalQuantity}
                    </ThemedText>
                  </View>
                </ThemedView>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Product</ThemedText>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={28} color={tintColor} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <View style={[styles.searchContainer, { borderColor: tintColor + '40' }]}>
                <Ionicons name="search-outline" size={20} color={tintColor} />
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder="Search products..."
                  placeholderTextColor="#9CA3AF"
                  value={productSearchQuery}
                  onChangeText={setProductSearchQuery}
                />
                {productSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: tintColor }]}
                onPress={() => {
                  setShowProductModal(false);
                  setShowBarcodeScanner(true);
                }}
              >
                <Ionicons name="scan-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Products List */}
            <FlatList
              data={products.filter(product => {
                if (!productSearchQuery.trim()) return true;
                const query = productSearchQuery.toLowerCase();
                return (
                  product.name.toLowerCase().includes(query) ||
                  product.sku.toLowerCase().includes(query)
                );
              })}
              keyExtractor={item => item.sku}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalProductItem,
                    selectedProduct === item.sku && { backgroundColor: tintColor + '20' }
                  ]}
                  onPress={() => {
                    setSelectedProduct(item.sku);
                    setShowProductModal(false);
                    setProductSearchQuery('');
                  }}
                >
                  <View style={styles.modalProductInfo}>
                    <ThemedText style={styles.modalProductName}>{item.name}</ThemedText>
                    <ThemedText style={styles.modalProductSku}>{item.sku}</ThemedText>
                    <View style={styles.modalProductMeta}>
                      <ThemedText style={styles.modalProductVolume}>
                        {item.volume_ml}ml
                      </ThemedText>
                      <ThemedText style={styles.modalProductPrice}>
                        ₱{item.price.toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>
                  {selectedProduct === item.sku && (
                    <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalProductList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <ThemedView style={styles.modalEmptyState}>
                  <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                  <ThemedText style={styles.modalEmptyText}>No products found</ThemedText>
                </ThemedView>
              }
            />
          </ThemedView>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={showBarcodeScanner}
        onClose={() => {
          setShowBarcodeScanner(false);
          // Reopen product modal if it was open
          if (!selectedProduct) {
            setShowProductModal(true);
          }
        }}
        onScan={handleBarcodeScan}
        title="Scan Product Barcode"
        subtitle="Scan a barcode to select the product"
      />
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formCard: {
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  formTitle: {
    fontSize: 18,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pickerText: {
    fontSize: 15,
  },
  productList: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    opacity: 0.6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  textInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 15,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  historyTitle: {
    fontSize: 18,
  },
  historyList: {
    gap: 12,
    marginBottom: 24,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionProduct: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionQuantity: {
    fontSize: 20,
    fontWeight: 'bold',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  modalProductList: {
    paddingBottom: 20,
  },
  modalProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalProductSku: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  modalProductMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalProductVolume: {
    fontSize: 14,
    opacity: 0.7,
  },
  modalProductPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalEmptyState: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
});
