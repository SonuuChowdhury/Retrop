import express from 'express';
import { getHealth} from '../controllers/healthController.js';
import rateLimit from 'express-rate-limit';
import { strictLimiter } from '../middleware/security.js';
import {
  adminLogin,
  refreshToken,
  adminLogout,
  getCurrentAdmin,
} from '../controllers/adminController.js';
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

import {
  getAllMenuItems,
  getMenuItemById,
  getMenuCategories,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  toggleCategoryAvailability,
  getMenuStats,
  uploadDishImage,
  deleteDishImage,
} from '../controllers/menuController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { RATE_LIMIT_CONFIG } from '../config/constants.js';

const router = express.Router();
const adminLoginLimiter = rateLimit(RATE_LIMIT_CONFIG.adminLogin);

// Health check endpoint
router.get('/', getHealth);
router.post('/api/admin/login', adminLoginLimiter, adminLogin);
router.post('/api/admin/refresh', refreshToken);
router.post('/api/admin/logout', authMiddleware, adminLogout);
router.get('/api/admin/profile', authMiddleware, getCurrentAdmin);


// ============================================================================
// MANAGER PROFILE & DASHBOARD
// ============================================================================
router.get('/api/manager/profile', authMiddleware, requireRole(['manager']), getManagerProfile);
router.get('/api/manager/dashboard/summary', authMiddleware, requireRole(['manager']), getDashboardSummary);

// ============================================================================
// WAITER MANAGEMENT ROUTES
// ============================================================================
router.get('/api/manager/waiters', authMiddleware, requireRole(['manager']), getAllWaiters);
router.get('/api/manager/waiters/active', authMiddleware, requireRole(['manager']), getActiveWaiters);
router.get('/api/manager/waiters/:waiterId', authMiddleware, requireRole(['manager']), getWaiterProfile);
router.get('/api/manager/waiters/:waiterId/tables', authMiddleware, requireRole(['manager']), getWaiterCurrentTables);
router.post('/api/manager/waiters', authMiddleware, requireRole(['manager']), addWaiter);
router.delete('/api/manager/waiters/:waiterId', authMiddleware, requireRole(['manager']), deleteWaiter);
router.post('/api/manager/waiters/:waiterId/reset-password', authMiddleware, requireRole(['manager']), resetWaiterPassword);
router.patch('/api/manager/waiters/:waiterId/status', authMiddleware, requireRole(['manager']), toggleWaiterStatus);

// ============================================================================
// ORDER ANALYTICS ROUTES
// ============================================================================
router.get('/api/manager/analytics/sales/today', authMiddleware, requireRole(['manager']), getTodaySales);
router.get('/api/manager/analytics/sales/weekly', authMiddleware, requireRole(['manager']), getWeeklySales);
router.get('/api/manager/analytics/sales/monthly', authMiddleware, requireRole(['manager']), getMonthlySales);
router.get('/api/manager/analytics/dishes/best-selling', authMiddleware, requireRole(['manager']), getBestSellingDishes);
router.get('/api/manager/analytics/payment-methods', authMiddleware, requireRole(['manager']), getSalesByPaymentMethod);
router.get('/api/manager/analytics/orders/status', authMiddleware, requireRole(['manager']), getOrdersByStatus);
router.get('/api/manager/analytics/orders', authMiddleware, requireRole(['manager']), getDetailedOrders);
router.get('/api/manager/analytics/customers/top', authMiddleware, requireRole(['manager']), getTopCustomers);
router.get('/api/manager/analytics/completion-time', authMiddleware, requireRole(['manager']), getAverageCompletionTime);

// ============================================================================
// TABLE MANAGEMENT ROUTES
// ============================================================================
router.get('/api/manager/tables', authMiddleware, requireRole(['manager']), getAllTables);
router.get('/api/manager/tables/statistics', authMiddleware, requireRole(['manager']), getTableStatistics);
router.get('/api/manager/tables/occupancy-trend', authMiddleware, requireRole(['manager']), getTableOccupancyTrend);
router.get('/api/manager/tables/:tableNo', authMiddleware, requireRole(['manager']), getTableDetails);
router.post('/api/manager/tables', authMiddleware, requireRole(['manager']), addTable);
router.delete('/api/manager/tables/:tableNo', authMiddleware, requireRole(['manager']), deleteTable);
router.patch('/api/manager/tables/:tableNo/capacity', authMiddleware, requireRole(['manager']), updateTableCapacity);

// ============================================================================
// MENU MANAGEMENT ROUTES
// ============================================================================
router.get('/api/manager/menu', authMiddleware, requireRole(['manager']), getAllMenuItems);
router.get('/api/manager/menu/categories', authMiddleware, requireRole(['manager']), getMenuCategories);
router.get('/api/manager/menu/stats', authMiddleware, requireRole(['manager']), getMenuStats);
router.get('/api/manager/menu/:dishId', authMiddleware, requireRole(['manager']), getMenuItemById);
router.post('/api/manager/menu', authMiddleware, requireRole(['manager']), addMenuItem);
router.put('/api/manager/menu/:dishId', authMiddleware, requireRole(['manager']), updateMenuItem);
router.delete('/api/manager/menu/:dishId', authMiddleware, requireRole(['manager']), deleteMenuItem);
router.patch('/api/manager/menu/:dishId/availability', authMiddleware, requireRole(['manager']), toggleMenuItemAvailability);
router.patch('/api/manager/menu/category/:category/availability', authMiddleware, requireRole(['manager']), toggleCategoryAvailability);

// ============================================================================
// MENU IMAGE ROUTES
// ============================================================================
// POST   /api/manager/menu/:dishId/image  — Upload or replace dish photo
// DELETE /api/manager/menu/:dishId/image  — Remove dish photo
//
// Upload supports two modes:
//   A) Raw binary:  Content-Type: image/jpeg (or png/webp/gif), body = raw bytes
//                   Optional header: X-File-Name: my-photo.jpg
//   B) Base64 JSON: Content-Type: application/json
//                   Body: { "image": "<base64>", "mimeType": "image/jpeg", "fileName": "photo.jpg" }
router.post('/api/manager/menu/:dishId/image', authMiddleware, requireRole(['manager']), uploadDishImage);
router.delete('/api/manager/menu/:dishId/image', authMiddleware, requireRole(['manager']), deleteDishImage);

export default router;
