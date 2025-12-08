import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProducts, searchProducts } from '@/lib/api/products';
import { CurrentStock } from '@/lib/types';

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

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

  const renderProductCard = ({ item }: { item: CurrentStock }) => {
    const isLowStock = item.quantity_on_hand <= item.min_stock_threshold;

    return (
      <TouchableOpacity activeOpacity={0.7}>
        <ThemedView style={[styles.productCard, styles.card]}>
          {/* Header with SKU and Volume */}
          <View style={styles.cardHeader}>
            <View style={styles.skuBadge}>
              <ThemedText style={styles.skuText}>{item.sku}</ThemedText>
            </View>
            <View style={[styles.volumeBadge, { backgroundColor: tintColor + '20' }]}>
              <Ionicons name="water-outline" size={12} color={tintColor} />
              <ThemedText style={[styles.volumeText, { color: tintColor }]}>
                {item.volume_ml}ml
              </ThemedText>
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
});
