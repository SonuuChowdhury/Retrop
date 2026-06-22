import { managerService } from '../services/managerService.js';
import { waiterService } from '../services/waiterService.js';
import { orderAnalyticsService } from '../services/orderAnalyticsService.js';
import { tableService } from '../services/tableService.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';

// ============================================================================
// MANAGER CONTROLLER
// ============================================================================

// ============================================================================
// 1. MANAGER PROFILE & DASHBOARD
// ============================================================================

export const getManagerProfile = async (req, res) => {
  try {
    const { adminId } = req.admin;

    const result = await managerService.getManagerProfile(adminId);
    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    logger.error('Get manager profile error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
    });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const result = await managerService.getDashboardSummary();
    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    logger.error('Get dashboard summary error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard',
    });
  }
};

// ============================================================================
// 2. WAITER MANAGEMENT ENDPOINTS
// ============================================================================

export const getAllWaiters = async (req, res) => {
  try {
    const { search } = req.query;

    const result = await waiterService.getAllWaiters(search);
    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    logger.error('Get all waiters error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch waiters',
    });
  }
};

export const getWaiterProfile = async (req, res) => {
  try {
    const { waiterId } = req.params;

    const result = await waiterService.getWaiterProfile(waiterId);
    if (!result.success) {
      return res.status(404).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    logger.error('Get waiter profile error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch waiter profile',
    });
  }
};

export const getActiveWaiters = async (req, res) => {
  try {
    const result = await waiterService.getActiveWaiters();
    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    logger.error('Get active waiters error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch active waiters',
    });
  }
};

export const addWaiter = async (req, res) => {
  try {
    const { waiterName, mobile, password } = req.body;

    if (!waiterName || !mobile || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, mobile, and password are required',
      });
    }

    const result = await waiterService.addWaiter(waiterName, mobile, password);
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Waiter added successfully',
      data: result.data,
    });
  } catch (error) {
    logger.error('Add waiter error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add waiter',
    });
  }
};

export const deleteWaiter = async (req, res) => {
  try {
    const { waiterId } = req.params;

    const result = await waiterService.deleteWaiter(waiterId);
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Waiter deleted successfully',
    });
  } catch (error) {
    logger.error('Delete waiter error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete waiter',
    });
  }
};

export const resetWaiterPassword = async (req, res) => {
  try {
    const { waiterId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password is required',
      });
    }

    const result = await waiterService.resetWaiterPassword(waiterId, newPassword);
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    logger.error('Reset waiter password error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password',
    });
  }
};

export const getWaiterCurrentTables = async (req, res) => {
  try {
    const { waiterId } = req.params;

    const result = await waiterService.getWaiterCurrentTables(waiterId);
    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    logger.error('Get waiter current tables error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch waiter tables',
    });
  }
};

export const toggleWaiterStatus = async (req, res) => {
  try {
    const { waiterId } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'isActive status is required',
      });
    }

    const result = await waiterService.toggleWaiterStatus(waiterId, isActive);
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Waiter status updated successfully',
    });
  } catch (error) {
    logger.error('Toggle waiter status error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update waiter status',
    });
  }
};

// ============================================================================
// 3. ORDER ANALYTICS ENDPOINTS
// ============================================================================

export const getTodaySales = async (req, res) => {
  try {
    const result = await orderAnalyticsService.getTodaySales();
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get today sales error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch today sales' });
  }
};

export const getWeeklySales = async (req, res) => {
  try {
    const result = await orderAnalyticsService.getWeeklySales();
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get weekly sales error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch weekly sales' });
  }
};

export const getMonthlySales = async (req, res) => {
  try {
    const { monthOffset = 0 } = req.query;

    const result = await orderAnalyticsService.getMonthlySales(parseInt(monthOffset));
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get monthly sales error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch monthly sales' });
  }
};

export const getBestSellingDishes = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const result = await orderAnalyticsService.getBestSellingDishes(parseInt(days));
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get best selling dishes error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch best selling dishes' });
  }
};

export const getSalesByPaymentMethod = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const result = await orderAnalyticsService.getSalesByPaymentMethod(parseInt(days));
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get sales by payment method error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch payment method data' });
  }
};

export const getOrdersByStatus = async (req, res) => {
  try {
    const result = await orderAnalyticsService.getOrdersByStatus();
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get orders by status error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch status data' });
  }
};

export const getDetailedOrders = async (req, res) => {
  try {
    // FIX: only pass paymentCompleted when explicitly provided in query string
    const filters = {
      status: req.query.status,
      paymentCompleted: req.query.paymentCompleted !== undefined
        ? req.query.paymentCompleted === 'true'
        : undefined,
      waiterId: req.query.waiterId,
      tableNo: req.query.tableNo,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
    };

    const result = await orderAnalyticsService.getDetailedOrders(filters);
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get detailed orders error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders' });
  }
};

export const getTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await orderAnalyticsService.getTopCustomers(parseInt(limit));
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get top customers error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch top customers' });
  }
};

export const getAverageCompletionTime = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const result = await orderAnalyticsService.getAverageCompletionTime(parseInt(days));
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get average completion time error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch completion time' });
  }
};

// ============================================================================
// COMPREHENSIVE ANALYTICS ENDPOINT (combines all 9 analytics)
// ============================================================================

export const getComprehensiveAnalytics = async (req, res) => {
  try {
    const { metrics } = req.query;
    const monthOffset = parseInt(req.query.monthOffset || 0);
    const days = parseInt(req.query.days || 7);
    const limit = parseInt(req.query.limit || 10);

    // Parse requested metrics (if none specified, return all)
    let requestedMetrics = [];
    if (metrics) {
      requestedMetrics = metrics.split(',').map(m => m.trim());
    } else {
      // If no metrics specified, return all by default
      requestedMetrics = ['sales', 'dishes', 'paymentMethods', 'orderStatus', 'orders', 'customers', 'completionTime'];
    }

    // Validate metrics
    const validMetrics = ['sales', 'dishes', 'paymentMethods', 'orderStatus', 'orders', 'customers', 'completionTime'];
    const invalidMetrics = requestedMetrics.filter(m => !validMetrics.includes(m));
    
    if (invalidMetrics.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid metrics: ${invalidMetrics.join(', ')}. Valid options: ${validMetrics.join(', ')}`,
      });
    }

    const analyticsData = {};
    const errors = [];

    // Parallel execution of all requested analytics
    const promises = [];

    if (requestedMetrics.includes('sales')) {
      promises.push(
        Promise.all([
          orderAnalyticsService.getTodaySales(),
          orderAnalyticsService.getWeeklySales(),
          orderAnalyticsService.getMonthlySales(monthOffset),
        ]).then(([today, weekly, monthly]) => {
          if (today.success && weekly.success && monthly.success) {
            analyticsData.sales = {
              today: today.data,
              weekly: weekly.data,
              monthly: monthly.data,
            };
          } else {
            const failedSales = [];
            if (!today.success) failedSales.push('today');
            if (!weekly.success) failedSales.push('weekly');
            if (!monthly.success) failedSales.push('monthly');
            errors.push(`Sales metrics failed: ${failedSales.join(', ')}`);
          }
        })
      );
    }

    if (requestedMetrics.includes('dishes')) {
      promises.push(
        orderAnalyticsService.getBestSellingDishes(days).then((result) => {
          if (result.success) {
            analyticsData.dishes = {
              bestSelling: result.data,
            };
          } else {
            errors.push(`Best selling dishes: ${result.error}`);
          }
        })
      );
    }

    if (requestedMetrics.includes('paymentMethods')) {
      promises.push(
        orderAnalyticsService.getSalesByPaymentMethod(days).then((result) => {
          if (result.success) {
            analyticsData.paymentMethods = result.data;
          } else {
            errors.push(`Payment methods: ${result.error}`);
          }
        })
      );
    }

    if (requestedMetrics.includes('orderStatus')) {
      promises.push(
        orderAnalyticsService.getOrdersByStatus().then((result) => {
          if (result.success) {
            analyticsData.orderStatus = result.data;
          } else {
            errors.push(`Order status: ${result.error}`);
          }
        })
      );
    }

    if (requestedMetrics.includes('orders')) {
      // Extract detailed orders filters from query
      const filters = {
        status: req.query.status,
        paymentCompleted: req.query.paymentCompleted !== undefined
          ? req.query.paymentCompleted === 'true'
          : undefined,
        waiterId: req.query.waiterId,
        tableNo: req.query.tableNo,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit ? parseInt(req.query.limit) : 100,
      };

      promises.push(
        orderAnalyticsService.getDetailedOrders(filters).then((result) => {
          if (result.success) {
            analyticsData.orders = result.data;
          } else {
            errors.push(`Detailed orders: ${result.error}`);
          }
        })
      );
    }

    if (requestedMetrics.includes('customers')) {
      promises.push(
        orderAnalyticsService.getTopCustomers(limit).then((result) => {
          if (result.success) {
            analyticsData.customers = {
              top: result.data,
            };
          } else {
            errors.push(`Top customers: ${result.error}`);
          }
        })
      );
    }

    if (requestedMetrics.includes('completionTime')) {
      promises.push(
        orderAnalyticsService.getAverageCompletionTime(days).then((result) => {
          if (result.success) {
            analyticsData.completionTime = result.data;
          } else {
            errors.push(`Completion time: ${result.error}`);
          }
        })
      );
    }

    // Wait for all promises to complete
    await Promise.all(promises);

    // Return results with any errors that occurred
    res.status(200).json({
      status: errors.length > 0 ? 'partial' : 'success',
      data: analyticsData,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    logger.error('Get comprehensive analytics error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics',
    });
  }
};

// ============================================================================
// 4. TABLE MANAGEMENT ENDPOINTS
// ============================================================================

export const getAllTables = async (req, res) => {
  try {
    const result = await tableService.getAllTables();
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get all tables error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tables' });
  }
};

export const getTableDetails = async (req, res) => {
  try {
    const { tableNo } = req.params;

    const result = await tableService.getTableDetails(parseInt(tableNo));
    if (!result.success) {
      return res.status(404).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get table details error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch table details' });
  }
};

export const getTableStatistics = async (req, res) => {
  try {
    const result = await tableService.getTableStatistics();
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get table statistics error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch table statistics' });
  }
};

export const getTableOccupancyTrend = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const result = await tableService.getTableOccupancyTrend(parseInt(days));
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get table occupancy trend error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch occupancy trend' });
  }
};

export const addTable = async (req, res) => {
  try {
    const { tableNo, capacity = 2 } = req.body;

    if (!tableNo) {
      return res.status(400).json({ status: 'error', message: 'Table number is required' });
    }

    const result = await tableService.addTable(tableNo, capacity);
    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    res.status(201).json({
      status: 'success',
      message: 'Table added successfully',
      data: result.data,
    });
  } catch (error) {
    logger.error('Add table error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to add table' });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { tableNo } = req.params;

    const result = await tableService.deleteTable(parseInt(tableNo));
    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', message: 'Table deleted successfully' });
  } catch (error) {
    logger.error('Delete table error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to delete table' });
  }
};

export const updateTableCapacity = async (req, res) => {
  try {
    const { tableNo } = req.params;
    const { capacity } = req.body;

    if (!capacity) {
      return res.status(400).json({ status: 'error', message: 'Capacity is required' });
    }

    const result = await tableService.updateTableCapacity(parseInt(tableNo), capacity);
    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', message: 'Table capacity updated successfully' });
  } catch (error) {
    logger.error('Update table capacity error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to update table capacity' });
  }
};

// ============================================================================
// ANALYTICS ORDERS — FULL DETAIL (for manager orders list with infinite scroll)
// ============================================================================
// FIX: Moved from inline route handler in routes.js (where supabase was undefined)
//      to this controller where supabase is properly imported.

export const getAnalyticsOrders = async (req, res) => {
  try {
    const {
      from, to, status, waiterId, tableNo, search,
      limit = '20', offset = '0',
    } = req.query;

    const lim = Math.min(parseInt(limit) || 20, 100); // cap at 100 per request
    const off = parseInt(offset) || 0;

    let query = supabase
      .from('orders')
      .select(`
        ordersId, dailyOrderNo, invoiceNo, tableNo, orderStatus, ordersInfo,
        ordersUpdateInfo, totalAmount, finalAmount, taxBreakdown, gstAmount,
        paymentMethod, isPaymentCompleted, createdAt, completedAt, servedAt,
        customer:mobile(name, mobile),
        waiter:waiterId(waiterName, mobile)
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(off, off + lim - 1);

    if (from)      query = query.gte('createdAt', from);
    if (to)        query = query.lte('createdAt', to);
    if (status)    query = query.eq('orderStatus', status);
    if (waiterId)  query = query.eq('waiterId', waiterId);
    if (tableNo)   query = query.eq('tableNo', parseInt(tableNo));
    if (search && search.trim()) {
      query = query.ilike('invoiceNo', `%${search.trim()}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      logger.error('Get analytics orders error', error.message);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch orders' });
    }

    res.status(200).json({
      status: 'success',
      data,
      meta: { total: count ?? 0, limit: lim, offset: off, hasMore: (off + lim) < (count ?? 0) },
    });
  } catch (error) {
    logger.error('Get analytics orders error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders' });
  }
};

// ── GET single order with full detail (for order detail modal) ─────────────────
export const getAnalyticsOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:mobile(name, mobile),
        waiter:waiterId(waiterName, mobile)
      `)
      .eq('ordersId', orderId)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const { data: restaurantInfo } = await supabase
      .from('restaurant_info')
      .select('*')
      .eq('infoId', 1)
      .maybeSingle();

    res.status(200).json({ status: 'success', data: { order, restaurantInfo } });
  } catch (error) {
    logger.error('Get analytics order detail error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch order details' });
  }
};