import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { getUser } from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('jwt_token');
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        // Clear both if one is missing
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('jwt_token');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: User, token?: string) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (token) {
        await AsyncStorage.setItem('jwt_token', token);
      }
      setUser(userData);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('cart');
      await AsyncStorage.removeItem('wishlist');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    if (user) {
      try {
        const updatedUser = await getUser(user._id);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};