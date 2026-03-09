import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { addAddress } from '../../utils/api';
import { Address } from '../../types';
import { Colors } from '../../constants/Theme';

export default function AddressesScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false,
  });

  const handleSaveAddress = async () => {
    if (!user) return;

    if (!formData.name || !formData.phone || !formData.address_line1 || !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await addAddress(user._id, formData as Address);
      await refreshUser();
      setShowForm(false);
      setFormData({
        name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false,
      });
      Alert.alert('Success', 'Address added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add address');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>My Addresses</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? "close" : "add"} size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Add Address Form */}
          {showForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Add New Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <TextInput
                style={styles.input}
                placeholder="Address Line 1 *"
                value={formData.address_line1}
                onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Address Line 2"
                value={formData.address_line2}
                onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="City *"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="State *"
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Pincode *"
                value={formData.pincode}
                onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
              >
                <Ionicons
                  name={formData.is_default ? "checkbox" : "square-outline"}
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.checkboxText}>Set as default address</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
                <Text style={styles.saveButtonText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Saved Addresses */}
          <View style={styles.addressesContainer}>
            {user?.addresses && user.addresses.length > 0 ? (
              user.addresses.map((address, index) => (
                <View key={address.id || index} style={styles.addressCard}>
                  {address.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>DEFAULT</Text>
                    </View>
                  )}
                  <View style={styles.addressHeader}>
                    <Ionicons name="location" size={20} color={Colors.primary} />
                    <Text style={styles.addressName}>{address.name}</Text>
                  </View>
                  <Text style={styles.addressText}>{address.address_line1}</Text>
                  {address.address_line2 && (
                    <Text style={styles.addressText}>{address.address_line2}</Text>
                  )}
                  <Text style={styles.addressText}>
                    {address.city}, {address.state} - {address.pincode}
                  </Text>
                  <Text style={styles.addressPhone}>Phone: {address.phone}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No addresses saved</Text>
                <Text style={styles.emptySubtext}>Add an address to get started</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
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
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressesContainer: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  defaultBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
  },
});