'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Product, CartItem, GrindType } from './types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number; grind: GrindType; weight: number; unitPrice: number }
  | { type: 'REMOVE_ITEM'; productId: string; grind: GrindType; weight: number }
  | { type: 'UPDATE_QUANTITY'; productId: string; grind: GrindType; weight: number; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === action.product.id && item.grind === action.grind && item.weight === action.weight
      );
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.quantity,
        };
        return { items: newItems };
      }
      return {
        items: [...state.items, { product: action.product, quantity: action.quantity, grind: action.grind, weight: action.weight, unitPrice: action.unitPrice }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(
          (item) => !(item.product.id === action.productId && item.grind === action.grind && item.weight === action.weight)
        ),
      };
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          items: state.items.filter(
            (item) => !(item.product.id === action.productId && item.grind === action.grind && item.weight === action.weight)
          ),
        };
      }
      return {
        items: state.items.map((item) =>
          item.product.id === action.productId && item.grind === action.grind && item.weight === action.weight
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    }
    case 'CLEAR_CART':
      return { items: [] };
    case 'HYDRATE':
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, grind: GrindType, weight?: number, unitPrice?: number) => void;
  removeItem: (productId: string, grind: GrindType, weight: number) => void;
  updateQuantity: (productId: string, grind: GrindType, weight: number, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [cartOpen, setCartOpen] = React.useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('danleon-cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'HYDRATE', items: parsed });
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('danleon-cart', JSON.stringify(state.items));
    } catch {
      // ignore storage errors
    }
  }, [state.items]);

  const addItem = useCallback((product: Product, quantity: number, grind: GrindType, weight?: number, unitPrice?: number) => {
    const w = weight ?? product.weight;
    const p = unitPrice ?? product.price;
    dispatch({ type: 'ADD_ITEM', product, quantity, grind, weight: w, unitPrice: p });
  }, []);

  const removeItem = useCallback((productId: string, grind: GrindType, weight: number) => {
    dispatch({ type: 'REMOVE_ITEM', productId, grind, weight });
  }, []);

  const updateQuantity = useCallback((productId: string, grind: GrindType, weight: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, grind, weight, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const totalPrice = state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items: state.items, addItem, removeItem, updateQuantity, clearCart, totalPrice, totalItems, cartOpen, setCartOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
