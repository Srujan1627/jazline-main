import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  wishlist: Product[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    loadCart();
    loadWishlist();
  }, []);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) {
        setCart(JSON.parse(cartData));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const loadWishlist = async () => {
    try {
      const wishlistData = await AsyncStorage.getItem('wishlist');
      if (wishlistData) {
        setWishlist(JSON.parse(wishlistData));
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const saveCart = async (newCart: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const saveWishlist = async (newWishlist: Product[]) => {
    try {
      await AsyncStorage.setItem('wishlist', JSON.stringify(newWishlist));
      setWishlist(newWishlist);
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    if (existingItem) {
      const newCart = cart.map(item =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      saveCart(newCart);
    } else {
      saveCart([...cart, { product, quantity }]);
    }
  };

  const removeFromCart = (productId: string) => {
    saveCart(cart.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      const newCart = cart.map(item =>
        item.product._id === productId ? { ...item, quantity } : item
      );
      saveCart(newCart);
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const addToWishlist = (product: Product) => {
    if (!isInWishlist(product._id)) {
      saveWishlist([...wishlist, product]);
    }
  };

  const removeFromWishlist = (productId: string) => {
    saveWishlist(wishlist.filter(item => item._id !== productId));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item._id === productId);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.product.selling_price || item.product.mrp;
      return total + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};