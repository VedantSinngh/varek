"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  product_id: string;
  sku: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  size?: string;
  color?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cart items:", e);
      }
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const addToCart = (newItem: CartItem) => {
    const existingIdx = cart.findIndex((item) => item.product_id === newItem.product_id);
    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].qty += newItem.qty;
      saveCart(updated);
    } else {
      saveCart([...cart, newItem]);
    }
  };

  const removeFromCart = (productId: string) => {
    saveCart(cart.filter((item) => item.product_id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
    } else {
      saveCart(
        cart.map((item) => (item.product_id === productId ? { ...item, qty } : item))
      );
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartSubtotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
