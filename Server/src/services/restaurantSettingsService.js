import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

// ============================================================================
// RESTAURANT SETTINGS SERVICE
// ============================================================================
// Manages the single-row restaurant_settings table.
// Key behaviour: closing the restaurant also deactivates ALL waiters.

export const restaurantSettingsService = {

  // --------------------------------------------------------------------------
  // GET SETTINGS
  // --------------------------------------------------------------------------
  // Returns the current restaurant settings row.
  // --------------------------------------------------------------------------
  getSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('settingsId, isRestaurantOpen, updatedAt, updatedBy')
        .single();

      if (error) {
        logger.error('Failed to fetch restaurant restaurant settings', error.message);
        return { success: false, error: 'Failed to fetch restaurant settings' };
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Restaurant settings fetch error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // TOGGLE RESTAURANT OPEN / CLOSED
  // --------------------------------------------------------------------------
  // Sets isRestaurantOpen to the given boolean value.
  //
  // SIDE EFFECT when closing (isOpen = false):
  //   All waiter rows get isActive = false so no waiter can operate while
  //   the restaurant is closed.
  //
  // @param {boolean} isOpen    - Desired new state.
  // @param {string}  adminId   - UUID of the admin making the change.
  // --------------------------------------------------------------------------
  toggleRestaurantOpen: async (isOpen, adminId, restaurantId) => {
    try {
      // If closing the restaurant, check for active orders first
      if (!isOpen && restaurantId) {
        const { data: activeOrders, error: activeOrdersError } = await supabase
          .from('orders')
          .select('ordersId, tableNo, orderStatus, mobile')
          .eq('restaurantId', restaurantId)
          .in('orderStatus', ['ordering', 'preparing', 'ready', 'serving']);

        if (activeOrdersError) {
          logger.error('Failed to query active orders on close', activeOrdersError.message);
          return { success: false, error: 'Failed to verify active orders. Please try again.' };
        }

        if (activeOrders && activeOrders.length > 0) {
          return {
            success: false,
            error: 'Cannot close restaurant: active orders are currently in progress.',
            code: 'active_orders_exist',
            activeOrders,
          };
        }
      }

      // 1. Update the settings row
      const { data: settings, error: settingsError } = await supabase
        .from('restaurant_settings')
        .update({
          isRestaurantOpen: isOpen,
          updatedAt: nowIST(),
          updatedBy: adminId,
        })
        .select('settingsId, isRestaurantOpen, updatedAt, updatedBy')
        .single();

      if (settingsError) {
        logger.error('Failed to update restaurant settings', settingsError.message);
        return { success: false, error: 'Failed to update restaurant settings' };
      }

      // 2. If closing the restaurant → deactivate all waiters
      if (!isOpen) {
        const { error: waiterError } = await supabase
          .from('waiter')
          .update({ isActive: false, updatedAt: nowIST() })
          .neq('waiterId', '00000000-0000-0000-0000-000000000000'); // update all rows

        if (waiterError) {
          // Non-fatal: settings were saved but waiter deactivation failed.
          // Log and include a warning in the response so the caller knows.
          logger.error('Failed to deactivate waiters on restaurant close', waiterError.message);
          return {
            success: true,
            data: settings,
            warning: 'Restaurant closed but some waiters may still be marked active. Please refresh waiter list.',
          };
        }

        logger.info(`Restaurant CLOSED by admin ${adminId} — all waiters deactivated`);
      } else {
        logger.info(`Restaurant OPENED by admin ${adminId}`);
      }

      return { success: true, data: settings };
    } catch (error) {
      logger.error('Restaurant settings toggle error', error.message);
      throw error;
    }
  },
};