// ============================================================================
// useMenu
// ============================================================================
// Fetches the public menu once and caches in module-level memory.
// Re-fetches only when the component mounts for the first time after
// the cache expires (5 min to match backend Redis cache).
// ============================================================================

import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

// Module-level cache (survives re-renders, cleared on page refresh)
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useMenu() {
  const [menu, setMenu] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    const now = Date.now();
    if (_cache && now - _cacheTime < CACHE_TTL) {
      setMenu(_cache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api.getMenu()
      .then((res) => {
        if (cancelled) return;
        _cache = res.data;
        _cacheTime = Date.now();
        setMenu(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  /**
   * Returns menu items grouped by category.
   * { "Starters": [...], "Mains": [...], ... }
   */
  const menuByCategory = menu
    ? menu.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {})
    : {};

  const categories = Object.keys(menuByCategory).sort();

  return { menu, menuByCategory, categories, loading, error };
}
