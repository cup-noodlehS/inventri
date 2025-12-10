import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProducts } from '@/lib/api/products';
import { supabase } from '@/lib/supabase';
import { CurrentStock } from '@/lib/types';

export default function HomeScreen() {
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllLowStock, setShowAllLowStock] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await getProducts();

      if (error) {
        console.error('Error fetching products:', error);
        Alert.alert('Error', 'Failed to load products. Please try again.');
        return;
      }

      if (data) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Set up real-time subscription for inventory transactions
  useEffect(() => {
    const subscription = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inventory_transaction' },
        () => {
          fetchProducts(); // Refresh data when new transaction is created
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={{ marginTop: 16 }}>Loading dashboard...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const totalStock = products.reduce((sum, product) => sum + product.quantity_on_hand, 0);
  const lowStockProducts = products.filter(product => product.quantity_on_hand <= product.min_stock_threshold);
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + product.total_value, 0);
  const displayedLowStock = showAllLowStock ? lowStockProducts : lowStockProducts.slice(0, 5);
  const hiddenLowStockCount = showAllLowStock ? 0 : Math.max(lowStockProducts.length - 5, 0);
  const hasMoreLowStock = lowStockProducts.length > 5;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tintColor} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>Perfume Inventory Overview</ThemedText>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Products Card */}
          <ThemedView style={[styles.statCard, styles.card]}>
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="cube-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.statValue}>{totalProducts}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Products</ThemedText>
          </ThemedView>

          {/* Total Stock Card */}
          <ThemedView style={[styles.statCard, styles.card]}>
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="layers-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.statValue}>{totalStock}</ThemedText>
            <ThemedText style={styles.statLabel}>Current Inventory</ThemedText>
          </ThemedView>

          {/* Low Stock Alert Card */}
          <ThemedView style={[styles.statCard, styles.card, lowStockProducts.length > 0 && styles.alertCard]}>
            <View style={[styles.iconContainer, { backgroundColor: lowStockProducts.length > 0 ? '#EF4444' : '#10B981' }]}>
              <Ionicons name={lowStockProducts.length > 0 ? "alert-circle-outline" : "checkmark-circle-outline"} size={24} color="#fff" />
            </View>
            <ThemedText style={[styles.statValue, lowStockProducts.length > 0 && { color: '#EF4444' }]}>
              {lowStockProducts.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Low Stock Alerts</ThemedText>
          </ThemedView>

          {/* Inventory Value Card */}
          <ThemedView style={[styles.statCard, styles.card]}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <Ionicons name="cash-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.statValue}>₱{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Value</ThemedText>
          </ThemedView>
        </View>

        {/* Low Stock Alerts Section */}
        {lowStockProducts.length > 0 && (
          <ThemedView style={[styles.section, styles.card]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={24} color="#EF4444" />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Low Stock Alerts
              </ThemedText>
            </View>
            <View style={styles.alertsContainer}>
              {displayedLowStock.map((product) => (
                <View key={product.sku} style={styles.alertItem}>
                  <View style={styles.alertItemLeft}>
                    <ThemedText style={styles.productName}>{product.name}</ThemedText>
                    <ThemedText style={styles.productDetails}>
                      {product.volume_ml}ml • SKU: {product.sku}
                    </ThemedText>
                  </View>
                  <View style={styles.alertItemRight}>
                    <Pressable
                      style={styles.stockBadge}
                      onPress={() => setShowAllLowStock(current => !current)}
                      accessibilityRole="button"
                      accessibilityLabel={showAllLowStock ? 'Hide low stock items' : 'Show all low stock items'}
                    >
                      <ThemedText style={styles.stockBadgeText}>{product.quantity_on_hand} left</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
              {hasMoreLowStock && (
                <Pressable
                  style={styles.moreToggleButton}
                  onPress={() => setShowAllLowStock(current => !current)}
                  accessibilityRole="button"
                  accessibilityLabel={showAllLowStock ? 'Close more low stock items' : 'Show more low stock items'}
                >
                  <ThemedText style={styles.moreItemsText}>
                    {showAllLowStock ? 'Close more' : `Show more (+${hiddenLowStockCount} items)`}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </ThemedView>
        )}

        {/* Summary Section */}
        <ThemedView style={[styles.section, styles.card]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart-outline" size={24} color={tintColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Inventory Summary
            </ThemedText>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Products in Stock</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {products.filter(p => p.quantity_on_hand > 0).length} / {totalProducts}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Out of Stock</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {products.filter(p => p.quantity_on_hand === 0).length}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Avg. Stock per Product</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0} units
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Avg. Value per Product</ThemedText>
              <ThemedText style={styles.summaryValue}>
                ₱{totalProducts > 0 ? (totalValue / totalProducts).toFixed(2) : '0.00'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  header: {
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  alertCard: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
  },
  alertsContainer: {
    gap: 0,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  alertItemLeft: {
    flex: 1,
  },
  alertItemRight: {
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 12,
    opacity: 0.5,
  },
  stockBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stockBadgeText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  moreToggleButton: {
    alignItems: 'center',
  },
  moreItemsText: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    width: '47%',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
