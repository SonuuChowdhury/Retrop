import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST, todayStartIST, tomorrowStartIST } from '../utils/time.js';

// ============================================================================
// MANAGER SERVICE
// ============================================================================
// Handles manager dashboard, profile, and real-time session management

export const managerService = {
  // Get manager profile data
  getManagerProfile: async (adminId) => {
    try {
      const { data: manager, error } = await supabase
        .from('admin')
        .select('adminId, name, mobile, role, email, lastLogIn, createdAt')
        .eq('adminId', adminId)
        .maybeSingle();

      if (error || !manager) {
        logger.error('Failed to fetch manager profile', error?.message);
        return { success: false, error: 'Manager profile not found' };
      }

      return { success: true, data: manager };
    } catch (error) {
      logger.error('Manager profile fetch error', error.message);
      throw error;
    }
  },

  // Create manager WebSocket session
  createManagerSession: async (adminId, socketId, ipAddress, userAgent) => {
    try {
      const { data: session, error } = await supabase
        .from('manager_session')
        .insert([
          {
            adminId,
            socketId,
            ipAddress,
            userAgent,
            lastActivityAt: nowIST(),
            isActive: true,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create manager session', error.message);
        return { success: false, error: 'Session creation failed' };
      }

      return { success: true, data: session };
    } catch (error) {
      logger.error('Manager session creation error', error.message);
      throw error;
    }
  },

  // Update manager session activity
  updateSessionActivity: async (sessionId) => {
    try {
      const { error } = await supabase
        .from('manager_session')
        .update({ lastActivityAt: nowIST() })
        .eq('sessionId', sessionId);

      if (error) {
        logger.warn('Failed to update session activity', error.message);
      }
    } catch (error) {
      logger.error('Session activity update error', error.message);
    }
  },

  // Close manager session
  closeManagerSession: async (sessionId) => {
    try {
      const { error } = await supabase
        .from('manager_session')
        .update({ isActive: false, socketId: null })
        .eq('sessionId', sessionId);

      if (error) {
        logger.error('Failed to close manager session', error.message);
        return { success: false, error: 'Session closure failed' };
      }

      return { success: true };
    } catch (error) {
      logger.error('Manager session closure error', error.message);
      throw error;
    }
  },

  // Get dashboard summary data — returns all fields needed by both App dashboard + frontend.
  // FIX: use IST day boundaries so "today" is correct in IST, not UTC.
  // FIX: renamed output fields to match App's DashboardData interface exactly.
  getDashboardSummary: async () => {
    try {
      const todayStart = todayStartIST();
      const todayEnd = tomorrowStartIST();

      const [
        { data: todayOrderRows },
        { data: todayRevenueRows },
        { data: pendingOrderRows },
        { data: allTables },
        { data: occupiedTables },
        { data: waiterSessions },
        { data: allWaiters },
      ] = await Promise.all([
        // Today's total orders
        supabase.from('orders').select('ordersId').gte('createdAt', todayStart).lt('createdAt', todayEnd),
        // Today's revenue (completed + paid)
        supabase.from('orders').select('finalAmount, totalAmount').gte('createdAt', todayStart).lt('createdAt', todayEnd).eq('isPaymentCompleted', true),
        // Pending orders in 'ordering' status
        supabase.from('orders').select('ordersId').eq('orderStatus', 'ordering'),
        // All tables
        supabase.from('restaurant_table').select('tableNo'),
        // Occupied tables
        supabase.from('restaurant_table').select('tableNo').eq('isAvailable', false),
        // Active waiter sessions
        supabase.from('waiter_session').select('waiterId').eq('isActive', true),
        // All waiters
        supabase.from('waiter').select('waiterId').eq('isActive', true),
      ]);

      // Sum revenue (prefer finalAmount which includes tax; fall back to totalAmount)
      const todayRevenue = (todayRevenueRows ?? []).reduce(
        (sum, o) => sum + (parseFloat(o.finalAmount) || parseFloat(o.totalAmount) || 0),
        0
      );

      return {
        success: true,
        data: {
          // Fields used by App's DashboardData interface
          todayOrders:    todayOrderRows?.length || 0,
          todayRevenue:   Math.round(todayRevenue * 100), // paise for display formatting
          pendingOrders:  pendingOrderRows?.length || 0,
          totalTables:    allTables?.length || 0,
          occupiedTables: occupiedTables?.length || 0,
          activeWaiters:  waiterSessions?.length || 0,
          totalWaiters:   allWaiters?.length || 0,
          // Legacy fields kept for backwards compat
          todayOrdersCount: todayOrderRows?.length || 0,
          busyTablesCount:  occupiedTables?.length || 0,
          activeWaitersCount: waiterSessions?.length || 0,
        },
      };
    } catch (error) {
      logger.error('Dashboard summary fetch error', error.message);
      return { success: false, error: 'Failed to fetch dashboard summary' };
    }
  },

  // Cleanup inactive manager sessions
  cleanupInactiveSessions: async () => {
    try {
      const inactivityTimeout = 30 * 60 * 1000; // 30 minutes
      // Compare against IST time stored in DB
      const cutoffTime = new Date(Date.now() - inactivityTimeout);
      const istCutoff = new Date(cutoffTime.getTime() + 5.5 * 60 * 60 * 1000)
        .toISOString()
        .replace('Z', '+05:30');

      const { error } = await supabase
        .from('manager_session')
        .update({ isActive: false })
        .lt('lastActivityAt', istCutoff)
        .eq('isActive', true);

      if (error) {
        logger.warn('Failed to cleanup inactive sessions', error.message);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      logger.error('Session cleanup error', error.message);
    }
  },
};