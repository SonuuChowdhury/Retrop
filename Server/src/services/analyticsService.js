// ============================================================================
// ANALYTICS SERVICE — Server-side Analytics Storage & Aggregation Engine
// ============================================================================

import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

// In-memory sessions store fallback for fast caching and fallback when DB is connecting
const inMemorySessions = new Map();
const inMemoryVisitorIds = new Set();

export const analyticsService = {
  // Record or update session hit
  recordTrackHit: async (hitData) => {
    const {
      visitorId,
      sessionId,
      isReturning,
      pathname,
      device = {},
      traffic = {},
      ip = '127.0.0.1',
      geo = {}
    } = hitData;

    try {
      inMemoryVisitorIds.add(visitorId);
      const existing = inMemorySessions.get(sessionId) || {
        sessionId,
        visitorId,
        isReturning: !!isReturning,
        entryPage: pathname,
        exitPage: pathname,
        pagesVisited: [],
        sessionDurationSeconds: 0,
        createdAt: nowIST(),
        updatedAt: nowIST(),
        deviceType: device.deviceType || 'Desktop',
        browser: device.browser || 'Chrome',
        os: device.operatingSystem || 'Windows',
        screenResolution: device.screenResolution || '1920x1080',
        timezone: device.timezone || 'Asia/Kolkata',
        network: device.network || '4g',
        ipAddress: ip,
        country: geo.country || 'India',
        state: geo.state || 'Telangana',
        city: geo.city || 'Hyderabad',
        isp: geo.isp || 'Telecom',
        sourceCategory: traffic.sourceCategory || 'Direct',
        referrerDomain: traffic.referrerDomain || '',
        utm: traffic.utm || {}
      };

      if (!existing.pagesVisited.includes(pathname)) {
        existing.pagesVisited.push(pathname);
      }
      existing.exitPage = pathname;
      existing.updatedAt = nowIST();

      inMemorySessions.set(sessionId, existing);

      // Persist to Supabase if table exists (async, fail-safe)
      try {
        await supabase.from('website_analytics').upsert([{
          session_id: sessionId,
          visitor_id: visitorId,
          is_returning: isReturning,
          entry_page: existing.entryPage,
          exit_page: existing.exitPage,
          pages_visited: existing.pagesVisited,
          duration_seconds: existing.sessionDurationSeconds,
          device_type: existing.deviceType,
          browser: existing.browser,
          os: existing.os,
          screen_resolution: existing.screenResolution,
          timezone: existing.timezone,
          network_type: existing.network,
          ip_address: ip,
          country: existing.country,
          state: existing.state,
          city: existing.city,
          isp: existing.isp,
          traffic_source: existing.sourceCategory,
          referrer_domain: existing.referrerDomain,
          utm_data: existing.utm,
          updated_at: new Date().toISOString()
        }], { onConflict: 'session_id' });
      } catch (dbErr) {
        // Log & fallback to memory
      }

      return { success: true, sessionId };
    } catch (err) {
      logger.error('Failed to record analytics hit', err.message);
      return { success: false, error: err.message };
    }
  },

  // Record session heartbeat & duration update
  recordHeartbeat: async ({ sessionId, visitorId, durationSeconds, exitPage }) => {
    try {
      const existing = inMemorySessions.get(sessionId);
      if (existing) {
        existing.sessionDurationSeconds = Math.max(existing.sessionDurationSeconds || 0, durationSeconds || 0);
        if (exitPage) existing.exitPage = exitPage;
        existing.updatedAt = nowIST();
        inMemorySessions.set(sessionId, existing);
      }

      try {
        await supabase.from('website_analytics').update({
          duration_seconds: durationSeconds,
          exit_page: exitPage,
          updated_at: new Date().toISOString()
        }).eq('session_id', sessionId);
      } catch (dbErr) {
        // fallback to memory
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Aggregate Summary Metrics for Dashboard
  getAnalyticsSummary: async () => {
    try {
      const sessions = Array.from(inMemorySessions.values());
      const totalSessions = sessions.length;
      const totalVisitors = inMemoryVisitorIds.size;

      // Unique visitors vs returning
      let returningCount = 0;
      let totalDuration = 0;
      let bounceCount = 0;

      const pagesMap = {};
      const deviceMap = {};
      const browserMap = {};
      const osMap = {};
      const sourceMap = {};
      const countryMap = {};
      const cityMap = {};

      sessions.forEach(s => {
        if (s.isReturning) returningCount++;
        totalDuration += (s.sessionDurationSeconds || 0);
        if ((s.pagesVisited || []).length <= 1 && (s.sessionDurationSeconds || 0) < 10) {
          bounceCount++;
        }

        // Pages
        (s.pagesVisited || []).forEach(p => {
          pagesMap[p] = (pagesMap[p] || 0) + 1;
        });

        // Device Specs
        if (s.deviceType) deviceMap[s.deviceType] = (deviceMap[s.deviceType] || 0) + 1;
        if (s.browser) browserMap[s.browser] = (browserMap[s.browser] || 0) + 1;
        if (s.os) osMap[s.os] = (osMap[s.os] || 0) + 1;

        // Traffic
        if (s.sourceCategory) sourceMap[s.sourceCategory] = (sourceMap[s.sourceCategory] || 0) + 1;

        // Geo
        if (s.country) countryMap[s.country] = (countryMap[s.country] || 0) + 1;
        if (s.city) cityMap[s.city] = (cityMap[s.city] || 0) + 1;
      });

      const uniqueVisitors = totalVisitors;
      const avgSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
      const bounceRate = totalSessions > 0 ? Math.round((bounceCount / totalSessions) * 100) : 0;

      return {
        success: true,
        summary: {
          totalVisitors: totalSessions,
          uniqueVisitors,
          returningVisitors: returningCount,
          avgSessionDurationSeconds: avgSessionDuration,
          bounceRatePercent: bounceRate,
          pagesVisited: pagesMap,
          deviceTypes: deviceMap,
          browsers: browserMap,
          operatingSystems: osMap,
          trafficSources: sourceMap,
          countries: countryMap,
          cities: cityMap,
          lastUpdated: nowIST()
        }
      };
    } catch (err) {
      logger.error('Failed to aggregate analytics summary', err.message);
      return { success: false, error: err.message };
    }
  }
};
