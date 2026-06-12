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
} from '../controllers/waiterController.js';
import {
  kitchenLogin,
  kitchenRefresh,
  kitchenLogout,
  kitchenDashboard,
  startPreparation,
  markOrderReady,
  getOrderForKitchen,
  getAllKitchens,
  addKitchen,
  deleteKitchen,
  toggleKitchenStatus,
} from '../controllers/kitchenController.js';
import {
  createOrderSession,
  submitCustomerInfo,
  getSessionStatus,
  getPublicMenu,
  placeOrder,
  getOrderBill,
} from '../controllers/customerOrderController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { waiterAuthMiddleware, kitchenAuthMiddleware } from '../middleware/waiterKitchenAuth.js';
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

// ── GET all orders with full details (for manager analytics) ─────────────────
router.get('/api/manager/analytics/orders', authMiddleware, requireRole(['manager']), async (req, res) => {
  try {
    const { from, to, status, waiterId } = req.query;
    let query = supabase
      .from('orders')
      .select(`
        ordersId, dailyOrderNo, tableNo, orderStatus, ordersInfo,
        ordersUpdateInfo, totalAmount, finalAmount, taxBreakdown, gstAmount,
        paymentMethod, isPaymentCompleted, createdAt, completedAt, servedAt,
        customer:mobile(name, mobile),
        waiter:waiterId(waiterName, mobile)
      `)
      .order('createdAt', { ascending: false });

    if (from) query = query.gte('createdAt', from);
    if (to) query = query.lte('createdAt', to);
    if (status) query = query.eq('orderStatus', status);
    if (waiterId) query = query.eq('waiterId', waiterId);

    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders' });
  }
});

// ── GET single order full detail (for manager analytics invoice view) ─────────
router.get('/api/manager/analytics/orders/:orderId', authMiddleware, requireRole(['manager']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *, 
        customer:mobile(name, mobile),
        waiter:waiterId(waiterName, mobile)
      `)
      .eq('ordersId', orderId)
      .maybeSingle();
    if (error || !data) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const { data: restaurantInfo } = await supabase.from('restaurant_info').select('*').eq('infoId', 1).maybeSingle();
    res.status(200).json({ status: 'success', data: { order: data, restaurantInfo } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch order details' });
  }
});

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
router.get('/api/waiter/dashboard', waiterAuthMiddleware, waiterDashboard);
router.get('/api/waiter/pending-sessions', waiterAuthMiddleware, getPendingSessions)
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
router.get('/api/kitchen/dashboard', kitchenAuthMiddleware, kitchenDashboard);
router.patch('/api/kitchen/orders/:orderId/start', kitchenAuthMiddleware, startPreparation);
router.patch('/api/kitchen/orders/:orderId/ready', kitchenAuthMiddleware, markOrderReady);
router.get('/api/kitchen/orders/:orderId', kitchenAuthMiddleware, getOrderForKitchen);

// ============================================================================
// PUBLIC CUSTOMER ORDER ROUTES (web QR scan flow)
// ============================================================================
router.post('/api/order/session', publicOrderLimiter, createOrderSession);
router.post('/api/order/session/customer-info', publicOrderLimiter, submitCustomerInfo);
router.get('/api/order/session/:tableId/status', publicOrderLimiter, getSessionStatus);
router.get('/api/order/menu', publicOrderLimiter, getPublicMenu);
router.post('/api/order/place', publicOrderLimiter, placeOrder);
router.get('/api/order/:orderId/bill', publicOrderLimiter, getOrderBill);

export default router;