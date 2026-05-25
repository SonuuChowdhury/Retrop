import express from 'express';
import {
  getManagerProfile,
  getDashboardSummary,
  getAllWaiters,
  getWaiterProfile,
  getActiveWaiters,
  addWaiter,
  deleteWaiter,
  resetWaiterPassword,
  getWaiterCurrentTables,
  toggleWaiterStatus,
  getTodaySales,
  getWeeklySales,
  getMonthlySales,
  getBestSellingDishes,
  getSalesByPaymentMethod,
  getOrdersByStatus,
  getDetailedOrders,
  getTopCustomers,
  getAverageCompletionTime,
  getAllTables,
  getTableDetails,
  getTableStatistics,
  getTableOccupancyTrend,
  addTable,
  deleteTable,
  updateTableCapacity,
} from '../controllers/managerController.js';

const router = express.Router();

// ============================================================================
// MANAGER PROFILE & DASHBOARD
// ============================================================================
router.get('/profile', getManagerProfile);
router.get('/dashboard/summary', getDashboardSummary);

// ============================================================================
// WAITER MANAGEMENT ROUTES
// ============================================================================
router.get('/waiters', getAllWaiters);
router.get('/waiters/active', getActiveWaiters);
router.get('/waiters/:waiterId', getWaiterProfile);
router.get('/waiters/:waiterId/tables', getWaiterCurrentTables);
router.post('/waiters', addWaiter);
router.delete('/waiters/:waiterId', deleteWaiter);
router.post('/waiters/:waiterId/reset-password', resetWaiterPassword);
router.patch('/waiters/:waiterId/status', toggleWaiterStatus);

// ============================================================================
// ORDER ANALYTICS ROUTES
// ============================================================================
router.get('/analytics/sales/today', getTodaySales);
router.get('/analytics/sales/weekly', getWeeklySales);
router.get('/analytics/sales/monthly', getMonthlySales);
router.get('/analytics/dishes/best-selling', getBestSellingDishes);
router.get('/analytics/payment-methods', getSalesByPaymentMethod);
router.get('/analytics/orders/status', getOrdersByStatus);
router.get('/analytics/orders', getDetailedOrders);
router.get('/analytics/customers/top', getTopCustomers);
router.get('/analytics/completion-time', getAverageCompletionTime);

// ============================================================================
// TABLE MANAGEMENT ROUTES
// ============================================================================
router.get('/tables', getAllTables);
router.get('/tables/statistics', getTableStatistics);
router.get('/tables/occupancy-trend', getTableOccupancyTrend);
router.get('/tables/:tableNo', getTableDetails);
router.post('/tables', addTable);
router.delete('/tables/:tableNo', deleteTable);
router.patch('/tables/:tableNo/capacity', updateTableCapacity);

export default router;