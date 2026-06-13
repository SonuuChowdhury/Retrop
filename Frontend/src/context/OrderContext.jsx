// ============================================================================
// ORDER CONTEXT
// ============================================================================
// Global state for the customer order flow.
// Persists to sessionStorage so a page refresh doesn't lose progress.
// ISSUE 10 FIX: Exposes isRestaurantClosed so all order sub-pages can guard
// against manual navigation when the restaurant is closed.
// ============================================================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api.js';

const OrderContext = createContext(null);

// ---------- sessionStorage helpers ----------
const SS_KEY = 'rms_order_state';

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(state) {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable (private browsing quotas)
  }
}

export function OrderProvider({ children }) {
  // ── Session data from backend ─────────────────────────────────────────────
  const [session, _setSession] = useState(() => loadFromStorage()?.session ?? null);
  const [sessionToken, _setSessionToken] = useState(() => loadFromStorage()?.sessionToken ?? null);

  // ── Customer info ─────────────────────────────────────────────────────────
  const [customerName, _setCustomerName] = useState(() => loadFromStorage()?.customerName ?? '');
  const [customerMobile, _setCustomerMobile] = useState(() => loadFromStorage()?.customerMobile ?? '');

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, _setCart] = useState(() => loadFromStorage()?.cart ?? []);

  // ── Restaurant branding (fetched once on mount) ───────────────────────────
  const [restaurantInfo, setRestaurantInfo] = useState(() => loadFromStorage()?.restaurantInfo ?? null);

  // ── ISSUE 10: Restaurant open/closed state ────────────────────────────────
  const [isRestaurantClosed, setIsRestaurantClosed] = useState(false);
  const [closedCheckDone, setClosedCheckDone] = useState(false);

  // ── Persist to sessionStorage whenever state changes ─────────────────────
  useEffect(() => {
    saveToStorage({ session, sessionToken, customerName, customerMobile, cart, restaurantInfo });
  }, [session, sessionToken, customerName, customerMobile, cart, restaurantInfo]);

  // ── Write customerToken to localStorage so tracking page can always find it ─
  // This MUST use localStorage (not sessionStorage) so it survives navigation.
  // Done synchronously here so the token is present before OrderTracking mounts.
  useEffect(() => {
    if (session?.customerToken && session?.tableId) {
      localStorage.setItem(`rms_token_${session.tableId}`, session.customerToken);
    }
  }, [session?.customerToken, session?.tableId]);

  // ── ISSUE 10: Check restaurant open status on mount ───────────────────────
  // Uses the public restaurant-info endpoint which includes isRestaurantOpen.
  useEffect(() => {
    api.getRestaurantInfo()
      .then((res) => {
        if (res?.status === 'success' && res.data) {
          if (res.data.isRestaurantOpen === false) {
            setIsRestaurantClosed(true);
          }
          // Also seed restaurantInfo if not already loaded
          setRestaurantInfo((prev) => prev ?? res.data);
        }
      })
      .catch(() => {
        // Network error — don't block the UI
      })
      .finally(() => {
        setClosedCheckDone(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Setters (wrapped so we can add side effects later) ----------
  // setSession supports both a value and a functional updater: setSession(fn) or setSession(obj)
  const setSession = useCallback((s) => {
    if (typeof s === 'function') {
      _setSession(s);
    } else {
      _setSession(s);
    }
  }, []);
  const setSessionToken = useCallback((t) => _setSessionToken(t), []);
  const setCustomerName = useCallback((n) => _setCustomerName(n), []);
  const setCustomerMobile = useCallback((m) => _setCustomerMobile(m), []);
  const setCart = useCallback((c) => _setCart(c), []);

  // ---------- Cart operations ----------
  const addToCart = useCallback((dish, quantity = 1, remarks = '') => {
    _setCart((prev) => {
      const existing = prev.find((i) => i.dishId === dish.dishId);
      if (existing) {
        return prev.map((i) =>
          i.dishId === dish.dishId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...dish, quantity, remarks }];
    });
  }, []);

  const removeFromCart = useCallback((dishId) => {
    _setCart((prev) => prev.filter((i) => i.dishId !== dishId));
  }, []);

  const updateQuantity = useCallback((dishId, quantity) => {
    if (quantity <= 0) {
      _setCart((prev) => prev.filter((i) => i.dishId !== dishId));
    } else {
      _setCart((prev) =>
        prev.map((i) => (i.dishId === dishId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const updateRemarks = useCallback((dishId, remarks) => {
    _setCart((prev) =>
      prev.map((i) => (i.dishId === dishId ? { ...i, remarks } : i))
    );
  }, []);

  const clearCart = useCallback(() => _setCart([]), []);

  // ---------- Derived values ----------
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ---------- Clear all state (session expired / restart) ----------
  const clearSession = useCallback(() => {
    _setSession(null);
    _setSessionToken(null);
    _setCustomerName('');
    _setCustomerMobile('');
    _setCart([]);
    try { sessionStorage.removeItem(SS_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <OrderContext.Provider
      value={{
        // Session
        session, setSession,
        sessionToken, setSessionToken,
        // Customer
        customerName, setCustomerName,
        customerMobile, setCustomerMobile,
        // Cart
        cart, setCart,
        addToCart, removeFromCart, updateQuantity, updateRemarks, clearCart,
        cartTotal, cartCount,
        // Restaurant branding
        restaurantInfo, setRestaurantInfo,
        // ISSUE 10: Restaurant closed state
        isRestaurantClosed,
        closedCheckDone,
        // Utils
        clearSession,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used inside <OrderProvider>');
  return ctx;
}
