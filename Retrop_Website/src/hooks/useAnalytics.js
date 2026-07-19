// ============================================================================
// USE ANALYTICS HOOK — Auto-track pageviews & session duration on route changes
// ============================================================================

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, sendHeartbeat } from '../utils/analytics';

export function useAnalytics() {
  const location = useLocation();
  const sessionStartTime = useRef(Date.now());
  const currentPathname = useRef(location.pathname);

  // Update current pathname ref
  useEffect(() => {
    currentPathname.current = location.pathname;
  }, [location.pathname]);

  // Track pageview on route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Session duration timer & Heartbeat (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      sendHeartbeat(durationSeconds, currentPathname.current);
    }, 60000); // 60 seconds interval

    const handleUnload = () => {
      const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      sendHeartbeat(durationSeconds, currentPathname.current, true);
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);
}
