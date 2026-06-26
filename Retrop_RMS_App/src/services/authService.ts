// ============================================================================
// AUTH SERVICE
// ============================================================================
// Handles all authentication API calls for manager/admin login.
// Uses centralized API config — no hardcoded URLs.
// ============================================================================

import { ENDPOINTS, TIMEOUT_MS } from '@/config/api';

export interface LoginCredentials {
  mobile: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    adminId: string;
    role: 'manager' | 'owner';
    name?: string;
    mobile?: string;
    email?: string;
  };
}

export interface LoginError {
  success: false;
  message: string;
  code?: number;
}

export type LoginResult = LoginResponse | LoginError;

// ============================================================================
// MANAGER / ADMIN LOGIN
// POST /api/admin/login
// ============================================================================

export async function loginManager(credentials: LoginCredentials): Promise<LoginResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINTS.ADMIN_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        mobile: credentials.mobile,
        password: credentials.password,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    const json = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: json?.message ?? getHttpErrorMessage(response.status),
        code: response.status,
      };
    }

    if (json?.status !== 'success' || !json?.data) {
      return {
        success: false,
        message: json?.message ?? 'Unexpected server response',
      };
    }

    // ─── FIX: Backend returns tokens at json.data level,
    //         but admin fields are nested under json.data.admin
    const { accessToken, refreshToken, admin } = json.data;

    if (!accessToken || !refreshToken || !admin) {
      return {
        success: false,
        message: 'Incomplete response from server. Please try again.',
      };
    }

    const { adminId, role, name, mobile, email } = admin;

    // Only 'manager' role accounts may log into the manager dashboard
    if (role !== 'manager') {
      return {
        success: false,
        message: 'Access denied. Only manager accounts can log in here.',
        code: 403,
      };
    }

    return {
      success: true,
      data: { accessToken, refreshToken, adminId, role, name, mobile, email },
    };
  } catch (error: any) {
    clearTimeout(timer);

    if (error?.name === 'AbortError') {
      return {
        success: false,
        message: 'Request timed out. Please check your connection.',
      };
    }

    if (
      error?.message?.includes('Network request failed') ||
      error?.message?.includes('fetch')
    ) {
      return {
        success: false,
        message: 'Unable to reach server. Please check your internet connection.',
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// ============================================================================
// TOKEN REFRESH
// POST /api/admin/refresh
// ============================================================================

export interface RefreshResponse {
  success: true;
  data: {
    accessToken: string;
    // Backend refresh endpoint only returns a new accessToken — no new refreshToken
  };
}

export type RefreshResult = RefreshResponse | LoginError;

export async function refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINTS.ADMIN_REFRESH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const json = await response.json();

    if (!response.ok || json?.status !== 'success') {
      return {
        success: false,
        message: json?.message ?? 'Session expired. Please log in again.',
        code: response.status,
      };
    }

    if (!json?.data?.accessToken) {
      return {
        success: false,
        message: 'Invalid refresh response from server.',
      };
    }

    return {
      success: true,
      data: { accessToken: json.data.accessToken },
    };
  } catch (error: any) {
    clearTimeout(timer);

    if (error?.name === 'AbortError') {
      return {
        success: false,
        message: 'Request timed out. Please log in again.',
      };
    }

    return {
      success: false,
      message: 'Session expired. Please log in again.',
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400: return 'Invalid credentials format.';
    case 401: return 'Invalid mobile number or password.';
    case 403: return 'Access denied. Manager credentials required.';
    case 404: return 'Account not found.';
    case 429: return 'Too many login attempts. Please wait before trying again.';
    case 500:
    case 502:
    case 503: return 'Server is temporarily unavailable. Please try again shortly.';
    default:  return 'Login failed. Please try again.';
  }
}