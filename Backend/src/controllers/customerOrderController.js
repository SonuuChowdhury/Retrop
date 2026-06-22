// ============================================================================
// CUSTOMER ORDER CONTROLLER
// ============================================================================
// Public routes - no auth required for customer (web browser QR scan flow).
// Rate limited aggressively to prevent abuse.
// ============================================================================

import { orderSessionService } from '../services/orderSessionService.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { redis, REDIS_KEYS } from '../config/redis.js';

// ── POST /api/order/session ───────────────────────────────────────────────────
// Customer scans QR code → creates/fetches 20-min order session
export const createOrderSession = async (req, res) => {
  try {
    const { tableId } = req.body;
    if (!tableId) {
      return res.status(400).json({ status: 'error', message: 'tableId is required' });
    }

    const result = await orderSessionService.createOrderSession(tableId);
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', data: result.data, existing: result.existing || false });
  } catch (err) {
    logger.error('Create order session controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to create session' });
  }
};

// ── POST /api/order/session/customer-info ─────────────────────────────────────
// Customer submits name + mobile
export const submitCustomerInfo = async (req, res) => {
  try {
    const { tableId, sessionToken, customerName, customerMobile } = req.body;

    if (!tableId || !sessionToken || !customerName || !customerMobile) {
      return res.status(400).json({
        status: 'error',
        message: 'tableId, sessionToken, customerName, and customerMobile are required',
      });
    }

    // Basic mobile validation
    if (!/^\d{10}$/.test(customerMobile.replace(/\D/g, ''))) {
      return res.status(400).json({ status: 'error', message: 'Invalid mobile number' });
    }

    const result = await orderSessionService.submitCustomerInfo(tableId, sessionToken, customerName.trim(), customerMobile.trim());
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Submit customer info controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to submit info' });
  }
};

// ── GET /api/order/session/:tableId/status ────────────────────────────────────
// Customer polls this to know if waiter has accepted
export const getSessionStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const result = await orderSessionService.getOrderSession(tableId);

    if (!result.success) {
      return res.status(result.code || 404).json({ status: 'error', message: result.error });
    }

    // Return only safe fields to the customer (no internal wait identifiers)
    const { sessionToken, tableId: tid, tableNo, status, customerName, customerMobile, waiterId, waiterName, orderId, dailyOrderNo, createdAt, expiresAt, customerToken, tokenValidUntil } = result.data;

    res.status(200).json({
      status: 'success',
      data: { sessionToken, tableId: tid, tableNo, status, customerName, customerMobile, waiterId: !!waiterId, waiterName, orderId, dailyOrderNo, createdAt, expiresAt, customerToken, tokenValidUntil },
    });
  } catch (err) {
    logger.error('Get session status error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get session status' });
  }
};

// ── GET /api/order/menu ───────────────────────────────────────────────────────
// Customer views menu (cached)
export const getPublicMenu = async (req, res) => {
  try {
    // Try menu cache
    const cached = await redis.get(REDIS_KEYS.menuCache());
    if (cached) {
      return res.status(200).json({ status: 'success', data: cached, cached: true });
    }

    const { data: menu, error } = await supabase
      .from('menu')
      .select('dishId, dishName, price, category, description, imageUrl, preparationTime, spicyLevel, isVegetarian, isAvailable')
      .eq('isAvailable', true)
      .order('category', { ascending: true });

    if (error) return res.status(500).json({ status: 'error', message: 'Failed to fetch menu' });

    await redis.set(REDIS_KEYS.menuCache(), menu, 5 * 60); // 5 min cache

    res.status(200).json({ status: 'success', data: menu });
  } catch (err) {
    logger.error('Get public menu error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch menu' });
  }
};

// ── POST /api/order/place ─────────────────────────────────────────────────────
// Customer places the order
export const placeOrder = async (req, res) => {
  try {
    const { tableId, sessionToken, items } = req.body;

    if (!tableId || !sessionToken || !items?.length) {
      return res.status(400).json({ status: 'error', message: 'tableId, sessionToken, and items are required' });
    }

    const result = await orderSessionService.placeOrder(tableId, sessionToken, items);
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }

    res.status(201).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Place order controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to place order' });
  }
};

// ── GET /api/order/:orderId/bill ──────────────────────────────────────────────
// Customer views thank-you + QR for bill download after payment
export const getOrderBill = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        ordersId, dailyOrderNo, invoiceNo, tableNo, orderStatus,
        ordersInfo, totalAmount, finalAmount, taxBreakdown,
        gstAmount, discountAmount, discountBreakdown, paymentMethod,
        isPaymentCompleted, createdAt, completedAt,
        customer:mobile(name, mobile)
      `)
      .eq('ordersId', orderId)
      .maybeSingle();

    if (error || !order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (!order.isPaymentCompleted) return res.status(400).json({ status: 'error', message: 'Payment not completed yet' });

    const { data: restaurantInfo } = await supabase.from('restaurant_info').select('*').eq('infoId', 1).maybeSingle();

    res.status(200).json({
      status: 'success',
      data: { order, restaurantInfo },
    });
  } catch (err) {
    logger.error('Get order bill error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch bill' });
  }
};

// ── GET /api/order/:tableId/order-status?token=xxx ────────────────────────────
// Customer polls active order status
export const getCustomerOrderStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Token is required' });
    }

    const { data: table, error: tableError } = await supabase
      .from('restaurant_table')
      .select('tableNo')
      .eq('tableId', tableId)
      .maybeSingle();

    if (tableError || !table) {
      return res.status(404).json({ status: 'error', message: 'Table not found' });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        ordersId, dailyOrderNo, invoiceNo, tableNo, orderStatus, ordersInfo,
        ordersUpdateInfo, totalAmount, finalAmount, taxBreakdown, gstAmount,
        discountAmount, discountBreakdown, paymentMethod, isPaymentCompleted,
        createdAt, completedAt, servedAt, tokenValidUntil,
        waiter:waiterId(waiterName)
      `)
      .eq('customerToken', token)
      .eq('tableNo', table.tableNo)
      .maybeSingle();

    if (orderError || !order) {
      return res.status(404).json({ status: 'error', message: 'Order session not found' });
    }

    const expiry = new Date(order.tokenValidUntil);
    if (expiry < new Date()) {
      return res.status(403).json({ status: 'error', message: 'Session expired' });
    }

    const { data: restaurantInfo } = await supabase.from('restaurant_info').select('*').eq('infoId', 1).maybeSingle();

    res.status(200).json({
      status: 'success',
      data: { order, restaurantInfo },
    });
  } catch (err) {
    logger.error('Get customer order status error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch order status' });
  }
};

// ── POST /api/order/:orderId/customer-modify ──────────────────────────────────
// Customer adds/removes items before kitchen starts
export const customerModifyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token, action, items } = req.body;

    if (!token || !action || !items?.length) {
      return res.status(400).json({ status: 'error', message: 'token, action, and items are required' });
    }

    const result = await orderSessionService.customerModifyOrder(orderId, token, action, items);
    if (!result.success) {
      return res.status(result.code || 400).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Customer modify order controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to modify order' });
  }
};

// ── GET /api/order/:tableId/token-check?token=xxx ─────────────────────────────
// Validate token from QR re-scan
export const checkCustomerToken = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Token is required' });
    }

    const { data: table, error: tableError } = await supabase
      .from('restaurant_table')
      .select('tableNo')
      .eq('tableId', tableId)
      .maybeSingle();

    if (tableError || !table) {
      return res.status(404).json({ status: 'error', message: 'Table not found' });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('ordersId, orderStatus, isPaymentCompleted, tokenValidUntil')
      .eq('customerToken', token)
      .eq('tableNo', table.tableNo)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError || !order) {
      return res.status(200).json({ status: 'success', valid: false });
    }

    const now = new Date();
    const expiry = new Date(order.tokenValidUntil);
    if (expiry < now) {
      return res.status(200).json({ status: 'success', valid: false, reason: 'expired' });
    }

    return res.status(200).json({
      status: 'success',
      valid: true,
      data: {
        orderId: order.ordersId,
        orderStatus: order.orderStatus,
        isPaymentCompleted: order.isPaymentCompleted,
      }
    });
  } catch (err) {
    logger.error('Check customer token controller error', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};