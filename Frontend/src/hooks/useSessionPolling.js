// ============================================================================
// useSessionPolling
// ============================================================================
// Polls GET /api/order/session/:tableId/status at a given interval.
// Automatically stops when the component unmounts or when `enabled` is false.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api.js';

/**
 * @param {string|null} tableId
 * @param {number} intervalMs — polling interval in milliseconds
 * @param {boolean} enabled — set to false to pause polling
 * @returns {{ session, loading, error, refetch }}
 */
export function useSessionPolling(tableId, intervalMs = 3000, enabled = true) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!tableId) return;
    try {
      const res = await api.getSessionStatus(tableId);
      setSession(res.data);
      setError(null);
    } catch (err) {
      // Surface errors in DevTools so polling failures are never silent
      if (import.meta.env.DEV) {
        console.error(`[useSessionPolling] Poll failed for table ${tableId}:`, err?.message, `(status: ${err?.status})`);
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    if (!tableId || !enabled) return;

    fetchStatus(); // immediate first fetch

    intervalRef.current = setInterval(fetchStatus, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [tableId, intervalMs, enabled, fetchStatus]);

  return { session, loading, error, refetch: fetchStatus };
}
