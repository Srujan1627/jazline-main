import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProducts } from '../../utils/api';
import { Product } from '../../types';
import { Colors } from '../../constants/Theme';

export default function RentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      const rentableProducts = data.filter((p: Product) =>
        p.category === 'rent_only' || p.category === 'hybrid'
      );
      setProducts(rentableProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rent</Text>
          <Text style={styles.subtitle}>{filteredProducts.length} equipment available</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="sync-outline" size={24} color="#1A2138" />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#90A4AE" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rental equipment..."
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
                  onPress={() => router.push(`/rental/${product._id}`)}
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
                    {/* Sanitized Badge */}
                    {product.sanitization_certified && (
                      <View style={styles.sanitizedBadge}>
                        <Ionicons name="shield-checkmark" size={10} color="#2E7D32" />
                        <Text style={styles.sanitizedText}>Sanitized</Text>
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
                      <Text style={styles.price}>₹{(product.rental_price_per_month || 0).toLocaleString()}</Text>
                      <Text style={styles.pricePeriod}>/mo</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push(`/rental/${product._id}`);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="sync"
                        size={16}
                        color="#FFF"
                      />
                      <Text style={styles.addButtonText}>View & Rent</Text>
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
              <Text style={styles.emptyTitle}>No Equipment Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
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
  headerIcon: {
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
  sanitizedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sanitizedText: {
    color: '#2E7D32',
    fontSize: 10,
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
    gap: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  pricePeriod: {
    fontSize: 12,
    color: '#90A4AE',
    fontWeight: '600',
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
});