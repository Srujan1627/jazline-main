import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Colors } from '../../constants/Theme';

const API_URL = 'https://jazline-backend-v84.onrender.com/api';

export default function KitDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [kit, setKit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKit();
  }, [id]);

  const loadKit = async () => {
    try {
      const response = await axios.get(`${API_URL}/kits/${id}`);
      setKit(response.data);
    } catch (error) {
      console.error('Error loading kit:', error);
      Alert.alert('Error', 'Failed to load kit details');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToBooking = () => {
    Alert.alert(
      'Kit Booking',
      'This will proceed to book the complete care kit with both rental and purchase items.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => {
          // Navigate to kit booking flow (can be implemented)
          Alert.alert('Success', 'Kit booking flow will be implemented here');
        }},
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!kit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Kit not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kit Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Kit Image */}
        <View style={styles.imageSection}>
          <Image source={{ uri: kit.image }} style={styles.productImage} resizeMode="contain" />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Kit Name */}
          <Text style={styles.kitName}>{kit.name}</Text>
          <Text style={styles.bestFor}>{kit.best_for}</Text>

          {/* Savings Badge */}
          {kit.savings > 0 && (
            <View style={styles.savingsBadge}>
              <Ionicons name="pricetag" size={20} color={Colors.success} />
              <Text style={styles.savingsText}>Save ₹{kit.savings} with this kit!</Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{kit.description}</Text>

          {/* Pricing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kit Pricing</Text>
            <View style={styles.pricingCard}>
              <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                  <Ionicons name="sync" size={20} color={Colors.primary} />
                  <View style={styles.priceInfo}>
                    <Text style={styles.priceLabel}>Rental Items (Monthly)</Text>
                    <Text style={styles.priceValue}>₹{kit.total_rent_price}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                  <Ionicons name="cart" size={20} color={Colors.info} />
                  <View style={styles.priceInfo}>
                    <Text style={styles.priceLabel}>Purchase Items (One-time)</Text>
                    <Text style={styles.priceValue}>₹{kit.total_buy_price}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.separator} />
              <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                  <Ionicons name="shield-checkmark" size={20} color="#666" />
                  <View style={styles.priceInfo}>
                    <Text style={styles.priceLabel}>Security Deposit (Refundable)</Text>
                    <Text style={styles.depositValue}>₹{kit.security_deposit}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Rental Items */}
          {kit.rent_items && kit.rent_items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items to Rent</Text>
              <View style={styles.itemsCard}>
                {kit.rent_items.map((item: any, index: number) => (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name="sync-circle" size={18} color={Colors.primary} />
                    <Text style={styles.listText}>{item.product_name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Purchase Items */}
          {kit.buy_items && kit.buy_items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items to Buy</Text>
              <View style={styles.itemsCard}>
                {kit.buy_items.map((item: any, index: number) => (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name="cart" size={18} color={Colors.info} />
                    <Text style={styles.listText}>{item.product_name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Choose This Kit?</Text>
            <View style={styles.benefitsCard}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.benefitText}>Complete care solution in one package</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.benefitText}>Save ₹{kit.savings} vs individual purchase</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.benefitText}>Rent equipment, own consumables</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.benefitText}>Flexible rental duration</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomActions}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total (First Month)</Text>
          <Text style={styles.totalValue}>
            ₹{kit.total_rent_price + kit.total_buy_price + kit.security_deposit}
          </Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleProceedToBooking}>
          <Text style={styles.bookButtonText}>Proceed to Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  imageSection: {
    width: '100%',
    height: 320,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 64, // Add padding to avoid overlapping with header
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
  },
  kitName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bestFor: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 16,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  savingsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pricingCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    marginBottom: 16,
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  depositValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 8,
  },
  itemsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  listText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  benefitsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  bottomActions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
