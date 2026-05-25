import { managerService } from '../services/managerService.js';
import { waiterService } from '../services/waiterService.js';
import { orderAnalyticsService } from '../services/orderAnalyticsService.js';
import { tableService } from '../services/tableService.js';
import { logger } from '../utils/logger.js';

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