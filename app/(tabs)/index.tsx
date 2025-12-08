import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProducts } from '@/lib/api/products';
import { getShipments } from '@/lib/api/shipments';
import { supabase } from '@/lib/supabase';
import { CurrentStock, Shipment } from '@/lib/types';

type TransactionShortcut = 'Stock In' | 'Stock Out' | 'Adjustment';

export default function HomeScreen() {
  const tintColor = useThemeColor({}, 'tint');
  const accent = useThemeColor({}, 'accent');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const danger = useThemeColor({}, 'danger');
  const surface = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const mutedText = useThemeColor({}, 'textMuted');
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(true);
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

  const fetchShipments = async () => {
    try {
      setLoadingShipments(true);
      const { data, error } = await getShipments({ limit: 10 });
      if (error) {
        console.error('Error fetching shipments:', error);
        return;
      }
      setShipments(data ?? []);
    } catch (error) {
      console.error('Error in fetchShipments:', error);
    } finally {
      setLoadingShipments(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchShipments();
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inventory_transaction' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    const shipmentsChannel = supabase
      .channel('shipment-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipment' },
        () => fetchShipments()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      shipmentsChannel.unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleQuickAction = (type: TransactionShortcut) => {
    router.push({ pathname: '/(tabs)/transactions', params: { type } });
  };

  const dashboardStats = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + product.quantity_on_hand, 0);
    const lowStockProducts = products.filter(
      (product) => product.quantity_on_hand < product.min_stock_threshold
    );
    const totalProducts = products.length;
    const totalValue = products.reduce(
      (sum, product) => sum + product.quantity_on_hand * product.price,
      0
    );
    const categoryStats = products.reduce((acc, product) => {
      const categoryName = product.category_name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = { count: 0, stock: 0 };
      }
      acc[categoryName].count += 1;
      acc[categoryName].stock += product.quantity_on_hand;
      return acc;
    }, {} as Record<string, { count: number; stock: number }>);

    return { totalStock, lowStockProducts, totalProducts, totalValue, categoryStats };
  }, [products]);

  const shipmentSummary = useMemo(() => {
    const inbound = shipments.filter((s) => s.direction === 'inbound');
    const outbound = shipments.filter((s) => s.direction === 'outbound');
    const delayed = shipments.filter((s) => s.status === 'delayed');
    const nextEta = shipments
      .filter((s) => s.eta)
      .sort((a, b) => new Date(a.eta || '').getTime() - new Date(b.eta || '').getTime())[0];

    return {
      inboundCount: inbound.length,
      outboundCount: outbound.length,
      delayedCount: delayed.length,
      nextEta: nextEta?.eta ?? null,
    };
  }, [shipments]);

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const { totalProducts, totalStock, totalValue, lowStockProducts, categoryStats } = dashboardStats;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Dashboard
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>
            Inventory Overview
          </ThemedText>
        </View>

        <View style={styles.statsGrid}>
          <ThemedView style={[styles.statCard, styles.card, { backgroundColor: surface, borderColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: tintColor }]}>
              <Ionicons name="cube-outline" size={20} color="#fff" />
            </View>
            <ThemedText style={styles.statValue}>{totalProducts}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedText }]}>Total Products</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, styles.card, { backgroundColor: surface, borderColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: accent }]}>
              <Ionicons name="layers-outline" size={20} color="#fff" />
            </View>
            <ThemedText style={styles.statValue}>{totalStock}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedText }]}>Total Stock</ThemedText>
          </ThemedView>

          <ThemedView
            style={[
              styles.statCard,
              styles.card,
              { backgroundColor: surface, borderColor: lowStockProducts.length ? danger : borderColor },
            ]}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: lowStockProducts.length ? danger : success },
              ]}>
              <Ionicons
                name={lowStockProducts.length ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={20}
                color="#fff"
              />
            </View>
            <ThemedText style={styles.statValue}>{lowStockProducts.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedText }]}>Low Stock Items</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, styles.card, { backgroundColor: surface, borderColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: success }]}>
              <Ionicons name="cash-outline" size={20} color="#fff" />
            </View>
            <ThemedText style={styles.statValue}>₱{totalValue.toLocaleString()}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedText }]}>Inventory Value</ThemedText>
          </ThemedView>
        </View>

        {lowStockProducts.length > 0 && (
          <ThemedView style={[styles.section, styles.card, { backgroundColor: surface, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={20} color={danger} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Low Stock Alerts
              </ThemedText>
            </View>
            {lowStockProducts.map((product) => (
              <View key={product.sku} style={[styles.alertItem, { borderColor }]}>
                <View style={styles.alertItemLeft}>
                  <ThemedText style={styles.productName}>{product.name}</ThemedText>
                  <ThemedText style={[styles.productSku, { color: mutedText }]}>
                    SKU: {product.sku}
                  </ThemedText>
                </View>
                <View style={styles.alertItemRight}>
                  <View style={[styles.stockBadge, { backgroundColor: `${danger}20` }]}>
                    <ThemedText style={[styles.stockBadgeText, { color: danger }]}>
                      {product.quantity_on_hand} left
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </ThemedView>
        )}

        <ThemedView style={[styles.section, styles.card, { backgroundColor: surface, borderColor }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart-outline" size={20} color={tintColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Category Breakdown
            </ThemedText>
          </View>
          {Object.entries(categoryStats).map(([category, stats]) => (
            <View key={category} style={[styles.categoryItem, { borderColor }]}>
              <View style={styles.categoryLeft}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: getCategoryColor(category, accent, tintColor) },
                  ]}
                />
                <ThemedText style={styles.categoryName}>{category}</ThemedText>
              </View>
              <View style={styles.categoryRight}>
                <ThemedText style={styles.categoryValue}>{stats.count} products</ThemedText>
                <ThemedText style={[styles.categoryStock, { color: mutedText }]}>
                  {stats.stock} units
                </ThemedText>
              </View>
            </View>
          ))}
        </ThemedView>

        <ThemedView style={[styles.section, styles.card, { backgroundColor: surface, borderColor }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={20} color={accent} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Logistics Snapshot
            </ThemedText>
          </View>
          {loadingShipments ? (
            <ThemedText style={{ color: mutedText }}>Loading shipments…</ThemedText>
          ) : shipments.length === 0 ? (
            <ThemedText style={{ color: mutedText }}>No shipments tracked yet.</ThemedText>
          ) : (
            <>
              <View style={styles.logisticsRow}>
                <View>
                  <ThemedText style={styles.logisticsValue}>{shipmentSummary.inboundCount}</ThemedText>
                  <ThemedText style={[styles.logisticsLabel, { color: mutedText }]}>
                    Inbound
                  </ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.logisticsValue}>{shipmentSummary.outboundCount}</ThemedText>
                  <ThemedText style={[styles.logisticsLabel, { color: mutedText }]}>
                    Outbound
                  </ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.logisticsValue}>{shipmentSummary.delayedCount}</ThemedText>
                  <ThemedText style={[styles.logisticsLabel, { color: mutedText }]}>
                    Delayed
                  </ThemedText>
                </View>
              </View>
              {shipmentSummary.nextEta && (
                <View style={styles.logisticsEta}>
                  <Ionicons name="calendar-outline" size={16} color={mutedText} />
                  <ThemedText style={[styles.logisticsEtaText, { color: mutedText }]}>
                    Next delivery ETA {new Date(shipmentSummary.nextEta).toLocaleDateString()}
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </ThemedView>

        <ThemedView style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tintColor }]}
            onPress={() => handleQuickAction('Stock In')}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <ThemedText style={styles.actionText}>Stock In</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: danger }]}
            onPress={() => handleQuickAction('Stock Out')}>
            <Ionicons name="remove-circle-outline" size={22} color="#fff" />
            <ThemedText style={styles.actionText}>Stock Out</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: warning }]}
            onPress={() => handleQuickAction('Adjustment')}>
            <Ionicons name="swap-horizontal-outline" size={22} color="#fff" />
            <ThemedText style={styles.actionText}>Adjust</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

function getCategoryColor(category: string, accent: string, fallback: string): string {
  const colors: Record<string, string> = {
    Women: '#E58BB5',
    Men: '#7BA7F6',
    Unisex: accent,
  };
  return colors[category] || fallback;
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  statCard: {
    flexBasis: '48%',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  alertItemLeft: {
    flex: 1,
  },
  alertItemRight: {
    marginLeft: Spacing.md,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  productSku: {
    fontSize: 12,
  },
  stockBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  },
  categoryStock: {
    fontSize: 12,
    marginTop: Spacing.xs / 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
  },
  actionText: {
    color: '#fff',
    marginTop: Spacing.xs,
    fontSize: 13,
    fontWeight: '600',
  },
  logisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  logisticsValue: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  logisticsLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  logisticsEta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  logisticsEtaText: {
    fontSize: 12,
  },
});
