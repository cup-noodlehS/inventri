import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Tabs } from '@/components/tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProducts } from '@/lib/api/products';
import { createTransaction, getRecentTransactions, TransactionWithItems } from '@/lib/api/transactions';
import { CreateTransactionInput, CurrentStock } from '@/lib/types';

type TransactionType = 'Stock In' | 'Stock Out' | 'Adjustment';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TransactionType>('Stock In');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
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
    } finally {
      setLoadingProducts(false);
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

  const handleBarcodeScan = (barcode: string) => {
    // Search for product with matching barcode_value
    const product = products.find(
      (p) => p.barcode_value && p.barcode_value.toLowerCase() === barcode.toLowerCase()
    );

    if (product) {
      // Product found - set as selected
      setSelectedProduct(product.sku);
      setShowScanner(false);
      Alert.alert('Success', `Product found: ${product.name}`);
    } else {
      // Product not found
      Alert.alert(
        'Product Not Found',
        `No product found with barcode: ${barcode}. Please check the barcode or add the product first.`
      );
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
        notes: '',
        userId: user.id,
        items: [
          {
            sku: selectedProduct,
            quantity: activeTab === 'Stock Out' ? -quantity : quantity,
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
      setDate(new Date());

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
      case 'Stock In':
        return 'add-circle';
      case 'Stock Out':
        return 'remove-circle';
      case 'Adjustment':
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'Stock In':
        return '#10B981';
      case 'Stock Out':
        return '#EF4444';
      case 'Adjustment':
        return '#F59E0B';
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

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Transactions</ThemedText>
        <ThemedText style={styles.subtitle}>Manage your inventory</ThemedText>
      </View>

      {/* Tabs */}
      <Tabs
        tabs={['Stock In', 'Stock Out', 'Adjustment']}
        activeTab={activeTab}
        onTabPress={setActiveTab}
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
              onPress={() => setShowProductPicker(!showProductPicker)}
            >
              <View style={styles.pickerContent}>
                <Ionicons name="cube-outline" size={20} color={tintColor} />
                <ThemedText style={styles.pickerText}>
                  {selectedProductData 
                    ? `${selectedProductData.name} (${selectedProductData.sku})` 
                    : 'Select a product'}
                </ThemedText>
              </View>
              <Ionicons 
                name={showProductPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={tintColor} 
              />
            </TouchableOpacity>

            {/* Product Dropdown */}
            {showProductPicker && (
              <ThemedView style={[styles.productList, { backgroundColor }]}>
                {products.map(product => (
                  <TouchableOpacity
                    key={product.sku}
                    style={styles.productItem}
                    onPress={() => {
                      setSelectedProduct(product.sku);
                      setShowProductPicker(false);
                    }}
                  >
                    <View>
                      <ThemedText style={styles.productName}>{product.name}</ThemedText>
                      <ThemedText style={styles.productSku}>
                        {product.sku} • Stock: {product.quantity_on_hand}
                      </ThemedText>
                    </View>
                    {selectedProduct === product.sku && (
                      <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                    )}
                  </TouchableOpacity>
                ))}
              </ThemedView>
            )}
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

          {/* Date */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Date & Time</ThemedText>
            <TouchableOpacity
              style={[styles.picker, { borderColor: tintColor + '40' }]}
              onPress={() => {/* TODO: Add date picker */}}
            >
              <View style={styles.pickerContent}>
                <Ionicons name="calendar-outline" size={20} color={tintColor} />
                <ThemedText style={styles.pickerText}>
                  {date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tintColor} />
            </TouchableOpacity>
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

          {/* Barcode Scan Button */}
          <TouchableOpacity
            style={[styles.scanButton, { borderColor: tintColor }]}
            onPress={() => setShowScanner(true)}
          >
            <Ionicons name="barcode-outline" size={24} color={tintColor} />
            <ThemedText style={[styles.scanButtonText, { color: tintColor }]}>
              Scan Barcode
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
            <ThemedText>Loading transactions...</ThemedText>
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
              const totalQuantity = transaction.transaction_item?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              
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
                        {transaction.reference && ` • ${transaction.reference}`}
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
                      {totalQuantity > 0 ? '+' : ''}{totalQuantity}
                    </ThemedText>
                  </View>
                </ThemedView>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Barcode Scanner */}
      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
});
