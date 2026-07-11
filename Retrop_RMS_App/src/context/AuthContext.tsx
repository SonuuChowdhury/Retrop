// ============================================================================
// AUTH CONTEXT  (UPDATED — adds refreshToken export alias for apiCall compat)
// ============================================================================
// Manages global authentication state for Manager/Admin role.
// Persists session securely and handles token lifecycle.
// No breaking changes to existing API.
// ============================================================================

import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef,
} from 'react';
import { TokenStorage } from '@/utils/storage';
import { loginManager, refreshAccessToken } from '@/services/authService';
import { ENDPOINTS, NGROK_HEADERS } from '@/config/api';
import { useDialog } from '@/context/DialogContext';

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 'manager' | 'owner';

export interface Manager {
  adminId: string;
  name: string;
  mobile: string;
  role: UserRole;
  email?: string;
  lastLogIn?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  manager: Manager | null;
  accessToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (mobile: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
  refreshSession: () => Promise<boolean>;
  /** Alias for refreshSession — matches apiCall's onRefresh signature */
  refreshToken: () => Promise<boolean>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let isInterceptorSetup = false;
let isRefreshingToken = false;
let refreshPromise: Promise<boolean> | null = null;

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showConfirm } = useDialog();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    manager: null,
    accessToken: null,
  });

  const showConfirmRef = useRef(showConfirm);
  const logoutRef = useRef<() => Promise<void>>(async () => {});
  const tryRefreshTokenRef = useRef<() => Promise<boolean>>(async () => false);

  useEffect(() => {
    showConfirmRef.current = showConfirm;
    logoutRef.current = logout;
    tryRefreshTokenRef.current = tryRefreshToken;
  });

  useEffect(() => {
    if (isInterceptorSetup) return;
    isInterceptorSetup = true;

    const originalFetch = global.fetch;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as any).url;
      const response = await originalFetch(input, init);

      if (response.status === 401 && url && (url.includes('/api/admin') || url.includes('/api/manager') || url.includes('/api/owner'))) {
        console.log(`[Fetch Interceptor] 401 Unauthorized for ${url}`);

        // Try to refresh token (lock mechanism to prevent duplicate parallel requests)
        if (!isRefreshingToken) {
          isRefreshingToken = true;
          refreshPromise = tryRefreshTokenRef.current();
        }

        const refreshed = await refreshPromise;
        isRefreshingToken = false;
        refreshPromise = null;

        if (refreshed) {
          console.log('[Fetch Interceptor] Token refreshed successfully. Retrying request...');
          const newToken = await TokenStorage.getAccessToken();
          if (init) {
            const headers = { ...init.headers } as Record<string, string>;
            headers['Authorization'] = `Bearer ${newToken}`;
            return originalFetch(input, { ...init, headers });
          }
          return originalFetch(input, {
            headers: {
              Authorization: `Bearer ${newToken}`,
              ...NGROK_HEADERS,
            }
          });
        } else {
          console.warn('[Fetch Interceptor] Token refresh failed. Prompting for re-login.');

          showConfirmRef.current({
            title: 'Session Expired',
            message: 'Your login session has expired. Please log in again to continue.',
            confirmText: 'Re-login',
            cancelText: 'Cancel',
            destructive: true,
            onConfirm: async () => {
              await logoutRef.current();
            },
            onCancel: async () => {
              await logoutRef.current();
            }
          });
        }
      }

      return response;
    };

    return () => {
      global.fetch = originalFetch;
      isInterceptorSetup = false;
    };
  }, []);

  useEffect(() => { restoreSession(); }, []);

  const restoreSession = async () => {
    try {
      const hasSession = await TokenStorage.hasActiveSession();
      if (!hasSession) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const [token, adminId, role] = await Promise.all([
        TokenStorage.getAccessToken(),
        TokenStorage.getAdminId(),
        TokenStorage.getRole(),
      ]);

      if (!token || !adminId || (role !== 'manager' && role !== 'owner')) {
        await TokenStorage.clearSession();
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const profileResult = await fetchManagerProfile(token);
      if (profileResult) {
        setState({ isAuthenticated: true, isLoading: false, manager: profileResult, accessToken: token });
      } else {
        const refreshed = await tryRefreshToken();
        if (!refreshed) {
          await TokenStorage.clearSession();
          setState({ isAuthenticated: false, isLoading: false, manager: null, accessToken: null });
        }
      }
    } catch {
      setState({ isAuthenticated: false, isLoading: false, manager: null, accessToken: null });
    }
  };

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (mobile: string, password: string) => {
    const result = await loginManager({ mobile, password });
    if (!result.success) return { success: false, message: result.message };

    const { accessToken, refreshToken, adminId, role, name, mobile: adminMobile, email } = result.data;
    const localProfile: Manager = { adminId, name: name ?? 'Manager', mobile: adminMobile ?? mobile, role: role as UserRole, email };

    await TokenStorage.saveSession({ accessToken, refreshToken, adminId, role, name: localProfile.name });
    const profile = await fetchManagerProfile(accessToken) ?? localProfile;

    setState({ isAuthenticated: true, isLoading: false, manager: profile, accessToken });
    return { success: true };
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await TokenStorage.clearSession();
    setState({ isAuthenticated: false, isLoading: false, manager: null, accessToken: null });
  }, []);

  // ─── Auth Headers ──────────────────────────────────────────────────────────
  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!state.accessToken) return { ...NGROK_HEADERS };
    return {
      Authorization: `Bearer ${state.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...NGROK_HEADERS,
    };
  }, [state.accessToken]);

  // ─── Refresh ───────────────────────────────────────────────────────────────
  const tryRefreshToken = async (): Promise<boolean> => {
    try {
      const [storedRefreshToken, storedAdminId, storedRole] = await Promise.all([
        TokenStorage.getRefreshToken(),
        TokenStorage.getAdminId(),
        TokenStorage.getRole(),
      ]);
      if (!storedRefreshToken || !storedAdminId || !storedRole) return false;

      const result = await refreshAccessToken(storedRefreshToken);
      if (!result.success) return false;

      const { accessToken, refreshToken: newRefreshToken } = result.data;
      const profile = await fetchManagerProfile(accessToken);

      await TokenStorage.saveSession({
        accessToken,
        refreshToken: newRefreshToken || storedRefreshToken,
        adminId: storedAdminId,
        role: storedRole,
        name: profile?.name,
      });

      setState((prev) => ({ ...prev, accessToken, manager: profile ?? prev.manager, isAuthenticated: true }));
      return true;
    } catch {
      return false;
    }
  };

  const refreshSession = useCallback(async () => tryRefreshToken(), []);
  const refreshToken = refreshSession; // alias for apiCall compat

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getAuthHeaders, refreshSession, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// ============================================================================
// HELPERS
// ============================================================================

async function fetchManagerProfile(token: string): Promise<Manager | null> {
  try {
    const response = await fetch(ENDPOINTS.MANAGER_PROFILE, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...NGROK_HEADERS },
    });
    if (!response.ok) return null;
    const json = await response.json();
    if (json?.status !== 'success' || !json?.data) return null;
    return json.data as Manager;
  } catch {
    return null;
  }
}
