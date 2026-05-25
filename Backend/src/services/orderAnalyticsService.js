import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { todayStartIST, tomorrowStartIST, daysAgoStartIST, monthRangeIST } from '../utils/time.js';

// ============================================================================
// ORDER ANALYTICS SERVICE
// ============================================================================
// Handles order reports, sales data, trends, and analytics

export const orderAnalyticsService = {
  // Get today's sales summary
  // FIX: use IST day boundaries
  getTodaySales: async () => {
    try {
      const todayStart = todayStartIST();
      const todayEnd = tomorrowStartIST();

      const { data: orders, error } = await supabase
        .from('orders')
        .select('ordersId, totalAmount, orderStatus, createdAt')
        .gte('createdAt', todayStart)
        .lt('createdAt', todayEnd)
        .eq('isPaymentCompleted', true);

      if (error) {
        logger.error('Failed to fetch today sales', error.message);
        return { success: false, error: 'Failed to fetch sales data' };
      }

      const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const completedOrders = orders.filter((o) => o.orderStatus === 'completed').length;

      return {
        success: true,
        data: {
          totalSales,
          ordersCount: orders.length,
          completedOrders,
          averageOrderValue: orders.length > 0 ? (totalSales / orders.length).toFixed(2) : 0,
        },
      };
    } catch (error) {
      logger.error('Today sales fetch error', error.message);
      throw error;
    }
  },

  // Get weekly sales report
  // FIX: use IST-based 7-day start boundary
  getWeeklySales: async () => {
    try {
      const startDate = daysAgoStartIST(7);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('totalAmount, createdAt, isPaymentCompleted')
        .gte('createdAt', startDate)
        .eq('isPaymentCompleted', true);

      if (error) {
        logger.error('Failed to fetch weekly sales', error.message);
        return { success: false, error: 'Failed to fetch sales data' };
      }

      // Group by IST date (strip the time/offset portion after T)
      const dailySales = {};
      orders.forEach((order) => {
        // createdAt is stored as IST e.g. "2025-05-25T14:30:00+05:30"
        const date = order.createdAt.split('T')[0];
        if (!dailySales[date]) dailySales[date] = 0;
        dailySales[date] += order.totalAmount || 0;
      });

      const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      return {
        success: true,
        data: {
          dailySales,
          totalSales,
          ordersCount: orders.length,
          averageDaily: (totalSales / 7).toFixed(2),
        },
      };
    } catch (error) {
      logger.error('Weekly sales fetch error', error.message);
      throw error;
    }
  },

  // Get monthly sales report
  // FIX: use correct IST month boundaries (no more hardcoded day-31)
  getMonthlySales: async (monthOffset = 0) => {
    try {
      const { start, end, monthLabel } = monthRangeIST(monthOffset);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('totalAmount, createdAt, isPaymentCompleted')
        .gte('createdAt', start)
        .lt('createdAt', end) // exclusive end — covers all days correctly
        .eq('isPaymentCompleted', true);

      if (error) {
        logger.error('Failed to fetch monthly sales', error.message);
        return { success: false, error: 'Failed to fetch sales data' };
      }

      const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      return {
        success: true,
        data: {
          month: monthLabel,
          totalSales,
          ordersCount: orders.length,
          averageOrderValue: orders.length > 0 ? (totalSales / orders.length).toFixed(2) : 0,
        },
      };
    } catch (error) {
      logger.error('Monthly sales fetch error', error.message);
      throw error;
    }
  },

  // Get best-selling dishes
  // FIX: join menu table to include dish names in the result
  getBestSellingDishes: async (days = 7) => {
    try {
      const startDate = daysAgoStartIST(days);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('ordersInfo')
        .gte('createdAt', startDate)
        .eq('isPaymentCompleted', true);

      if (error) {
        logger.error('Failed to fetch best selling dishes', error.message);
        return { success: false, error: 'Failed to fetch dishes data' };
      }

      // Aggregate dish sales
      const dishSales = {};
      orders.forEach((order) => {
        if (Array.isArray(order.ordersInfo)) {
          order.ordersInfo.forEach((item) => {
            if (!dishSales[item.dishId]) {
              dishSales[item.dishId] = { dishId: item.dishId, quantity: 0 };
            }
            dishSales[item.dishId].quantity += item.quantity || 0;
          });
        }
      });

      // Sort by quantity, take top 10
      const topDishIds = Object.values(dishSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      if (topDishIds.length === 0) {
        return { success: true, data: [] };
      }

      // Fetch dish names from menu table
      const { data: menuItems, error: menuError } = await supabase
        .from('menu')
        .select('dishId, dishName, category, price')
        .in('dishId', topDishIds.map((d) => d.dishId));

      if (menuError) {
        logger.warn('Failed to fetch dish names', menuError.message);
        // Return without names rather than failing
        return { success: true, data: topDishIds };
      }

      // Merge names into results
      const menuMap = {};
      menuItems.forEach((item) => {
        menuMap[item.dishId] = item;
      });

      const enriched = topDishIds.map((d) => ({
        ...d,
        dishName: menuMap[d.dishId]?.dishName || 'Unknown',
        category: menuMap[d.dishId]?.category || null,
        price: menuMap[d.dishId]?.price || null,
      }));

      return { success: true, data: enriched };
    } catch (error) {
      logger.error('Best selling dishes fetch error', error.message);
      throw error;
    }
  },

  // Get sales by payment method
  getSalesByPaymentMethod: async (days = 7) => {
    try {
      const startDate = daysAgoStartIST(days);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('totalAmount, paymentMethod')
        .gte('createdAt', startDate)
        .eq('isPaymentCompleted', true);

      if (error) {
        logger.error('Failed to fetch payment method sales', error.message);
        return { success: false, error: 'Failed to fetch payment data' };
      }

      // Group by payment method
      const paymentMethods = {};
      orders.forEach((order) => {
        const method = order.paymentMethod || 'unknown';
        if (!paymentMethods[method]) paymentMethods[method] = 0;
        paymentMethods[method] += order.totalAmount || 0;
      });

      return { success: true, data: paymentMethods };
    } catch (error) {
      logger.error('Payment method sales fetch error', error.message);
      throw error;
    }
  },

  // Get orders count by status
  getOrdersByStatus: async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('orderStatus');

      if (error) {
        logger.error('Failed to fetch orders by status', error.message);
        return { success: false, error: 'Failed to fetch status data' };
      }

      // Group by status
      const statusCounts = {};
      const statuses = ['ordersing', 'preparing', 'served', 'completed', 'cancelled'];
      statuses.forEach((status) => {
        statusCounts[status] = orders.filter((o) => o.orderStatus === status).length;
      });

      return { success: true, data: statusCounts };
    } catch (error) {
      logger.error('Orders by status fetch error', error.message);
      throw error;
    }
  },

  // Get detailed order list with filters
  // FIX: paymentCompleted filter only applied when explicitly provided
  getDetailedOrders: async (filters = {}) => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          ordersId,
          mobile,
          waiterId,
          tableNo,
          orderStatus,
          totalAmount,
          isPaymentCompleted,
          paymentMethod,
          createdAt,
          updatedAt,
          waiter(waiterName),
          customer(name, mobile)
        `)
        .order('createdAt', { ascending: false });

      if (filters.status) {
        query = query.eq('orderStatus', filters.status);
      }
      // FIX: only apply payment filter when explicitly passed as a string
      if (filters.paymentCompleted !== undefined && filters.paymentCompleted !== null) {
        query = query.eq('isPaymentCompleted', filters.paymentCompleted);
      }
      if (filters.waiterId) {
        query = query.eq('waiterId', filters.waiterId);
      }
      if (filters.tableNo) {
        query = query.eq('tableNo', filters.tableNo);
      }
      if (filters.startDate && filters.endDate) {
        query = query
          .gte('createdAt', filters.startDate)
          .lte('createdAt', filters.endDate);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data: orders, error } = await query;

      if (error) {
        logger.error('Failed to fetch detailed orders', error.message);
        return { success: false, error: 'Failed to fetch orders' };
      }

      return { success: true, data: orders };
    } catch (error) {
      logger.error('Detailed orders fetch error', error.message);
      throw error;
    }
  },

  // Get average order completion time
  getAverageCompletionTime: async (days = 7) => {
    try {
      const startDate = daysAgoStartIST(days);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('createdAt, updatedAt')
        .eq('orderStatus', 'completed')
        .gte('createdAt', startDate);

      if (error) {
        logger.error('Failed to fetch completion times', error.message);
        return { success: false, error: 'Failed to fetch timing data' };
      }

      if (orders.length === 0) {
        return { success: true, data: { averageMinutes: 0 } };
      }

      const totalTime = orders.reduce((sum, order) => {
        const created = new Date(order.createdAt);
        const updated = new Date(order.updatedAt);
        return sum + (updated - created);
      }, 0);

      const averageMinutes = Math.round(totalTime / orders.length / 1000 / 60);

      return { success: true, data: { averageMinutes } };
    } catch (error) {
      logger.error('Completion time fetch error', error.message);
      throw error;
    }
  },

  // Get top customers by order count
  getTopCustomers: async (limit = 10) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('mobile, customer(name, mobile)');

      if (error) {
        logger.error('Failed to fetch top customers', error.message);
        return { success: false, error: 'Failed to fetch customers' };
      }

      // Group by mobile
      const customerOrders = {};
      orders.forEach((order) => {
        const mobile = order.mobile;
        if (!customerOrders[mobile]) {
          customerOrders[mobile] = {
            mobile,
            name: order.customer?.name,
            orderCount: 0,
          };
        }
        customerOrders[mobile].orderCount += 1;
      });

      // Sort and limit
      const topCustomers = Object.values(customerOrders)
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, limit);

      return { success: true, data: topCustomers };
    } catch (error) {
      logger.error('Top customers fetch error', error.message);
      throw error;
    }
  },
};