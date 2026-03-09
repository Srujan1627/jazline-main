import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { createRental } from '../../utils/api';
import { Address } from '../../types';
import { Colors } from '../../constants/Theme';

export default function RentalBookingScreen() {
  const { productId, productName, duration, rentalPrice, gst, deposit, delivery } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find(addr => addr.is_default);
      setSelectedAddress(defaultAddr || user.addresses[0]);
    }
  }, [user]);

  const totalAmount = Number(rentalPrice) + Number(gst) + Number(deposit) + Number(delivery);

  const handleBookRental = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Error', 'Please accept the rental agreement');
      return;
    }

    setLoading(true);
    try {
      const rentalData = {
        user_id: user._id,
        product_id: productId as string,
        rental_duration: Number(duration),
        rental_type: 'daily',
        address: selectedAddress,
        payment_method: paymentMethod,
      };

      await createRental(rentalData);
      Alert.alert(
        'Rental Request Submitted!',
        'Your rental request has been received. We will contact you shortly for confirmation.',
        [
          {
            text: 'View Rentals',
            onPress: () => router.replace('/(tabs)/orders'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create rental');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Rental Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Details</Text>
          <View style={styles.infoCard}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.duration}>Duration: {duration} days</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/profile/addresses')}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.addressName}>{selectedAddress.name}</Text>
              </View>
              <Text style={styles.addressText}>{selectedAddress.address_line1}</Text>
              {selectedAddress.address_line2 && (
                <Text style={styles.addressText}>{selectedAddress.address_line2}</Text>
              )}
              <Text style={styles.addressText}>
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
              <Text style={styles.addressPhone}>Phone: {selectedAddress.phone}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => router.push('/profile/addresses')}
            >
              <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
              <Text style={styles.addAddressText}>Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {['UPI', 'CARD'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  paymentMethod === method && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Ionicons
                  name={method === 'UPI' ? 'phone-portrait-outline' : 'card-outline'}
                  size={24}
                  color={paymentMethod === method ? Colors.primary : '#666'}
                />
                <Text
                  style={[
                    styles.paymentText,
                    paymentMethod === method && styles.paymentTextActive,
                  ]}
                >
                  {method}
                </Text>
                {paymentMethod === method && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rental Agreement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Agreement</Text>
          <View style={styles.agreementCard}>
            <Text style={styles.agreementText}>
              • Equipment must be returned in working condition
            </Text>
            <Text style={styles.agreementText}>
              • Security deposit will be refunded after inspection
            </Text>
            <Text style={styles.agreementText}>
              • Late returns will incur additional charges
            </Text>
            <Text style={styles.agreementText}>
              • Equipment is clinically sanitized before delivery
            </Text>
            <Text style={styles.agreementText}>
              • Free maintenance and support included
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <Ionicons
              name={agreedToTerms ? 'checkbox' : 'square-outline'}
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.checkboxText}>I accept the rental agreement</Text>
          </TouchableOpacity>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Rental Charges</Text>
              <Text style={styles.priceValue}>₹{rentalPrice}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>₹{gst}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Security Deposit</Text>
              <Text style={styles.priceValue}>₹{deposit}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charges</Text>
              <Text style={styles.priceValue}>₹{delivery}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{totalAmount}</Text>
            </View>
            <Text style={styles.depositNote}>* Deposit refunded after return</Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.disabledButton]}
          onPress={handleBookRental}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking - ₹{totalAmount}</Text>
          )}
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  changeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 8,
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  addressCard: {
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  paymentText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  paymentTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  agreementCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  agreementText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  priceCard: {
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 12,
  },
  priceRow: {
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
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});