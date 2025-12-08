import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProducts, searchProducts } from '@/lib/api/products';
import { CurrentStock } from '@/lib/types';

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'textMuted');
  const dangerColor = useThemeColor({}, 'danger');
  
  const [products, setProducts] = useState<CurrentStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

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

  const categories = ['All', ...new Set(products.map(p => p.category_name || 'Uncategorized').filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || (product.category_name || 'Uncategorized') === selectedCategory;
    return matchesCategory;
  });

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Women: '#E58BB5',
      Men: '#7BA7F6',
      Unisex: '#8B7AF6',
    };
    return colors[category] || '#A3A09A';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const renderProductCard = ({ item }: { item: CurrentStock }) => {
    const categoryName = item.category_name || 'Uncategorized';
    const isLowStock = item.quantity_on_hand < item.min_stock_threshold;
    const categoryColor = getCategoryColor(categoryName);

    return (
      <TouchableOpacity activeOpacity={0.85}>
        <ThemedView
          style={[
            styles.productCard,
            styles.card,
            {
              backgroundColor: surfaceColor,
              borderColor,
            },
          ]}>
          <View style={styles.cardHeader}>
            <View style={[styles.skuBadge, { backgroundColor: surfaceAlt }]}>
              <ThemedText style={[styles.skuText, { color: mutedColor }]}>{item.sku}</ThemedText>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
              <ThemedText style={[styles.categoryText, { color: categoryColor }]}>{categoryName}</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.productName}>{item.name}</ThemedText>

          <View style={styles.cardFooter}>
            <View style={styles.stockContainer}>
              <Ionicons
                name={isLowStock ? 'alert-circle' : 'cube'}
                size={16}
                color={isLowStock ? dangerColor : tintColor}
              />
              <ThemedText
                style={[
                  styles.stockText,
                  {
                    color: isLowStock ? dangerColor : mutedColor,
                  },
                ]}>
                {item.quantity_on_hand} in stock
              </ThemedText>
            </View>
            <ThemedText style={styles.priceText}>₱{item.price.toLocaleString()}</ThemedText>
          </View>

          {isLowStock && (
            <View
              style={[
                styles.lowStockBanner,
                {
                  borderColor,
                  backgroundColor: `${dangerColor}10`,
                },
              ]}>
              <Ionicons name="warning" size={14} color={dangerColor} />
              <ThemedText style={[styles.lowStockBannerText, { color: dangerColor }]}>
                Low Stock Alert
              </ThemedText>
            </View>
          )}
        </ThemedView>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Products</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </ThemedText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <ThemedView style={[styles.searchContainer, { borderColor, backgroundColor: surfaceColor }]}>
          <Ionicons name="search-outline" size={20} color={tintColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search by name or SKU..."
            placeholderTextColor={mutedColor}
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
              <Ionicons name="close-circle" size={20} color={mutedColor} />
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.iconButton, { borderColor, backgroundColor: surfaceColor }]}>
            <Ionicons name="barcode-outline" size={24} color={tintColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { borderColor, backgroundColor: surfaceColor }]}>
            <Ionicons name="add-circle-outline" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categorySection}>
        <View style={styles.categoryList}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === category ? tintColor : surfaceAlt,
                  borderColor,
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <ThemedText
                style={[
                  styles.categoryChipText,
                  {
                    color: selectedCategory === category ? '#fff' : mutedColor,
                  }
                ]}
              >
                {category}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Products List */}
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={item => item.sku}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <ThemedView style={[styles.emptyState, styles.card, { backgroundColor: surfaceColor, borderColor }]}>
              <Ionicons name="cube-outline" size={64} color={mutedColor} />
              <ThemedText style={styles.emptyText}>No products found</ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: mutedColor }]}>
                Try adjusting your search or filters
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
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  searchSection: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  categorySection: {
    marginBottom: Spacing.md,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  productCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  skuBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radii.sm,
  },
  skuText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radii.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stockText: {
    fontSize: 14,
  },
  lowStockText: {
    fontWeight: '600',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
  },
  lowStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lowStockBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
    marginTop: Spacing.xl,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
});
