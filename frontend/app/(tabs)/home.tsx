import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getProducts } from '../../utils/api';
import { Product } from '../../types';
import { Colors } from '../../constants/Theme';
import axios from 'axios';

const API_URL = 'https://jazline-backend-v84.onrender.com/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.42, 180);

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [curatedKits, setCuratedKits] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allProducts, kits] = await Promise.all([
        getProducts(),
        axios.get(`${API_URL}/kits`).then(res => res.data)
      ]);
      setFeaturedProducts(allProducts.slice(0, 6));
      setCuratedKits(kits);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const discount = (mrp: number, price: number) => Math.round(((mrp - price) / mrp) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/images/jazline-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="notifications-outline" size={22} color="#1A2138" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{greeting()}</Text>
          <Text style={styles.userName}>{user?.name || 'Welcome to Jazline'}</Text>
        </View>

        {/* Hero Banner */}
        <TouchableOpacity
          style={styles.heroBanner}
          onPress={() => router.push('/(tabs)/buy')}
          activeOpacity={0.95}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroLabel}>MEDICAL SUPPLIES</Text>
              <Text style={styles.heroTitle}>Buy or Rent{'\n'}Medical Equipment</Text>
              <Text style={styles.heroSubtitle}>
                Clinically sanitized · Free delivery · 0% EMI
              </Text>
              <View style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Shop Now</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </View>
            </View>
            <View style={styles.heroVisual}>
              <Ionicons name="medkit" size={56} color="rgba(255,255,255,0.3)" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {[
            { icon: 'cart-outline' as const, label: 'Buy', route: '/(tabs)/buy', bg: '#E8F5E9', color: '#2E7D32' },
            { icon: 'sync-outline' as const, label: 'Rent', route: '/(tabs)/rent', bg: '#E0F7FA', color: '#00796B' },
            { icon: 'gift-outline' as const, label: 'Kits', route: '/kits', bg: '#FFF3E0', color: '#E65100' },
            { icon: 'receipt-outline' as const, label: 'Orders', route: '/(tabs)/orders', bg: '#F3E5F5', color: '#7B1FA2' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickAction}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconCircle, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trust Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.trustScroll}
          contentContainerStyle={styles.trustScrollContent}
        >
          {[
            { icon: 'shield-checkmark' as const, label: 'Clinically Sanitized', color: Colors.primary },
            { icon: 'ribbon' as const, label: 'Authorized Dealer', color: '#00796B' },
            { icon: 'card' as const, label: '0% EMI Options', color: '#1976D2' },
            { icon: 'construct' as const, label: 'Free Maintenance', color: '#2E7D32' },
            { icon: 'car' as const, label: 'Free Delivery', color: '#E65100' },
          ].map((badge, i) => (
            <View key={i} style={styles.trustBadge}>
              <Ionicons name={badge.icon} size={16} color={badge.color} />
              <Text style={styles.trustLabel}>{badge.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Curated Care Kits */}
        {curatedKits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Curated Care Kits</Text>
                <Text style={styles.sectionSubtitle}>Bundled for savings</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push('/kits')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {curatedKits.map((kit) => (
                <TouchableOpacity
                  key={kit._id}
                  style={styles.kitCard}
                  onPress={() => router.push(`/kits/${kit._id}`)}
                  activeOpacity={0.9}
                >
                  <View style={styles.kitImageContainer}>
                    <Image
                      source={{ uri: kit.image }}
                      style={styles.kitImage}
                      resizeMode="contain"
                    />
                    <View style={styles.kitSaveBadge}>
                      <Text style={styles.kitSaveText}>Save ₹{kit.savings}</Text>
                    </View>
                  </View>
                  <View style={styles.kitInfo}>
                    <Text style={styles.kitName} numberOfLines={1}>{kit.name}</Text>
                    <Text style={styles.kitBestFor} numberOfLines={1}>{kit.best_for}</Text>
                    <View style={styles.kitPriceRow}>
                      <Text style={styles.kitPrice}>₹{kit.total_rent_price?.toLocaleString()}</Text>
                      <Text style={styles.kitPricePeriod}>/month</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <Text style={styles.sectionSubtitle}>Top picks for you</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/(tabs)/buy')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : featuredProducts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredProducts.map((product) => (
                <TouchableOpacity
                  key={product._id}
                  style={styles.productCard}
                  onPress={() => router.push(`/products/${product._id}`)}
                  activeOpacity={0.9}
                >
                  <View style={styles.productImageContainer}>
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                      resizeMode="contain"
                      defaultSource={require('../../assets/images/app-image.png')}
                    />
                    {product.selling_price && product.selling_price < product.mrp && (
                      <View style={styles.productDiscountBadge}>
                        <Text style={styles.productDiscountText}>
                          {discount(product.mrp, product.selling_price)}% OFF
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.productPrice}>
                      ₹{(product.selling_price || product.mrp).toLocaleString()}
                    </Text>
                    {product.mrp && product.selling_price && product.selling_price < product.mrp && (
                      <Text style={styles.productMrp}>₹{product.mrp.toLocaleString()}</Text>
                    )}
                    {product.emi_available && (
                      <View style={styles.emiBadge}>
                        <Ionicons name="card-outline" size={12} color="#1976D2" />
                        <Text style={styles.emiText}>EMI Available</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color="#B0BEC5" />
              <Text style={styles.emptyTitle}>No Products Yet</Text>
              <Text style={styles.emptySubtitle}>Products will appear here once added</Text>
            </View>
          )}
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Browse by Category</Text>
              <Text style={styles.sectionSubtitle}>Find what you need</Text>
            </View>
          </View>
          <View style={styles.categoryGrid}>
            {[
              { name: 'Post-Surgery', icon: 'medkit' as const, bg: '#FFEBEE', color: '#C62828' },
              { name: 'Dental Care', icon: 'water' as const, bg: '#E3F2FD', color: '#1565C0' },
              { name: 'Diabetes', icon: 'pulse' as const, bg: '#F3E5F5', color: '#7B1FA2' },
              { name: 'Fracture Care', icon: 'fitness' as const, bg: '#E8F5E9', color: '#2E7D32' },
              { name: 'Elderly Care', icon: 'accessibility' as const, bg: '#FFF8E1', color: '#F57F17' },
              { name: 'Respiratory', icon: 'heart' as const, bg: '#E0F7FA', color: '#00838F' },
            ].map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={styles.categoryItem}
                onPress={() => router.push({
                  pathname: '/(tabs)/buy',
                  params: { category: cat.name }
                })}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon} size={26} color={cat.color} />
                </View>
                <Text style={styles.categoryText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Why Jazline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Jazline?</Text>
          <View style={styles.whyGrid}>
            {[
              { icon: 'car-outline' as const, title: 'Free Delivery', desc: 'Same-day delivery available', color: '#E65100' },
              { icon: 'refresh-outline' as const, title: 'Easy Returns', desc: '7-day return policy', color: '#1565C0' },
              { icon: 'pricetag-outline' as const, title: 'Best Prices', desc: 'Price match guarantee', color: '#2E7D32' },
              { icon: 'headset-outline' as const, title: '24/7 Support', desc: 'Always here to help', color: '#7B1FA2' },
            ].map((item, i) => (
              <View key={i} style={styles.whyCard}>
                <View style={[styles.whyIconCircle, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.whyTitle}>{item.title}</Text>
                <Text style={styles.whyDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', gap: 8 },
  logo: { width: 130, height: 40 },
  headerBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  notifDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F44336', borderWidth: 1.5, borderColor: '#FFF' },
  greetingSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  greetingText: { fontSize: 14, color: '#78909C', fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: '#1A2138', marginTop: 2, letterSpacing: -0.5 },
  heroBanner: { marginHorizontal: 20, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.primary },
  heroContent: { flexDirection: 'row', padding: 22, alignItems: 'center' },
  heroTextBlock: { flex: 1 },
  heroLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5, marginBottom: 8 },
  heroTitle: { fontSize: 21, fontWeight: '800', color: '#FFFFFF', lineHeight: 28, letterSpacing: -0.3, fontFamily: "'Playfair Display', 'Times New Roman', serif" },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  heroButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, marginTop: 14, gap: 6 },
  heroButtonText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  heroVisual: { marginLeft: 10, opacity: 0.9 },
  quickActionsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 12 },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  quickIconCircle: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '700', color: '#455A64' },
  trustScroll: { marginTop: 20 },
  trustScrollContent: { paddingHorizontal: 20, gap: 8 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 25, gap: 6, borderWidth: 1, borderColor: '#F0F0F0' },
  trustLabel: { fontSize: 12, fontWeight: '600', color: '#455A64' },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#1A2138', letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 12, color: '#90A4AE', marginTop: 2, fontWeight: '500' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryBg, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 2 },
  seeAllText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  kitCard: { width: 200, backgroundColor: '#FFFFFF', borderRadius: 18, marginRight: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  kitImageContainer: { width: '100%', height: 130, backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center', padding: 10 },
  kitImage: { width: '100%', height: '100%' },
  kitSaveBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#2E7D32', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  kitSaveText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  kitInfo: { padding: 14 },
  kitName: { fontSize: 15, fontWeight: '700', color: '#1A2138', marginBottom: 4 },
  kitBestFor: { fontSize: 11, color: '#78909C', marginBottom: 8, fontWeight: '500' },
  kitPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  kitPrice: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  kitPricePeriod: { fontSize: 12, color: '#90A4AE', marginLeft: 2, fontWeight: '500' },
  productCard: { width: CARD_WIDTH, backgroundColor: '#FFFFFF', borderRadius: 18, marginRight: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  productImageContainer: { width: '100%', height: 140, backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center', padding: 12 },
  productImage: { width: '100%', height: '100%' },
  productDiscountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E8F5E9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  productDiscountText: { fontSize: 11, fontWeight: '800', color: '#2E7D32' },
  productInfo: { padding: 12 },
  productName: { fontSize: 13, fontWeight: '600', color: '#1A2138', marginBottom: 6, lineHeight: 18, minHeight: 36 },
  productPrice: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  productMrp: { fontSize: 12, color: '#B0BEC5', textDecorationLine: 'line-through', marginTop: 2 },
  emiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  emiText: { fontSize: 10, fontWeight: '700', color: '#1976D2' },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFFFFF', borderRadius: 18 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#455A64', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#90A4AE' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryItem: { width: '30%', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  categoryIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  categoryText: { fontSize: 12, color: '#455A64', fontWeight: '700', textAlign: 'center' },
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  whyCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  whyIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  whyTitle: { fontSize: 14, fontWeight: '700', color: '#1A2138', marginTop: 10, marginBottom: 4 },
  whyDesc: { fontSize: 12, color: '#90A4AE', lineHeight: 16 },
  loader: { marginVertical: 40 },
});