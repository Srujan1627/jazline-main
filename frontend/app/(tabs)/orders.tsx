import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getUserOrders, getUserRentals } from '../../utils/api';
import { Order, Rental } from '../../types';
import { Colors } from '../../constants/Theme';
import { useFocusEffect } from 'expo-router';

export default function OrdersScreen() {
  const { user } = useAuth();
  const { cart, getCartTotal, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cart' | 'orders' | 'rentals'>('cart');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const loadData = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [ordersData, rentalsData] = await Promise.all([
        getUserOrders(user._id),
        getUserRentals(user._id),
      ]);
      setOrders(ordersData);
      setRentals(rentalsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      placed: '#1976D2', confirmed: '#2E7D32', shipped: '#E65100', delivered: '#2E7D32',
      cancelled: '#C62828', requested: '#1976D2', approved: '#2E7D32', active: '#2E7D32',
      return_requested: '#E65100', closed: '#78909C',
    };
    return colors[status] || '#78909C';
  };

  const getStatusIcon = (status: string): string => {
    const icons: { [key: string]: string } = {
      placed: 'document-text', confirmed: 'checkmark-circle', shipped: 'car',
      delivered: 'cube', cancelled: 'close-circle', requested: 'document-text',
      approved: 'checkmark-circle', active: 'sync', return_requested: 'return-down-back',
      closed: 'lock-closed',
    };
    return icons[status] || 'document-text';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const cartTotal = getCartTotal();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveFromCart = (productId: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${name} from cart?`)) removeFromCart(productId);
    } else {
      removeFromCart(productId);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        {[
          { key: 'cart' as const, label: `Cart (${cartCount})`, icon: 'cart-outline' as const },
          { key: 'orders' as const, label: 'Orders', icon: 'receipt-outline' as const },
          { key: 'rentals' as const, label: 'Rentals', icon: 'sync-outline' as const },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? '#FFF' : '#90A4AE'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Cart Tab */}
          {activeTab === 'cart' && (
            <>
              {cart.length > 0 ? (
                <>
                  {cart.map((item) => {
                    const price = item.product.selling_price || item.product.mrp;
                    return (
                      <View key={item.product._id} style={styles.cartCard}>
                        <View style={styles.cartInner}>
                          <View style={styles.cartImageContainer}>
                            <Image source={{ uri: item.product.image }} style={styles.cartImage} resizeMode="contain" />
                          </View>
                          <View style={styles.cartInfo}>
                            <Text style={styles.cartProductName} numberOfLines={2}>{item.product.name}</Text>
                            <Text style={styles.cartPrice}>₹{price.toLocaleString()}</Text>
                            <View style={styles.quantityRow}>
                              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product._id, item.quantity - 1)}>
                                <Ionicons name="remove" size={16} color={Colors.primary} />
                              </TouchableOpacity>
                              <Text style={styles.qtyText}>{item.quantity}</Text>
                              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product._id, Math.min(item.product.stock, item.quantity + 1))}>
                                <Ionicons name="add" size={16} color={Colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveFromCart(item.product._id, item.product.name)}>
                                <Ionicons name="trash-outline" size={16} color="#C62828" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={styles.cartItemTotal}>₹{(price * item.quantity).toLocaleString()}</Text>
                        </View>
                      </View>
                    );
                  })}

                  {/* Price Summary */}
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Price Details</Text>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal ({cartCount} items)</Text>
                      <Text style={styles.summaryValue}>₹{cartTotal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tax (18% GST)</Text>
                      <Text style={styles.summaryValue}>₹{Math.round(cartTotal * 0.18).toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery</Text>
                      <Text style={[styles.summaryValue, { color: '#2E7D32', fontWeight: '700' }]}>FREE</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                      <Text style={styles.summaryTotalValue}>₹{Math.round(cartTotal + cartTotal * 0.18).toLocaleString()}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push('/cart/checkout')} activeOpacity={0.8}>
                    <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="cart-outline" size={48} color="#B0BEC5" />
                  <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
                  <Text style={styles.emptySubtitle}>Add items from the Buy or Rent tabs</Text>
                  <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/buy')} activeOpacity={0.8}>
                    <Text style={styles.shopBtnText}>Start Shopping</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <View key={order._id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderId}>Order #{order._id.slice(-8)}</Text>
                        <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.order_status) + '15' }]}>
                        <Ionicons name={getStatusIcon(order.order_status) as any} size={12} color={getStatusColor(order.order_status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(order.order_status) }]}>
                          {order.order_status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.orderItems}>
                      {order.items.map((item, index) => (
                        <Text key={index} style={styles.itemText}>
                          {item.product_name} × {item.quantity}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.orderFooter}>
                      <View>
                        <Text style={styles.footerLabel}>Total</Text>
                        <Text style={styles.footerAmount}>₹{order.total.toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity style={styles.viewDetailBtn}>
                        <Text style={styles.viewDetailText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={48} color="#B0BEC5" />
                  <Text style={styles.emptyTitle}>No Orders Yet</Text>
                  <Text style={styles.emptySubtitle}>Your placed orders will appear here</Text>
                  <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/buy')} activeOpacity={0.8}>
                    <Text style={styles.shopBtnText}>Browse Products</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Rentals Tab */}
          {activeTab === 'rentals' && (
            <>
              {rentals.length > 0 ? (
                rentals.map((rental) => (
                  <View key={rental._id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderId}>Rental #{rental._id.slice(-8)}</Text>
                        <Text style={styles.orderDate}>{formatDate(rental.created_at)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rental.rental_status) + '15' }]}>
                        <Ionicons name={getStatusIcon(rental.rental_status) as any} size={12} color={getStatusColor(rental.rental_status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(rental.rental_status) }]}>
                          {rental.rental_status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rentalInfo}>
                      <Text style={styles.rentalProduct}>{rental.product_name}</Text>
                      <Text style={styles.rentalDetail}>Duration: {rental.rental_duration} days ({rental.rental_type})</Text>
                      <Text style={styles.rentalDetail}>Deposit: ₹{rental.security_deposit?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.orderFooter}>
                      <View>
                        <Text style={styles.footerLabel}>Rental Amount</Text>
                        <Text style={styles.footerAmount}>₹{rental.rental_price?.toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity style={styles.viewDetailBtn}>
                        <Text style={styles.viewDetailText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="sync-outline" size={48} color="#B0BEC5" />
                  <Text style={styles.emptyTitle}>No Rentals Yet</Text>
                  <Text style={styles.emptySubtitle}>Your rental orders will appear here</Text>
                  <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/rent')} activeOpacity={0.8}>
                    <Text style={styles.shopBtnText}>Browse Rentals</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A2138', letterSpacing: -0.5 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8ECF0', gap: 5 },
  activeTab: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: '#90A4AE' },
  activeTabText: { color: '#FFFFFF' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 20 },
  cartCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cartInner: { flexDirection: 'row', alignItems: 'center' },
  cartImageContainer: { width: 72, height: 72, backgroundColor: '#F8FAFB', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 6 },
  cartImage: { width: '100%', height: '100%' },
  cartInfo: { flex: 1, marginLeft: 14 },
  cartProductName: { fontSize: 14, fontWeight: '600', color: '#1A2138', marginBottom: 4, lineHeight: 19 },
  cartPrice: { fontSize: 15, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 15, fontWeight: '700', color: '#1A2138', minWidth: 20, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto', padding: 6 },
  cartItemTotal: { fontSize: 16, fontWeight: '800', color: '#1A2138', marginLeft: 8 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: '#1A2138', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#78909C' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#455A64' },
  summaryDivider: { height: 1, backgroundColor: '#ECEFF1', marginVertical: 10 },
  summaryTotalLabel: { fontSize: 16, fontWeight: '800', color: '#1A2138' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  checkoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 16, gap: 8, marginBottom: 16, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  checkoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1A2138' },
  orderDate: { fontSize: 12, color: '#90A4AE', marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  orderItems: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F4F8', borderBottomWidth: 1, borderBottomColor: '#F0F4F8', marginBottom: 14 },
  itemText: { fontSize: 14, color: '#455A64', marginBottom: 4, lineHeight: 20 },
  rentalInfo: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F4F8', borderBottomWidth: 1, borderBottomColor: '#F0F4F8', marginBottom: 14 },
  rentalProduct: { fontSize: 16, fontWeight: '700', color: '#1A2138', marginBottom: 8 },
  rentalDetail: { fontSize: 13, color: '#78909C', marginBottom: 4, lineHeight: 20 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 12, color: '#90A4AE' },
  footerAmount: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  viewDetailBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 4 },
  viewDetailText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, backgroundColor: '#FFFFFF', borderRadius: 18, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#455A64', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#90A4AE', marginBottom: 24 },
  shopBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  shopBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});