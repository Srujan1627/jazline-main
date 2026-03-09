import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProduct } from '../../utils/api';
import { useCart } from '../../contexts/CartContext';
import { Product } from '../../types';
import { Colors } from '../../constants/Theme';

export default function HybridProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, addToWishlist, isInWishlist } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'buy' | 'rent'>('buy'); // Hybrid toggle
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(30);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await getProduct(id as string);
      setProduct(data);
      // Set default mode based on product category
      if (data.category === 'rent_only') {
        setMode('rent');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const calculateRentalPrice = () => {
    if (!product) return 0;
    const days = rentalDays;
    if (product.rental_price_per_day) {
      return product.rental_price_per_day * days;
    }
    if (days <= 7 && product.rental_price_per_week) {
      return product.rental_price_per_week;
    }
    if (days <= 30 && product.rental_price_per_month) {
      return product.rental_price_per_month;
    }
    // Calculate for longer periods
    const months = Math.ceil(days / 30);
    return (product.rental_price_per_month || 0) * months;
  };

  const handleAddToCart = () => {
    if (product && mode === 'buy') {
      addToCart(product, quantity);
      Alert.alert('Success', `${product.name} added to cart!`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/cart') },
      ]);
    }
  };

  const handleRentNow = () => {
    if (product) {
      router.push({
        pathname: '/rental/booking',
        params: {
          productId: product._id,
          productName: product.name,
          duration: rentalDays,
          rentalPrice: calculateRentalPrice(),
          deposit: product.security_deposit || 0,
          delivery: 100,
        },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const isHybrid = product.category === 'hybrid';
  const canBuy = product.category === 'hybrid' || product.category === 'buy_only';
  const canRent = product.category === 'hybrid' || product.category === 'rent_only';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.wishlistButton} onPress={() => addToWishlist(product)}>
            <Ionicons
              name={isInWishlist(product._id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isInWishlist(product._id) ? '#FF5252' : '#333'}
            />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <View style={styles.imageSection}>
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Product Name */}
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.bestFor}>{product.best_for}</Text>

          {/* Trust Badges */}
          <View style={styles.badgesContainer}>
            {product.sanitization_certified && (
              <View style={[styles.badge, { backgroundColor: Colors.primaryBg }]}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
                <Text style={[styles.badgeText, { color: Colors.primary }]}>Sanitized</Text>
              </View>
            )}
            {product.maintenance_included && (
              <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="construct" size={14} color={Colors.success} />
                <Text style={[styles.badgeText, { color: Colors.success }]}>Maintenance</Text>
              </View>
            )}
            {product.emi_available && (
              <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="card" size={14} color={Colors.info} />
                <Text style={[styles.badgeText, { color: Colors.info }]}>0% EMI</Text>
              </View>
            )}
          </View>

          {/* Hybrid Toggle */}
          {isHybrid && (
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, mode === 'buy' && styles.toggleButtonActive]}
                onPress={() => setMode('buy')}
              >
                <Ionicons name="cart" size={20} color={mode === 'buy' ? '#FFF' : Colors.info} />
                <Text style={[styles.toggleText, mode === 'buy' && styles.toggleTextActive]}>
                  BUY
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, mode === 'rent' && styles.toggleButtonActiveRent]}
                onPress={() => setMode('rent')}
              >
                <Ionicons name="sync" size={20} color={mode === 'rent' ? '#FFF' : Colors.primary} />
                <Text style={[styles.toggleText, mode === 'rent' && styles.toggleTextActiveRent]}>
                  RENT
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Buy Mode */}
          {mode === 'buy' && canBuy && (
            <View style={styles.pricingSection}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{product.selling_price}</Text>
                <Text style={styles.mrp}>₹{product.mrp}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {Math.round(((product.mrp - (product.selling_price || 0)) / product.mrp) * 100)}% OFF
                  </Text>
                </View>
              </View>

              {/* EMI Options */}
              {product.emi_available && product.emi_plans && product.emi_plans.length > 0 && (
                <View style={styles.emiContainer}>
                  <Text style={styles.emiTitle}>0% EMI Available</Text>
                  {product.emi_plans.map((plan: any, index: number) => (
                    <View key={index} style={styles.emiOption}>
                      <Text style={styles.emiText}>
                        {plan.tenure} months @ ₹{plan.monthly_emi}/mo
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <View style={styles.quantitySection}>
                  <Text style={styles.sectionTitle}>Quantity</Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Ionicons name="remove" size={20} color={Colors.info} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    >
                      <Ionicons name="add" size={20} color={Colors.info} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Rent Mode */}
          {mode === 'rent' && canRent && (
            <View style={styles.pricingSection}>
              {/* Duration Slider */}
              <View style={styles.durationSection}>
                <Text style={styles.sectionTitle}>Rental Duration: {rentalDays} days</Text>
                <View style={styles.durationOptions}>
                  {[7, 14, 30, 60, 90].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[
                        styles.durationChip,
                        rentalDays === days && styles.durationChipActive,
                      ]}
                      onPress={() => setRentalDays(days)}
                    >
                      <Text
                        style={[
                          styles.durationChipText,
                          rentalDays === days && styles.durationChipTextActive,
                        ]}
                      >
                        {days}d
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rental Pricing */}
              <View style={styles.rentalPriceCard}>
                <View style={styles.priceDetailRow}>
                  <Text style={styles.priceLabel}>Rental Charges</Text>
                  <Text style={styles.priceValue}>₹{calculateRentalPrice()}</Text>
                </View>
                <View style={styles.priceDetailRow}>
                  <Text style={styles.priceLabel}>Security Deposit</Text>
                  <Text style={styles.priceValue}>₹{product.security_deposit}</Text>
                </View>
                <View style={styles.priceDetailRow}>
                  <Text style={styles.priceLabel}>Delivery</Text>
                  <Text style={styles.priceValue}>₹100</Text>
                </View>
                <View style={styles.separator} />
                <View style={styles.priceDetailRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ₹{calculateRentalPrice() + (product.security_deposit || 0) + 100}
                  </Text>
                </View>
                <Text style={styles.depositNote}>* Deposit refunded after return</Text>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* What's Included */}
          {product.whats_included && product.whats_included.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              {product.whats_included.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {product.stock > 0 && (
        <View style={styles.bottomActions}>
          {mode === 'buy' ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleAddToCart}>
              <Ionicons name="cart" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.primary }]}
              onPress={handleRentNow}
            >
              <Ionicons name="sync" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Rent Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wishlistButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageSection: {
    width: '100%',
    height: 320,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A2138',
    marginBottom: 4,
    fontFamily: "'Playfair Display', 'Times New Roman', serif",
  },
  bestFor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.info,
  },
  toggleButtonActiveRent: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  toggleTextActiveRent: {
    color: '#FFFFFF',
  },
  pricingSection: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginRight: 12,
  },
  mrp: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emiContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  emiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.info,
    marginBottom: 8,
  },
  emiOption: {
    marginBottom: 4,
  },
  emiText: {
    fontSize: 13,
    color: '#666',
  },
  quantitySection: {
    marginTop: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 24,
  },
  durationSection: {
    marginBottom: 16,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  durationChipActive: {
    backgroundColor: Colors.primary,
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  durationChipTextActive: {
    color: '#FFFFFF',
  },
  rentalPriceCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    padding: 16,
  },
  priceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  depositNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  bottomActions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  actionButton: {
    backgroundColor: Colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});