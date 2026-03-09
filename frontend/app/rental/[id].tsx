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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProduct } from '../../utils/api';
import { Product } from '../../types';

export default function RentalDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState('30');
  const [rentalType, setRentalType] = useState<'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await getProduct(id as string);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const calculateRentalCost = () => {
    if (!product) return { rental: 0, deposit: 0, delivery: 0, total: 0 };

    const days = parseInt(duration) || 0;
    let rentalPrice = 0;

    if (rentalType === 'weekly') {
      rentalPrice = (product.rental_price_per_week || 0) * (days / 7);
    } else {
      rentalPrice = (product.rental_price_per_month || 0) * (days / 30);
    }

    const deposit = product.security_deposit || 0;
    const delivery = 100; // Fixed delivery charge for rentals
    const gst = Math.round(rentalPrice * 0.18);
    const total = rentalPrice + gst + deposit + delivery;

    return {
      rental: Math.round(rentalPrice),
      gst,
      deposit,
      delivery,
      total: Math.round(total),
    };
  };

  const handleProceedToBook = () => {
    if (!product) return;
    const cost = calculateRentalCost();
    router.push({
      pathname: '/rental/booking',
      params: {
        productId: product._id,
        productName: product.name,
        duration,
        rentalType,
        ...cost,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
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

  const cost = calculateRentalCost();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rental Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Product Image */}
        <Image source={{ uri: product.image }} style={styles.productImage} />

        {/* Product Info */}
        <View style={styles.contentContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Rental Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Pricing</Text>
            <View style={styles.pricingCard}>
              <View style={styles.priceRow}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
                <Text style={styles.priceLabel}>Weekly:</Text>
                <Text style={styles.priceValue}>
                  ₹{product.rental_price_per_week}/week
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Ionicons name="calendar" size={20} color="#4CAF50" />
                <Text style={styles.priceLabel}>Monthly:</Text>
                <Text style={styles.priceValue}>
                  ₹{product.rental_price_per_month}/month
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Ionicons name="shield-checkmark" size={20} color="#666" />
                <Text style={styles.priceLabel}>Security Deposit:</Text>
                <Text style={styles.priceValue}>₹{product.security_deposit}</Text>
              </View>
            </View>
          </View>

          {/* Rental Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Rental Plan</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  rentalType === 'weekly' && styles.typeButtonActive,
                ]}
                onPress={() => setRentalType('weekly')}
              >
                <Text
                  style={[
                    styles.typeText,
                    rentalType === 'weekly' && styles.typeTextActive,
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  rentalType === 'monthly' && styles.typeButtonActive,
                ]}
                onPress={() => setRentalType('monthly')}
              >
                <Text
                  style={[
                    styles.typeText,
                    rentalType === 'monthly' && styles.typeTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Duration Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Duration (days)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={duration}
              onChangeText={setDuration}
              placeholder="Enter number of days"
            />
          </View>

          {/* Cost Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            <View style={styles.costCard}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Rental Charges</Text>
                <Text style={styles.costValue}>₹{cost.rental}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>GST (18%)</Text>
                <Text style={styles.costValue}>₹{cost.gst}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Security Deposit</Text>
                <Text style={styles.costValue}>₹{cost.deposit}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Delivery Charges</Text>
                <Text style={styles.costValue}>₹{cost.delivery}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.costRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{cost.total}</Text>
              </View>
              <Text style={styles.depositNote}>
                * Security deposit will be refunded after equipment return
              </Text>
            </View>
          </View>

          {/* What's Included */}
          {product.whats_included && product.whats_included.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              {product.whats_included.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Damage Policy */}
          {product.damage_policy && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Damage Policy</Text>
              <View style={styles.policyCard}>
                <Ionicons name="information-circle" size={20} color="#FF9800" />
                <Text style={styles.policyText}>{product.damage_policy}</Text>
              </View>
              <Text style={styles.lateFeeText}>
                Late fee: ₹{product.late_fee_per_day}/day
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {product.stock > 0 ? (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleProceedToBook}
          >
            <Text style={styles.bookButtonText}>Proceed to Book</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomActions}>
          <View style={styles.unavailableButton}>
            <Text style={styles.unavailableText}>Currently Unavailable</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
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
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productImage: {
    width: '100%',
    height: 250,
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
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
  pricingCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#4CAF50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  costCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
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
    color: '#4CAF50',
  },
  depositNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
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
  policyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
  },
  policyText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  lateFeeText: {
    fontSize: 13,
    color: '#FF9800',
    marginTop: 8,
    fontWeight: '600',
  },
  bottomActions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unavailableButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  unavailableText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
});