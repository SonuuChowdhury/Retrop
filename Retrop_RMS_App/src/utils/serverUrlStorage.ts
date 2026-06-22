// ============================================================================
// SERVER URL STORAGE
// ============================================================================
// Saves the backend server URL to AsyncStorage so users don't need to
// rebuild the app when the server URL changes (e.g. ngrok restart).
//
// Uses AsyncStorage (not SecureStore) — URL is not a secret.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL_KEY  = 'rms_server_url';
const URL_SET_KEY     = 'rms_server_url_set';

// Default fallback — only used if AsyncStorage read fails catastrophically
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const serverUrlStorage = {
  /** Get saved URL. Returns null if not set yet. */
  getUrl: async (): Promise<string | null> => {
    try {
      const url = await AsyncStorage.getItem(SERVER_URL_KEY);
      return url && url.length > 0 ? url.trim() : null;
    } catch {
      return null;
    }
  },

  /** Save a new server URL. Trims trailing slash. */
  saveUrl: async (url: string): Promise<void> => {
    try {
      const cleaned = url.trim().replace(/\/+$/, ''); // remove trailing slash
      await AsyncStorage.setItem(SERVER_URL_KEY, cleaned);
      await AsyncStorage.setItem(URL_SET_KEY, 'true');
    } catch (err) {
      console.error('[ServerURL] Failed to save URL', err);
      throw err;
    }
  },

  /** Whether URL has been configured by user */
  isSet: async (): Promise<boolean> => {
    try {
      const flag = await AsyncStorage.getItem(URL_SET_KEY);
      if (flag !== 'true') return false;
      const url = await AsyncStorage.getItem(SERVER_URL_KEY);
      return !!(url && url.length > 4);
    } catch {
      return false;
    }
  },

  /** Clear saved URL — forces setup screen to show again */
  clearUrl: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([SERVER_URL_KEY, URL_SET_KEY]);
    } catch (err) {
      console.error('[ServerURL] Failed to clear URL', err);
    }
  },

  /** Default/fallback URL from env */
  defaultUrl: DEFAULT_URL,
};
