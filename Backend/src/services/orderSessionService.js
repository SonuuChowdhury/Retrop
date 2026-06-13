// ============================================================================
// ORDER SESSION SERVICE
// ============================================================================
// Manages the full order lifecycle:
//  1. Customer scans QR → order session created (20 min, stored in Redis)
//  2. Customer enters name & mobile → session updated, all waiters notified
//  3. Waiter accepts → order claimed by waiter
//  4. Customer browses menu → items added
//  5. Order placed → persisted to Supabase
//  6. Kitchen receives ticket → prepares dishes
//  7. Kitchen marks done → waiter notified
//  8. Waiter concludes → payment collected → invoice generated
// ============================================================================

import { supabase } from '../config/supabase.js';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { notificationService } from './notificationService.js';
import { socketService } from './socketService.js';
import { logger } from '../utils/logger.js';
import { nowIST, todayDateIST } from '../utils/time.js';
import { randomUUID } from 'crypto';

const ORDER_SESSION_TTL = 20 * 60; // 20 minutes

// ── Generate per-day order number ────────────────────────────────────────────
export const generateDailyOrderNumber = async () => {
  const today = todayDateIST();
  const key = REDIS_KEYS.dailyOrderCounter(today);
  const num = await redis.incr(key);
  // Set TTL for 2 days (so counter auto-cleans)
  const client = await import('../config/redis.js').then(m => m.getRedisClient());
  await client.expire(key, 48 * 60 * 60);
  return num;
};

export const orderSessionService = {

  // ── Step 1: Create order session from QR scan ─────────────────────────
  // ISSUE 1 FIX: If the table already has an active session owned by someone
  // else, return 423 (Table Busy) instead of handing out the session to
  // any anonymous scanner. The token-holder resumes via the token-check flow.
  createOrderSession: async (tableId) => {
    try {
      // Check restaurant is open
      const { data: settings } = await supabase
        .from('restaurant_settings')
        .select('isRestaurantOpen')
        .eq('settingsId', 1)
        .single();

      if (!settings?.isRestaurantOpen) {
        return { success: false, error: 'Restaurant is currently closed. Please try again later.', code: 403 };
      }

      // Validate table exists
      const { data: table, error: tableError } = await supabase
        .from('restaurant_table')
        .select('tableId, tableNo, isAvailable')
        .eq('tableId', tableId)
        .maybeSingle();

      if (tableError || !table) {
        return { success: false, error: 'Invalid table. Please contact staff.', code: 404 };
      }

      // Check if table already has an active order session in Redis
      const existingSession = await redis.get(REDIS_KEYS.orderSession(tableId));
      if (existingSession && existingSession.status !== 'expired') {
        // ISSUE 1 FIX: If session is beyond the initial info-collection stage,
        // the table is "busy" — don't hand out session to a new stranger.
        // The original customer resumes via token-check (already in localStorage).
        if (existingSession.status !== 'waiting_customer_info') {
          return {
            success: false,
            error: 'This table is currently occupied by another guest.',
            code: 423, // 423 Locked — table is busy
          };
        }
        // Still at info stage — safe to return so they can re-fill info
        return { success: true, data: existingSession, existing: true };
      }

      const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const sessionData = {
        sessionToken,
        tableId,
        tableNo: table.tableNo,
        status: 'waiting_customer_info', // waiting_customer_info | waiting_waiter | accepted | ordering | ordered
        customerName: null,
        customerMobile: null,
        waiterId: null,
        waiterName: null,
        orderId: null,
        createdAt: nowIST(),
        expiresAt: new Date(Date.now() + ORDER_SESSION_TTL * 1000).toISOString(),
      };

      await redis.set(REDIS_KEYS.orderSession(tableId), sessionData, ORDER_SESSION_TTL);

      logger.info(`Order session created for table ${table.tableNo}`);
      return { success: true, data: sessionData };
    } catch (err) {
      logger.error('Create order session error', err.message);
      return { success: false, error: 'Failed to create order session', code: 500 };
    }
  },

  // ── Step 2: Customer submits name + mobile ────────────────────────────
  submitCustomerInfo: async (tableId, sessionToken, customerName, customerMobile) => {
    try {
      const session = await redis.get(REDIS_KEYS.orderSession(tableId));

      if (!session) {
        return { success: false, error: 'Session expired. Please scan the QR code again.', code: 410 };
      }
      if (session.sessionToken !== sessionToken) {
        return { success: false, error: 'Invalid session token.', code: 403 };
      }
      if (session.status !== 'waiting_customer_info') {
        return { success: false, data: session }; // Already submitted — return existing state
      }

      // Upsert customer record
      await supabase.from('customer').upsert({
        mobile: customerMobile,
        name: customerName,
        lastLogIn: nowIST(),
        updatedAt: nowIST(),
      }, { onConflict: 'mobile' });

      // Update session
      const updatedSession = {
        ...session,
        customerName,
        customerMobile,
        status: 'waiting_waiter',
        customerSubmittedAt: nowIST(),
      };

      const remainingTTL = await redis.ttl(REDIS_KEYS.orderSession(tableId));
      await redis.set(REDIS_KEYS.orderSession(tableId), updatedSession, remainingTTL > 0 ? remainingTTL : ORDER_SESSION_TTL);

      // Notify all logged-in waiters via FCM
      await notificationService.notifyAllWaiters(
        '🔔 New Table Request',
        `Table ${session.tableNo} — ${customerName} is ready to order`,
        {
          type: 'new_order_request',
          tableId,
          tableNo: String(session.tableNo),
          customerName,
          customerMobile,
          sessionToken,
        }
      );

      logger.info(`Customer info submitted for table ${session.tableNo}: ${customerName}`);
      return { success: true, data: updatedSession };
    } catch (err) {
      logger.error('Submit customer info error', err.message);
      return { success: false, error: 'Failed to submit info', code: 500 };
    }
  },

  // ── Step 3: Waiter accepts the order ─────────────────────────────────
  waiterAcceptsOrder: async (tableId, waiterId) => {
    try {
      const session = await redis.get(REDIS_KEYS.orderSession(tableId));

      if (!session) {
        return { success: false, error: 'Session expired or not found.', code: 410 };
      }

      // Allow re-acceptance by same waiter
      if (session.status === 'accepted' && session.waiterId !== waiterId) {
        return { success: false, error: 'This order has already been accepted by another waiter.', code: 409 };
      }

      if (!['waiting_waiter', 'accepted'].includes(session.status)) {
        return { success: false, error: 'Order is not in a state to be accepted.', code: 400 };
      }

      // Get waiter name
      const { data: waiter } = await supabase
        .from('waiter')
        .select('waiterName, isActive')
        .eq('waiterId', waiterId)
        .maybeSingle();

      if (!waiter || !waiter.isActive) {
        return { success: false, error: 'Waiter account inactive.', code: 403 };
      }

      const acceptedAt = nowIST();
      const tokenValidUntil = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
      const customerToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}`;

      const updatedSession = {
        ...session,
        waiterId,
        waiterName: waiter.waiterName,
        status: 'accepted',
        acceptedAt,
        customerToken,
        tokenValidUntil,
      };

      const remainingTTL = await redis.ttl(REDIS_KEYS.orderSession(tableId));
      await redis.set(REDIS_KEYS.orderSession(tableId), updatedSession, remainingTTL > 0 ? remainingTTL : ORDER_SESSION_TTL);

      logger.info(`Waiter ${waiter.waiterName} accepted order for table ${session.tableNo}`);
      return { success: true, data: updatedSession };
    } catch (err) {
      logger.error('Waiter accept order error', err.message);
      return { success: false, error: 'Failed to accept order', code: 500 };
    }
  },

  // ── Get current session state (for polling) ───────────────────────────
  getOrderSession: async (tableId) => {
    try {
      const session = await redis.get(REDIS_KEYS.orderSession(tableId));
      if (!session) return { success: false, error: 'Session not found or expired', code: 404 };
      return { success: true, data: session };
    } catch (err) {
      logger.error('Get order session error', err.message);
      return { success: false, error: 'Failed to get session', code: 500 };
    }
  },

  // ── Step 4: Customer places order (creates DB record) ─────────────────
  placeOrder: async (tableId, sessionToken, items) => {
    try {
      const session = await redis.get(REDIS_KEYS.orderSession(tableId));

      if (!session) return { success: false, error: 'Session expired.', code: 410 };
      if (session.sessionToken !== sessionToken) return { success: false, error: 'Invalid session.', code: 403 };
      if (session.status !== 'accepted') {
        return { success: false, error: 'A waiter has not accepted this table yet.', code: 400 };
      }
      if (!items || !items.length) {
        return { success: false, error: 'No items in order.', code: 400 };
      }

      // Validate & price all items from DB
      const dishIds = items.map(i => i.dishId);
      const { data: dishes, error: dishError } = await supabase
        .from('menu')
        .select('dishId, dishName, price, isAvailable')
        .in('dishId', dishIds);

      if (dishError) return { success: false, error: 'Failed to validate menu items.', code: 500 };

      const dishMap = Object.fromEntries(dishes.map(d => [d.dishId, d]));
      let totalAmount = 0;
      const ordersInfo = [];

      for (const item of items) {
        const dish = dishMap[item.dishId];
        if (!dish) return { success: false, error: `Dish not found: ${item.dishId}`, code: 400 };
        if (!dish.isAvailable) return { success: false, error: `${dish.dishName} is currently unavailable.`, code: 400 };
        const qty = parseInt(item.quantity) || 1;
        totalAmount += dish.price * qty;
        ordersInfo.push({
          dishId: dish.dishId,
          dishName: dish.dishName,
          price: dish.price,
          quantity: qty,
          remarks: item.remarks || null,
        });
      }

      // Generate daily order number
      const dailyOrderNo = await generateDailyOrderNumber();

      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          mobile: session.customerMobile,
          waiterId: session.waiterId,
          tableNo: session.tableNo,
          orderStatus: 'ordering',
          ordersInfo,
          ordersUpdateInfo: [],
          lockedItems: [],
          totalAmount,
          discountAmount: 0,
          discountBreakdown: [],
          isPaymentCompleted: false,
          dailyOrderNo,
          createdAt: nowIST(),
          updatedAt: nowIST(),
          customerToken: session.customerToken || null,
          tokenValidUntil: session.tokenValidUntil || null,
        }])
        .select()
        .single();

      if (orderError) {
        logger.error('Failed to create order', orderError.message);
        return { success: false, error: 'Failed to place order.', code: 500 };
      }

      // Update Redis session with orderId
      const updatedSession = {
        ...session,
        status: 'ordered',
        orderId: order.ordersId,
        dailyOrderNo,
        orderedAt: nowIST(),
      };
      const remainingTTL = await redis.ttl(REDIS_KEYS.orderSession(tableId));
      await redis.set(REDIS_KEYS.orderSession(tableId), updatedSession, Math.max(remainingTTL, 3600));

      // Mark table as occupied
      await supabase.from('restaurant_table')
        .update({ isAvailable: false, currentOrder: order.ordersId, updatedAt: nowIST() })
        .eq('tableId', tableId);

      // Notify kitchen via FCM
      await notificationService.notifyKitchen(
        `🍳 New Order #${dailyOrderNo}`,
        `Table ${session.tableNo} — ${ordersInfo.length} item(s) — ${session.customerName}`,
        {
          type: 'new_order',
          orderId: order.ordersId,
          tableNo: String(session.tableNo),
          dailyOrderNo: String(dailyOrderNo),
        }
      );

      // Real-time: notify kitchen dashboard via socket (emits 'order:new' which kitchen listens for)
      socketService.emitToAll('order:new', {
        orderId: order.ordersId,
        dailyOrderNo,
        tableNo: session.tableNo,
        customerName: session.customerName,
      });

      logger.info(`Order placed: #${dailyOrderNo} for table ${session.tableNo}`);
      return { success: true, data: { order, session: updatedSession } };
    } catch (err) {
      logger.error('Place order error', err.message);
      return { success: false, error: 'Failed to place order', code: 500 };
    }
  },

  // ── Waiter modifies order (add/remove items) ─────────────────────────
  modifyOrder: async (orderId, waiterId, action, items, remarks) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('ordersId', orderId)
        .maybeSingle();

      if (error || !order) return { success: false, error: 'Order not found.', code: 404 };
      if (order.waiterId !== waiterId) return { success: false, error: 'Not your order.', code: 403 };
      if (['completed', 'cancelled'].includes(order.orderStatus)) {
        return { success: false, error: 'Cannot modify a completed or cancelled order.', code: 400 };
      }

      let newOrdersInfo = [...order.ordersInfo];
      let totalAmount = 0;

      if (action === 'add') {
        const dishIds = items.map(i => i.dishId);
        const { data: dishes } = await supabase.from('menu').select('dishId, dishName, price, isAvailable').in('dishId', dishIds);
        const dishMap = Object.fromEntries(dishes.map(d => [d.dishId, d]));
        for (const item of items) {
          const dish = dishMap[item.dishId];
          if (!dish || !dish.isAvailable) return { success: false, error: `Item unavailable: ${item.dishId}`, code: 400 };
          const existing = newOrdersInfo.find(i => i.dishId === item.dishId);
          if (existing) {
            existing.quantity += parseInt(item.quantity) || 1;
          } else {
            newOrdersInfo.push({ dishId: dish.dishId, dishName: dish.dishName, price: dish.price, quantity: parseInt(item.quantity) || 1, remarks: item.remarks || null });
          }
        }
      } else if (action === 'remove') {
        for (const item of items) {
          const idx = newOrdersInfo.findIndex(i => i.dishId === item.dishId);
          if (idx !== -1) {
            newOrdersInfo[idx].quantity -= parseInt(item.quantity) || 1;
            if (newOrdersInfo[idx].quantity <= 0) newOrdersInfo.splice(idx, 1);
          }
        }
      } else if (action === 'update_quantity') {
        for (const item of items) {
          const existing = newOrdersInfo.find(i => i.dishId === item.dishId);
          if (existing) existing.quantity = parseInt(item.quantity) || 1;
        }
      }

      // Recalculate total
      newOrdersInfo.forEach(i => { totalAmount += i.price * i.quantity; });

      const updateLog = {
        timestamp: nowIST(),
        action,
        items,
        remarks: remarks || null,
        waiterId,
      };

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          ordersInfo: newOrdersInfo,
          ordersUpdateInfo: [...(order.ordersUpdateInfo || []), updateLog],
          totalAmount,
          updatedAt: nowIST(),
        })
        .eq('ordersId', orderId)
        .select()
        .single();

      if (updateError) return { success: false, error: 'Failed to modify order.', code: 500 };

      // Notify kitchen via FCM (always, not just when preparing)
      await notificationService.notifyKitchen(
        `⚠️ Order #${order.dailyOrderNo} Modified by Waiter`,
        `Table ${order.tableNo} — items updated`,
        { type: 'order_modified', orderId, dailyOrderNo: String(order.dailyOrderNo) }
      );

      // Real-time: emit 'order:modified' so kitchen & waiter dashboards update instantly
      socketService.emitToAll('order:modified', {
        orderId,
        dailyOrderNo: order.dailyOrderNo,
        tableNo: order.tableNo,
        modifiedBy: 'waiter',
        ordersInfo: updatedOrder.ordersInfo,
        totalAmount: updatedOrder.totalAmount,
      });

      logger.info(`Order ${orderId} modified by waiter: action=${action}`);
      return { success: true, data: updatedOrder };
    } catch (err) {
      logger.error('Modify order error', err.message);
      return { success: false, error: 'Failed to modify order', code: 500 };
    }
  },

  // ── Kitchen marks order as ready ──────────────────────────────────────
  // ISSUE 3 FIX: Snapshot ordersInfo into lockedItems when order becomes ready.
  kitchenOrderReady: async (orderId, kitchenId) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('ordersId', orderId)
        .maybeSingle();

      if (error || !order) return { success: false, error: 'Order not found.', code: 404 };
      if (order.orderStatus === 'completed') return { success: false, error: 'Order already completed.', code: 400 };

      // ISSUE 3: Lock items when order becomes ready (only lock once — don't overwrite if already locked)
      const lockedItems = (order.lockedItems && order.lockedItems.length > 0)
        ? order.lockedItems
        : [...order.ordersInfo]; // snapshot current items as locked

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          orderStatus: 'ready',
          lockedItems,
          updatedAt: nowIST(),
          readyAt: nowIST(),
        })
        .eq('ordersId', orderId);

      if (updateError) return { success: false, error: 'Failed to update order status.', code: 500 };

      // Notify assigned waiter
      if (order.waiterId) {
        await notificationService.notifyWaiter(
          order.waiterId,
          `✅ Order #${order.dailyOrderNo} Ready!`,
          `Table ${order.tableNo} — ${order.ordersInfo.length} item(s) ready to serve`,
          { type: 'order_ready', orderId, tableNo: String(order.tableNo), dailyOrderNo: String(order.dailyOrderNo) }
        );
      }

      // Broadcast real-time order status update to customers/waiters/kitchen
      socketService.emitToAll('order:status_change', {
        orderId,
        orderStatus: 'ready',
      });

      logger.info(`Order ${orderId} marked ready by kitchen — ${lockedItems.length} items locked`);
      return { success: true };
    } catch (err) {
      logger.error('Kitchen order ready error', err.message);
      return { success: false, error: 'Failed to mark order ready', code: 500 };
    }
  },

  // ── Waiter concludes order + payment ─────────────────────────────────
  // ISSUE 9 FIX: Apply active discounts (from restaurant_info) before tax calculation.
  // ISSUE 3 FIX: totalAmount uses lockedItems as baseline to prevent removal malpractice.
  concludeOrder: async (orderId, waiterId, paymentMethod) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('ordersId', orderId)
        .maybeSingle();

      if (error || !order) return { success: false, error: 'Order not found.', code: 404 };
      if (order.waiterId !== waiterId) return { success: false, error: 'Not your order.', code: 403 };
      if (order.isPaymentCompleted) return { success: false, error: 'Payment already completed.', code: 400 };

      // Calculate taxes from restaurant_info
      const { data: restaurantInfo } = await supabase
        .from('restaurant_info')
        .select('*')
        .eq('infoId', 1)
        .single();

      // ISSUE 3: Use lockedItems as the MINIMUM bill baseline.
      // Build the final item list: union of lockedItems + any unlocked additional items.
      const lockedItems = order.lockedItems || [];
      const currentItems = order.ordersInfo || [];

      // Find items that are in ordersInfo but NOT in lockedItems (newly added, unlocked)
      const lockedDishIds = new Set(lockedItems.map(i => i.dishId));
      const unlockedAdditions = currentItems.filter(item => !lockedDishIds.has(item.dishId));

      // Final billable items = locked items + any brand-new additions
      // Also add quantity additions from existing locked items (customer can add more qty of the same dish)
      const billableItems = lockedItems.map(lockedItem => {
        const currentItem = currentItems.find(i => i.dishId === lockedItem.dishId);
        // If customer added MORE of a locked item, bill the higher quantity
        const finalQty = currentItem && currentItem.quantity > lockedItem.quantity
          ? currentItem.quantity
          : lockedItem.quantity;
        return { ...lockedItem, quantity: finalQty };
      }).concat(unlockedAdditions);

      // Recalculate subtotal using billable items
      const subtotal = billableItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

      let finalAmount = subtotal;
      let taxBreakdown = [];
      let gstAmount = 0;
      let discountAmount = 0;
      let discountBreakdown = [];
      const taxType = restaurantInfo?.taxType || 'exclusive';

      // ISSUE 9: Apply active discounts to subtotal first
      const activeDiscounts = (restaurantInfo?.discounts || []).filter(d => d.isActive);
      if (activeDiscounts.length > 0) {
        for (const discount of activeDiscounts) {
          const dAmt = parseFloat(((subtotal * discount.percent) / 100).toFixed(2));
          discountAmount += dAmt;
          discountBreakdown.push({ name: discount.name, percent: discount.percent, amount: dAmt });
        }
        discountAmount = parseFloat(discountAmount.toFixed(2));
      }

      // Discounted subtotal (what tax is applied on)
      const discountedSubtotal = parseFloat((subtotal - discountAmount).toFixed(2));

      if (restaurantInfo?.isGST && restaurantInfo?.GSTIN && restaurantInfo?.taxes?.length) {
        const totalTaxPercent = restaurantInfo.taxes.reduce((sum, t) => sum + (t.percent || 0), 0);

        if (taxType === 'inclusive') {
          // Inclusive: taxes are already embedded in the discounted subtotal.
          const divisor = 1 + totalTaxPercent / 100;
          const baseAmount = discountedSubtotal / divisor;
          const totalExtractedTax = discountedSubtotal - baseAmount;

          for (const tax of restaurantInfo.taxes) {
            const taxAmt = parseFloat(((totalExtractedTax * tax.percent) / totalTaxPercent).toFixed(2));
            gstAmount += taxAmt;
            taxBreakdown.push({
              name: tax.name,
              percent: tax.percent,
              amount: taxAmt,
              inclusive: true,
            });
          }
          finalAmount = parseFloat(discountedSubtotal.toFixed(2));
        } else {
          // Exclusive: taxes added on top of discounted subtotal
          for (const tax of restaurantInfo.taxes) {
            const taxAmt = parseFloat(((discountedSubtotal * tax.percent) / 100).toFixed(2));
            gstAmount += taxAmt;
            taxBreakdown.push({ name: tax.name, percent: tax.percent, amount: taxAmt, inclusive: false });
          }
          finalAmount = parseFloat((discountedSubtotal + gstAmount).toFixed(2));
        }
      } else {
        // No taxes — finalAmount is discounted subtotal
        finalAmount = discountedSubtotal;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          ordersInfo: billableItems, // Ensure bill reflects final locked+additions list
          orderStatus: 'completed',
          isPaymentCompleted: true,
          paymentMethod,
          totalAmount: subtotal,
          finalAmount,
          taxBreakdown,
          gstAmount: parseFloat(gstAmount.toFixed(2)),
          discountAmount,
          discountBreakdown,
          completedAt: nowIST(),
          updatedAt: nowIST(),
        })
        .eq('ordersId', orderId);

      if (updateError) return { success: false, error: 'Failed to complete order.', code: 500 };

      // Free the table
      await supabase.from('restaurant_table')
        .update({ isAvailable: true, currentOrder: null, updatedAt: nowIST() })
        .eq('tableNo', order.tableNo);

      // Broadcast real-time order status update + bill ready event
      socketService.emitToAll('order:status_change', {
        orderId,
        orderStatus: 'completed',
      });

      socketService.emitToAll('customer:bill_ready', {
        orderId,
        tableNo: order.tableNo,
        finalAmount,
      });

      // Remove Redis order session
      const tableResult = await supabase.from('restaurant_table').select('tableId').eq('tableNo', order.tableNo).maybeSingle();
      if (tableResult.data) {
        await redis.del(REDIS_KEYS.orderSession(tableResult.data.tableId));
      }

      // Update waiter daily stats
      await updateWaiterDailyStats(waiterId, finalAmount);

      // Increment customer total orders (safe — failure won't block payment)
      try {
        const { data: cust } = await supabase
          .from('customer')
          .select('totalorders')
          .eq('mobile', order.mobile)
          .maybeSingle();
        await supabase.from('customer').update({
          totalorders: (cust?.totalorders ?? 0) + 1,
          updatedAt: nowIST(),
        }).eq('mobile', order.mobile);
      } catch (_) { /* non-critical — don't block payment */ }

      logger.info(`Order ${orderId} completed. Payment: ${paymentMethod}, Amount: ${finalAmount}, Discount: ${discountAmount}, TaxType: ${taxType}`);

      return {
        success: true,
        data: {
          orderId,
          dailyOrderNo: order.dailyOrderNo,
          finalAmount,
          taxBreakdown,
          taxType,
          discountAmount,
          discountBreakdown,
          paymentMethod,
          restaurantInfo,
          customerName: null,
        },
      };
    } catch (err) {
      logger.error('Conclude order error', err.message);
      return { success: false, error: 'Failed to conclude order', code: 500 };
    }
  },

  // ── Customer modifies order (add/remove/update items) ─────────────────
  // ISSUE 2 FIX: When adding items, also create an addon batch in ordersUpdateInfo
  //              for the kitchen to see as a separate card.
  // ISSUE 3 FIX: Prevent removal/quantity-reduction of locked items.
  customerModifyOrder: async (orderId, token, action, items) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('ordersId', orderId)
        .eq('customerToken', token)
        .maybeSingle();

      if (error || !order) {
        return { success: false, error: 'Order session not found.', code: 404 };
      }

      // Check token expiration
      const expiry = new Date(order.tokenValidUntil);
      if (expiry < new Date()) {
        return { success: false, error: 'Order session token has expired.', code: 403 };
      }

      // Customer can modify if order is active (not completed/cancelled)
      const allowed = ['ordering', 'preparing', 'ready', 'serving'];
      if (!allowed.includes(order.orderStatus)) {
        return { success: false, error: 'Order is already finalized.', code: 400 };
      }

      const lockedItems = order.lockedItems || [];
      const lockedDishIds = new Set(lockedItems.map(i => i.dishId));

      let newOrdersInfo = [...order.ordersInfo];
      let totalAmount = 0;
      let addonBatch = null; // ISSUE 2: track newly added items for kitchen addon card

      if (action === 'replace') {
        // ISSUE 3: For replace action, ensure locked items are always preserved
        const dishIds = items.map(i => i.dishId);
        const { data: dishes } = await supabase.from('menu').select('dishId, dishName, price, isAvailable').in('dishId', dishIds);
        const dishMap = Object.fromEntries(dishes.map(d => [d.dishId, d]));

        const newItems = [];
        for (const item of items) {
          const dish = dishMap[item.dishId];
          if (!dish || !dish.isAvailable) {
            return { success: false, error: `Item unavailable: ${dish?.dishName || item.dishId}`, code: 400 };
          }
          newItems.push({
            dishId: dish.dishId,
            dishName: dish.dishName,
            price: dish.price,
            quantity: parseInt(item.quantity) || 1,
            remarks: item.remarks || null
          });
        }

        // Merge: keep locked items at their locked quantity (or higher if customer increased),
        // add any non-locked new items.
        const newDishIds = new Set(newItems.map(i => i.dishId));

        // Keep all locked items (with their locked quantities as minimum)
        const mergedItems = lockedItems.map(locked => {
          const newVersion = newItems.find(i => i.dishId === locked.dishId);
          // Customer can increase qty of locked items but NOT decrease below locked qty
          const qty = newVersion && newVersion.quantity > locked.quantity
            ? newVersion.quantity
            : locked.quantity;
          return { ...locked, quantity: qty };
        });

        // Add new items that weren't locked
        for (const newItem of newItems) {
          if (!lockedDishIds.has(newItem.dishId)) {
            mergedItems.push(newItem);
          }
        }

        newOrdersInfo = mergedItems;

        // Compute addon items (dishes that are new, or have increased quantity compared to order.ordersInfo)
        const addonItems = [];
        for (const newItem of newOrdersInfo) {
          const oldItem = order.ordersInfo.find(i => i.dishId === newItem.dishId);
          const oldQty = oldItem ? oldItem.quantity : 0;
          if (newItem.quantity > oldQty) {
            addonItems.push({
              dishId: newItem.dishId,
              dishName: newItem.dishName,
              price: newItem.price,
              quantity: newItem.quantity - oldQty,
              remarks: newItem.remarks || null,
            });
          }
        }

        if (addonItems.length > 0) {
          addonBatch = {
            type: 'addon',
            addonId: randomUUID(),
            addonItems,
            kitchenAcknowledged: false,
            timestamp: nowIST(),
            customer: true,
          };
        }
      } else if (action === 'add') {
        const dishIds = items.map(i => i.dishId);
        const { data: dishes } = await supabase.from('menu').select('dishId, dishName, price, isAvailable').in('dishId', dishIds);
        const dishMap = Object.fromEntries(dishes.map(d => [d.dishId, d]));

        // ISSUE 2: Collect genuinely new items (not already in order) for kitchen addon card
        const addonItems = [];

        for (const item of items) {
          const dish = dishMap[item.dishId];
          if (!dish || !dish.isAvailable) return { success: false, error: `Item unavailable: ${item.dishId}`, code: 400 };
          const existing = newOrdersInfo.find(i => i.dishId === item.dishId);
          const addQty = parseInt(item.quantity) || 1;
          if (existing) {
            existing.quantity += addQty;
          } else {
            const newItem = { dishId: dish.dishId, dishName: dish.dishName, price: dish.price, quantity: addQty, remarks: item.remarks || null };
            newOrdersInfo.push(newItem);
            addonItems.push(newItem);
          }
        }

        // ISSUE 2: If we have brand-new dishes, create an addon batch for kitchen
        if (addonItems.length > 0) {
          addonBatch = {
            type: 'addon',
            addonId: randomUUID(),
            addonItems,
            kitchenAcknowledged: false,
            timestamp: nowIST(),
            customer: true,
          };
        }
      } else if (action === 'remove') {
        for (const item of items) {
          // ISSUE 3: Block removal of locked items
          if (lockedDishIds.has(item.dishId)) {
            const lockedItem = lockedItems.find(i => i.dishId === item.dishId);
            return {
              success: false,
              error: `"${lockedItem?.dishName || item.dishId}" has already been prepared and cannot be removed from the bill.`,
              code: 409,
            };
          }
          const idx = newOrdersInfo.findIndex(i => i.dishId === item.dishId);
          if (idx !== -1) {
            newOrdersInfo[idx].quantity -= parseInt(item.quantity) || 1;
            if (newOrdersInfo[idx].quantity <= 0) newOrdersInfo.splice(idx, 1);
          }
        }
      } else if (action === 'update_quantity') {
        for (const item of items) {
          const existing = newOrdersInfo.find(i => i.dishId === item.dishId);
          if (existing) {
            const newQty = parseInt(item.quantity) || 1;
            // ISSUE 3: Don't allow reducing quantity below locked quantity
            if (lockedDishIds.has(item.dishId)) {
              const lockedItem = lockedItems.find(i => i.dishId === item.dishId);
              const lockedQty = lockedItem?.quantity || 1;
              if (newQty < lockedQty) {
                return {
                  success: false,
                  error: `Cannot reduce "${existing.dishName}" below ${lockedQty} — ${lockedQty} unit(s) already served.`,
                  code: 409,
                };
              }
            }
            existing.quantity = newQty;
          }
        }
      }

      // If cart is empty, prevent saving empty order.
      if (newOrdersInfo.length === 0) {
        return { success: false, error: 'Cannot empty the order. Cancel order instead or keep at least 1 item.', code: 400 };
      }

      // Recalculate total
      newOrdersInfo.forEach(i => { totalAmount += i.price * i.quantity; });

      const updateLog = {
        timestamp: nowIST(),
        action,
        items,
        customer: true,
        ...(addonBatch && { addonId: addonBatch.addonId }),
      };

      // Build updated ordersUpdateInfo — append addon batch if present
      const updatedUpdateInfo = [
        ...(order.ordersUpdateInfo || []),
        ...(addonBatch ? [addonBatch] : []),
        updateLog,
      ];

      // Determine next status: revert to preparing if new items/quantities added and order was ready/serving
      let itemsAdded = false;
      for (const newItem of newOrdersInfo) {
        const oldItem = order.ordersInfo.find(i => i.dishId === newItem.dishId);
        if (!oldItem || newItem.quantity > oldItem.quantity) {
          itemsAdded = true;
          break;
        }
      }

      let nextStatus = order.orderStatus;
      if (itemsAdded && ['ready', 'serving'].includes(order.orderStatus)) {
        nextStatus = 'preparing';
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          ordersInfo: newOrdersInfo,
          ordersUpdateInfo: updatedUpdateInfo,
          totalAmount,
          orderStatus: nextStatus,
          updatedAt: nowIST(),
        })
        .eq('ordersId', orderId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update modified order', updateError.message);
        return { success: false, error: 'Failed to save modifications.', code: 500 };
      }

      // Notify kitchen via FCM
      if (addonBatch) {
        // ISSUE 2: Specific addon notification
        await notificationService.notifyKitchen(
          `🆕 Add-On for Order #${order.dailyOrderNo}`,
          `Table ${order.tableNo} — ${addonBatch.addonItems.length} new item(s) added by customer`,
          { type: 'order_addon', orderId, addonId: addonBatch.addonId, dailyOrderNo: String(order.dailyOrderNo), tableNo: String(order.tableNo) }
        );
      } else {
        await notificationService.notifyKitchen(
          `⚠️ Order #${order.dailyOrderNo} Modified by Customer`,
          `Table ${order.tableNo} — customer updated items`,
          { type: 'order_modified', orderId, dailyOrderNo: String(order.dailyOrderNo), tableNo: String(order.tableNo) }
        );
      }

      // Notify assigned waiter via FCM
      if (order.waiterId) {
        await notificationService.notifyWaiter(
          order.waiterId,
          `🔔 Items Updated — Table ${order.tableNo}`,
          `Customer changed their order for Order #${order.dailyOrderNo}`,
          { type: 'order_modified', orderId, tableNo: String(order.tableNo) }
        ).catch(() => {});
      }

      // ISSUE 2: Emit dedicated addon event for kitchen dashboard
      if (addonBatch) {
        socketService.emitToAll('order:customer_addon', {
          orderId,
          dailyOrderNo: order.dailyOrderNo,
          tableNo: order.tableNo,
          addonId: addonBatch.addonId,
          addonItems: addonBatch.addonItems,
        });
      }

      // Real-time 1: emit 'order:modified' so kitchen dashboard is aware
      socketService.emitToAll('order:modified', {
        orderId,
        dailyOrderNo: order.dailyOrderNo,
        tableNo: order.tableNo,
        modifiedBy: 'customer',
        ordersInfo: newOrdersInfo,
        totalAmount,
        hasAddon: !!addonBatch,
      });

      // Real-time 2: emit 'order:status_change' for customer tracking page live update
      socketService.emitToAll('order:status_change', {
        orderId,
        orderStatus: nextStatus,
        ordersInfo: newOrdersInfo,
        totalAmount,
      });

      logger.info(`Order ${orderId} modified by customer: action=${action}${addonBatch ? ` + addon card created (${addonBatch.addonItems.length} items)` : ''}`);
      return { success: true, data: updatedOrder };
    } catch (err) {
      logger.error('Customer modify order error', err.message);
      return { success: false, error: 'Failed to modify order', code: 500 };
    }
  },

  // ── ISSUE 2: Kitchen acknowledges an addon batch ──────────────────────
  // Marks a kitchen addon card as done (removes it from kitchen view).
  acknowledgeAddon: async (orderId, addonId) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('ordersId, ordersUpdateInfo')
        .eq('ordersId', orderId)
        .maybeSingle();

      if (error || !order) return { success: false, error: 'Order not found.', code: 404 };

      const updatedUpdateInfo = (order.ordersUpdateInfo || []).map(entry => {
        if (entry.type === 'addon' && entry.addonId === addonId) {
          return { ...entry, kitchenAcknowledged: true };
        }
        return entry;
      });

      const { error: updateError } = await supabase
        .from('orders')
        .update({ ordersUpdateInfo: updatedUpdateInfo, updatedAt: nowIST() })
        .eq('ordersId', orderId);

      if (updateError) return { success: false, error: 'Failed to acknowledge addon.', code: 500 };

      logger.info(`Addon ${addonId} acknowledged by kitchen for order ${orderId}`);
      return { success: true };
    } catch (err) {
      logger.error('Acknowledge addon error', err.message);
      return { success: false, error: 'Failed to acknowledge addon', code: 500 };
    }
  },
};

// ── Helper: update waiter daily stats ────────────────────────────────────────
const updateWaiterDailyStats = async (waiterId, earnedAmount) => {
  const today = todayDateIST();
  const { data: existing } = await supabase
    .from('waiter_daily_stats')
    .select('*')
    .eq('waiterId', waiterId)
    .eq('statsDate', today)
    .maybeSingle();

  if (existing) {
    await supabase.from('waiter_daily_stats').update({
      completedOrders: existing.completedOrders + 1,
      totalOrders: existing.totalOrders + 1,
      totalEarnings: parseFloat((existing.totalEarnings + earnedAmount).toFixed(2)),
      updatedAt: nowIST(),
    }).eq('statsId', existing.statsId);
  } else {
    await supabase.from('waiter_daily_stats').insert([{
      waiterId,
      statsDate: today,
      totalOrders: 1,
      completedOrders: 1,
      totalEarnings: parseFloat(earnedAmount.toFixed(2)),
      createdAt: nowIST(),
      updatedAt: nowIST(),
    }]);
  }
};