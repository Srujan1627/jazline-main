import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import { Colors } from '../../constants/Theme';

export default function WishlistScreen() {
  const router = useRouter();
  const { wishlist, removeFromWishlist, addToCart } = useCart();

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    Alert.alert('Success', `${product.name} added to cart!`);
  };

  const handleRemove = (productId: string, productName: string) => {
    Alert.alert('Remove from Wishlist', `Remove ${productName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromWishlist(productId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#CCC" />
          <Text style={styles.emptyText}>Your wishlist is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/buy')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.count}>{wishlist.length} items</Text>
          <View style={styles.gridContainer}>
            {wishlist.map((product) => (
              <View key={product._id} style={styles.productCard}>
                <TouchableOpacity onPress={() => router.push(`/products/${product._id}`)}>
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(product._id, product.name)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF5252" />
                </TouchableOpacity>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    ₹{product.selling_price || product.mrp}
                  </Text>
                  {product.stock > 0 ? (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddToCart(product)}
                    >
                      <Ionicons name="cart" size={16} color="#FFFFFF" />
                      <Text style={styles.addButtonText}>Add to Cart</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.outOfStock}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: '1%',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  outOfStock: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
  },
});