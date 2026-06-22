// ============================================================================
// WAITER AUTH CONTEXT
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WaiterStorage } from '@/utils/storage';
import { ENDPOINTS, NGROK_HEADERS } from '@/config/api';
import { registerForPushNotificationsAsync } from '@/services/notificationService';

// ============================================================================
// TYPES
// ============================================================================

interface WaiterUser {
  waiterId: string;
  waiterName: string;
  mobile: string;
  isActive: boolean;
}

interface WaiterAuthContextType {
  waiter: WaiterUser | null;
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

const WaiterAuthContext = createContext<WaiterAuthContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export const WaiterAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [waiter, setWaiter] = useState<WaiterUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await WaiterStorage.getAccessToken();
        const id = await WaiterStorage.getWaiterId();
        const name = await WaiterStorage.getWaiterName();
        const mobile = await WaiterStorage.getWaiterMobile();
        if (token && id) {
          setAccessToken(token);
          setWaiter({ waiterId: id, waiterName: name ?? '', mobile: mobile ?? '', isActive: true });
        }
      } catch (err) {
        console.warn('[WaiterAuth] Session restore failed', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (mobile: string, password: string) => {
    try {
      // 1. Get FCM token (best-effort)
      const fcmToken = await registerForPushNotificationsAsync();

      // 2. Call login API
      const response = await fetch(ENDPOINTS.WAITER_LOGIN, {
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

      const { accessToken: at, refreshToken: rt, waiter: w } = json.data;

      // 3. Persist session
      await WaiterStorage.saveSession({
        accessToken: at,
        refreshToken: rt,
        waiterId: w.waiterId,
        waiterName: w.waiterName,
        mobile: w.mobile,
      });

      setAccessToken(at);
      setWaiter({ waiterId: w.waiterId, waiterName: w.waiterName, mobile: w.mobile, isActive: w.isActive ?? true });

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
    // Clear local state immediately
    setWaiter(null);
    setAccessToken(null);
    await WaiterStorage.clearSession();

    if (token) {
      try {
        await fetch(ENDPOINTS.WAITER_LOGOUT, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, ...NGROK_HEADERS },
        });
      } catch {
        // Best-effort logout on server
      }
    }
  }, [accessToken]);

  // ── Refresh Token ─────────────────────────────────────────────────────────
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const rt = await WaiterStorage.getRefreshToken();
    if (!rt) return false;

    try {
      const res = await fetch(ENDPOINTS.WAITER_REFRESH, {
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
        await WaiterStorage.saveAccessToken(json.data.accessToken);
        setAccessToken(json.data.accessToken);
        return true;
      }

      // Account disabled or refresh expired
      if (json.disabled) {
        await WaiterStorage.clearSession();
        setWaiter(null);
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
    <WaiterAuthContext.Provider
      value={{
        waiter,
        accessToken,
        isLoading,
        isAuthenticated: !!waiter && !!accessToken,
        login,
        logout,
        refreshToken,
        getAuthHeaders,
      }}
    >
      {children}
    </WaiterAuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useWaiterAuth = (): WaiterAuthContextType => {
  const ctx = useContext(WaiterAuthContext);
  if (!ctx) throw new Error('useWaiterAuth must be used within WaiterAuthProvider');
  return ctx;
};
