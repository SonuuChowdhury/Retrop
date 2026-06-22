// ============================================================================
// KITCHEN AUTH CONTEXT
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { KitchenStorage } from '@/utils/storage';
import { ENDPOINTS, NGROK_HEADERS } from '@/config/api';
import { registerForPushNotificationsAsync } from '@/services/notificationService';

// ============================================================================
// TYPES
// ============================================================================

interface KitchenUser {
  kitchenId: string;
  kitchenName: string;
  isActive: boolean;
}

interface KitchenAuthContextType {
  kitchen: KitchenUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mobile: string, password: string) => Promise<{ success: boolean; message?: string; disabled?: boolean }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getAuthHeaders: () => Record<string, string>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const KitchenAuthContext = createContext<KitchenAuthContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export const KitchenAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kitchen, setKitchen] = useState<KitchenUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await KitchenStorage.getAccessToken();
        const id = await KitchenStorage.getKitchenId();
        const name = await KitchenStorage.getKitchenName();
        if (token && id) {
          setAccessToken(token);
          setKitchen({ kitchenId: id, kitchenName: name ?? '', isActive: true });
        }
      } catch (err) {
        console.warn('[KitchenAuth] Session restore failed', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (mobile: string, password: string) => {
    try {
      const fcmToken = await registerForPushNotificationsAsync();

      const response = await fetch(ENDPOINTS.KITCHEN_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({ mobile, password, fcmToken }),
      });

      const json = await response.json();

      if (!response.ok || json.status !== 'success') {
        return {
          success: false,
          message: json.message ?? 'Login failed. Please try again.',
          disabled: json.disabled ?? false,
        };
      }

      const { accessToken: at, refreshToken: rt, kitchen: k } = json.data;

      await KitchenStorage.saveSession({
        accessToken: at,
        refreshToken: rt,
        kitchenId: k.kitchenId,
        kitchenName: k.kitchenName,
      });

      setAccessToken(at);
      setKitchen({ kitchenId: k.kitchenId, kitchenName: k.kitchenName, isActive: k.isActive ?? true });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message?.includes('Network')
          ? 'Unable to reach server. Check your connection.'
          : 'An unexpected error occurred.',
      };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const token = accessToken;
    setKitchen(null);
    setAccessToken(null);
    await KitchenStorage.clearSession();

    if (token) {
      try {
        await fetch(ENDPOINTS.KITCHEN_LOGOUT, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, ...NGROK_HEADERS },
        });
      } catch {
        // Best-effort
      }
    }
  }, [accessToken]);

  // ── Refresh Token ─────────────────────────────────────────────────────────
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const rt = await KitchenStorage.getRefreshToken();
    if (!rt) return false;

    try {
      const res = await fetch(ENDPOINTS.KITCHEN_REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({ refreshToken: rt }),
      });
      const json = await res.json();

      if (json.status === 'success' && json.data?.accessToken) {
        await KitchenStorage.saveAccessToken(json.data.accessToken);
        setAccessToken(json.data.accessToken);
        return true;
      }

      if (json.disabled) {
        await KitchenStorage.clearSession();
        setKitchen(null);
        setAccessToken(null);
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // ── Auth Headers ──────────────────────────────────────────────────────────
  const getAuthHeaders = useCallback((): Record<string, string> => {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...NGROK_HEADERS,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
  }, [accessToken]);

  return (
    <KitchenAuthContext.Provider
      value={{
        kitchen,
        accessToken,
        isLoading,
        isAuthenticated: !!kitchen && !!accessToken,
        login,
        logout,
        refreshToken,
        getAuthHeaders,
      }}
    >
      {children}
    </KitchenAuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useKitchenAuth = (): KitchenAuthContextType => {
  const ctx = useContext(KitchenAuthContext);
  if (!ctx) throw new Error('useKitchenAuth must be used within KitchenAuthProvider');
  return ctx;
};
