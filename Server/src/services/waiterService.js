import { supabase } from '../config/supabase.js';
import { authService } from './authService.js';
import { logger } from '../utils/logger.js';
import { nowIST, todayDateIST } from '../utils/time.js';

// ============================================================================
// WAITER SERVICE
// ============================================================================

export const waiterService = {
  // Get all waiters with optional search filter
  getAllWaiters: async (searchMobile = null) => {
    try {
      let query = supabase
        .from('waiter')
        .select('waiterId, waiterName, mobile, isActive, createdAt, updatedAt');

      if (searchMobile) {
        query = query.ilike('mobile', `%${searchMobile}%`);
      }

      const { data: waiters, error } = await query;

      if (error) {
        logger.error('Failed to fetch waiters', error.message);
        return { success: false, error: 'Failed to fetch waiters' };
      }

      return { success: true, data: waiters };
    } catch (error) {
      logger.error('Waiter fetch error', error.message);
      throw error;
    }
  },

  // Get waiter profile with current session info
  getWaiterProfile: async (waiterId) => {
    try {
      const { data: waiter, error: waiterError } = await supabase
        .from('waiter')
        .select('waiterId, waiterName, mobile, isActive, createdAt')
        .eq('waiterId', waiterId)
        .maybeSingle();

      if (waiterError || !waiter) {
        logger.error('Failed to fetch waiter profile', waiterError?.message);
        return { success: false, error: 'Waiter not found' };
      }

      // Get active session if exists
      const { data: session } = await supabase
        .from('waiter_session')
        .select('sessionId, createdAt')
        .eq('waiterId', waiterId)
        .eq('isActive', true)
        .maybeSingle();

      // Get today's stats (using IST date)
      const today = todayDateIST();
      const { data: stats } = await supabase
        .from('waiter_daily_stats')
        .select('totalOrders, completedOrders')
        .eq('waiterId', waiterId)
        .eq('statsDate', today)
        .maybeSingle();

      // Get current table assignment
      const { data: currentTable } = await supabase
        .from('orders')
        .select('tableNo')
        .eq('waiterId', waiterId)
        .in('orderStatus', ['ordersing', 'preparing'])
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        success: true,
        data: {
          ...waiter,
          isCurrentlyLoggedIn: !!session,
          sessionStartTime: session?.createdAt,
          todayStats: stats || { totalOrders: 0, completedOrders: 0 },
          currentTable: currentTable?.tableNo || null,
        },
      };
    } catch (error) {
      logger.error('Waiter profile fetch error', error.message);
      throw error;
    }
  },

  // Get all currently logged-in waiters
  getActiveWaiters: async () => {
    try {
      const { data: activeSessions, error } = await supabase
        .from('waiter_session')
        .select(`
          sessionId,
          waiterId,
          createdAt,
          waiter(waiterId, waiterName, mobile)
        `)
        .eq('isActive', true);

      if (error) {
        logger.error('Failed to fetch active waiters', error.message);
        return { success: false, error: 'Failed to fetch active waiters' };
      }

      return { success: true, data: activeSessions };
    } catch (error) {
      logger.error('Active waiters fetch error', error.message);
      throw error;
    }
  },

  // Add new waiter
  addWaiter: async (waiterName, mobile, password) => {
    try {
      const { data: existing } = await supabase
        .from('waiter')
        .select('mobile')
        .eq('mobile', mobile)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Mobile number already exists' };
      }

      const hashedPassword = await authService.hashPassword(password);

      const { data: waiter, error } = await supabase
        .from('waiter')
        .insert([{
          waiterName,
          mobile,
          password: hashedPassword,
          isActive: true,
        }])
        .select()
        .single();

      if (error) {
        logger.error('Failed to add waiter', error.message);
        return { success: false, error: 'Failed to add waiter' };
      }

      logger.info(`New waiter added: ${waiter.waiterId}`);
      return { success: true, data: waiter };
    } catch (error) {
      logger.error('Waiter addition error', error.message);
      throw error;
    }
  },

  // Delete waiter
  deleteWaiter: async (waiterId) => {
    try {
      const { data: activeSessions } = await supabase
        .from('waiter_session')
        .select('sessionId')
        .eq('waiterId', waiterId)
        .eq('isActive', true);

      if (activeSessions && activeSessions.length > 0) {
        return { success: false, error: 'Cannot delete waiter with active session' };
      }

      const { error } = await supabase
        .from('waiter')
        .delete()
        .eq('waiterId', waiterId);

      if (error) {
        logger.error('Failed to delete waiter', error.message);
        return { success: false, error: 'Failed to delete waiter' };
      }

      logger.info(`Waiter deleted: ${waiterId}`);
      return { success: true };
    } catch (error) {
      logger.error('Waiter deletion error', error.message);
      throw error;
    }
  },

  // Reset waiter password
  resetWaiterPassword: async (waiterId, newPassword) => {
    try {
      const { data: waiter, error: waiterError } = await supabase
        .from('waiter')
        .select('waiterId')
        .eq('waiterId', waiterId)
        .maybeSingle();

      if (waiterError || !waiter) {
        return { success: false, error: 'Waiter not found' };
      }

      const hashedPassword = await authService.hashPassword(newPassword);

      const { error } = await supabase
        .from('waiter')
        .update({ password: hashedPassword })
        .eq('waiterId', waiterId);

      if (error) {
        logger.error('Failed to reset waiter password', error.message);
        return { success: false, error: 'Failed to reset password' };
      }

      logger.info(`Password reset for waiter: ${waiterId}`);
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      logger.error('Password reset error', error.message);
      throw error;
    }
  },

  // Get waiter daily statistics
  getWaiterDailyStats: async (waiterId) => {
    try {
      const today = todayDateIST();

      const { data: stats, error } = await supabase
        .from('waiter_daily_stats')
        .select('totalOrders, completedOrders')
        .eq('waiterId', waiterId)
        .eq('statsDate', today)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch waiter stats', error.message);
        return { success: false, error: 'Failed to fetch statistics' };
      }

      return {
        success: true,
        data: stats || { totalOrders: 0, completedOrders: 0 },
      };
    } catch (error) {
      logger.error('Waiter stats fetch error', error.message);
      throw error;
    }
  },

  // Get which tables waiter is currently serving
  getWaiterCurrentTables: async (waiterId) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('ordersId, tableNo, orderStatus, createdAt')
        .eq('waiterId', waiterId)
        .in('orderStatus', ['ordersing', 'preparing', 'served'])
        .order('createdAt', { ascending: false });

      if (error) {
        logger.error('Failed to fetch waiter tables', error.message);
        return { success: false, error: 'Failed to fetch table assignments' };
      }

      return { success: true, data: orders };
    } catch (error) {
      logger.error('Waiter tables fetch error', error.message);
      throw error;
    }
  },

  // Create waiter session (login)
  createWaiterSession: async (waiterId, socketId, ipAddress, userAgent) => {
    try {
      const { data: session, error } = await supabase
        .from('waiter_session')
        .insert([{
          waiterId,
          socketId,
          ipAddress,
          userAgent,
          isActive: true,
        }])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create waiter session', error.message);
        return { success: false, error: 'Session creation failed' };
      }

      return { success: true, data: session };
    } catch (error) {
      logger.error('Waiter session creation error', error.message);
      throw error;
    }
  },

  // Close waiter session (logout)
  closeWaiterSession: async (waiterId) => {
    try {
      const { error } = await supabase
        .from('waiter_session')
        .update({ isActive: false, socketId: null })
        .eq('waiterId', waiterId)
        .eq('isActive', true);

      if (error) {
        logger.error('Failed to close waiter session', error.message);
        return { success: false, error: 'Session closure failed' };
      }

      return { success: true };
    } catch (error) {
      logger.error('Waiter session closure error', error.message);
      throw error;
    }
  },

  // Toggle waiter active status
  toggleWaiterStatus: async (waiterId, isActive) => {
    try {
      const { error } = await supabase
        .from('waiter')
        .update({ isActive })
        .eq('waiterId', waiterId);

      if (error) {
        logger.error('Failed to toggle waiter status', error.message);
        return { success: false, error: 'Failed to update waiter status' };
      }

      logger.info(`Waiter ${waiterId} status updated to ${isActive}`);
      return { success: true };
    } catch (error) {
      logger.error('Waiter status toggle error', error.message);
      throw error;
    }
  },
};