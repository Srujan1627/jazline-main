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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../utils/api';
import { Address } from '../../types';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { cart, getCartTotal, clearCart } = useCart();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find(addr => addr.is_default);
      setSelectedAddress(defaultAddr || user.addresses[0]);
    }
  }, [user]);

  const subtotal = getCartTotal();
  const tax = subtotal * 0.18;
  const deliveryCharges = subtotal > 500 ? 0 : 50;
  const total = subtotal + tax + deliveryCharges;

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        user_id: user._id,
        items: cart.map(item => ({
          product_id: item.product._id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.selling_price || item.product.mrp,
          image: item.product.image,
        })),
        address: selectedAddress,
        payment_method: paymentMethod,
      };

      const order = await createOrder(orderData);
      await clearCart();
      Alert.alert(
        'Order Placed!',
        `Your order has been placed successfully. Order ID: ${order._id.slice(-8)}`,
        [
          {
            text: 'View Orders',
            onPress: () => router.replace('/(tabs)/orders'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
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
                <Ionicons name="location" size={20} color="#2196F3" />
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
              <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
              <Text style={styles.addAddressText}>Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.itemCount}>{cart.length} item(s)</Text>
            {cart.map((item) => (
              <View key={item.product._id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.product.name} x {item.quantity}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ₹{(item.product.selling_price || item.product.mrp) * item.quantity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {['UPI', 'CARD', 'COD'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  paymentMethod === method && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Ionicons
                  name={
                    method === 'UPI'
                      ? 'phone-portrait-outline'
                      : method === 'CARD'
                      ? 'card-outline'
                      : 'cash-outline'
                  }
                  size={24}
                  color={paymentMethod === method ? '#2196F3' : '#666'}
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
                  <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tax (18% GST)</Text>
              <Text style={styles.priceValue}>₹{tax.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charges</Text>
              {deliveryCharges === 0 ? (
                <Text style={styles.freeText}>FREE</Text>
              ) : (
                <Text style={styles.priceValue}>₹{deliveryCharges}</Text>
              )}
            </View>
            <View style={styles.separator} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order - ₹{total.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
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
  },
  changeText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
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
    borderColor: '#2196F3',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 8,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 12,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  paymentText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  paymentTextActive: {
    color: '#2196F3',
    fontWeight: '600',
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
  freeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    color: '#2196F3',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  placeOrderButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});