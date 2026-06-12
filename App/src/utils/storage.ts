// ============================================================================
// SECURE TOKEN STORAGE UTILITY
// ============================================================================
// Uses expo-secure-store on native (encrypted keychain/keystore).
// Falls back to in-memory for web (never persisted to localStorage).
// ============================================================================

import { Platform } from 'react-native';

// Dynamic import for SecureStore — only available on native
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch {
    console.warn('[Storage] expo-secure-store not available');
  }
}

// In-memory fallback for web (session-scoped only)
const memoryStore: Record<string, string> = {};

const KEYS = {
  // Manager (existing)
  ACCESS_TOKEN:   'rms_access_token',
  REFRESH_TOKEN:  'rms_refresh_token',
  ADMIN_ID:       'rms_admin_id',
  ROLE:           'rms_role',
  MANAGER_NAME:   'rms_manager_name',

  // Waiter (NEW)
  WAITER_ACCESS_TOKEN:  'rms_waiter_access_token',
  WAITER_REFRESH_TOKEN: 'rms_waiter_refresh_token',
  WAITER_ID:            'rms_waiter_id',
  WAITER_NAME:          'rms_waiter_name',
  WAITER_MOBILE:        'rms_waiter_mobile',

  // Kitchen (NEW)
  KITCHEN_ACCESS_TOKEN:  'rms_kitchen_access_token',
  KITCHEN_REFRESH_TOKEN: 'rms_kitchen_refresh_token',
  KITCHEN_ID:            'rms_kitchen_id',
  KITCHEN_NAME:          'rms_kitchen_name',
} as const;

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (SecureStore) {
      await SecureStore.setItemAsync(key, value);
    } else {
      memoryStore[key] = value;
    }
  } catch (error) {
    console.error(`[Storage] Failed to set ${key}:`, error);
    throw error;
  }
}

async function getItem(key: string): Promise<string | null> {
  try {
    if (SecureStore) {
      return await SecureStore.getItemAsync(key);
    }
    return memoryStore[key] ?? null;
  } catch (error) {
    console.error(`[Storage] Failed to get ${key}:`, error);
    return null;
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    if (SecureStore) {
      await SecureStore.deleteItemAsync(key);
    } else {
      delete memoryStore[key];
    }
  } catch (error) {
    console.error(`[Storage] Failed to remove ${key}:`, error);
  }
}

// ============================================================================
// MANAGER / ADMIN PUBLIC API
// ============================================================================

export const TokenStorage = {
  async saveSession(data: {
    accessToken: string;
    refreshToken: string;
    adminId: string;
    role: string;
    name?: string;
  }): Promise<void> {
    await Promise.all([
      setItem(KEYS.ACCESS_TOKEN, data.accessToken),
      setItem(KEYS.REFRESH_TOKEN, data.refreshToken),
      setItem(KEYS.ADMIN_ID, data.adminId),
      setItem(KEYS.ROLE, data.role),
      data.name ? setItem(KEYS.MANAGER_NAME, data.name) : Promise.resolve(),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return getItem(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(KEYS.REFRESH_TOKEN);
  },

  async getAdminId(): Promise<string | null> {
    return getItem(KEYS.ADMIN_ID);
  },

  async getRole(): Promise<string | null> {
    return getItem(KEYS.ROLE);
  },

  async getManagerName(): Promise<string | null> {
    return getItem(KEYS.MANAGER_NAME);
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.ADMIN_ID,
      KEYS.ROLE,
      KEYS.MANAGER_NAME,
    ].map(removeItem));
  },

  async hasActiveSession(): Promise<boolean> {
    const token = await getItem(KEYS.ACCESS_TOKEN);
    return !!token;
  },
};

// ============================================================================
// WAITER PUBLIC API
// ============================================================================

export const WaiterStorage = {
  async saveSession(data: {
    accessToken: string;
    refreshToken: string;
    waiterId: string;
    waiterName: string;
    mobile: string;
  }): Promise<void> {
    await Promise.all([
      setItem(KEYS.WAITER_ACCESS_TOKEN, data.accessToken),
      setItem(KEYS.WAITER_REFRESH_TOKEN, data.refreshToken),
      setItem(KEYS.WAITER_ID, data.waiterId),
      setItem(KEYS.WAITER_NAME, data.waiterName),
      setItem(KEYS.WAITER_MOBILE, data.mobile),
    ]);
  },

  async saveAccessToken(token: string): Promise<void> {
    return setItem(KEYS.WAITER_ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return getItem(KEYS.WAITER_ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(KEYS.WAITER_REFRESH_TOKEN);
  },

  async getWaiterId(): Promise<string | null> {
    return getItem(KEYS.WAITER_ID);
  },

  async getWaiterName(): Promise<string | null> {
    return getItem(KEYS.WAITER_NAME);
  },

  async getWaiterMobile(): Promise<string | null> {
    return getItem(KEYS.WAITER_MOBILE);
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      KEYS.WAITER_ACCESS_TOKEN,
      KEYS.WAITER_REFRESH_TOKEN,
      KEYS.WAITER_ID,
      KEYS.WAITER_NAME,
      KEYS.WAITER_MOBILE,
    ].map(removeItem));
  },

  async hasActiveSession(): Promise<boolean> {
    const token = await getItem(KEYS.WAITER_ACCESS_TOKEN);
    return !!token;
  },
};

// ============================================================================
// KITCHEN PUBLIC API
// ============================================================================

export const KitchenStorage = {
  async saveSession(data: {
    accessToken: string;
    refreshToken: string;
    kitchenId: string;
    kitchenName: string;
  }): Promise<void> {
    await Promise.all([
      setItem(KEYS.KITCHEN_ACCESS_TOKEN, data.accessToken),
      setItem(KEYS.KITCHEN_REFRESH_TOKEN, data.refreshToken),
      setItem(KEYS.KITCHEN_ID, data.kitchenId),
      setItem(KEYS.KITCHEN_NAME, data.kitchenName),
    ]);
  },

  async saveAccessToken(token: string): Promise<void> {
    return setItem(KEYS.KITCHEN_ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return getItem(KEYS.KITCHEN_ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(KEYS.KITCHEN_REFRESH_TOKEN);
  },

  async getKitchenId(): Promise<string | null> {
    return getItem(KEYS.KITCHEN_ID);
  },

  async getKitchenName(): Promise<string | null> {
    return getItem(KEYS.KITCHEN_NAME);
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      KEYS.KITCHEN_ACCESS_TOKEN,
      KEYS.KITCHEN_REFRESH_TOKEN,
      KEYS.KITCHEN_ID,
      KEYS.KITCHEN_NAME,
    ].map(removeItem));
  },

  async hasActiveSession(): Promise<boolean> {
    const token = await getItem(KEYS.KITCHEN_ACCESS_TOKEN);
    return !!token;
  },
};
