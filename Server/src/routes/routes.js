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
  getAvailableTables,
  createManualOrder,
  getOrderBillPDF,
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
  resetKitchenPassword,
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
  submitFeedback,
} from '../controllers/customerOrderController.js';
import { retropController } from '../controllers/retropController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { waiterAuthMiddleware, kitchenAuthMiddleware } from '../middleware/waiterKitchenAuth.js';
import { requireRestaurantOpen } from '../middleware/restaurantOpen.js';
import { productKeyAuth } from '../middleware/productKeyAuth.js';
import { retropAuth } from '../middleware/retropAuth.js';
import { ownerController } from '../controllers/ownerController.js';
import { inventoryController } from '../controllers/inventoryController.js';
import { ownerAuthMiddleware } from '../middleware/ownerAuth.js';
import { validate, schemas } from '../middleware/validate.js';
import { RATE_LIMIT_CONFIG } from '../config/constants.js';
import { staffController } from '../controllers/staffController.js';
import { expenseController } from '../controllers/expenseController.js';

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────
const adminLoginLimiter   = rateLimit(RATE_LIMIT_CONFIG.adminLogin);
const waiterLoginLimiter  = rateLimit(RATE_LIMIT_CONFIG.waiterLogin);
const kitchenLoginLimiter = rateLimit(RATE_LIMIT_CONFIG.kitchenLogin);
const publicOrderLimiter  = rateLimit(RATE_LIMIT_CONFIG.publicOrder);
const retropLoginLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true });
const retropOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: { success: false, message: 'Too many administrative operations from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});                   

// ============================================================================
// HEALTH CHECK (no auth, no product key)
// ============================================================================
router.get('/', getHealth);

// ============================================================================
// RETROP SUPER ADMIN ROUTES — /api/retrop/*
// Auth: retropAuth middleware (separate JWT secret)
// No X-Product-Key required — this is Retrop's own control plane
// ============================================================================

// Auth (open)
router.post('/api/retrop/auth/login',   retropLoginLimiter, retropController.login);
router.post('/api/retrop/auth/refresh', retropController.refreshToken);
router.post('/api/retrop/auth/logout',  retropAuth, retropController.logout);
router.get('/api/retrop/auth/me',       retropAuth, retropController.me);

// Dashboard
router.get('/api/retrop/dashboard', retropAuth, retropController.getDashboard);

// Restaurant CRUD
router.post('/api/retrop/restaurants',                          retropAuth, retropOperationLimiter, retropController.createRestaurant);
router.get('/api/retrop/restaurants',                           retropAuth, retropController.listRestaurants);
router.get('/api/retrop/restaurants/:restaurantId',             retropAuth, retropController.getRestaurant);
router.patch('/api/retrop/restaurants/:restaurantId',           retropAuth, retropOperationLimiter, retropController.updateRestaurant);
router.patch('/api/retrop/restaurants/:restaurantId/status',    retropAuth, retropController.toggleRestaurantStatus);
router.delete('/api/retrop/restaurants/:restaurantId',           retropAuth, retropOperationLimiter, retropController.deleteRestaurant);

// Restaurant admin management
router.get('/api/retrop/restaurants/:restaurantId/admins',           retropAuth, retropController.getRestaurantAdmins);
router.post('/api/retrop/restaurants/:restaurantId/admins',          retropAuth, retropController.addRestaurantAdmin);
router.patch('/api/retrop/restaurants/:restaurantId/admins/:adminId', retropAuth, retropController.updateRestaurantAdmin);
router.delete('/api/retrop/restaurants/:restaurantId/admins/:adminId', retropAuth, retropController.deleteRestaurantAdmin);
router.post('/api/retrop/restaurants/:restaurantId/mail-credentials', retropAuth, retropOperationLimiter, retropController.mailCredentials);
router.get('/api/retrop/restaurants/:restaurantId/setup-qrcode', retropAuth, retropController.getSetupQrCode);

// Product key management
router.post('/api/retrop/keys/generate/:restaurantId', retropAuth, retropController.generateKey);
router.patch('/api/retrop/keys/:keyId/toggle',         retropAuth, retropController.toggleKey);
router.delete('/api/retrop/keys/:keyId',              retropAuth, retropController.deleteKey);
router.get('/api/retrop/keys',                         retropAuth, retropController.listAllKeys);
router.get('/api/retrop/keys/:restaurantId',           retropAuth, retropController.getRestaurantKeys);

// Retrop Business Config CRUD
router.get('/api/retrop/config', retropAuth, retropController.getBusinessConfig);
router.put('/api/retrop/config', retropAuth, retropController.updateBusinessConfig);

// Pricing Plans CRUD
router.get('/api/retrop/plans',            retropAuth, retropController.listPlans);
router.post('/api/retrop/plans',           retropAuth, retropController.createPlan);
router.put('/api/retrop/plans/:planId',    retropAuth, retropController.updatePlan);
router.delete('/api/retrop/plans/:planId', retropAuth, retropController.deletePlan);

// Transactions & Subscriptions Ledger
router.get('/api/retrop/transactions',          retropAuth, retropController.listTransactions);
router.get('/api/retrop/transactions/:transactionId/invoice', retropAuth, retropController.getTransactionInvoice);
router.get('/api/retrop/subscriptions',         retropAuth, retropController.listSubscriptions);
router.put('/api/retrop/subscriptions/:subscriptionId', retropAuth, retropController.updateSubscription);
router.post('/api/retrop/transactions/confirm', retropAuth, retropOperationLimiter, retropController.confirmPayment);

// Support tickets
router.post('/api/retrop/support-tickets', retropAuth, retropOperationLimiter, retropController.createSupportTicket);

// ============================================================================
// ALL RESTAURANT ROUTES — require X-Product-Key header (productKeyAuth)
// productKeyAuth resolves and attaches req.restaurantId for downstream use
// ============================================================================

// ── Admin / Manager Auth ──────────────────────────────────────────────────────
router.post('/api/admin/login',    productKeyAuth, adminLoginLimiter, adminLogin);
router.post('/api/admin/refresh',  productKeyAuth, refreshToken);
router.post('/api/admin/logout',   productKeyAuth, authMiddleware, adminLogout);
router.get('/api/admin/profile',   productKeyAuth, authMiddleware, getCurrentAdmin);

// ── Manager Profile & Dashboard ───────────────────────────────────────────────
router.get('/api/manager/profile',           productKeyAuth, authMiddleware, requireRole(['manager']), getManagerProfile);
router.get('/api/manager/dashboard/summary', productKeyAuth, authMiddleware, requireRole(['manager']), getDashboardSummary);

// ── Waiter Management (Manager side) ─────────────────────────────────────────
router.get('/api/manager/waiters',                              productKeyAuth, authMiddleware, requireRole(['manager']), getAllWaiters);
router.get('/api/manager/waiters/active',                       productKeyAuth, authMiddleware, requireRole(['manager']), getActiveWaiters);
router.get('/api/manager/waiters/:waiterId',                    productKeyAuth, authMiddleware, requireRole(['manager']), getWaiterProfile);
router.get('/api/manager/waiters/:waiterId/tables',             productKeyAuth, authMiddleware, requireRole(['manager']), getWaiterCurrentTables);
// Shifting waiter creation and deletion exclusively to Owner Staff Registry
// router.post('/api/manager/waiters',                             productKeyAuth, authMiddleware, requireRole(['manager']), addWaiter);
// router.delete('/api/manager/waiters/:waiterId',                 productKeyAuth, authMiddleware, requireRole(['manager']), deleteWaiter);
router.patch('/api/manager/waiters/:waiterId/reset-password',   productKeyAuth, authMiddleware, requireRole(['manager']), resetWaiterPassword);
router.patch('/api/manager/waiters/:waiterId/status',           productKeyAuth, authMiddleware, requireRole(['manager']), toggleWaiterStatus);

// ── Kitchen Management (Manager side) ────────────────────────────────────────
router.get('/api/manager/kitchen',                      productKeyAuth, authMiddleware, requireRole(['manager']), getAllKitchens);
// Shifting kitchen account creation and deletion exclusively to Owner Staff Registry
// router.post('/api/manager/kitchen',                     productKeyAuth, authMiddleware, requireRole(['manager']), addKitchen);
// router.delete('/api/manager/kitchen/:kitchenId',        productKeyAuth, authMiddleware, requireRole(['manager']), deleteKitchen);
router.patch('/api/manager/kitchen/:kitchenId/status',  productKeyAuth, authMiddleware, requireRole(['manager']), toggleKitchenStatus);
router.patch('/api/manager/kitchen/:kitchenId/reset-password', productKeyAuth, authMiddleware, requireRole(['manager']), resetKitchenPassword);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/api/admins/analytics',                         productKeyAuth, authMiddleware, requireRole(['manager', 'owner']), getComprehensiveAnalytics);
router.get('/api/manager/analytics/orders',                 productKeyAuth, authMiddleware, requireRole(['manager']), getAnalyticsOrders);
router.get('/api/manager/analytics/orders/:orderId',        productKeyAuth, authMiddleware, requireRole(['manager']), getAnalyticsOrderDetail);

// ── Table Management ──────────────────────────────────────────────────────────
router.get('/api/manager/tables',                           productKeyAuth, authMiddleware, requireRole(['manager']), getAllTables);
router.get('/api/manager/tables/statistics',                productKeyAuth, authMiddleware, requireRole(['manager']), getTableStatistics);
router.get('/api/manager/tables/occupancy-trend',           productKeyAuth, authMiddleware, requireRole(['manager']), getTableOccupancyTrend);
router.get('/api/manager/tables/:tableNo',                  productKeyAuth, authMiddleware, requireRole(['manager']), getTableDetails);
router.post('/api/manager/tables',                          productKeyAuth, authMiddleware, requireRole(['manager']), addTable);
router.delete('/api/manager/tables/:tableNo',               productKeyAuth, authMiddleware, requireRole(['manager']), deleteTable);
router.patch('/api/manager/tables/:tableNo/capacity',       productKeyAuth, authMiddleware, requireRole(['manager']), updateTableCapacity);

// ── Menu Management ───────────────────────────────────────────────────────────
router.get('/api/manager/menu',                                     productKeyAuth, authMiddleware, requireRole(['manager']), getAllMenuItems);
router.get('/api/manager/menu/categories',                          productKeyAuth, authMiddleware, requireRole(['manager']), getMenuCategories);
router.get('/api/manager/menu/stats',                               productKeyAuth, authMiddleware, requireRole(['manager']), getMenuStats);
router.get('/api/manager/menu/:dishId',                             productKeyAuth, authMiddleware, requireRole(['manager']), getMenuItemById);
// Shifting menu item creation, updates, deletions and image uploads exclusively to Owner Portal
// router.post('/api/manager/menu',                                    productKeyAuth, authMiddleware, requireRole(['manager']), addMenuItem);
// router.put('/api/manager/menu/:dishId',                             productKeyAuth, authMiddleware, requireRole(['manager']), updateMenuItem);
// router.delete('/api/manager/menu/:dishId',                          productKeyAuth, authMiddleware, requireRole(['manager']), deleteMenuItem);
router.patch('/api/manager/menu/:dishId/availability',              productKeyAuth, authMiddleware, requireRole(['manager']), toggleMenuItemAvailability);
router.patch('/api/manager/menu/category/:category/availability',   productKeyAuth, authMiddleware, requireRole(['manager']), toggleCategoryAvailability);
// router.post('/api/manager/menu/:dishId/image',                      productKeyAuth, authMiddleware, requireRole(['manager']), uploadDishImage);
// router.delete('/api/manager/menu/:dishId/image',                    productKeyAuth, authMiddleware, requireRole(['manager']), deleteDishImage);

// ── Restaurant Settings & Info ────────────────────────────────────────────────
router.get('/api/manager/settings',           productKeyAuth, authMiddleware, requireRole(['manager']), getRestaurantSettings);
router.patch('/api/manager/settings/toggle',  productKeyAuth, authMiddleware, requireRole(['manager']), toggleRestaurantOpen);
router.get('/api/manager/restaurant-info',    productKeyAuth, authMiddleware, requireRole(['manager']), getRestaurantInfo);
// Shifting restaurant info updates exclusively to Owner Settings
// router.put('/api/manager/restaurant-info',    productKeyAuth, authMiddleware, requireRole(['manager']), updateRestaurantInfo);

// ── Public restaurant info (used by customer web — also needs product key) ────
router.get('/api/public/restaurant-info', productKeyAuth, publicOrderLimiter, getRestaurantInfo);

// ── Waiter Auth & Operations ──────────────────────────────────────────────────
router.post('/api/waiter/login',                      productKeyAuth, waiterLoginLimiter, waiterLogin);
router.post('/api/waiter/refresh',                    productKeyAuth, waiterRefresh);
router.post('/api/waiter/logout',                     productKeyAuth, waiterAuthMiddleware, waiterLogout);
router.post('/api/waiter/fcm-token',                  productKeyAuth, waiterAuthMiddleware, updateWaiterFcmToken);
router.get('/api/waiter/dashboard',                   productKeyAuth, waiterAuthMiddleware, waiterDashboard);
router.get('/api/waiter/pending-sessions',            productKeyAuth, waiterAuthMiddleware, getPendingSessions);
router.get('/api/waiter/menu',                        productKeyAuth, waiterAuthMiddleware, getMenuForWaiter);
router.get('/api/waiter/active-orders',               productKeyAuth, waiterAuthMiddleware, getWaiterActiveOrders);
router.post('/api/waiter/orders/:tableId/accept',     productKeyAuth, waiterAuthMiddleware, acceptOrder);
router.get('/api/waiter/orders/:orderId',             productKeyAuth, waiterAuthMiddleware, getOrderDetails);
router.patch('/api/waiter/orders/:orderId/modify',    productKeyAuth, waiterAuthMiddleware, modifyOrder);
router.patch('/api/waiter/orders/:orderId/status',    productKeyAuth, waiterAuthMiddleware, updateOrderStatus);
router.post('/api/waiter/orders/:orderId/conclude',   productKeyAuth, waiterAuthMiddleware, concludeOrder);
router.get('/api/waiter/orders/:orderId/bill-preview',productKeyAuth, waiterAuthMiddleware, getBillPreview);
router.get('/api/waiter/tables',                       productKeyAuth, waiterAuthMiddleware, getAvailableTables);
router.post('/api/waiter/orders/manual',              productKeyAuth, waiterAuthMiddleware, createManualOrder);

// ── Kitchen Auth & Operations ─────────────────────────────────────────────────
router.post('/api/kitchen/login',                               productKeyAuth, kitchenLoginLimiter, kitchenLogin);
router.post('/api/kitchen/refresh',                             productKeyAuth, kitchenRefresh);
router.post('/api/kitchen/logout',                              productKeyAuth, kitchenAuthMiddleware, kitchenLogout);
router.post('/api/kitchen/fcm-token',                           productKeyAuth, kitchenAuthMiddleware, updateKitchenFcmToken);
router.get('/api/kitchen/dashboard',                            productKeyAuth, kitchenAuthMiddleware, kitchenDashboard);
router.patch('/api/kitchen/orders/:orderId/start',              productKeyAuth, kitchenAuthMiddleware, startPreparation);
router.patch('/api/kitchen/orders/:orderId/ready',              productKeyAuth, kitchenAuthMiddleware, markOrderReady);
router.patch('/api/kitchen/orders/:orderId/addon/:addonId/done',productKeyAuth, kitchenAuthMiddleware, acknowledgeAddon);
router.get('/api/kitchen/orders/:orderId',                      productKeyAuth, kitchenAuthMiddleware, getOrderForKitchen);

// ============================================================================
// PUBLIC CUSTOMER ORDER ROUTES (web QR scan flow)
// All require X-Product-Key to identify which restaurant's data to serve
// ============================================================================
router.post('/api/order/session',                productKeyAuth, publicOrderLimiter, requireRestaurantOpen, createOrderSession);
router.post('/api/order/session/customer-info',  productKeyAuth, publicOrderLimiter, requireRestaurantOpen, submitCustomerInfo);
router.get('/api/order/session/:tableId/status', productKeyAuth, publicOrderLimiter, requireRestaurantOpen, getSessionStatus);
router.get('/api/order/menu',                    productKeyAuth, publicOrderLimiter, getPublicMenu);
router.post('/api/order/place',                  productKeyAuth, publicOrderLimiter, requireRestaurantOpen, placeOrder);
router.get('/api/order/:orderId/bill',           productKeyAuth, publicOrderLimiter, getOrderBill);
router.get('/api/orders/:orderId/bill-pdf',      publicOrderLimiter, getOrderBillPDF);
router.get('/api/order/:tableId/order-status',   productKeyAuth, publicOrderLimiter, requireRestaurantOpen, getCustomerOrderStatus);
router.post('/api/order/:orderId/customer-modify',productKeyAuth, publicOrderLimiter, requireRestaurantOpen, customerModifyOrder);
// ISSUE 10 FIX: token-check now also requires restaurant to be open
router.get('/api/order/:tableId/token-check',    productKeyAuth, publicOrderLimiter, requireRestaurantOpen, checkCustomerToken);
router.post('/api/order/:orderId/feedback',       productKeyAuth, publicOrderLimiter, submitFeedback);

// ── Owner Auth & Dashboard Operations ─────────────────────────────────────────
router.post('/api/owner/auth/login',          validate(schemas.login), ownerController.login);
router.post('/api/owner/auth/reset-password', validate(schemas.resetPassword), ownerController.resetPassword);
router.post('/api/owner/auth/refresh',        ownerController.refreshToken);
router.post('/api/owner/auth/logout',         ownerAuthMiddleware, ownerController.logout);
router.get('/api/owner/auth/me',              ownerAuthMiddleware, ownerController.me);

router.get('/api/owner/dashboard/summary',    ownerAuthMiddleware, ownerController.getDashboardSummary);
router.get('/api/owner/dashboard/export',     ownerAuthMiddleware, ownerController.exportSalesReport);

// Manager control endpoints via Owner Portal
router.get('/api/owner/managers',             ownerAuthMiddleware, ownerController.getManagers);
router.post('/api/owner/managers',            ownerAuthMiddleware, validate(schemas.createManager), ownerController.createManager);
router.delete('/api/owner/managers/:adminId', ownerAuthMiddleware, ownerController.deleteManager);
router.put('/api/owner/managers/:adminId/password', ownerAuthMiddleware, validate(schemas.resetManagerPassword), ownerController.updateManagerPassword);

// Menu endpoint for recipe mapping
router.get('/api/owner/menu',                         ownerAuthMiddleware, inventoryController.getMenuItems);

// Inventory CRUD endpoints via Owner Portal
router.get('/api/owner/inventory/vendors',             ownerAuthMiddleware, inventoryController.getVendors);
router.post('/api/owner/inventory/vendors',            ownerAuthMiddleware, validate(schemas.vendor), inventoryController.createVendor);
router.put('/api/owner/inventory/vendors/:vendorId',   ownerAuthMiddleware, validate(schemas.vendor), inventoryController.updateVendor);
router.delete('/api/owner/inventory/vendors/:vendorId',ownerAuthMiddleware, inventoryController.deleteVendor);

router.get('/api/owner/inventory/items',               ownerAuthMiddleware, inventoryController.getItems);
router.post('/api/owner/inventory/items',              ownerAuthMiddleware, validate(schemas.inventoryItem), inventoryController.createItem);
router.put('/api/owner/inventory/items/:itemId',       ownerAuthMiddleware, validate(schemas.inventoryItem), inventoryController.updateItem);
router.delete('/api/owner/inventory/items/:itemId',    ownerAuthMiddleware, inventoryController.deleteItem);

router.get('/api/owner/inventory/recipes',             ownerAuthMiddleware, inventoryController.getRecipes);
router.post('/api/owner/inventory/recipes',            ownerAuthMiddleware, validate(schemas.recipe), inventoryController.saveRecipe);
router.delete('/api/owner/inventory/recipes/:dishId',  ownerAuthMiddleware, inventoryController.deleteRecipe);

router.get('/api/owner/inventory/purchases',           ownerAuthMiddleware, inventoryController.getPurchases);
router.post('/api/owner/inventory/purchases',          ownerAuthMiddleware, validate(schemas.purchase), inventoryController.createPurchase);

// ── Logo Upload Route ────────────────────────────────────────────────────────
router.post('/api/owner/restaurant/logo',              ownerAuthMiddleware, ownerController.uploadLogo);

// ── GST Compliance GSTR-1 & GSTR-3B Route ────────────────────────────────────
router.get('/api/owner/gst/gstr1',                     ownerAuthMiddleware, ownerController.getGstr1Report);
router.get('/api/owner/gst/gstr3b',                    ownerAuthMiddleware, ownerController.getGstr3bReport);
router.put('/api/owner/menu/:dishId/hsn',              ownerAuthMiddleware, updateMenuItem);

// ── Unified Staff Registry Routes ───────────────────────────────────────────
router.get('/api/owner/staff',                         ownerAuthMiddleware, staffController.getAllStaff);
router.post('/api/owner/staff',                        ownerAuthMiddleware, validate(schemas.createStaff), staffController.createStaff);
router.delete('/api/owner/staff/:type/:id',            ownerAuthMiddleware, staffController.deleteStaff);
router.put('/api/owner/staff/:type/:id/password',      ownerAuthMiddleware, validate(schemas.resetStaffPassword), staffController.updateStaffPassword);

// ── Expenses & Day Close (Owner Portal side) ───────────────────────────────
router.get('/api/owner/expenses',                      ownerAuthMiddleware, expenseController.getExpenses);
router.post('/api/owner/expenses',                     ownerAuthMiddleware, validate(schemas.expense), expenseController.createExpense);
router.delete('/api/owner/expenses/:expenseId',        ownerAuthMiddleware, expenseController.deleteExpense);
router.get('/api/owner/day-close',                     ownerAuthMiddleware, expenseController.getDayClose);
router.post('/api/owner/day-close',                    ownerAuthMiddleware, validate(schemas.dayClose), expenseController.closeDay);

// ── Expenses & Day Close (Manager Portal side) ─────────────────────────────
router.get('/api/manager/expenses',                    productKeyAuth, authMiddleware, requireRole(['manager', 'owner']), expenseController.getExpenses);
router.post('/api/manager/expenses',                   productKeyAuth, authMiddleware, requireRole(['manager', 'owner']), validate(schemas.expense), expenseController.createExpense);
router.delete('/api/manager/expenses/:expenseId',      productKeyAuth, authMiddleware, requireRole(['manager', 'owner']), expenseController.deleteExpense);
router.get('/api/manager/day-close',                   productKeyAuth, authMiddleware, requireRole(['manager', 'owner']), expenseController.getDayClose);
router.post('/api/manager/day-close',                  productKeyAuth, authMiddleware, requireRole(['manager', 'owner']), validate(schemas.dayClose), expenseController.closeDay);


// ── Owner Menu Management (Owner Portal side) ────────────────────────────────
router.get('/api/owner/menu-management',                         ownerAuthMiddleware, getAllMenuItems);
router.get('/api/owner/menu-management/categories',              ownerAuthMiddleware, getMenuCategories);
router.get('/api/owner/menu-management/stats',                  ownerAuthMiddleware, getMenuStats);
router.get('/api/owner/menu-management/:dishId',                 ownerAuthMiddleware, getMenuItemById);
router.post('/api/owner/menu-management',                        ownerAuthMiddleware, addMenuItem);
router.put('/api/owner/menu-management/:dishId',                 ownerAuthMiddleware, updateMenuItem);
router.delete('/api/owner/menu-management/:dishId',              ownerAuthMiddleware, deleteMenuItem);
router.patch('/api/owner/menu-management/:dishId/availability',  ownerAuthMiddleware, toggleMenuItemAvailability);
router.patch('/api/owner/menu-management/category/:category/availability', ownerAuthMiddleware, toggleCategoryAvailability);
router.post('/api/owner/menu-management/:dishId/image',          ownerAuthMiddleware, uploadDishImage);
router.delete('/api/owner/menu-management/:dishId/image',        ownerAuthMiddleware, deleteDishImage);

// ── Owner Restaurant Settings & Info (Owner Portal side) ──────────────────────
router.get('/api/owner/restaurant-info',    ownerAuthMiddleware, getRestaurantInfo);
router.put('/api/owner/restaurant-info',    ownerAuthMiddleware, updateRestaurantInfo);

// ── Owner Analytics (Owner Portal side) ──────────────────────────────────────
router.get('/api/owner/analytics',          ownerAuthMiddleware, getComprehensiveAnalytics);

// ── Owner Order Management & Reviews ──────────────────────────────────────────
router.get('/api/owner/orders',             ownerAuthMiddleware, ownerController.getOrders);
router.get('/api/owner/reviews',            ownerAuthMiddleware, ownerController.getReviews);

export default router;