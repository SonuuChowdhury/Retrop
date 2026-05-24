import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// WAITER SERVICE
// ============================================================================

export const waiterService = {
  // Create new waiter
  create: async (waiterData) => {
    try {
      const { data, error } = await supabase
        .from('waiter')
        .insert([waiterData])
        .select();
      
      if (error) throw error;
      logger.debug('Waiter created:', data[0]?.waiterId);
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to create waiter', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get waiter by mobile
  getByMobile: async (mobile) => {
    try {
      const { data, error } = await supabase
        .from('waiter')
        .select('*')
        .eq('mobile', mobile)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to get waiter', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get all active waiters
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('waiter')
        .select('*')
        .eq('isActive', true);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to fetch waiters', error.message);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// USER SERVICE
// ============================================================================

export const userService = {
  // Create new user
  create: async (userData) => {
    try {
      const { data, error } = await supabase
        .from('user')
        .insert([userData])
        .select();
      
      if (error) throw error;
      logger.debug('User created:', userData.mobile);
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to create user', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get user by mobile
  getByMobile: async (mobile) => {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('mobile', mobile)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to get user', error.message);
      return { success: false, error: error.message };
    }
  },

  // Update user last login
  updateLastLogin: async (mobile) => {
    try {
      const { data, error } = await supabase
        .from('user')
        .update({ lastLogIn: new Date().toISOString() })
        .eq('mobile', mobile)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to update last login', error.message);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// MENU SERVICE
// ============================================================================

export const menuService = {
  // Create new menu item
  create: async (menuData) => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .insert([menuData])
        .select();
      
      if (error) throw error;
      logger.debug('Menu item created:', data[0]?.dishId);
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to create menu item', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get all available menu items
  getAllAvailable: async () => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .eq('isAvailable', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to fetch menu items', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get menu by category
  getByCategory: async (category) => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .eq('category', category)
        .eq('isAvailable', true);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to fetch menu by category', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get dish by ID
  getById: async (dishId) => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .eq('dishId', dishId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to get menu item', error.message);
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// ORDER SERVICE
// ============================================================================

export const orderService = {
  // Create new order
  create: async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('order')
        .insert([orderData])
        .select();
      
      if (error) throw error;
      logger.debug('Order created:', data[0]?.orderId);
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to create order', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get order by ID
  getById: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('order')
        .select('*')
        .eq('orderId', orderId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to get order', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get orders by user mobile
  getByMobile: async (mobile) => {
    try {
      const { data, error } = await supabase
        .from('order')
        .select('*')
        .eq('mobile', mobile)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to fetch user orders', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get orders by waiter ID
  getByWaiterId: async (waiterId) => {
    try {
      const { data, error } = await supabase
        .from('order')
        .select('*')
        .eq('waiterId', waiterId)
        .neq('orderStatus', 'completed')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to fetch waiter orders', error.message);
      return { success: false, error: error.message };
    }
  },

  // Update order status
  updateStatus: async (orderId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('order')
        .update({ 
          orderStatus: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === 'served' && { servedAt: new Date().toISOString() })
        })
        .eq('orderId', orderId)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to update order status', error.message);
      return { success: false, error: error.message };
    }
  },

  // Add items to order (update orderUpdateInfo)
  addOrderItems: async (orderId, newItems) => {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('order')
        .select('orderUpdateInfo')
        .eq('orderId', orderId)
        .single();
      
      if (fetchError) throw fetchError;

      const updateInfo = order.orderUpdateInfo || [];
      updateInfo.push({
        timestamp: new Date().toISOString(),
        action: 'items_added',
        items: newItems
      });

      const { data, error } = await supabase
        .from('order')
        .update({ 
          orderUpdateInfo: updateInfo,
          updatedAt: new Date().toISOString()
        })
        .eq('orderId', orderId)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to add order items', error.message);
      return { success: false, error: error.message };
    }
  },

  // Mark payment as completed
  markPaymentCompleted: async (orderId, paymentMethod) => {
    try {
      const { data, error } = await supabase
        .from('order')
        .update({ 
          isPaymentCompleted: true,
          paymentMethod: paymentMethod,
          updatedAt: new Date().toISOString()
        })
        .eq('orderId', orderId)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to mark payment', error.message);
      return { success: false, error: error.message };
    }
  },
};
