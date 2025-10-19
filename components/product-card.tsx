import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export type Product = {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText style={styles.sku}>{product.sku}</ThemedText>
      <ThemedText style={styles.name}>{product.name}</ThemedText>
      <ThemedText style={styles.category}>{product.category}</ThemedText>
      <ThemedView style={styles.details}>
        <ThemedText>Stock: {product.stock}</ThemedText>
        <ThemedText>Price: ${product.price}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sku: {
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    marginVertical: 5,
  },
  category: {
    fontStyle: 'italic',
    marginBottom: 10,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
