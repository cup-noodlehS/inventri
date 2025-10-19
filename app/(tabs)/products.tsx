import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Product } from '@/components/product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { products as mockProducts } from '@/data/products';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  const [products] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Women: '#EC4899',
      Men: '#3B82F6',
      Unisex: '#8B5CF6',
    };
    return colors[category] || '#6B7280';
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const isLowStock = item.stock < item.lowStockThreshold;
    
    return (
      <TouchableOpacity activeOpacity={0.7}>
        <ThemedView style={[styles.productCard, styles.card]}>
          {/* Header with SKU and Category */}
          <View style={styles.cardHeader}>
            <View style={styles.skuBadge}>
              <ThemedText style={styles.skuText}>{item.sku}</ThemedText>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
              <ThemedText style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                {item.category}
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
                {item.stock} in stock
              </ThemedText>
            </View>
            <ThemedText style={styles.priceText}>₱{item.price.toLocaleString()}</ThemedText>
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
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
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
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.iconButton, { borderColor: tintColor }]}>
            <Ionicons name="barcode-outline" size={24} color={tintColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { borderColor: tintColor }]}>
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
                selectedCategory === category && { backgroundColor: tintColor }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <ThemedText
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive
                ]}
              >
                {category}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedView style={[styles.emptyState, styles.card]}>
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <ThemedText style={styles.emptyText}>No products found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Try adjusting your search or filters
            </ThemedText>
          </ThemedView>
        }
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
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  categorySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
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
});
