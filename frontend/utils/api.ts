import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let rawBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
if (rawBackendUrl && !rawBackendUrl.startsWith('http')) {
  rawBackendUrl = 'https://' + rawBackendUrl;
}
const API_URL = rawBackendUrl + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Add JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // silently fail
  }
  return config;
});

// Better error handling for network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error (no response from server)
      error.message = 'Unable to connect to the server. Please ensure the backend is running.';
    } else if (error.response.data && error.response.data.detail) {
      // FastAPI detail error
      error.message = error.response.data.detail;
    }
    return Promise.reject(error);
  }
);

// ==================== Auth APIs ====================

export const signupWithEmail = async (name: string, email: string, password: string) => {
  const response = await api.post('/auth/signup', { name, email, password });
  return response.data;
};

export const loginWithEmail = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const loginWithGoogle = async (idToken: string) => {
  const response = await api.post('/auth/google', { id_token: idToken });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Legacy OTP auth (kept for backward compatibility)
export const sendOTP = async (phone: string) => {
  const response = await api.post('/auth/send-otp', { phone });
  return response.data;
};

export const verifyOTP = async (phone: string, otp: string) => {
  const response = await api.post('/auth/verify-otp', { phone, otp });
  return response.data;
};

// ==================== User APIs ====================

export const getUser = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId: string, data: any) => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

export const addAddress = async (userId: string, address: any) => {
  const response = await api.post(`/users/${userId}/addresses`, address);
  return response.data;
};

// ==================== Product APIs ====================

export const getProducts = async (category?: string) => {
  const response = await api.get('/products', { params: { category } });
  return response.data;
};

export const getProduct = async (productId: string) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

// ==================== Order APIs ====================

export const createOrder = async (orderData: any) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getUserOrders = async (userId: string) => {
  const response = await api.get(`/orders/user/${userId}`);
  return response.data;
};

// ==================== Rental APIs ====================

export const createRental = async (rentalData: any) => {
  const response = await api.post('/rentals', rentalData);
  return response.data;
};

export const getUserRentals = async (userId: string) => {
  const response = await api.get(`/rentals/user/${userId}`);
  return response.data;
};

export const requestReturn = async (rentalId: string) => {
  const response = await api.post(`/rentals/${rentalId}/return`);
  return response.data;
};

export default api;