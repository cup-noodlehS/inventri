import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CurrentStock } from '@/lib/types';

interface ProductInfoCardProps {
  product: CurrentStock;
}

export function ProductInfoCard({ product }: ProductInfoCardProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.productName}>{product.name}</ThemedText>
      <ThemedText style={styles.productDetails}>
        SKU: {product.sku} • {product.volume_ml}ml • ₱{product.price.toFixed(2)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  productDetails: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});

