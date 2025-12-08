import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Tabs } from '@/components/tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getUserPreferences } from '@/lib/api/preferences';
import { getProducts } from '@/lib/api/products';
import { createTransaction, getRecentTransactions, TransactionWithItems } from '@/lib/api/transactions';
import { CreateTransactionInput, CurrentStock, TransactionType, UserPreferences } from '@/lib/types';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'textMuted');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');
  const warningColor = useThemeColor({}, 'warning');
  const accentColor = useThemeColor({}, 'accent');
  const params = useLocalSearchParams<{ type?: string }>();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TransactionType>('Stock In');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (
      params.type &&
      ['Stock In', 'Stock Out', 'Adjustment'].includes(params.type as TransactionType)
    ) {
      setActiveTab(params.type as TransactionType);
    }
  }, [params.type]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let isMounted = true;
    const loadPreferences = async () => {
      try {
        setLoadingPrefs(true);
        const { data, error } = await getUserPreferences(user.id);
        if (!isMounted) {
          return;
        }
        if (error) {
          console.error('Preferences error:', error);
          return;
        }
        setPreferences(data);
        if (!params.type && data?.default_transaction_type) {
          setActiveTab(data.default_transaction_type as TransactionType);
        }
      } finally {
        if (isMounted) {
          setLoadingPrefs(false);
        }
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [user?.id, params.type]);

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
            quantity,
          },
        ],
      };

      // Call API
      const { error } = await createTransaction(input);

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
      case 'Transfer':
        return 'swap-horizontal';
      case 'Sale':
        return 'cart-outline';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'Stock In':
        return successColor;
      case 'Stock Out':
      case 'Sale':
        return dangerColor;
      case 'Transfer':
        return accentColor;
      case 'Adjustment':
      default:
        return warningColor;
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
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
      <ThemedText type="title" style={styles.title}>Transactions</ThemedText>
      <ThemedText style={[styles.subtitle, { color: mutedColor }]}>Manage your inventory</ThemedText>
    </View>

    {/* Tabs */}
    <Tabs
      tabs={['Stock In', 'Stock Out', 'Adjustment', 'Sale', 'Transfer']}
      activeTab={activeTab}
      onTabPress={setActiveTab}
    />
    {loadingPrefs ? (
      <ThemedText style={[styles.preferenceHint, { color: mutedColor }]}>
        Loading your preferred defaults…
      </ThemedText>
    ) : preferences ? (
      <ThemedText style={[styles.preferenceHint, { color: mutedColor }]}>
        Default transaction type: {preferences.default_transaction_type}
      </ThemedText>
    ) : null}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Transaction Form */}
        <ThemedView
          style={[
            styles.formCard,
            styles.card,
            {
              backgroundColor: surfaceColor,
              borderColor,
            },
          ]}>
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
              style={[
                styles.picker,
                {
                  borderColor,
                  backgroundColor: surfaceAlt,
                },
              ]}
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
              <ThemedView style={[styles.productList, { backgroundColor: surfaceColor, borderColor }]}>
                {products.map(product => (
                  <TouchableOpacity
                    key={product.sku}
                    style={[styles.productItem, { borderColor }]}
                    onPress={() => {
                      setSelectedProduct(product.sku);
                      setShowProductPicker(false);
                    }}
                  >
                    <View>
                      <ThemedText style={styles.productName}>{product.name}</ThemedText>
                      <ThemedText style={[styles.productSku, { color: mutedColor }]}>
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
              <ThemedView style={[styles.quantityDisplay, { borderColor }]}>
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
              style={[
                styles.picker,
                {
                  borderColor,
                  backgroundColor: surfaceAlt,
                },
              ]}
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
            style={[
              styles.scanButton,
              {
                borderColor,
                backgroundColor: surfaceAlt,
              },
            ]}
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
          <Ionicons name="time-outline" size={22} color={tintColor} />
          <ThemedText type="subtitle" style={styles.historyTitle}>
            Transaction History
          </ThemedText>
        </View>

        {loadingTransactions ? (
          <ThemedView style={[styles.emptyState, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
            <ThemedText>Loading transactions...</ThemedText>
          </ThemedView>
        ) : transactions.length === 0 ? (
          <ThemedView style={[styles.emptyState, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
            <Ionicons name="document-text-outline" size={64} color={mutedColor} />
            <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: mutedColor }]}>
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
                <ThemedView
                  key={transaction.id}
                  style={[
                    styles.transactionItem,
                    styles.card,
                    { backgroundColor: surfaceColor, borderColor },
                  ]}>
                  <View style={styles.transactionLeft}>
                    <View 
                      style={[
                        styles.transactionIcon, 
                        { backgroundColor: `${getTransactionColor(transaction.transaction_type)}20` }
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
                      <ThemedText style={[styles.transactionMeta, { color: mutedColor }]}>
                        {transaction.transaction_type}
                        {transaction.reference && ` • ${transaction.reference}`}
                      </ThemedText>
                      <ThemedText style={[styles.transactionDate, { color: mutedColor }]}>
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
  content: {
    flex: 1,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  formCard: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  formTitle: {
    fontSize: 18,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  pickerText: {
    fontSize: 15,
  },
  productList: {
    marginTop: Spacing.xs,
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  productSku: {
    fontSize: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    flex: 1,
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
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
    padding: Spacing.md,
    borderRadius: Radii.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  historyTitle: {
    fontSize: 18,
  },
  historyList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionProduct: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  transactionMeta: {
    fontSize: 12,
    marginBottom: Spacing.xs / 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionQuantity: {
    fontSize: 20,
    fontWeight: '700',
  },
  preferenceHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
});
