import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Colors } from '../../constants/Theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export default function CuratedKitsScreen() {
  const router = useRouter();
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    try {
      const response = await axios.get(`${API_URL}/kits`);
      setKits(response.data);
    } catch (error) {
      console.error('Error loading kits:', error);
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
        <Text style={styles.title}>Care Kits</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={24} color={Colors.primary} />
        <Text style={styles.infoText}>
          Curated bundles: Rent equipment, buy consumables – all in one go!
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {kits.map((kit) => (
            <TouchableOpacity
              key={kit._id}
              style={styles.kitCard}
              onPress={() => router.push(`/kits/${kit._id}`)}
            >
              <Image source={{ uri: kit.image }} style={styles.kitImage} resizeMode="contain" />
              <View style={styles.kitContent}>
                <Text style={styles.kitName}>{kit.name}</Text>
                <Text style={styles.kitBestFor}>{kit.best_for}</Text>
                <Text style={styles.kitDescription} numberOfLines={2}>
                  {kit.description}
                </Text>

                {/* Pricing */}
                <View style={styles.pricingRow}>
                  <View style={styles.priceColumn}>
                    <Text style={styles.priceLabel}>Rent</Text>
                    <Text style={styles.priceValue}>
                      ₹{kit.total_rent_price}/mo
                    </Text>
                  </View>
                  <View style={styles.priceColumn}>
                    <Text style={styles.priceLabel}>Buy Items</Text>
                    <Text style={styles.priceValue}>₹{kit.total_buy_price}</Text>
                  </View>
                </View>

                {/* Savings Badge */}
                {kit.savings > 0 && (
                  <View style={styles.savingsBadge}>
                    <Ionicons name="pricetag" size={14} color={Colors.success} />
                    <Text style={styles.savingsText}>Save ₹{kit.savings}</Text>
                  </View>
                )}

                {/* Kit Details */}
                <View style={styles.kitDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="sync" size={16} color={Colors.primary} />
                    <Text style={styles.detailText}>
                      {kit.rent_items.length} items to rent
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cart" size={16} color={Colors.info} />
                    <Text style={styles.detailText}>
                      {kit.buy_items.length} items to buy
                    </Text>
                  </View>
                </View>

                {/* Security Deposit */}
                <View style={styles.depositInfo}>
                  <Ionicons name="shield-checkmark" size={14} color="#666" />
                  <Text style={styles.depositText}>
                    Deposit: ₹{kit.security_deposit} (Refundable)
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {kits.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No care kits available</Text>
            </View>
          )}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  kitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  kitImage: {
    width: '100%',
    height: 180,
  },
  kitContent: {
    padding: 16,
  },
  kitName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kitBestFor: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  kitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  priceColumn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.success,
  },
  kitDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  depositInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  depositText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
