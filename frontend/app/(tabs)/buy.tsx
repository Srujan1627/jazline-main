import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import { getProducts } from '../../utils/api';
import { Product } from '../../types';
import { Colors } from '../../constants/Theme';

export default function BuyScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const { addToCart, addToWishlist, isInWishlist, cart } = useCart();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (productName: string) => {
    setToastMessage(`${productName} added to cart!`);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      const buyableProducts = data.filter((p: Product) =>
        p.category === 'buy_only' || p.category === 'hybrid'
      );
      setProducts(buyableProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchFiltered = searchQuery
    ? products.filter((product) =>
      product.name?.toLowerCase().includes(searchQuery?.toLowerCase())
    )
    : products;

  const filteredProducts = category
    ? searchFiltered.filter((p) =>
      p.name?.toLowerCase().includes(category.toString().toLowerCase())
    )
    : searchFiltered;

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discount = (mrp: number, price: number) => Math.round(((mrp - price) / mrp) * 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast Notification */}
      <Animated.View style={[
        styles.toast,
        { opacity: toastOpacity, transform: [{ translateY: toastOpacity.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
      ]} pointerEvents="none">
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shop</Text>
          <Text style={styles.subtitle}>{filteredProducts.length} products available</Text>
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="cart-outline" size={24} color="#1A2138" />
          {cartItemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#90A4AE" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medical equipment..."
          placeholderTextColor="#B0BEC5"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#B0BEC5" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredProducts.length > 0 ? (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product._id}
                  style={styles.productCard}
                  onPress={() => router.push(`/products/${product._id}`)}
                  activeOpacity={0.9}
                >
                  {/* Image Container */}
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                      resizeMode="contain"
                      defaultSource={require('../../assets/images/app-image.png')}
                    />
                    {/* Wishlist */}
                    <TouchableOpacity
                      style={styles.wishlistButton}
                      onPress={(e) => { e.stopPropagation(); addToWishlist(product); }}
                    >
                      <Ionicons
                        name={isInWishlist(product._id) ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isInWishlist(product._id) ? '#FF5252' : '#90A4AE'}
                      />
                    </TouchableOpacity>
                    {/* Discount Badge */}
                    {product.selling_price && product.selling_price < product.mrp && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          {discount(product.mrp, product.selling_price)}% OFF
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Product Info */}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color="#FFC107" />
                      <Text style={styles.ratingText}>{product.average_rating || 0}</Text>
                      <Text style={styles.reviewCount}>({(product.reviews || []).length})</Text>
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₹{(product.selling_price || product.mrp).toLocaleString()}</Text>
                      {product.selling_price && product.selling_price < product.mrp && (
                        <Text style={styles.mrp}>₹{product.mrp.toLocaleString()}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.addButton, product.stock <= 0 && styles.addButtonDisabled]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (product.stock > 0) {
                          addToCart(product, 1);
                          showToast(product.name);
                        }
                      }}
                      disabled={product.stock <= 0}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={product.stock > 0 ? "cart-outline" : "close-circle-outline"}
                        size={16}
                        color="#FFF"
                      />
                      <Text style={styles.addButtonText}>
                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={40} color="#B0BEC5" />
              </View>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2138',
    letterSpacing: -0.5,
    fontFamily: "'Playfair Display', 'Times New Roman', serif",
  },
  subtitle: {
    fontSize: 13,
    color: '#90A4AE',
    fontWeight: '500',
    marginTop: 2,
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F5F7FA',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A2138',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '800',
  },
  productInfo: {
    padding: 14,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2138',
    marginBottom: 6,
    lineHeight: 20,
    minHeight: 40,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#455A64',
  },
  reviewCount: {
    fontSize: 12,
    color: '#90A4AE',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  mrp: {
    fontSize: 13,
    color: '#B0BEC5',
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#CFD8DC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#455A64',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#90A4AE',
  },
  toast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: '#1B5E20',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    zIndex: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});