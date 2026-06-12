// ============================================================================
// FCM PUSH NOTIFICATION SERVICE
// ============================================================================
// Sends push notifications to waiters and kitchen staff via Firebase FCM.
// Uses firebase-admin SDK. Tokens stored in Redis for active devices.
// ============================================================================

import admin from 'firebase-admin';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { logger } from '../utils/logger.js';

let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
    return;
  }
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    logger.info('✓ Firebase Admin SDK initialized');
  } catch (err) {
    logger.error('Firebase init failed', err.message);
  }
};

initFirebase();

// ============================================================================
// SEND TO A SINGLE FCM TOKEN
// ============================================================================
const sendToToken = async (token, title, body, data = {}) => {
  if (!firebaseInitialized) return { success: false, error: 'Firebase not initialized' };
  try {
    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high', notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };
    const response = await admin.messaging().send(message);
    logger.debug(`FCM sent to token: ${response}`);
    return { success: true, messageId: response };
  } catch (err) {
    logger.error('FCM send to token failed', err.message);
    return { success: false, error: err.message };
  }
};

// ============================================================================
// SEND TO MULTIPLE TOKENS (MULTICAST)
// ============================================================================
const sendMulticast = async (tokens, title, body, data = {}) => {
  if (!firebaseInitialized || !tokens.length) return { success: false, error: 'No tokens' };
  try {
    const message = {
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high', notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };
    const response = await admin.messaging().sendEachForMulticast(message);
    logger.debug(`FCM multicast: ${response.successCount} success, ${response.failureCount} fail`);
    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (err) {
    logger.error('FCM multicast failed', err.message);
    return { success: false, error: err.message };
  }
};

// ============================================================================
// PUBLIC NOTIFICATION FUNCTIONS
// ============================================================================

export const notificationService = {
  // ── Register waiter FCM token in Redis ──────────────────────────────────
  registerWaiterToken: async (waiterId, fcmToken) => {
    await redis.set(REDIS_KEYS.waiterFcmToken(waiterId), fcmToken);
    await redis.sadd(REDIS_KEYS.waiterFcmTokens(), waiterId);
    logger.debug(`Waiter FCM token registered: ${waiterId}`);
  },

  // ── Remove waiter FCM token from Redis ──────────────────────────────────
  unregisterWaiterToken: async (waiterId) => {
    await redis.del(REDIS_KEYS.waiterFcmToken(waiterId));
    await redis.srem(REDIS_KEYS.waiterFcmTokens(), waiterId);
    logger.debug(`Waiter FCM token unregistered: ${waiterId}`);
  },

  // ── Register kitchen FCM token ───────────────────────────────────────────
  registerKitchenToken: async (kitchenId, fcmToken) => {
    await redis.set(REDIS_KEYS.kitchenFcmToken(kitchenId), fcmToken);
    await redis.sadd(REDIS_KEYS.kitchenFcmTokens(), kitchenId);
    logger.debug(`Kitchen FCM token registered: ${kitchenId}`);
  },

  // ── Remove kitchen FCM token ─────────────────────────────────────────────
  unregisterKitchenToken: async (kitchenId) => {
    await redis.del(REDIS_KEYS.kitchenFcmToken(kitchenId));
    await redis.srem(REDIS_KEYS.kitchenFcmTokens(), kitchenId);
  },

  // ── Notify ALL logged-in waiters (new order session created) ─────────────
  notifyAllWaiters: async (title, body, data = {}) => {
    const waiterIds = await redis.smembers(REDIS_KEYS.waiterFcmTokens());
    if (!waiterIds.length) return { success: true, note: 'No active waiters' };
    const tokens = [];
    for (const wid of waiterIds) {
      const token = await redis.get(REDIS_KEYS.waiterFcmToken(wid));
      if (token) tokens.push(token);
    }
    if (!tokens.length) return { success: true, note: 'No FCM tokens available' };
    return sendMulticast(tokens, title, body, data);
  },

  // ── Notify a SINGLE waiter ───────────────────────────────────────────────
  notifyWaiter: async (waiterId, title, body, data = {}) => {
    const token = await redis.get(REDIS_KEYS.waiterFcmToken(waiterId));
    if (!token) return { success: false, error: 'Waiter FCM token not found' };
    return sendToToken(token, title, body, data);
  },

  // ── Notify ALL kitchen devices ───────────────────────────────────────────
  notifyKitchen: async (title, body, data = {}) => {
    const kitchenIds = await redis.smembers(REDIS_KEYS.kitchenFcmTokens());
    if (!kitchenIds.length) return { success: true, note: 'No active kitchen devices' };
    const tokens = [];
    for (const kid of kitchenIds) {
      const token = await redis.get(REDIS_KEYS.kitchenFcmToken(kid));
      if (token) tokens.push(token);
    }
    if (!tokens.length) return { success: true, note: 'No FCM tokens available' };
    return sendMulticast(tokens, title, body, data);
  },
};