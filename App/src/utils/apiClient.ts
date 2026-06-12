// ============================================================================
// API CLIENT — FETCH WRAPPER WITH AUTO-REFRESH + DISABLED HANDLING
// ============================================================================
// 1. Attaches Authorization + Content-Type + ngrok headers
// 2. On 401: attempts token refresh once, retries original request
// 3. On 403 + disabled: calls onDisabled() callback
// 4. Returns typed result
// ============================================================================

import { NGROK_HEADERS } from '@/config/api';

interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  disabled?: boolean;
  status?: string;
}

export async function apiCall<T = any>(
  url: string,
  options: RequestInit,
  getToken: () => Promise<string | null>,
  onRefresh: () => Promise<boolean>,
  onDisabled: () => void,
): Promise<ApiResult<T>> {
  const doFetch = async (): Promise<Response> => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        // Only send Content-Type: application/json when there IS a body.
        // Sending it on bodyless PATCH/GET causes express.json() to try to
        // parse an empty string → SyntaxError → "Invalid JSON body" 400.
        ...(options.body != null ? { 'Content-Type': 'application/json' } : {}),
        Accept: 'application/json',
        ...NGROK_HEADERS,
        ...(options.headers as Record<string, string> ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };

  try {
    let response = await doFetch();

    // ── Auto-refresh on 401 ──────────────────────────────────────────────────
    if (response.status === 401) {
      const refreshed = await onRefresh();
      if (refreshed) {
        response = await doFetch();
      } else {
        return { success: false, message: 'Session expired. Please log in again.' };
      }
    }

    const json = await response.json();

    // ── Account disabled ─────────────────────────────────────────────────────
    if (response.status === 403 && json?.disabled) {
      onDisabled();
      return { success: false, message: json.message ?? 'Account disabled.', disabled: true };
    }

    if (!response.ok) {
      return { success: false, message: json?.message ?? `Request failed (${response.status})` };
    }

    // Normalise: backend always wraps in { status: 'success', data: ... }
    if (json?.status === 'success') {
      return { success: true, data: json.data as T };
    }

    return { success: false, message: json?.message ?? 'Unexpected server response' };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { success: false, message: 'Request timed out.' };
    }
    if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
      return { success: false, message: 'Unable to reach server. Check your connection.' };
    }
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
