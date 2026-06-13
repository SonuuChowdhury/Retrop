import express from 'express';
import rateLimit from 'express-rate-limit';
import { getHealth } from '../controllers/healthController.js';
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
  getComprehensiveAnalytics,
  getAnalyticsOrders,
  getAnalyticsOrderDetail,
  getAllTables,
  getTableDetails,
  getTableStatistics,
  getTableOccupancyTrend,
  addTable,
  deleteTable,
  updateTableCapacity,
} from '../controllers/managerController.js';
import {
  getRestaurantSettings,
  toggleRestaurantOpen,
} from '../controllers/restaurantSettingsController.js';
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
import {
  getRestaurantInfo,
  updateRestaurantInfo,
} from '../controllers/restaurantInfoController.js';
import {
  waiterLogin,
  waiterRefresh,
  waiterLogout,
  waiterDashboard,
  acceptOrder,
  getOrderDetails,
  modifyOrder,
  updateOrderStatus,
  concludeOrder,
  getMenuForWaiter,
  getWaiterActiveOrders,
  getBillPreview,
  getPendingSessions,
  updateWaiterFcmToken,
} from '../controllers/waiterController.js';
import {
  kitchenLogin,
  kitchenRefresh,
  kitchenLogout,
  kitchenDashboard,
  startPreparation,
  markOrderReady,
  getOrderForKitchen,
  acknowledgeAddon,
  getAllKitchens,
  addKitchen,
  deleteKitchen,
  toggleKitchenStatus,
  updateKitchenFcmToken,
} from '../controllers/kitchenController.js';
import {
  createOrderSession,
  submitCustomerInfo,
  getSessionStatus,
  getPublicMenu,
  placeOrder,
  getOrderBill,
  getCustomerOrderStatus,
  customerModifyOrder,
  checkCustomerToken,
} from '../controllers/customerOrderController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { waiterAuthMiddleware, kitchenAuthMiddleware } from '../middleware/waiterKitchenAuth.js';
import { requireRestaurantOpen } from '../middleware/restaurantOpen.js';
import { RATE_LIMIT_CONFIG } from '../config/constants.js';

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────
const adminLoginLimiter = rateLimit(RATE_LIMIT_CONFIG.adminLogin);
const waiterLoginLimiter = rateLimit(RATE_LIMIT_CONFIG.waiterLogin);
const kitchenLoginLimiter = rateLimit(RATE_LIMIT_CONFIG.kitchenLogin);
const publicOrderLimiter = rateLimit(RATE_LIMIT_CONFIG.publicOrder);

// ============================================================================
// HEALTH CHECK
// ============================================================================
router.get('/', getHealth);

// ============================================================================
// ADMIN / MANAGER AUTH
// ============================================================================
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
// WAITER MANAGEMENT (Manager side)
// ============================================================================
router.get('/api/manager/waiters', authMiddleware, requireRole(['manager']), getAllWaiters);
router.get('/api/manager/waiters/active', authMiddleware, requireRole(['manager']), getActiveWaiters);
router.get('/api/manager/waiters/:waiterId', authMiddleware, requireRole(['manager']), getWaiterProfile);
router.get('/api/manager/waiters/:waiterId/tables', authMiddleware, requireRole(['manager']), getWaiterCurrentTables);
router.post('/api/manager/waiters', authMiddleware, requireRole(['manager']), addWaiter);
router.delete('/api/manager/waiters/:waiterId', authMiddleware, requireRole(['manager']), deleteWaiter);
router.patch('/api/manager/waiters/:waiterId/reset-password', authMiddleware, requireRole(['manager']), resetWaiterPassword);
router.patch('/api/manager/waiters/:waiterId/status', authMiddleware, requireRole(['manager']), toggleWaiterStatus);

// ============================================================================
// KITCHEN MANAGEMENT (Manager side) — CRUD for kitchen accounts
// ============================================================================
router.get('/api/manager/kitchen', authMiddleware, requireRole(['manager']), getAllKitchens);
router.post('/api/manager/kitchen', authMiddleware, requireRole(['manager']), addKitchen);
router.delete('/api/manager/kitchen/:kitchenId', authMiddleware, requireRole(['manager']), deleteKitchen);
router.patch('/api/manager/kitchen/:kitchenId/status', authMiddleware, requireRole(['manager']), toggleKitchenStatus);

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================
router.get('/api/admins/analytics', authMiddleware, requireRole(['manager', 'owner']), getComprehensiveAnalytics);

// ── GET all orders with full details (for manager analytics) — uses proper controller
router.get('/api/manager/analytics/orders', authMiddleware, requireRole(['manager']), getAnalyticsOrders);

// ── GET single order full detail (for manager analytics invoice view)
router.get('/api/manager/analytics/orders/:orderId', authMiddleware, requireRole(['manager']), getAnalyticsOrderDetail);

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
router.post('/api/manager/menu/:dishId/image', authMiddleware, requireRole(['manager']), uploadDishImage);
router.delete('/api/manager/menu/:dishId/image', authMiddleware, requireRole(['manager']), deleteDishImage);

// ============================================================================
// RESTAURANT SETTINGS ROUTES
// ============================================================================
router.get('/api/manager/settings', authMiddleware, requireRole(['manager']), getRestaurantSettings);
router.patch('/api/manager/settings/toggle', authMiddleware, requireRole(['manager']), toggleRestaurantOpen);

// ============================================================================
// RESTAURANT INFO ROUTES (editable by manager)
// ============================================================================
router.get('/api/manager/restaurant-info', authMiddleware, requireRole(['manager']), getRestaurantInfo);
router.put('/api/manager/restaurant-info', authMiddleware, requireRole(['manager']), updateRestaurantInfo);

// ── Public restaurant info (used by customer web) ─────────────────────────────
router.get('/api/public/restaurant-info', publicOrderLimiter, getRestaurantInfo);

// ============================================================================
// WAITER AUTH & ROUTES
// ============================================================================
router.post('/api/waiter/login', waiterLoginLimiter, waiterLogin);
router.post('/api/waiter/refresh', waiterRefresh);
router.post('/api/waiter/logout', waiterAuthMiddleware, waiterLogout);
router.post('/api/waiter/fcm-token', waiterAuthMiddleware, updateWaiterFcmToken);
router.get('/api/waiter/dashboard', waiterAuthMiddleware, waiterDashboard);
router.get('/api/waiter/pending-sessions', waiterAuthMiddleware, getPendingSessions);
router.get('/api/waiter/menu', waiterAuthMiddleware, getMenuForWaiter);
router.get('/api/waiter/active-orders', waiterAuthMiddleware, getWaiterActiveOrders);
router.post('/api/waiter/orders/:tableId/accept', waiterAuthMiddleware, acceptOrder);
router.get('/api/waiter/orders/:orderId', waiterAuthMiddleware, getOrderDetails);
router.patch('/api/waiter/orders/:orderId/modify', waiterAuthMiddleware, modifyOrder);
router.patch('/api/waiter/orders/:orderId/status', waiterAuthMiddleware, updateOrderStatus);
router.post('/api/waiter/orders/:orderId/conclude', waiterAuthMiddleware, concludeOrder);
router.get('/api/waiter/orders/:orderId/bill-preview', waiterAuthMiddleware, getBillPreview);

// ============================================================================
// KITCHEN AUTH & ROUTES
// ============================================================================
router.post('/api/kitchen/login', kitchenLoginLimiter, kitchenLogin);
router.post('/api/kitchen/refresh', kitchenRefresh);
router.post('/api/kitchen/logout', kitchenAuthMiddleware, kitchenLogout);
router.post('/api/kitchen/fcm-token', kitchenAuthMiddleware, updateKitchenFcmToken);
router.get('/api/kitchen/dashboard', kitchenAuthMiddleware, kitchenDashboard);
router.patch('/api/kitchen/orders/:orderId/start', kitchenAuthMiddleware, startPreparation);
router.patch('/api/kitchen/orders/:orderId/ready', kitchenAuthMiddleware, markOrderReady);
router.patch('/api/kitchen/orders/:orderId/addon/:addonId/done', kitchenAuthMiddleware, acknowledgeAddon);
router.get('/api/kitchen/orders/:orderId', kitchenAuthMiddleware, getOrderForKitchen);

// ============================================================================
// PUBLIC CUSTOMER ORDER ROUTES (web QR scan flow)
// ============================================================================
router.post('/api/order/session', publicOrderLimiter, requireRestaurantOpen, createOrderSession);
router.post('/api/order/session/customer-info', publicOrderLimiter, requireRestaurantOpen, submitCustomerInfo);
router.get('/api/order/session/:tableId/status', publicOrderLimiter, requireRestaurantOpen, getSessionStatus);
router.get('/api/order/menu', publicOrderLimiter, getPublicMenu);
router.post('/api/order/place', publicOrderLimiter, requireRestaurantOpen, placeOrder);
router.get('/api/order/:orderId/bill', publicOrderLimiter, getOrderBill);
router.get('/api/order/:tableId/order-status', publicOrderLimiter, requireRestaurantOpen, getCustomerOrderStatus);
router.post('/api/order/:orderId/customer-modify', publicOrderLimiter, requireRestaurantOpen, customerModifyOrder);
// ISSUE 10 FIX: token-check now also requires restaurant to be open
router.get('/api/order/:tableId/token-check', publicOrderLimiter, requireRestaurantOpen, checkCustomerToken);

export default router;