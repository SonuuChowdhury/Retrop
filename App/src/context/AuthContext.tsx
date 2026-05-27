// ============================================================================
// AUTH CONTEXT
// ============================================================================
// Manages global authentication state.
// Persists session securely and handles token lifecycle.
// ============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
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

  // ─── Restore session on mount ───────────────────────────────────────────
  useEffect(() => {
    restoreSession();
  }, []);

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

      // Fetch manager profile to validate token
      const profileResult = await fetchManagerProfile(token);
      if (profileResult) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          manager: profileResult,
          accessToken: token,
        });
      } else {
        // Token likely expired — try refresh
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

  // ─── Login ───────────────────────────────────────────────────────────────
  const login = useCallback(
    async (mobile: string, password: string): Promise<{ success: boolean; message?: string }> => {
      const result = await loginManager({ mobile, password });

      if (!result.success) {
        return { success: false, message: result.message };
      }

      const { accessToken, refreshToken, adminId, role, name, mobile: adminMobile, email } = result.data;

      // Build a local profile from login data immediately (no extra round-trip needed)
      const localProfile: Manager = {
        adminId,
        name: name ?? 'Manager',
        mobile: adminMobile ?? mobile,
        role: role as UserRole,
        email,
      };

      // Save session first so profile fetch has a valid token
      await TokenStorage.saveSession({
        accessToken,
        refreshToken,
        adminId,
        role,
        name: localProfile.name,
      });

      // Optionally enrich profile from /me endpoint (non-blocking failure)
      const profile = await fetchManagerProfile(accessToken) ?? localProfile;

      setState({
        isAuthenticated: true,
        isLoading: false,
        manager: profile,
        accessToken,
      });

      return { success: true };
    },
    []
  );

  // ─── Logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await TokenStorage.clearSession();
    setState({
      isAuthenticated: false,
      isLoading: false,
      manager: null,
      accessToken: null,
    });
  }, []);

  // ─── Auth Headers ─────────────────────────────────────────────────────────
  // FIX: Always include ngrok bypass header so requests aren't intercepted
  // by the ngrok browser warning page (which returns HTML instead of JSON).
  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!state.accessToken) return { ...NGROK_HEADERS };
    return {
      Authorization: `Bearer ${state.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...NGROK_HEADERS,
    };
  }, [state.accessToken]);

  // ─── Refresh Session ─────────────────────────────────────────────────────
  const refreshSession = useCallback(async (): Promise<boolean> => {
    return tryRefreshToken();
  }, []);

  // ─── FIX: Backend refresh only returns a new accessToken (no new refreshToken).
  //         We keep the existing refreshToken and re-use stored adminId/role.
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

      // Fetch fresh profile with new token
      const profile = await fetchManagerProfile(accessToken);

      // Persist updated access token while keeping existing refresh token / adminId / role
      await TokenStorage.saveSession({
        accessToken,
        refreshToken: storedRefreshToken,
        adminId: storedAdminId,
        role: storedRole,
        name: profile?.name,
      });

      setState((prev) => ({
        ...prev,
        accessToken,
        manager: profile ?? prev.manager,
        isAuthenticated: true,
      }));

      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, getAuthHeaders, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ============================================================================
// HELPERS
// ============================================================================

async function fetchManagerProfile(token: string): Promise<Manager | null> {
  try {
    const response = await fetch(ENDPOINTS.MANAGER_PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...NGROK_HEADERS,
      },
    });
    if (!response.ok) return null;
    const json = await response.json();
    if (json?.status !== 'success' || !json?.data) return null;
    return json.data as Manager;
  } catch {
    return null;
  }
}