// ============================================================================
// WAITER CONTROLLER
// ============================================================================

import { waiterAuthService } from '../services/waiterAuthService.js';
import { orderSessionService } from '../services/orderSessionService.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { redis } from '../config/redis.js';                                    // ← NEW import
import { todayStartIST, tomorrowStartIST, todayDateIST, nowIST } from '../utils/time.js';

// ── POST /api/waiter/login ────────────────────────────────────────────────────
export const waiterLogin = async (req, res) => {
  try {
    const { mobile, password, fcmToken } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ status: 'error', message: 'Mobile and password are required' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const result = await waiterAuthService.login(mobile, password, fcmToken, ipAddress, userAgent);

    if (!result.success) {
      return res.status(result.code || 401).json({
        status: 'error',
        message: result.error,
        ...(result.disabled && { disabled: true }),
      });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Waiter login controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Login failed' });
  }
};

// ── POST /api/waiter/refresh ──────────────────────────────────────────────────
export const waiterRefresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ status: 'error', message: 'Refresh token required' });
    }
    const result = await waiterAuthService.refreshAccessToken(refreshToken);
    if (!result.success) {
      return res.status(401).json({
        status: 'error',
        message: result.error,
        ...(result.disabled && { disabled: true }),
      });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Waiter refresh controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Token refresh failed' });
  }
};

// ── POST /api/waiter/logout ───────────────────────────────────────────────────
export const waiterLogout = async (req, res) => {
  try {
    await waiterAuthService.logout(req.waiter.waiterId);
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Waiter logout controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
};

// ── GET /api/waiter/dashboard ─────────────────────────────────────────────────
export const waiterDashboard = async (req, res) => {
  try {
    const waiterId = req.waiter.waiterId;
    const today = todayDateIST();
    const todayStart = todayStartIST();
    const todayEnd = tomorrowStartIST();

    // Waiter profile
    const { data: waiter, error: waiterError } = await supabase
      .from('waiter')
      .select('waiterId, waiterName, mobile, isActive, createdAt')
      .eq('waiterId', waiterId)
      .single();

    if (waiterError || !waiter) {
      return res.status(404).json({ status: 'error', message: 'Waiter not found' });
    }

    // isActive guard
    if (!waiter.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account is disabled. Please contact your manager.',
        disabled: true,
      });
    }

    // Daily stats from waiter_daily_stats table
    const { data: stats } = await supabase
      .from('waiter_daily_stats')
      .select('*')
      .eq('waiterId', waiterId)
      .eq('statsDate', today)
      .maybeSingle();

    // Active orders for this waiter today
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('ordersId, tableNo, orderStatus, dailyOrderNo, totalAmount, createdAt, ordersInfo')
      .eq('waiterId', waiterId)
      .not('orderStatus', 'in', '("completed","cancelled")')
      .order('createdAt', { ascending: false });

    // Today's completed orders
    const { data: completedToday } = await supabase
      .from('orders')
      .select('ordersId, totalAmount, finalAmount, paymentMethod, completedAt')
      .eq('waiterId', waiterId)
      .eq('orderStatus', 'completed')
      .gte('createdAt', todayStart)
      .lt('createdAt', todayEnd);

    res.status(200).json({
      status: 'success',
      data: {
        waiter: {
          waiterId: waiter.waiterId,
          waiterName: waiter.waiterName,
          mobile: waiter.mobile,
          memberSince: waiter.createdAt,
        },
        todayStats: {
          totalOrders: stats?.totalOrders || 0,
          completedOrders: stats?.completedOrders || 0,
          totalEarnings: stats?.totalEarnings || 0,
          activeOrders: activeOrders?.length || 0,
        },
        activeOrders: activeOrders || [],
        completedToday: completedToday || [],
      },
    });
  } catch (err) {
    logger.error('Waiter dashboard error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard' });
  }
};

// ── GET /api/waiter/pending-sessions ─────────────────────────────────────────
// NEW: Returns all Redis order sessions with status 'waiting_waiter'.
// Polled by the waiter app every 8 seconds as an in-screen alternative
// to push notifications (which don't work in Expo Go).
export const getPendingSessions = async (req, res) => {
  try {
    // Scan Redis for all order session keys
    const keys = await redis.keys('order_session:*');

    if (!keys.length) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const pendingSessions = [];

    for (const key of keys) {
      const session = await redis.get(key);
      // Only return sessions that are waiting for a waiter to accept
      if (session && session.status === 'waiting_waiter') {
        pendingSessions.push({
          tableId:             session.tableId,
          tableNo:             session.tableNo,
          customerName:        session.customerName,
          customerMobile:      session.customerMobile,
          sessionToken:        session.sessionToken,
          createdAt:           session.createdAt,
          customerSubmittedAt: session.customerSubmittedAt ?? session.createdAt,
        });
      }
    }

    // Sort oldest first so the longest-waiting table appears at the top
    pendingSessions.sort(
      (a, b) =>
        new Date(a.customerSubmittedAt).getTime() -
        new Date(b.customerSubmittedAt).getTime()
    );

    return res.status(200).json({ status: 'success', data: pendingSessions });
  } catch (err) {
    logger.error('Get pending sessions error', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch pending sessions' });
  }
};

// ── POST /api/waiter/orders/:tableId/accept ───────────────────────────────────
export const acceptOrder = async (req, res) => {
  try {
    const { tableId } = req.params;
    const waiterId = req.waiter.waiterId;

    const result = await orderSessionService.waiterAcceptsOrder(tableId, waiterId);
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Accept order controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to accept order' });
  }
};

// ── GET /api/waiter/orders/:orderId ──────────────────────────────────────────
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const waiterId = req.waiter.waiterId;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:mobile(name, mobile)
      `)
      .eq('ordersId', orderId)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Waiter can only see their own orders (or if order has no waiter — edge case)
    if (order.waiterId && order.waiterId !== waiterId) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    res.status(200).json({ status: 'success', data: order });
  } catch (err) {
    logger.error('Get order details error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch order' });
  }
};

// ── PATCH /api/waiter/orders/:orderId/modify ──────────────────────────────────
export const modifyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, items, remarks } = req.body;
    const waiterId = req.waiter.waiterId;

    if (!action || !items) {
      return res.status(400).json({ status: 'error', message: 'action and items are required' });
    }

    const result = await orderSessionService.modifyOrder(orderId, waiterId, action, items, remarks);
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }
    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Modify order controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to modify order' });
  }
};

// ── PATCH /api/waiter/orders/:orderId/status ──────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const waiterId = req.waiter.waiterId;

    const allowed = ['serving', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status. Use: serving, cancelled' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('waiterId, orderStatus, dailyOrderNo, tableNo, mobile')
      .eq('ordersId', orderId)
      .maybeSingle();

    if (error || !order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (order.waiterId !== waiterId) return res.status(403).json({ status: 'error', message: 'Not your order' });
    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ status: 'error', message: 'Order is already finalized' });
    }

    const updates = { orderStatus: status, updatedAt: nowIST() };
    if (status === 'serving') updates.servedAt = nowIST();

    await supabase.from('orders').update(updates).eq('ordersId', orderId);

    if (status === 'cancelled') {
      await supabase.from('restaurant_table')
        .update({ isAvailable: true, currentOrder: null, updatedAt: nowIST() })
        .eq('tableNo', order.tableNo);
    }

    res.status(200).json({ status: 'success', message: `Order status updated to ${status}` });
  } catch (err) {
    logger.error('Update order status error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update order status' });
  }
};

// ── POST /api/waiter/orders/:orderId/conclude ─────────────────────────────────
export const concludeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;
    const waiterId = req.waiter.waiterId;

    if (!paymentMethod || !['cash', 'online', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({ status: 'error', message: 'Valid paymentMethod required: cash, online, upi' });
    }

    const result = await orderSessionService.concludeOrder(orderId, waiterId, paymentMethod);
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Conclude order controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to conclude order' });
  }
};

// ── GET /api/waiter/menu ──────────────────────────────────────────────────────
export const getMenuForWaiter = async (req, res) => {
  try {
    const { data: menu, error } = await supabase
      .from('menu')
      .select('*')
      .eq('isAvailable', true)
      .order('category', { ascending: true });

    if (error) return res.status(500).json({ status: 'error', message: 'Failed to fetch menu' });
    res.status(200).json({ status: 'success', data: menu });
  } catch (err) {
    logger.error('Get menu for waiter error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch menu' });
  }
};

// ── GET /api/waiter/active-orders ─────────────────────────────────────────────
export const getWaiterActiveOrders = async (req, res) => {
  try {
    const waiterId = req.waiter.waiterId;

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`*, customer:mobile(name, mobile)`)
      .eq('waiterId', waiterId)
      .not('orderStatus', 'in', '("completed","cancelled")')
      .order('createdAt', { ascending: false });

    if (error) return res.status(500).json({ status: 'error', message: 'Failed to fetch orders' });
    res.status(200).json({ status: 'success', data: orders });
  } catch (err) {
    logger.error('Get waiter active orders error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch active orders' });
  }
};

// ── GET /api/waiter/orders/:orderId/bill-preview ──────────────────────────────
export const getBillPreview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { data: order } = await supabase
      .from('orders')
      .select(`*, customer:mobile(name, mobile)`)
      .eq('ordersId', orderId)
      .maybeSingle();

    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const { data: restaurantInfo } = await supabase
      .from('restaurant_info')
      .select('*')
      .eq('infoId', 1)
      .maybeSingle();

    let totalBeforeTax = order.totalAmount || 0;
    let taxBreakdown = [];
    let gstAmount = 0;
    let finalAmount = totalBeforeTax;

    if (restaurantInfo?.isGST && restaurantInfo?.taxes?.length) {
      for (const tax of restaurantInfo.taxes) {
        const amt = (totalBeforeTax * tax.percent) / 100;
        gstAmount += amt;
        taxBreakdown.push({ name: tax.name, percent: tax.percent, amount: parseFloat(amt.toFixed(2)) });
      }
      finalAmount = parseFloat((totalBeforeTax + gstAmount).toFixed(2));
    }

    res.status(200).json({
      status: 'success',
      data: {
        order,
        restaurantInfo,
        billing: {
          subtotal:     parseFloat(totalBeforeTax.toFixed(2)),
          taxBreakdown,
          gstAmount:    parseFloat(gstAmount.toFixed(2)),
          finalAmount,
        },
      },
    });
  } catch (err) {
    logger.error('Bill preview error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to generate bill preview' });
  }
};