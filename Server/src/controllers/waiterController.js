// ============================================================================
// WAITER CONTROLLER
// ============================================================================

import { waiterAuthService } from '../services/waiterAuthService.js';
import { orderSessionService } from '../services/orderSessionService.js';
import { socketService } from '../services/socketService.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { redis, REDIS_KEYS } from '../config/redis.js';
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

    const result = await waiterAuthService.login(req.restaurantId, mobile, password, fcmToken, ipAddress, userAgent);

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
    await waiterAuthService.logout(req.waiter.restaurantId, req.waiter.waiterId);
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Waiter logout controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
};

// ── POST /api/waiter/fcm-token ───────────────────────────────────────────────
// App calls this on startup to refresh the FCM push token registration.
export const updateWaiterFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ status: 'error', message: 'fcmToken required' });
    }
    const { notificationService } = await import('../services/notificationService.js');
    await notificationService.registerWaiterToken(req.waiter.waiterId, fcmToken);
    res.status(200).json({ status: 'success', message: 'FCM token updated' });
  } catch (err) {
    logger.error('Update waiter FCM token error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update FCM token' });
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
        customer(name, mobile)
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
  return res.status(403).json({
    status: 'error',
    message: 'Modify order feature is disabled for waiters.',
  });
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

    if (status === 'cancelled') {
      const { cancellationReason } = req.body;
      if (!cancellationReason || !cancellationReason.trim()) {
        return res.status(400).json({ status: 'error', message: 'Cancellation reason is required' });
      }
      updates.cancellationReason = cancellationReason.trim();
    }

    await supabase.from('orders').update(updates).eq('ordersId', orderId);

    if (status === 'cancelled') {
      await supabase.from('restaurant_table')
        .update({ isAvailable: true, currentOrder: null, updatedAt: nowIST() })
        .eq('tableNo', order.tableNo);

      // Clean up Redis session
      try {
        const { data: tableData } = await supabase
          .from('restaurant_table')
          .select('tableId')
          .eq('tableNo', order.tableNo)
          .maybeSingle();

        if (tableData?.tableId) {
          await redis.del(REDIS_KEYS.orderSession(tableData.tableId));
        }
      } catch (redisErr) {
        logger.error('Failed to clean up Redis session on cancel:', redisErr.message);
      }
    }

    // Broadcast order status change to customer tracking page
    socketService.emitToAll('order:status_change', {
      orderId,
      orderStatus: status,
    });

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

    // ISSUE 7: Updated valid payment methods — 'card' replaces 'online'
    if (!paymentMethod || !['cash', 'card', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({ status: 'error', message: 'Valid paymentMethod required: cash, card, upi' });
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
      .select(`*, customer(name, mobile)`)
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
      .select(`*, customer(name, mobile)`)
      .eq('ordersId', orderId)
      .maybeSingle();

    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const { data: restaurantInfo } = await supabase
      .from('restaurant_info')
      .select('*')
      .eq('restaurantId', order.restaurantId)
      .maybeSingle();

    const subtotal = parseFloat(order.totalAmount) || 0;
    let taxBreakdown = order.taxBreakdown || [];
    let gstAmount = parseFloat(order.gstAmount) || 0;
    let discountAmount = parseFloat(order.discountAmount) || 0;
    let discountBreakdown = order.discountBreakdown || [];
    let finalAmount = order.finalAmount !== null ? parseFloat(order.finalAmount) : null;
    const taxType = order.taxBreakdown?.some(t => t.inclusive) ? 'inclusive' : (restaurantInfo?.taxType || 'exclusive');

    if (finalAmount === null) {
      taxBreakdown = [];
      gstAmount = 0;
      discountAmount = 0;
      discountBreakdown = [];

      // Apply active discounts to subtotal first
      const activeDiscounts = (restaurantInfo?.discounts || []).filter(d => d.isActive);
      if (activeDiscounts.length > 0) {
        for (const discount of activeDiscounts) {
          const dAmt = parseFloat(((subtotal * discount.percent) / 100).toFixed(2));
          discountAmount += dAmt;
          discountBreakdown.push({ name: discount.name, percent: discount.percent, amount: dAmt });
        }
        discountAmount = parseFloat(discountAmount.toFixed(2));
      }
      const discountedSubtotal = parseFloat((subtotal - discountAmount).toFixed(2));

      finalAmount = discountedSubtotal;

      if (restaurantInfo?.isGST && restaurantInfo?.taxes?.length) {
        const totalTaxPercent = restaurantInfo.taxes.reduce((sum, t) => sum + (t.percent || 0), 0);

        if (restaurantInfo.taxType === 'inclusive') {
          const divisor = 1 + totalTaxPercent / 100;
          const baseAmount = discountedSubtotal / divisor;
          const totalExtractedTax = discountedSubtotal - baseAmount;

          for (const tax of restaurantInfo.taxes) {
            const taxAmt = parseFloat(((totalExtractedTax * tax.percent) / totalTaxPercent).toFixed(2));
            gstAmount += taxAmt;
            taxBreakdown.push({ name: tax.name, percent: tax.percent, amount: taxAmt, inclusive: true });
          }
          finalAmount = parseFloat(discountedSubtotal.toFixed(2));
        } else {
          for (const tax of restaurantInfo.taxes) {
            const amt = parseFloat(((discountedSubtotal * tax.percent) / 100).toFixed(2));
            gstAmount += amt;
            taxBreakdown.push({ name: tax.name, percent: tax.percent, amount: amt, inclusive: false });
          }
          finalAmount = parseFloat((discountedSubtotal + gstAmount).toFixed(2));
        }
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        order,
        restaurantInfo,
        billing: {
          subtotal:          parseFloat(subtotal.toFixed(2)),
          discountAmount,
          discountBreakdown,
          taxBreakdown,
          taxType,
          gstAmount:         parseFloat(gstAmount.toFixed(2)),
          finalAmount,
        },
      },
    });
  } catch (err) {
    logger.error('Bill preview error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to generate bill preview' });
  }
};