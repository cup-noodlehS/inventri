import { Ionicons } from '@expo/vector-icons';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getProducts } from '@/lib/api/products';
import { CurrentStock } from '@/lib/types';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function HomeScreen() {
  const tintColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();
  
  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const totalStock = products.reduce((sum, product) => sum + product.quantity_on_hand, 0);
  const lowStockProducts = products.filter(product => product.quantity_on_hand < product.min_stock_threshold);
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.quantity_on_hand * product.price), 0);
  
  // Category breakdown
  const categoryStats = products.reduce((acc, product) => {
    const categoryName = product.category_name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = { count: 0, stock: 0 };
    }
    acc[categoryName].count += 1;
    acc[categoryName].stock += product.quantity_on_hand;
    return acc;
  }, {} as Record<string, { count: number; stock: number }>);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>Inventory Overview</ThemedText>
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
            <ThemedText style={styles.statLabel}>Total Stock</ThemedText>
          </ThemedView>

          {/* Low Stock Alert Card */}
          <ThemedView style={[styles.statCard, styles.card, lowStockProducts.length > 0 && styles.alertCard]}>
            <View style={[styles.iconContainer, { backgroundColor: lowStockProducts.length > 0 ? '#EF4444' : '#10B981' }]}>
              <Ionicons name={lowStockProducts.length > 0 ? "alert-circle-outline" : "checkmark-circle-outline"} size={24} color="#fff" />
            </View>
            <ThemedText style={styles.statValue}>{lowStockProducts.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Low Stock Items</ThemedText>
          </ThemedView>

          {/* Inventory Value Card */}
          <ThemedView style={[styles.statCard, styles.card]}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <Ionicons name="cash-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.statValue}>₱{totalValue.toLocaleString()}</ThemedText>
            <ThemedText style={styles.statLabel}>Inventory Value</ThemedText>
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
            {lowStockProducts.map((product) => (
              <View key={product.sku} style={styles.alertItem}>
                <View style={styles.alertItemLeft}>
                  <ThemedText style={styles.productName}>{product.name}</ThemedText>
                  <ThemedText style={styles.productSku}>SKU: {product.sku}</ThemedText>
                </View>
                <View style={styles.alertItemRight}>
                  <View style={styles.stockBadge}>
                    <ThemedText style={styles.stockBadgeText}>{product.quantity_on_hand} left</ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </ThemedView>
        )}

        {/* Category Breakdown */}
        <ThemedView style={[styles.section, styles.card]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart-outline" size={24} color={tintColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Category Breakdown
            </ThemedText>
          </View>
          {Object.entries(categoryStats).map(([category, stats]) => (
            <View key={category} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                <ThemedText style={styles.categoryName}>{category}</ThemedText>
              </View>
              <View style={styles.categoryRight}>
                <ThemedText style={styles.categoryValue}>{stats.count} products</ThemedText>
                <ThemedText style={styles.categoryStock}>{stats.stock} units</ThemedText>
              </View>
            </View>
          ))}
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: tintColor }]}>
            <Ionicons name="add-circle-outline" size={28} color="#fff" />
            <ThemedText style={styles.actionText}>Stock In</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="remove-circle-outline" size={28} color="#fff" />
            <ThemedText style={styles.actionText}>Stock Out</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="swap-horizontal-outline" size={28} color="#fff" />
            <ThemedText style={styles.actionText}>Adjust</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Women: '#EC4899',
    Men: '#3B82F6',
    Unisex: '#8B5CF6',
  };
  return colors[category] || '#6B7280';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
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
  productSku: {
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryStock: {
    fontSize: 12,
    opacity: 0.6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
});