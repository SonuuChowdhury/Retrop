// ============================================================================
// AUTH CONTEXT  (UPDATED — adds refreshToken export alias for apiCall compat)
// ============================================================================
// Manages global authentication state for Manager/Admin role.
// Persists session securely and handles token lifecycle.
// No breaking changes to existing API.
// ============================================================================

import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { TokenStorage } from '@/utils/storage';
import { loginManager, refreshAccessToken } from '@/services/authService';
import { ENDPOINTS, NGROK_HEADERS } from '@/config/api';

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

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    manager: null,
    accessToken: null,
  });

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

      const { accessToken } = result.data;
      const profile = await fetchManagerProfile(accessToken);

      await TokenStorage.saveSession({
        accessToken,
        refreshToken: storedRefreshToken,
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
