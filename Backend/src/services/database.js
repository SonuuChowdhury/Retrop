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
// customer SERVICE
// ============================================================================

export const customerService = {
  // Create new customer
  create: async (customerData) => {
    try {
      const { data, error } = await supabase
        .from('customer')
        .insert([customerData])
        .select();
      
      if (error) throw error;
      logger.debug('customer created:', customerData.mobile);
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to create customer', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get customer by mobile
  getByMobile: async (mobile) => {
    try {
      const { data, error } = await supabase
        .from('customer')
        .select('*')
        .eq('mobile', mobile)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to get customer', error.message);
      return { success: false, error: error.message };
    }
  },

  // Update customer last login
  updateLastLogin: async (mobile) => {
    try {
      const { data, error } = await supabase
        .from('customer')
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

export const mencustomervice = {
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
        .orders('category', { ascending: true });
      
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
// orders SERVICE
// ============================================================================

export const orderService = {
  // Create new orders
  create: async (ordersData) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([ordersData])
        .select();
      
      if (error) throw error;
      logger.debug('orders created:', data[0]?.ordersId);
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to create orders', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get orders by ID
  getById: async (ordersId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('ordersId', ordersId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to get orders', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get orders by customer mobile
  getByMobile: async (mobile) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('mobile', mobile)
        .orders('createdAt', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to fetch customer orders', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get orders by waiter ID
  getByWaiterId: async (waiterId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('waiterId', waiterId)
        .neq('orderStatus', 'completed')
        .orders('createdAt', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to fetch waiter orders', error.message);
      return { success: false, error: error.message };
    }
  },

  // Update orders status
  updateStatus: async (ordersId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          orderStatus: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === 'served' && { servedAt: new Date().toISOString() })
        })
        .eq('ordersId', ordersId)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to update orders status', error.message);
      return { success: false, error: error.message };
    }
  },

  // Add items to orders (update ordersUpdateInfo)
  addordersItems: async (ordersId, newItems) => {
    try {
      const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('ordersUpdateInfo')
        .eq('ordersId', ordersId)
        .single();
      
      if (fetchError) throw fetchError;

      const updateInfo = orders.ordersUpdateInfo || [];
      updateInfo.push({
        timestamp: new Date().toISOString(),
        action: 'items_added',
        items: newItems
      });

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          ordersUpdateInfo: updateInfo,
          updatedAt: new Date().toISOString()
        })
        .eq('ordersId', ordersId)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to add orders items', error.message);
      return { success: false, error: error.message };
    }
  },

  // Mark payment as completed
  markPaymentCompleted: async (ordersId, paymentMethod) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          isPaymentCompleted: true,
          paymentMethod: paymentMethod,
          updatedAt: new Date().toISOString()
        })
        .eq('ordersId', ordersId)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      logger.error('Failed to mark payment', error.message);
      return { success: false, error: error.message };
    }
  },
};
