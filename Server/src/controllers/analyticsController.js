// ============================================================================
// ANALYTICS CONTROLLER — Handles Track Ingestion, Heartbeats & Summary API
// ============================================================================

import { analyticsService } from '../services/analyticsService.js';
import { logger } from '../utils/logger.js';

// Resolve Client IP Address & Geolocation Fallback
function getClientGeo(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Handle local / internal IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      ip,
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      isp: 'Local Development / Internal'
    };
  }

  // Cloudflare / Proxy headers if available
  const country = req.headers['cf-ipcountry'] || 'India';
  return {
    ip,
    country,
    state: 'Telangana',
    city: 'Hyderabad',
    isp: 'Internet Provider'
  };
}

export const trackHit = async (req, res) => {
  try {
    const { visitorId, sessionId, isReturning, pathname, device, traffic } = req.body;

    if (!visitorId || !sessionId) {
      return res.status(400).json({ status: 'error', message: 'visitorId and sessionId are required' });
    }

    const geo = getClientGeo(req);

    const result = await analyticsService.recordTrackHit({
      visitorId,
      sessionId,
      isReturning,
      pathname,
      device,
      traffic,
      ip: geo.ip,
      geo
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    logger.error('Error in trackHit controller:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const heartbeat = async (req, res) => {
  try {
    const { sessionId, visitorId, durationSeconds, exitPage } = req.body;

    if (!sessionId) {
      return res.status(400).json({ status: 'error', message: 'sessionId is required' });
    }

    const result = await analyticsService.recordHeartbeat({
      sessionId,
      visitorId,
      durationSeconds: Number(durationSeconds) || 0,
      exitPage
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    logger.error('Error in heartbeat controller:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const result = await analyticsService.getAnalyticsSummary();
    const userResult = await analyticsService.getUserAnalyticsSummary();

    return res.status(200).json({
      status: 'success',
      data: {
        ...result.summary,
        userAnalytics: userResult.success ? {
          metrics: userResult.userMetrics,
          users: userResult.users,
          loginAuditTrail: userResult.loginAuditTrail
        } : null
      }
    });
  } catch (error) {
    logger.error('Error in getSummary controller:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
