import React, { createContext, useContext, useState, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) { setCart(null); setCartCount(0); return; }
    try {
      const { data } = await cartAPI.get();
      setCart(data.cart);
      setCartCount(data.cart.itemCount);
    } catch (err) {
      console.error('Fetch cart error:', err);
    }
  }, [isAuthenticated]);

  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated) { setCartCount(0); return; }
    try {
      const { data } = await cartAPI.getCount();
      setCartCount(data.count);
    } catch (err) {
      console.error('Fetch cart count error:', err);
    }
  }, [isAuthenticated]);

  const addToCart = useCallback(async (medicine_id, quantity) => {
    if (!isAuthenticated) return { success: false, error: 'Please login to add items to cart.' };
    setLoading(true);
    try {
      const { data } = await cartAPI.addItem({ medicine_id, quantity });
      setCartCount(data.cartCount);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to add to cart.' };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateItem = useCallback(async (id, quantity) => {
    try {
      await cartAPI.updateItem(id, { quantity });
      await fetchCart();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update cart.' };
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (id) => {
    try {
      await cartAPI.removeItem(id);
      await fetchCart();
      setCartCount(prev => Math.max(0, prev - 1));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to remove item.' };
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await cartAPI.clear();
      setCart(null);
      setCartCount(0);
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  }, []);

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, fetchCartCount, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
