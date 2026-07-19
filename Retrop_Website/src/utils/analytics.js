// ============================================================================
// VISITOR & TRAFFIC ANALYTICS ENGINE — Client Tracker Utility
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '';

// Generate or retrieve persistent Visitor ID (stored across visits)
export function getVisitorId() {
  let vid = localStorage.getItem('retrop_vid');
  if (!vid) {
    vid = 'vid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('retrop_vid', vid);
  }
  return vid;
}

// Generate or retrieve Session ID (stored for browser session)
export function getSessionId() {
  let sid = sessionStorage.getItem('retrop_sid');
  if (!sid) {
    sid = 'sid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    sessionStorage.setItem('retrop_sid', sid);
  }
  return sid;
}

// Check if visitor is returning (has previous visit logged)
export function isReturningVisitor() {
  const lastVisit = localStorage.getItem('retrop_last_visit');
  const now = Date.now();
  localStorage.setItem('retrop_last_visit', now.toString());
  return !!lastVisit;
}

// Detect Device Type, Browser, Operating System, Screen Resolution, Timezone & Network
export function getDeviceInfo() {
  const ua = navigator.userAgent;

  // Device Type
  let deviceType = 'Desktop';
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

  // Browser Detection
  let browser = 'Unknown';
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  // Operating System
  let os = 'Unknown';
  if (/win/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Screen Resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  // Timezone
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    // fallback
  }

  // Network connection type if available
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const network = connection ? connection.effectiveType || connection.type || 'unknown' : 'online';

  return {
    deviceType,
    browser,
    operatingSystem: os,
    screenResolution,
    timezone,
    network
  };
}

// Parse Referrer & UTM Parameters to categorize Traffic Source
export function getTrafficSource() {
  const urlParams = new URLSearchParams(window.location.search);
  const utm = {
    source: urlParams.get('utm_source') || '',
    medium: urlParams.get('utm_medium') || '',
    campaign: urlParams.get('utm_campaign') || '',
    term: urlParams.get('utm_term') || '',
    content: urlParams.get('utm_content') || ''
  };

  const referrer = document.referrer || '';
  let sourceCategory = 'Direct';
  let referrerDomain = '';

  if (referrer) {
    try {
      const url = new URL(referrer);
      referrerDomain = url.hostname.replace(/^www\./, '');

      if (/google\./i.test(referrerDomain)) sourceCategory = 'Google';
      else if (/facebook\.com|fb\.me/i.test(referrerDomain)) sourceCategory = 'Facebook';
      else if (/instagram\.com/i.test(referrerDomain)) sourceCategory = 'Instagram';
      else if (/linkedin\.com/i.test(referrerDomain)) sourceCategory = 'LinkedIn';
      else if (/twitter\.com|t\.co|x\.com/i.test(referrerDomain)) sourceCategory = 'Twitter/X';
      else sourceCategory = 'Referral';
    } catch (e) {
      sourceCategory = 'Referral';
    }
  }

  // Override with UTM source if provided
  if (utm.source) {
    if (/google/i.test(utm.source)) sourceCategory = 'Google';
    else if (/facebook/i.test(utm.source)) sourceCategory = 'Facebook';
    else if (/instagram/i.test(utm.source)) sourceCategory = 'Instagram';
    else if (/linkedin/i.test(utm.source)) sourceCategory = 'LinkedIn';
    else if (/twitter|x\.com/i.test(utm.source)) sourceCategory = 'Twitter/X';
  }

  return {
    sourceCategory,
    referrerDomain,
    utm
  };
}

// Track Pageview Hit to Server
export async function trackPageView(pathname) {
  try {
    const payload = {
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      isReturning: isReturningVisitor(),
      pathname: pathname || window.location.pathname,
      device: getDeviceInfo(),
      traffic: getTrafficSource(),
      timestamp: new Date().toISOString()
    };

    fetch(`${API_BASE}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch (err) {
    // Fail silently so user navigation is never impacted
  }
}

let lastHeartbeatTime = 0;
let lastHeartbeatDuration = -1;

// Send Session Heartbeat (updates session duration & exit page)
export async function sendHeartbeat(durationSeconds, currentPathname, isImmediate = false) {
  try {
    const now = Date.now();

    // Throttling: Do not fire if less than 45 seconds have passed since last heartbeat,
    // unless isImmediate is true and duration has actually changed.
    if (!isImmediate && (now - lastHeartbeatTime < 45000)) {
      return;
    }

    if (durationSeconds === lastHeartbeatDuration && !isImmediate) {
      return;
    }

    lastHeartbeatTime = now;
    lastHeartbeatDuration = durationSeconds;

    const payload = JSON.stringify({
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      durationSeconds,
      exitPage: currentPathname || window.location.pathname
    });

    const endpoint = `${API_BASE}/api/analytics/heartbeat`;

    // Use navigator.sendBeacon when available for non-blocking execution
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch (err) {
    // Fail silently
  }
}
