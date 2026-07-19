// ============================================================================
// ANALYTICS SERVICE — Server-side Analytics Storage & Aggregation Engine
// ============================================================================

import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

// In-memory sessions store fallback for fast caching
const inMemorySessions = new Map();
const inMemoryVisitorIds = new Set();

// Disk persistence fallback directory and file path
const DATA_DIR = path.resolve(process.cwd(), '.data');
const BACKUP_FILE = path.join(DATA_DIR, 'website_analytics_backup.json');

let diskSaveTimer = null;

// Save sessions to disk backup file (debounced every 3 seconds to avoid triggering file watches)
function saveDiskBackup() {
  if (diskSaveTimer) return;
  diskSaveTimer = setTimeout(() => {
    diskSaveTimer = null;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const array = Array.from(inMemorySessions.values());
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(array, null, 2), 'utf-8');
    } catch (err) {
      logger.error('GOD DEBUG: Disk backup write failed:', err.message);
    }
  }, 3000);
}

// Load sessions from disk backup file
function loadDiskBackup() {
  try {
    const legacyFile = path.resolve(process.cwd(), 'data', 'website_analytics_backup.json');
    const targetFile = fs.existsSync(BACKUP_FILE) ? BACKUP_FILE : (fs.existsSync(legacyFile) ? legacyFile : null);

    if (targetFile) {
      const raw = fs.readFileSync(targetFile, 'utf-8');
      const array = JSON.parse(raw);
      if (Array.isArray(array)) {
        array.forEach(s => {
          if (s && s.sessionId) {
            inMemorySessions.set(s.sessionId, s);
            if (s.visitorId) inMemoryVisitorIds.add(s.visitorId);
          }
        });
        logger.info(`Loaded ${array.length} analytics session records from local disk storage.`);
      }
    }
  } catch (err) {
    logger.error('GOD DEBUG: Disk backup load failed:', err.message);
  }
}

// Initialize local disk cache immediately on module load
loadDiskBackup();

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
      saveDiskBackup(); // Save to local disk immediately

      // Persist to Supabase if table exists
      try {
        const { error: sbErr } = await supabase.from('website_analytics').upsert([{
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

        if (sbErr && !sbErr.message.includes('Could not find the table')) {
          logger.warn(`Supabase website_analytics notice: ${sbErr.message}`);
        }
      } catch (dbErr) {
        logger.error('GOD DEBUG: Exception upserting to website_analytics:', dbErr.message);
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
        saveDiskBackup(); // Save updated duration to disk
      }

      try {
        const { error: sbErr } = await supabase.from('website_analytics').update({
          duration_seconds: durationSeconds,
          exit_page: exitPage,
          updated_at: new Date().toISOString()
        }).eq('session_id', sessionId);

        if (sbErr && !sbErr.message.includes('Could not find the table')) {
          logger.warn(`Heartbeat update notice: ${sbErr.message}`);
        }
      } catch (dbErr) {
        // Fallback to local memory & disk
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Aggregate Summary Metrics for Dashboard
  getAnalyticsSummary: async () => {
    try {
      // 1. Fetch records from Supabase website_analytics table
      let dbSessions = [];
      try {
        const { data, error } = await supabase
          .from('website_analytics')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1000);

        if (error) {
          logger.warn(`GOD DEBUG: Supabase website_analytics fetch notice: ${error.message}`);
        } else if (data) {
          dbSessions = data;
        }
      } catch (dbErr) {
        logger.error('Failed to query website_analytics from DB:', dbErr.message);
      }

      // Merge memory & disk sessions with DB sessions
      const sessionMap = new Map();

      // First add DB sessions
      dbSessions.forEach(row => {
        sessionMap.set(row.session_id, {
          sessionId: row.session_id,
          visitorId: row.visitor_id,
          isReturning: !!row.is_returning,
          entryPage: row.entry_page,
          exitPage: row.exit_page,
          pagesVisited: Array.isArray(row.pages_visited) ? row.pages_visited : (row.entry_page ? [row.entry_page] : ['/']),
          sessionDurationSeconds: Number(row.duration_seconds) || 0,
          deviceType: row.device_type || 'Desktop',
          browser: row.browser || 'Chrome',
          os: row.os || 'Windows',
          country: row.country || 'India',
          city: row.city || 'Hyderabad',
          sourceCategory: row.traffic_source || 'Direct'
        });
      });

      // Overwrite with in-memory & disk sessions (most up-to-date)
      inMemorySessions.forEach((val, key) => {
        sessionMap.set(key, val);
      });

      const sessions = Array.from(sessionMap.values());
      const totalSessions = sessions.length;

      const visitorSet = new Set(sessions.map(s => s.visitorId).filter(Boolean));
      inMemoryVisitorIds.forEach(id => visitorSet.add(id));
      const totalVisitors = visitorSet.size;

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
          if (p) pagesMap[p] = (pagesMap[p] || 0) + 1;
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
  },

  // Registered User Details & Login Analytics Aggregator
  getUserAnalyticsSummary: async () => {
    try {
      // 1. Fetch portal users
      const { data: users, error: userErr } = await supabase
        .from('portal_user')
        .select('userId, name, email, mobile, googleId, needsPasswordReset, isActive, emailVerified, lastLoginAt, createdAt, updatedAt')
        .order('createdAt', { ascending: false });

      if (userErr) {
        logger.error('Failed to fetch portal_user for analytics:', userErr.message);
      }

      // 2. Fetch user business mappings with restaurant info
      const { data: userBusinesses, error: busErr } = await supabase
        .from('portal_user_business')
        .select('userId, role, linkedAt, retrop_restaurant ( restaurantId, businessName, businessTypeId, isActive )');

      if (busErr) {
        logger.error('Failed to fetch portal_user_business for analytics:', busErr.message);
      }

      const businessMap = {};
      (userBusinesses || []).forEach(ub => {
        if (!businessMap[ub.userId]) businessMap[ub.userId] = [];
        if (ub.retrop_restaurant) {
          businessMap[ub.userId].push({
            restaurantId: ub.retrop_restaurant.restaurantId,
            businessName: ub.retrop_restaurant.businessName,
            businessTypeId: ub.retrop_restaurant.businessTypeId,
            isActive: ub.retrop_restaurant.isActive,
            role: ub.role,
            linkedAt: ub.linkedAt
          });
        }
      });

      // 3. Fetch user sessions
      const { data: sessions, error: sessErr } = await supabase
        .from('portal_user_session')
        .select('sessionId, userId, ipAddress, userAgent, isActive, tokenExpiresAt, createdAt')
        .order('createdAt', { ascending: false })
        .limit(300);

      if (sessErr) {
        logger.error('Failed to fetch portal_user_session for analytics:', sessErr.message);
      }

      // Session stats per user
      const userSessionStats = {};
      let totalActiveSessions = 0;

      (sessions || []).forEach(s => {
        if (s.isActive) totalActiveSessions++;
        if (!userSessionStats[s.userId]) {
          userSessionStats[s.userId] = {
            totalSessions: 0,
            activeSessions: 0,
            sessions: []
          };
        }
        userSessionStats[s.userId].totalSessions++;
        if (s.isActive) userSessionStats[s.userId].activeSessions++;
        userSessionStats[s.userId].sessions.push(s);
      });

      // Metrics counter
      const totalUsers = (users || []).length;
      let verifiedUsers = 0;
      let googleUsers = 0;
      let emailUsers = 0;
      let activeUsers = 0;
      let pendingPasswordUsers = 0;

      const userDetails = (users || []).map(u => {
        if (u.emailVerified) verifiedUsers++;
        if (u.googleId) googleUsers++;
        else emailUsers++;
        if (u.isActive) activeUsers++;
        if (u.needsPasswordReset) pendingPasswordUsers++;

        const userStats = userSessionStats[u.userId] || { totalSessions: 0, activeSessions: 0, sessions: [] };

        return {
          ...u,
          authType: u.googleId ? 'Google OAuth' : 'Email / Password',
          businesses: businessMap[u.userId] || [],
          totalSessionsCount: userStats.totalSessions,
          activeSessionsCount: userStats.activeSessions,
          recentSessions: userStats.sessions.slice(0, 5)
        };
      });

      // User lookup map for audit logs
      const userMap = {};
      (users || []).forEach(u => { userMap[u.userId] = u; });

      const loginAuditTrail = (sessions || []).slice(0, 100).map(s => {
        const u = userMap[s.userId] || {};
        return {
          sessionId: s.sessionId,
          userId: s.userId,
          userName: u.name || 'Unknown User',
          userEmail: u.email || 'N/A',
          ipAddress: s.ipAddress || '127.0.0.1',
          userAgent: s.userAgent || 'Unknown Device',
          isActive: s.isActive,
          createdAt: s.createdAt,
          tokenExpiresAt: s.tokenExpiresAt
        };
      });

      return {
        success: true,
        userMetrics: {
          totalUsers,
          verifiedUsers,
          googleUsers,
          emailUsers,
          activeUsers,
          pendingPasswordUsers,
          totalActiveSessions
        },
        users: userDetails,
        loginAuditTrail
      };
    } catch (err) {
      logger.error('Failed to get user analytics summary:', err.message);
      return { success: false, error: err.message };
    }
  }
};
