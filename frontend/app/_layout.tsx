import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';

export default function RootLayout() {
  // Inject Google Fonts on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Add Google Fonts link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700;800&display=swap';
      document.head.appendChild(link);

      const style = document.createElement('style');
      style.textContent = `
        body, input, textarea, button {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}