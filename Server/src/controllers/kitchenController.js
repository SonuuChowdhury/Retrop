// ============================================================================
// KITCHEN CONTROLLER
// ============================================================================

import { kitchenAuthService } from '../services/kitchenAuthService.js';
import { orderSessionService } from '../services/orderSessionService.js';
import { socketService } from '../services/socketService.js';
import { notificationService } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { nowIST, todayStartIST, tomorrowStartIST } from '../utils/time.js';
import bcrypt from 'bcryptjs';
import { redis, REDIS_KEYS } from '../config/redis.js';

// ── POST /api/kitchen/login ───────────────────────────────────────────────────
export const kitchenLogin = async (req, res) => {
  try {
    const { mobile, password, fcmToken } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ status: 'error', message: 'Mobile and password are required' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const result = await kitchenAuthService.login(req.restaurantId, mobile, password, fcmToken, ipAddress, userAgent);

    if (!result.success) {
      return res.status(result.code || 401).json({
        status: 'error',
        message: result.error,
        ...(result.disabled && { disabled: true }),
      });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Kitchen login error', err.message);
    res.status(500).json({ status: 'error', message: 'Login failed' });
  }
};

// ── POST /api/kitchen/refresh ─────────────────────────────────────────────────
export const kitchenRefresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ status: 'error', message: 'Refresh token required' });
    const result = await kitchenAuthService.refreshAccessToken(refreshToken);
    if (!result.success) return res.status(401).json({ status: 'error', message: result.error });
    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Kitchen refresh error', err.message);
    res.status(500).json({ status: 'error', message: 'Token refresh failed' });
  }
};

// ── POST /api/kitchen/logout ──────────────────────────────────────────────────
export const kitchenLogout = async (req, res) => {
  try {
    await kitchenAuthService.logout(req.kitchen.restaurantId, req.kitchen.kitchenId);
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Kitchen logout error', err.message);
    res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
};

// ── POST /api/kitchen/fcm-token ───────────────────────────────────────────────
// App calls this on startup to refresh the FCM push token registration.
export const updateKitchenFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ status: 'error', message: 'fcmToken required' });
    }
    await notificationService.registerKitchenToken(req.kitchen.kitchenId, fcmToken);
    res.status(200).json({ status: 'success', message: 'FCM token updated' });
  } catch (err) {
    logger.error('Update kitchen FCM token error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update FCM token' });
  }
};

// ── GET /api/kitchen/dashboard ────────────────────────────────────────────────
// Returns all active orders that the kitchen needs to prepare
export const kitchenDashboard = async (req, res) => {
  try {
    const todayStart = todayStartIST();
    const todayEnd = tomorrowStartIST();

    // All active (non-completed) orders for today
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        ordersId, dailyOrderNo, tableNo, orderStatus,
        ordersInfo, ordersUpdateInfo, totalAmount,
        createdAt, updatedAt, readyAt,
        customer(name, mobile),
        waiter:waiterId(waiterName, mobile)
      `)
      .gte('createdAt', todayStart)
      .lt('createdAt', todayEnd)
      .not('orderStatus', 'in', '("completed","cancelled")')
      .order('createdAt', { ascending: true });

    if (error) {
      logger.error('Kitchen dashboard query error', error.message);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch orders' });
    }

    // Mark orders as modified if a customer-initiated modification happened in the last 5 minutes
    const MODIFIED_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const enrichedOrders = (orders || []).map((order) => {
      const recentCustomerMod = (order.ordersUpdateInfo || []).some((log) => {
        if (!log.customer) return false;
        const logTime = new Date(log.timestamp).getTime();
        return (now - logTime) < MODIFIED_WINDOW_MS;
      });
      return { ...order, isModified: recentCustomerMod };
    });

    // Categorize by status
    const queued    = enrichedOrders.filter(o => o.orderStatus === 'ordering');
    const preparing = enrichedOrders.filter(o => o.orderStatus === 'preparing');
    const ready     = enrichedOrders.filter(o => o.orderStatus === 'ready');
    const serving   = enrichedOrders.filter(o => o.orderStatus === 'serving');

    res.status(200).json({
      status: 'success',
      data: {
        kitchen: req.kitchen,
        queued,
        preparing,
        ready,
        serving,
        totalActive: enrichedOrders.length,
      },
    });
  } catch (err) {
    logger.error('Kitchen dashboard error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch kitchen dashboard' });
  }
};

// ── PATCH /api/kitchen/orders/:orderId/start ──────────────────────────────────
export const startPreparation = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('ordersId, orderStatus, dailyOrderNo, tableNo, waiterId, ordersInfo')
      .eq('ordersId', orderId)
      .maybeSingle();

    if (error || !order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (!['ordering'].includes(order.orderStatus)) {
      return res.status(400).json({ status: 'error', message: 'Order is not in queue state' });
    }

    await supabase.from('orders')
      .update({ orderStatus: 'preparing', preparationStartedAt: nowIST(), updatedAt: nowIST() })
      .eq('ordersId', orderId);

    // Notify assigned waiter: kitchen started preparing
    if (order.waiterId) {
      await notificationService.notifyWaiter(
        order.waiterId,
        `👨‍🍳 Preparing Order #${order.dailyOrderNo}`,
        `Kitchen started preparing Table ${order.tableNo}`,
        { type: 'order_preparing', orderId, tableNo: String(order.tableNo), dailyOrderNo: String(order.dailyOrderNo) }
      ).catch(() => {});
    }

    // Broadcast order status change to customer tracking page and all dashboards
    socketService.emitToAll('order:status_change', {
      orderId,
      orderStatus: 'preparing',
    });

    res.status(200).json({ status: 'success', message: 'Preparation started' });
  } catch (err) {
    logger.error('Start preparation error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to start preparation' });
  }
};

// ── PATCH /api/kitchen/orders/:orderId/ready ──────────────────────────────────
export const markOrderReady = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await orderSessionService.kitchenOrderReady(orderId, req.kitchen.kitchenId);
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', message: 'Order marked as ready. Waiter has been notified.' });
  } catch (err) {
    logger.error('Mark order ready error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to mark order as ready' });
  }
};

// ── GET /api/kitchen/orders/:orderId ─────────────────────────────────────────
export const getOrderForKitchen = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *, 
        customer(name, mobile),
        waiter:waiterId(waiterName)
      `)
      .eq('ordersId', orderId)
      .maybeSingle();

    if (error || !order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    res.status(200).json({ status: 'success', data: order });
  } catch (err) {
    logger.error('Get order for kitchen error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch order' });
  }
};

// ── PATCH /api/kitchen/orders/:orderId/addon/:addonId/done ────────────────────
// ISSUE 2: Kitchen acknowledges (dismisses) a customer addon card.
export const acknowledgeAddon = async (req, res) => {
  try {
    const { orderId, addonId } = req.params;
    const result = await orderSessionService.acknowledgeAddon(orderId, addonId);
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', message: 'Addon acknowledged' });
  } catch (err) {
    logger.error('Acknowledge addon error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to acknowledge addon' });
  }
};

// ============================================================================
// KITCHEN MANAGEMENT (Manager side) — CRUD for kitchen accounts
// ============================================================================


// ── GET all kitchens ─────────────────────────────────────────────────────────
export const getAllKitchens = async (req, res) => {
  try {
    const { data, error } = await supabase.from('kitchen').select('kitchenId, kitchenName, mobile, isActive, lastLogIn, createdAt');
    if (error) throw error;
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    logger.error('Fetch all kitchens error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch kitchen accounts' });
  }
};

// ── POST add kitchen ──────────────────────────────────────────────────────────
export const addKitchen = async (req, res) => {
  try {
    const { kitchenName, mobile, password } = req.body;
    if (!kitchenName || !mobile || !password) {
      return res.status(400).json({ status: 'error', message: 'kitchenName, mobile, and password required' });
    }
    const { data: existing } = await supabase.from('kitchen').select('mobile').eq('mobile', mobile).maybeSingle();
    if (existing) return res.status(409).json({ status: 'error', message: 'Mobile number already exists' });
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('kitchen').insert([{ kitchenName, mobile, password: hash, isActive: true, createdAt: nowIST(), updatedAt: nowIST() }]).select('kitchenId, kitchenName, mobile, isActive').single();
    if (error) throw error;
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    logger.error('Add kitchen error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to add kitchen account' });
  }
};

// ── DELETE kitchen ───────────────────────────────────────────────────────────
export const deleteKitchen = async (req, res) => {
  try {
    const { kitchenId } = req.params;
    // Remove from Redis sessions and FCM
    await redis.del(REDIS_KEYS.kitchenSession(req.admin.restaurantId, kitchenId));
    await notificationService.unregisterKitchenToken(kitchenId);
    const { error } = await supabase.from('kitchen').delete().eq('kitchenId', kitchenId);
    if (error) throw error;
    res.status(200).json({ status: 'success', message: 'Kitchen account deleted' });
  } catch (err) {
    logger.error('Delete kitchen error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to delete kitchen account' });
  }
};

// ── PATCH toggle kitchen status ───────────────────────────────────────────────
export const toggleKitchenStatus = async (req, res) => {
  try {
    const { kitchenId } = req.params;
    const { isActive } = req.body;
    if (isActive === undefined) return res.status(400).json({ status: 'error', message: 'isActive required' });
    if (!isActive) {
      // Force logout if disabling
      await redis.del(REDIS_KEYS.kitchenSession(req.admin.restaurantId, kitchenId));
      await notificationService.unregisterKitchenToken(kitchenId);
    }
    const { error } = await supabase.from('kitchen').update({ isActive: Boolean(isActive), updatedAt: nowIST() }).eq('kitchenId', kitchenId);
    if (error) throw error;
    res.status(200).json({ status: 'success', message: `Kitchen account ${isActive ? 'enabled' : 'disabled'}` });
  } catch (err) {
    logger.error('Toggle kitchen status error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update kitchen status' });
  }
};