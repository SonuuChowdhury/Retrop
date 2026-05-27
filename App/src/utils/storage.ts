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
  ACCESS_TOKEN: 'rms_access_token',
  REFRESH_TOKEN: 'rms_refresh_token',
  ADMIN_ID: 'rms_admin_id',
  ROLE: 'rms_role',
  MANAGER_NAME: 'rms_manager_name',
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
// PUBLIC API
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
    await Promise.all(Object.values(KEYS).map(removeItem));
  },

  async hasActiveSession(): Promise<boolean> {
    const token = await getItem(KEYS.ACCESS_TOKEN);
    return !!token;
  },
};