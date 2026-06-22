// ============================================================================
// API CONFIGURATION — DYNAMIC SERVER URL
// ============================================================================
// The BASE_URL is now loaded from AsyncStorage at runtime, so the app
// connects to whatever server URL was configured by the user on first run.
// This eliminates the need to rebuild the app when the ngrok/server URL changes.
//
// Usage:
//   import { ENDPOINTS, getBaseUrl, initializeApi } from '@/config/api';
//   await initializeApi();  // Call once in _layout.tsx before rendering
//
// All ENDPOINTS are lazy getters — they read from the cached BASE_URL
// set by initializeApi(). Do NOT import ENDPOINTS before initializeApi() resolves.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// Internal mutable state — set by initializeApi()
let _baseUrl: string = process.env.EXPO_PUBLIC_API_URL ?? '';
let _productKey: string = '';
let _initialized     = false;

const SERVER_URL_KEY = 'rms_server_url';
const URL_SET_KEY    = 'rms_server_url_set';
const PRODUCT_KEY    = 'rms_product_key';

// ── Public API ───────────────────────────────────────────────────────────────

/** Returns the current server base URL (e.g. https://xxxx.ngrok.app) */
export function getBaseUrl(): string {
  return _baseUrl;
}

/** Returns the current product key */
export function getProductKey(): string {
  return _productKey;
}

/**
 * Load the server URL and product key from AsyncStorage.
 * Call this ONCE at app startup before any API calls.
 * Returns: 'setup' if URL or key not configured yet, 'ready' if initialized OK.
 */
export async function initializeApi(): Promise<'setup' | 'ready'> {
  if (_initialized) return 'ready';

  try {
    const isSet = await AsyncStorage.getItem(URL_SET_KEY);
    const savedUrl = await AsyncStorage.getItem(SERVER_URL_KEY);
    const savedKey = await AsyncStorage.getItem(PRODUCT_KEY);

    if (isSet === 'true' && savedUrl && savedUrl.length > 4 && savedKey && savedKey.length > 4) {
      _baseUrl = savedUrl.trim().replace(/\/+$/, '');
      _productKey = savedKey.trim();
      _initialized = true;
      setupGlobalFetch();
      return 'ready';
    }

    // Fallback to env vars if available
    const envKey = process.env.EXPO_PUBLIC_PRODUCT_KEY;
    if (_baseUrl && _baseUrl.length > 4 && envKey && envKey.length > 4) {
      _productKey = envKey.trim();
      _initialized = true;
      setupGlobalFetch();
      return 'ready';
    }

    return 'setup';
  } catch {
    return 'setup';
  }
}

/**
 * Update the live base URL and product key.
 */
export async function updateApiConfig(url: string, key: string): Promise<void> {
  let cleanedUrl = url.trim().replace(/\/+$/, '');
  if (cleanedUrl && !/^https?:\/\//i.test(cleanedUrl)) {
    cleanedUrl = `https://${cleanedUrl}`;
  }
  const cleanedKey = key.trim();
  _baseUrl = cleanedUrl;
  _productKey = cleanedKey;
  _initialized = true;

  await AsyncStorage.setItem(SERVER_URL_KEY, cleanedUrl);
  await AsyncStorage.setItem(PRODUCT_KEY, cleanedKey);
  await AsyncStorage.setItem(URL_SET_KEY, 'true');

  setupGlobalFetch();
}

/** Legacy support */
export async function updateBaseUrl(url: string): Promise<void> {
  await updateApiConfig(url, _productKey);
}

/** Reset configuration */
export async function resetApiConfig(): Promise<void> {
  await AsyncStorage.multiRemove([SERVER_URL_KEY, URL_SET_KEY, PRODUCT_KEY]);
  _baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  _productKey = '';
  _initialized = false;
}

/** Legacy support */
export async function resetServerUrl(): Promise<void> {
  await resetApiConfig();
}

// ── Global Fetch Interceptor ──────────────────────────────────────────────────
let _fetchIntercepted = false;

function setupGlobalFetch() {
  if (_fetchIntercepted) return;
  _fetchIntercepted = true;

  const originalFetch = global.fetch;
  global.fetch = function (input: any, init: any) {
    const url = typeof input === 'string' ? input : (input && input.url);
    if (url && url.includes(_baseUrl)) {
      const newInit = { ...init };
      newInit.headers = {
        'ngrok-skip-browser-warning': 'true',
        'X-Product-Key': _productKey,
        ...newInit.headers,
      };
      return originalFetch(input, newInit);
    }
    return originalFetch(input, init);
  };
}

// ── Lazy endpoint builder ─────────────────────────────────────────────────────
// Each endpoint is a getter that reads _baseUrl at call time.
// This ensures they always point to the correct URL even after updateBaseUrl().

function base()  { return `${_baseUrl}/api`; }

export const ENDPOINTS = {
  // ── Admin / Manager Auth ──────────────────────────────────────────────────
  get ADMIN_LOGIN()    { return `${base()}/admin/login`; },
  get ADMIN_REFRESH()  { return `${base()}/admin/refresh`; },

  // ── Manager ───────────────────────────────────────────────────────────────
  get MANAGER_PROFILE()   { return `${base()}/manager/profile`; },
  get MANAGER_DASHBOARD() { return `${base()}/manager/dashboard/summary`; },

  // Manager — Settings / Restaurant toggle
  get MANAGER_SETTINGS()        { return `${base()}/manager/settings`; },
  get MANAGER_SETTINGS_TOGGLE() { return `${base()}/manager/settings/toggle`; },

  // Manager — Restaurant Info
  get MANAGER_RESTAURANT_INFO() { return `${base()}/manager/restaurant-info`; },

  // Manager — Waiters
  get WAITERS()        { return `${base()}/manager/waiters`; },
  get ACTIVE_WAITERS() { return `${base()}/manager/waiters/active`; },
  WAITER_BY_ID:          (id: string) => `${base()}/manager/waiters/${id}`,
  WAITER_TABLES:         (id: string) => `${base()}/manager/waiters/${id}/tables`,
  WAITER_RESET_PASSWORD: (id: string) => `${base()}/manager/waiters/${id}/reset-password`,
  WAITER_STATUS:         (id: string) => `${base()}/manager/waiters/${id}/status`,

  // Manager — Kitchen accounts
  get MANAGER_KITCHEN_LIST()   { return `${base()}/manager/kitchen`; },
  get MANAGER_KITCHEN_ADD()    { return `${base()}/manager/kitchen`; },
  MANAGER_KITCHEN_DELETE: (kitchenId: string) => `${base()}/manager/kitchen/${kitchenId}`,
  MANAGER_KITCHEN_STATUS: (kitchenId: string) => `${base()}/manager/kitchen/${kitchenId}/status`,

  // Manager — Analytics
  get ANALYTICS()                { return `${base()}/admins/analytics`; },
  get MANAGER_ANALYTICS_ORDERS() { return `${base()}/manager/analytics/orders`; },
  MANAGER_ANALYTICS_ORDER_DETAIL: (orderId: string) => `${base()}/manager/analytics/orders/${orderId}`,

  // ── Menu ──────────────────────────────────────────────────────────────────
  get MENU()             { return `${base()}/manager/menu`; },
  get MENU_CATEGORIES()  { return `${base()}/manager/menu/categories`; },
  get MENU_STATS()       { return `${base()}/manager/menu/stats`; },
  MENU_ITEM:                  (id: string) => `${base()}/manager/menu/${id}`,
  MENU_ITEM_IMAGE:            (id: string) => `${base()}/manager/menu/${id}/image`,
  MENU_AVAILABILITY:          (id: string) => `${base()}/manager/menu/${id}/availability`,
  MENU_CATEGORY_AVAILABILITY: (category: string) =>
    `${base()}/manager/menu/category/${encodeURIComponent(category)}/availability`,

  // ── Tables ────────────────────────────────────────────────────────────────
  get TABLES()      { return `${base()}/manager/tables`; },
  get TABLE_STATS() { return `${base()}/manager/tables/statistics`; },
  TABLE_BY_NO:    (tableNo: number) => `${base()}/manager/tables/${tableNo}`,
  TABLE_CAPACITY: (tableNo: number) => `${base()}/manager/tables/${tableNo}/capacity`,

  // ── Waiter Auth ───────────────────────────────────────────────────────────
  get WAITER_LOGIN()   { return `${base()}/waiter/login`; },
  get WAITER_REFRESH() { return `${base()}/waiter/refresh`; },
  get WAITER_LOGOUT()  { return `${base()}/waiter/logout`; },

  // ── Waiter Operations ─────────────────────────────────────────────────────
  get WAITER_DASHBOARD()        { return `${base()}/waiter/dashboard`; },
  get WAITER_MENU()             { return `${base()}/waiter/menu`; },
  get WAITER_ACTIVE_ORDERS()    { return `${base()}/waiter/active-orders`; },
  get WAITER_PENDING_SESSIONS() { return `${base()}/waiter/pending-sessions`; },
  WAITER_ACCEPT_ORDER: (tableId: string) => `${base()}/waiter/orders/${tableId}/accept`,
  WAITER_ORDER_DETAIL: (orderId: string) => `${base()}/waiter/orders/${orderId}`,
  WAITER_MODIFY_ORDER: (orderId: string) => `${base()}/waiter/orders/${orderId}/modify`,
  WAITER_ORDER_STATUS: (orderId: string) => `${base()}/waiter/orders/${orderId}/status`,
  WAITER_CONCLUDE_ORDER: (orderId: string) => `${base()}/waiter/orders/${orderId}/conclude`,
  WAITER_BILL_PREVIEW: (orderId: string) => `${base()}/waiter/orders/${orderId}/bill-preview`,

  // ── Kitchen Auth ──────────────────────────────────────────────────────────
  get KITCHEN_LOGIN()   { return `${base()}/kitchen/login`; },
  get KITCHEN_REFRESH() { return `${base()}/kitchen/refresh`; },
  get KITCHEN_LOGOUT()  { return `${base()}/kitchen/logout`; },

  // ── Kitchen Operations ────────────────────────────────────────────────────
  get KITCHEN_DASHBOARD() { return `${base()}/kitchen/dashboard`; },
  KITCHEN_START: (orderId: string) => `${base()}/kitchen/orders/${orderId}/start`,
  KITCHEN_READY: (orderId: string) => `${base()}/kitchen/orders/${orderId}/ready`,
  KITCHEN_ADDON_DONE: (orderId: string, addonId: string) => `${base()}/kitchen/orders/${orderId}/addon/${addonId}/done`,
  KITCHEN_ORDER: (orderId: string) => `${base()}/kitchen/orders/${orderId}`,
};

// ── Socket URL ────────────────────────────────────────────────────────────────
/** Returns socket URL — same as base URL without /api */
export function getSocketUrl(): string {
  return _baseUrl;
}

export const TIMEOUT_MS   = 15_000;
export const NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' };
export const SOCKET_CONFIG = {
  transports: ['websocket'] as const,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
};

// Legacy compat export
export const SOCKET_URL = _baseUrl;

export default { getBaseUrl, initializeApi, updateBaseUrl };