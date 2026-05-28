// ============================================================================
// CENTRALIZED API CONFIGURATION
// ============================================================================
// 🔧 SERVER SHIFT: To change the backend server, update BASE_URL only here.
//    All API calls across the entire app will automatically use the new URL.
// ============================================================================

const API_CONFIG = {
  BASE_URL: 'https://8a39-2401-4900-1c84-24ab-966-d5c8-d49a-2495.ngrok-free.app',
  API_PREFIX: '/api',
  TIMEOUT_MS: 15000,
  SOCKET: {
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 2000,
    ACTIVITY_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    SESSION_TIMEOUT_MS: 30 * 60 * 1000,  // 30 minutes
  },
} as const;

// ============================================================================
// DERIVED URLS — do NOT edit these; edit BASE_URL above instead
// ============================================================================

export const API_BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`;
export const SOCKET_URL = API_CONFIG.BASE_URL;
export const TIMEOUT_MS = API_CONFIG.TIMEOUT_MS;
export const SOCKET_CONFIG = API_CONFIG.SOCKET;

// ============================================================================
// NGROK BYPASS HEADER
// ============================================================================
// When running behind ngrok, requests without this header get an HTML
// interstitial page instead of JSON — causing every API call to silently fail.
// Always include this in every fetch call.
export const NGROK_HEADERS: Record<string, string> = {
  'ngrok-skip-browser-warning': 'true',
};

// ============================================================================
// ENDPOINT REGISTRY
// ============================================================================

export const ENDPOINTS = {
  // Auth
  ADMIN_LOGIN: `${API_BASE}/admin/login`,
  ADMIN_REFRESH: `${API_BASE}/admin/refresh`,

  // Manager
  MANAGER_PROFILE: `${API_BASE}/manager/profile`,
  MANAGER_DASHBOARD: `${API_BASE}/manager/dashboard/summary`,

  // Waiters
  WAITERS: `${API_BASE}/manager/waiters`,
  ACTIVE_WAITERS: `${API_BASE}/manager/waiters/active`,
  WAITER_BY_ID: (id: string) => `${API_BASE}/manager/waiters/${id}`,
  WAITER_TABLES: (id: string) => `${API_BASE}/manager/waiters/${id}/tables`,
  WAITER_RESET_PASSWORD: (id: string) => `${API_BASE}/manager/waiters/${id}/reset-password`,
  WAITER_STATUS: (id: string) => `${API_BASE}/manager/waiters/${id}/status`,

  // Menu
  MENU: `${API_BASE}/manager/menu`,
  MENU_CATEGORIES: `${API_BASE}/manager/menu/categories`,
  MENU_STATS: `${API_BASE}/manager/menu/stats`,
  MENU_ITEM: (id: string) => `${API_BASE}/manager/menu/${id}`,
  MENU_ITEM_IMAGE: (id: string) => `${API_BASE}/manager/menu/${id}/image`,
  MENU_AVAILABILITY: (id: string) => `${API_BASE}/manager/menu/${id}/availability`,
  MENU_CATEGORY_AVAILABILITY: (category: string) =>
    `${API_BASE}/manager/menu/category/${encodeURIComponent(category)}/availability`,

  // Analytics
  ANALYTICS: `${API_BASE}/admins/analytics`,

  // Tables
  TABLES: `${API_BASE}/manager/tables`,
  TABLE_STATS: `${API_BASE}/manager/tables/statistics`,
  TABLE_BY_NO: (tableNo: number) => `${API_BASE}/manager/tables/${tableNo}`,
  TABLE_CAPACITY: (tableNo: number) => `${API_BASE}/manager/tables/${tableNo}/capacity`,
} as const;

export default API_CONFIG;