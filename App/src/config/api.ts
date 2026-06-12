// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? 'https://6855-2401-4900-1c00-46e5-602b-80c5-fe51-215f.ngrok-free.app',
  TIMEOUT_MS: 15_000,
  SOCKET: {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  },
};

const API_BASE = `${API_CONFIG.BASE_URL}/api`;

export const SOCKET_URL = API_CONFIG.BASE_URL;
export const TIMEOUT_MS = API_CONFIG.TIMEOUT_MS;
export const SOCKET_CONFIG = API_CONFIG.SOCKET;

// ============================================================================
// NGROK BYPASS HEADER
// ============================================================================
// When running behind ngrok, requests without this header get an HTML
// interstitial page instead of JSON — causing every API call to silently fail.
export const NGROK_HEADERS: Record<string, string> = {
  'ngrok-skip-browser-warning': 'true',
};

// ============================================================================
// ENDPOINT REGISTRY
// ============================================================================

export const ENDPOINTS = {
  // ── Admin / Manager Auth ──────────────────────────────────────────────────
  ADMIN_LOGIN:    `${API_BASE}/admin/login`,
  ADMIN_REFRESH:  `${API_BASE}/admin/refresh`,

  // ── Manager ───────────────────────────────────────────────────────────────
  MANAGER_PROFILE:   `${API_BASE}/manager/profile`,
  MANAGER_DASHBOARD: `${API_BASE}/manager/dashboard/summary`,

  // Manager — Settings / Restaurant toggle
  MANAGER_SETTINGS:        `${API_BASE}/manager/settings`,
  MANAGER_SETTINGS_TOGGLE: `${API_BASE}/manager/settings/toggle`,

  // Manager — Restaurant Info
  MANAGER_RESTAURANT_INFO: `${API_BASE}/manager/restaurant-info`,

  // Manager — Waiters
  WAITERS:               `${API_BASE}/manager/waiters`,
  ACTIVE_WAITERS:        `${API_BASE}/manager/waiters/active`,
  WAITER_BY_ID:          (id: string) => `${API_BASE}/manager/waiters/${id}`,
  WAITER_TABLES:         (id: string) => `${API_BASE}/manager/waiters/${id}/tables`,
  WAITER_RESET_PASSWORD: (id: string) => `${API_BASE}/manager/waiters/${id}/reset-password`,
  WAITER_STATUS:         (id: string) => `${API_BASE}/manager/waiters/${id}/status`,

  // Manager — Kitchen accounts
  MANAGER_KITCHEN_LIST:   `${API_BASE}/manager/kitchen`,
  MANAGER_KITCHEN_ADD:    `${API_BASE}/manager/kitchen`,
  MANAGER_KITCHEN_DELETE: (kitchenId: string) => `${API_BASE}/manager/kitchen/${kitchenId}`,
  MANAGER_KITCHEN_STATUS: (kitchenId: string) => `${API_BASE}/manager/kitchen/${kitchenId}/status`,

  // Manager — Analytics
  ANALYTICS:                      `${API_BASE}/admins/analytics`,
  MANAGER_ANALYTICS_ORDERS:       `${API_BASE}/manager/analytics/orders`,
  MANAGER_ANALYTICS_ORDER_DETAIL: (orderId: string) => `${API_BASE}/manager/analytics/orders/${orderId}`,

  // ── Menu ──────────────────────────────────────────────────────────────────
  MENU:                       `${API_BASE}/manager/menu`,
  MENU_CATEGORIES:            `${API_BASE}/manager/menu/categories`,
  MENU_STATS:                 `${API_BASE}/manager/menu/stats`,
  MENU_ITEM:                  (id: string) => `${API_BASE}/manager/menu/${id}`,
  MENU_ITEM_IMAGE:            (id: string) => `${API_BASE}/manager/menu/${id}/image`,
  MENU_AVAILABILITY:          (id: string) => `${API_BASE}/manager/menu/${id}/availability`,
  MENU_CATEGORY_AVAILABILITY: (category: string) =>
    `${API_BASE}/manager/menu/category/${encodeURIComponent(category)}/availability`,

  // ── Tables ────────────────────────────────────────────────────────────────
  TABLES:         `${API_BASE}/manager/tables`,
  TABLE_STATS:    `${API_BASE}/manager/tables/statistics`,
  TABLE_BY_NO:    (tableNo: number) => `${API_BASE}/manager/tables/${tableNo}`,
  TABLE_CAPACITY: (tableNo: number) => `${API_BASE}/manager/tables/${tableNo}/capacity`,

  // ── Waiter Auth ───────────────────────────────────────────────────────────
  WAITER_LOGIN:   `${API_BASE}/waiter/login`,
  WAITER_REFRESH: `${API_BASE}/waiter/refresh`,
  WAITER_LOGOUT:  `${API_BASE}/waiter/logout`,

  // ── Waiter Operations ─────────────────────────────────────────────────────
  WAITER_DASHBOARD:        `${API_BASE}/waiter/dashboard`,
  WAITER_MENU:             `${API_BASE}/waiter/menu`,
  WAITER_ACTIVE_ORDERS:    `${API_BASE}/waiter/active-orders`,
  WAITER_PENDING_SESSIONS: `${API_BASE}/waiter/pending-sessions`,   // ← NEW
  WAITER_ACCEPT_ORDER:     (tableId: string) => `${API_BASE}/waiter/orders/${tableId}/accept`,
  WAITER_ORDER_DETAIL:     (orderId: string) => `${API_BASE}/waiter/orders/${orderId}`,
  WAITER_MODIFY_ORDER:     (orderId: string) => `${API_BASE}/waiter/orders/${orderId}/modify`,
  WAITER_ORDER_STATUS:     (orderId: string) => `${API_BASE}/waiter/orders/${orderId}/status`,
  WAITER_CONCLUDE_ORDER:   (orderId: string) => `${API_BASE}/waiter/orders/${orderId}/conclude`,
  WAITER_BILL_PREVIEW:     (orderId: string) => `${API_BASE}/waiter/orders/${orderId}/bill-preview`,

  // ── Kitchen Auth ──────────────────────────────────────────────────────────
  KITCHEN_LOGIN:   `${API_BASE}/kitchen/login`,
  KITCHEN_REFRESH: `${API_BASE}/kitchen/refresh`,
  KITCHEN_LOGOUT:  `${API_BASE}/kitchen/logout`,

  // ── Kitchen Operations ────────────────────────────────────────────────────
  KITCHEN_DASHBOARD: `${API_BASE}/kitchen/dashboard`,
  KITCHEN_START:     (orderId: string) => `${API_BASE}/kitchen/orders/${orderId}/start`,
  KITCHEN_READY:     (orderId: string) => `${API_BASE}/kitchen/orders/${orderId}/ready`,
  KITCHEN_ORDER:     (orderId: string) => `${API_BASE}/kitchen/orders/${orderId}`,
} as const;

export default API_CONFIG;