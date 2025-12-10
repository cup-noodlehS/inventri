import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeGenerator } from '@/components/barcode-generator';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { createProduct, deleteProduct, getProducts, searchProducts, updateProduct } from '@/lib/api/products';
import { CurrentStock, Product } from '@/lib/types';

type ProductFormData = {
  sku: string;
  name: string;
  volume_ml: string;
  price: string;
  min_stock_threshold: string;
  description: string;
};

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CurrentStock | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    volume_ml: '',
    price: '',
    min_stock_threshold: '5',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  
  // Barcode states
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<CurrentStock | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Guard: allow only whole numbers (empty string is allowed while typing)
  const allowNumericInput = (text: string, fieldLabel: string): boolean => {
    if (text === '') {
      return true;
    }
    if (/^[0-9]+$/.test(text)) {
      return true;
    }
    Alert.alert('Invalid input', `${fieldLabel} accepts numbers only.`);
    return false;
  };

  // Guard: allow numbers with a single decimal point (empty string allowed)
  const allowDecimalInput = (text: string, fieldLabel: string): boolean => {
    if (text === '') {
      return true;
    }
    if (/^[0-9]*\\.?[0-9]*$/.test(text)) {
      return true;
    }
    Alert.alert('Invalid input', `${fieldLabel} accepts numeric values (one decimal point max).`);
    return false;
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(async () => {
      if (query.trim() === '') {
        await fetchProducts();
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await searchProducts(query);

        if (error) {
          console.error('Error searching products:', error);
          return;
        }

        if (data) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Error in handleSearch:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      volume_ml: '',
      price: '',
      min_stock_threshold: '5',
      description: '',
    });
    setShowModal(true);
  };

  const openEditModal = (product: CurrentStock) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      volume_ml: String(product.volume_ml),
      price: String(product.price),
      min_stock_threshold: String(product.min_stock_threshold),
      description: product.description || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      volume_ml: '',
      price: '',
      min_stock_threshold: '5',
      description: '',
    });
  };

  const handleSave = async () => {
    // Validation
    if (!editingProduct && !formData.sku.trim()) {
      Alert.alert('Validation Error', 'SKU is required.');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product Name is required.');
      return;
    }

    const volumeNum = parseFloat(formData.volume_ml);
    const priceNum = parseFloat(formData.price);
    const thresholdNum = parseInt(formData.min_stock_threshold);

    if (isNaN(volumeNum) || volumeNum <= 0) {
      Alert.alert('Validation Error', 'Volume must be a positive number.');
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Validation Error', 'Price must be a valid number.');
      return;
    }

    if (isNaN(thresholdNum) || thresholdNum < 0) {
      Alert.alert('Validation Error', 'Min Stock Threshold must be a valid number.');
      return;
    }

    try {
      setSaving(true);

      if (editingProduct) {
        // Update existing product
        const updates: Partial<Product> = {
          name: formData.name.trim(),
          volume_ml: volumeNum,
          price: priceNum,
          min_stock_threshold: thresholdNum,
          description: formData.description.trim() || null,
        };

        const { error } = await updateProduct(editingProduct.sku, updates);

        if (error) {
          Alert.alert('Error', error.message || 'Failed to update product.');
          return;
        }

        Alert.alert('Success', 'Product updated successfully!');
      } else {
        // Create new product
        const newProduct: Omit<Product, 'created_at' | 'updated_at' | 'created_by'> = {
          sku: formData.sku.trim().toUpperCase(),
          name: formData.name.trim(),
          volume_ml: volumeNum,
          price: priceNum,
          min_stock_threshold: thresholdNum,
          description: formData.description.trim() || null,
        };

        const { error } = await createProduct(newProduct);

        if (error) {
          Alert.alert('Error', error.message || 'Failed to create product.');
          return;
        }

        Alert.alert('Success', 'Product created successfully!');
      }

      closeModal();
      await fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert('Error', error?.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product: CurrentStock) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteProduct(product.sku);

              if (error) {
                Alert.alert('Error', error.message || 'Failed to delete product.');
                return;
              }

              Alert.alert('Success', 'Product deleted successfully!');
              await fetchProducts();
            } catch (error: any) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', error?.message || 'An unexpected error occurred.');
            }
          },
        },
      ]
    );
  };

  const handleShowBarcode = (product: CurrentStock) => {
    setBarcodeProduct(product);
    setShowBarcodeGenerator(true);
  };

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
        ? `Found: ${productByBarcode.name} (${productByBarcode.volume_ml}ml) - Unit #${unitNum}`
        : `Found: ${productByBarcode.name} (${productByBarcode.volume_ml}ml)`;
      setSearchQuery(productByBarcode.sku);
      handleSearch(productByBarcode.sku);
      Alert.alert('Product Found', message);
      return;
    }

    // Try to extract SKU and volume from barcode
    const volumeMatch = baseBarcode.match(/-(\d+)ml$/);
    const skuPart = volumeMatch ? baseBarcode.replace(/-(\d+)ml$/, '') : baseBarcode;
    
    // Try to find by SKU only
    const productBySku = products.find(p => p.sku.toLowerCase() === skuPart.toLowerCase());
    
    if (productBySku) {
      setSearchQuery(productBySku.sku);
      handleSearch(productBySku.sku);
      Alert.alert('Product Found', `Found: ${productBySku.name}`);
      return;
    }

    // Try to find by partial match in SKU or name
    const productMatch = products.find(
      p => p.sku.toLowerCase().includes(scannedData.toLowerCase()) ||
           p.name.toLowerCase().includes(scannedData.toLowerCase())
    );

    if (productMatch) {
      setSearchQuery(productMatch.sku);
      handleSearch(productMatch.sku);
      Alert.alert('Product Found', `Found: ${productMatch.name}`);
    } else {
      Alert.alert('Product Not Found', `No product found with barcode: ${scannedData}`);
    }
  };

  const renderProductCard = ({ item }: { item: CurrentStock }) => {
    const isLowStock = item.quantity_on_hand <= item.min_stock_threshold;

    return (
      <TouchableOpacity activeOpacity={0.7} onLongPress={() => openEditModal(item)}>
        <ThemedView style={[styles.productCard, styles.card]}>
          {/* Header with SKU and Volume */}
          <View style={styles.cardHeader}>
            <View style={styles.skuBadge}>
              <ThemedText style={styles.skuText}>{item.sku}</ThemedText>
            </View>
            <View style={styles.cardHeaderRight}>
              <View style={[styles.volumeBadge, { backgroundColor: tintColor + '20' }]}>
                <Ionicons name="water-outline" size={12} color={tintColor} />
                <ThemedText style={[styles.volumeText, { color: tintColor }]}>
                  {item.volume_ml}ml
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => handleShowBarcode(item)} style={styles.iconButton}>
                <Ionicons name="barcode-outline" size={20} color={tintColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconButton}>
                <Ionicons name="create-outline" size={20} color={tintColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Name */}
          <ThemedText style={styles.productName}>{item.name}</ThemedText>

          {/* Stock and Price Info */}
          <View style={styles.cardFooter}>
            <View style={styles.stockContainer}>
              <Ionicons
                name={isLowStock ? "alert-circle" : "cube"}
                size={16}
                color={isLowStock ? "#EF4444" : tintColor}
              />
              <ThemedText style={[styles.stockText, isLowStock && styles.lowStockText]}>
                {item.quantity_on_hand} in stock
              </ThemedText>
            </View>
            <ThemedText style={styles.priceText}>₱{item.price.toFixed(2)}</ThemedText>
          </View>

          {/* Low Stock Warning */}
          {isLowStock && (
            <View style={styles.lowStockBanner}>
              <Ionicons name="warning" size={14} color="#DC2626" />
              <ThemedText style={styles.lowStockBannerText}>
                Low Stock Alert
              </ThemedText>
            </View>
          )}
        </ThemedView>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Products</ThemedText>
        <ThemedText style={styles.subtitle}>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </ThemedText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <ThemedView style={[styles.searchContainer, { borderColor: tintColor + '40' }]}>
          <Ionicons name="search-outline" size={20} color={tintColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search by name or SKU..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              fetchProducts();
            }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </ThemedView>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: tintColor }]}
          onPress={() => setShowBarcodeScanner(true)}
        >
          <Ionicons name="scan-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Products List */}
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={{ marginTop: 16 }}>Loading products...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={item => item.sku}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tintColor} />
          }
          ListEmptyComponent={
            <ThemedView style={[styles.emptyState, styles.card]}>
              <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
              <ThemedText style={styles.emptyText}>No products found</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Try adjusting your search
              </ThemedText>
            </ThemedView>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: tintColor }]}
        onPress={openCreateModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Product Form Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Create Product'}
              </ThemedText>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={28} color={tintColor} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalForm} 
              contentContainerStyle={styles.modalFormContent}
              showsVerticalScrollIndicator={false}
            >
              {/* SKU */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>
                  SKU {!editingProduct && '*'}
                  {editingProduct && (
                    <ThemedText style={styles.readOnlyLabel}> (Cannot be changed)</ThemedText>
                  )}
                </ThemedText>
                {editingProduct ? (
                  <View style={[styles.input, styles.skuReadOnlyContainer, { borderColor: '#9CA3AF' }]}>
                    <Ionicons name="lock-closed" size={16} color="#6B7280" style={styles.lockIcon} />
                    <ThemedText style={styles.skuReadOnlyText}>{formData.sku}</ThemedText>
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, { borderColor: tintColor + '40', color: textColor }]}
                    value={formData.sku}
                    onChangeText={(text) => setFormData({ ...formData, sku: text })}
                    placeholder="e.g., DIOR-SAUVAGE-100"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                  />
                )}
              </View>

              {/* Name */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Product Name *</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: tintColor + '40', color: textColor }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Dior Sauvage"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Volume */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Volume (ML) *</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: tintColor + '40', color: textColor }]}
                  value={formData.volume_ml}
                  onChangeText={(text) => {
                    if (!allowNumericInput(text, 'Volume')) {
                      return;
                    }
                    setFormData({ ...formData, volume_ml: text });
                  }}
                  placeholder="e.g., 100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Price */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Price (₱) *</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: tintColor + '40', color: textColor }]}
                  value={formData.price}
                  onChangeText={(text) => {
                    if (!allowDecimalInput(text, 'Price')) {
                      return;
                    }
                    setFormData({ ...formData, price: text });
                  }}
                  placeholder="e.g., 95.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Min Stock Threshold */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Min Stock Threshold *</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: tintColor + '40', color: textColor }]}
                  value={formData.min_stock_threshold}
                  onChangeText={(text) => {
                    if (!allowNumericInput(text, 'Min Stock Threshold')) {
                      return;
                    }
                    setFormData({ ...formData, min_stock_threshold: text });
                  }}
                  placeholder="e.g., 5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput
                  style={[styles.textArea, { borderColor: tintColor + '40', color: textColor }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Optional product description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={closeModal}
                disabled={saving}
              >
                <ThemedText style={styles.buttonSecondaryText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { backgroundColor: tintColor }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonPrimaryText}>
                    {editingProduct ? 'Update' : 'Create'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>

      {/* Barcode Generator Modal */}
      <BarcodeGenerator
        visible={showBarcodeGenerator}
        onClose={() => {
          setShowBarcodeGenerator(false);
          setBarcodeProduct(null);
        }}
        product={barcodeProduct}
        type="CODE128"
        title="Product Barcode"
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
        title="Scan Product Barcode"
        subtitle="Scan a barcode to find the product"
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
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  productCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skuBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skuText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  volumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  volumeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
    padding: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    opacity: 0.7,
  },
  lowStockText: {
    color: '#EF4444',
    fontWeight: '600',
    opacity: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lowStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  lowStockBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalForm: {
    flexShrink: 1,
    flexGrow: 0,
  },
  modalFormContent: {
    paddingBottom: 0,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  skuReadOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    opacity: 0.7,
  },
  lockIcon: {
    marginRight: 8,
  },
  skuReadOnlyText: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.6,
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.6,
    fontStyle: 'italic',
  },
  textArea: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonSecondary: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
