import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Colors } from '../../constants/Theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        await logout();
        await clearCart();
        router.replace('/auth/login');
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            await clearCart();
            router.replace('/auth/login');
          },
        },
      ]);
    }
  };

  const getAuthBadge = () => {
    switch (user?.auth_provider) {
      case 'google': return { icon: 'logo-google' as const, text: 'Google Account' };
      case 'email': return { icon: 'mail-outline' as const, text: 'Email Account' };
      case 'phone': return { icon: 'call-outline' as const, text: 'Phone Account' };
      default: return { icon: 'person-outline' as const, text: 'Account' };
    }
  };

  const authBadge = getAuthBadge();

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'location-outline',
      title: 'Manage Addresses',
      subtitle: `${user?.addresses?.length || 0} saved addresses`,
      onPress: () => router.push('/profile/addresses'),
    },
    {
      icon: 'heart-outline',
      title: 'Wishlist',
      subtitle: 'View your saved items',
      onPress: () => router.push('/profile/wishlist'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => { },
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      onPress: () => { },
    },
    {
      icon: 'document-text-outline',
      title: 'Terms & Conditions',
      subtitle: 'Read our terms and policies',
      onPress: () => { },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          {user?.profile_picture ? (
            <Image source={{ uri: user.profile_picture }} style={styles.profilePic} />
          ) : (
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={36} color={Colors.primary} />
            </View>
          )}
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
          {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
          <View style={styles.authBadge}>
            <Ionicons name={authBadge.icon} size={12} color="#78909C" />
            <Text style={styles.authBadgeText}>{authBadge.text}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={24} color="#2196F3" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF5252" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Jazline Medical Supplies</Text>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  authBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78909C',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5252',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
