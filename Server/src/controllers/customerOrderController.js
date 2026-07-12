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
        isPaymentCompleted, createdAt, completedAt, restaurantId,
        customer(name, mobile)
      `)
      .eq('ordersId', orderId)
      .maybeSingle();

    if (error || !order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (!order.isPaymentCompleted) return res.status(400).json({ status: 'error', message: 'Payment not completed yet' });

    const { data: restaurantInfo } = await supabase
      .from('restaurant_info')
      .select('*')
      .eq('restaurantId', order.restaurantId)
      .maybeSingle();

    const { data: feedback } = await supabase
      .from('customer_feedback')
      .select('feedbackId')
      .eq('orderId', orderId)
      .maybeSingle();

    const hasFeedback = !!feedback;

    res.status(200).json({
      status: 'success',
      data: { order, restaurantInfo, hasFeedback },
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
        createdAt, completedAt, servedAt, tokenValidUntil, restaurantId,
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

    const { data: restaurantInfo } = await supabase
      .from('restaurant_info')
      .select('*')
      .eq('restaurantId', order.restaurantId)
      .maybeSingle();

    // Dynamically calculate and enrich billing preview details if the order is in progress
    if (order.finalAmount === null && order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled') {
      const subtotal = parseFloat(order.totalAmount) || 0;
      let taxBreakdown = [];
      let gstAmount = 0;
      let discountAmount = 0;
      let discountBreakdown = [];
      const taxType = restaurantInfo?.taxType || 'exclusive';

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

      let finalAmount = discountedSubtotal;

      if (restaurantInfo?.isGST && restaurantInfo?.taxes?.length) {
        const totalTaxPercent = restaurantInfo.taxes.reduce((sum, t) => sum + (t.percent || 0), 0);

        if (taxType === 'inclusive') {
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

      order.discountAmount = discountAmount;
      order.discountBreakdown = discountBreakdown;
      order.taxBreakdown = taxBreakdown;
      order.gstAmount = gstAmount;
      order.finalAmount = finalAmount;
    }

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

// ── POST /api/order/:orderId/feedback ──────────────────────────────────────────
// Customers submits rating & comment for their completed order
export const submitFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment, mobile } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ status: 'error', message: 'Valid rating between 1 and 5 is required' });
    }

    // Resolve restaurantId and default customer mobile from the order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('restaurantId, mobile')
      .eq('ordersId', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const { error: insertErr } = await supabase
      .from('customer_feedback')
      .insert({
        restaurantId: order.restaurantId,
        orderId,
        mobile: mobile || order.mobile || '9999999999', // fallback default mobile
        rating: parseInt(rating),
        comment: comment || null,
      });

    if (insertErr) {
      throw insertErr;
    }

    res.status(200).json({ status: 'success', message: 'Feedback submitted successfully' });
  } catch (err) {
    logger.error('Submit customer feedback error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to submit feedback' });
  }
};