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
import { logger } from '../utils/logger.js';
import { nowIST, todayDateIST } from '../utils/time.js';

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
        // Return existing session so customer can continue
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

      const updatedSession = {
        ...session,
        waiterId,
        waiterName: waiter.waiterName,
        status: 'accepted',
        acceptedAt: nowIST(),
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
          totalAmount,
          isPaymentCompleted: false,
          dailyOrderNo,
          createdAt: nowIST(),
          updatedAt: nowIST(),
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

      // Notify kitchen
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

      // Notify kitchen about modification
      if (['preparing'].includes(order.orderStatus)) {
        await notificationService.notifyKitchen(
          `⚠️ Order #${order.dailyOrderNo} Modified`,
          `Table ${order.tableNo} — order has been updated`,
          { type: 'order_modified', orderId, dailyOrderNo: String(order.dailyOrderNo) }
        );
      }

      logger.info(`Order ${orderId} modified: action=${action}`);
      return { success: true, data: updatedOrder };
    } catch (err) {
      logger.error('Modify order error', err.message);
      return { success: false, error: 'Failed to modify order', code: 500 };
    }
  },

  // ── Kitchen marks order as ready ──────────────────────────────────────
  kitchenOrderReady: async (orderId, kitchenId) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('ordersId', orderId)
        .maybeSingle();

      if (error || !order) return { success: false, error: 'Order not found.', code: 404 };
      if (order.orderStatus === 'completed') return { success: false, error: 'Order already completed.', code: 400 };

      const { error: updateError } = await supabase
        .from('orders')
        .update({ orderStatus: 'ready', updatedAt: nowIST(), readyAt: nowIST() })
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

      logger.info(`Order ${orderId} marked ready by kitchen`);
      return { success: true };
    } catch (err) {
      logger.error('Kitchen order ready error', err.message);
      return { success: false, error: 'Failed to mark order ready', code: 500 };
    }
  },

  // ── Waiter concludes order + payment ─────────────────────────────────
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

      let finalAmount = order.totalAmount || 0;
      let taxBreakdown = [];
      let gstAmount = 0;

      if (restaurantInfo?.isGST && restaurantInfo?.GSTIN && restaurantInfo?.taxes) {
        for (const tax of restaurantInfo.taxes) {
          const taxAmt = (finalAmount * tax.percent) / 100;
          gstAmount += taxAmt;
          taxBreakdown.push({ name: tax.name, percent: tax.percent, amount: parseFloat(taxAmt.toFixed(2)) });
        }
        finalAmount = parseFloat((finalAmount + gstAmount).toFixed(2));
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          orderStatus: 'completed',
          isPaymentCompleted: true,
          paymentMethod,
          finalAmount,
          taxBreakdown,
          gstAmount: parseFloat(gstAmount.toFixed(2)),
          completedAt: nowIST(),
          updatedAt: nowIST(),
        })
        .eq('ordersId', orderId);

      if (updateError) return { success: false, error: 'Failed to complete order.', code: 500 };

      // Free the table
      await supabase.from('restaurant_table')
        .update({ isAvailable: true, currentOrder: null, updatedAt: nowIST() })
        .eq('tableNo', order.tableNo);

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

      logger.info(`Order ${orderId} completed. Payment: ${paymentMethod}, Amount: ${finalAmount}`);

      return {
        success: true,
        data: {
          orderId,
          dailyOrderNo: order.dailyOrderNo,
          finalAmount,
          taxBreakdown,
          paymentMethod,
          restaurantInfo,
          customerName: null, // caller will fetch from order.mobile if needed
        },
      };
    } catch (err) {
      logger.error('Conclude order error', err.message);
      return { success: false, error: 'Failed to conclude order', code: 500 };
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