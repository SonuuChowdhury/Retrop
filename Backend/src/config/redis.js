// ============================================================================
// REDIS CLIENT CONFIGURATION
// ============================================================================
// Used for: order session caching, active waiter push token tracking,
//           kitchen session tracking, rate-limit counters, temp state.
// ============================================================================

import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

let redisClient = null;

export const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) return redisClient;

  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis: too many reconnect attempts, giving up');
          return new Error('Too many reconnect attempts');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redisClient.on('error', (err) => logger.error('Redis client error', err.message));
  redisClient.on('connect', () => logger.info('✓ Redis connected'));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));
  redisClient.on('end', () => logger.warn('Redis connection closed'));

  await redisClient.connect();
  return redisClient;
};

// ============================================================================
// REDIS HELPERS — wraps get/set/del with JSON serialization and TTL
// ============================================================================

export const redis = {
  async get(key) {
    try {
      const client = await getRedisClient();
      const val = await client.get(key);
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    } catch (err) {
      logger.error('Redis GET error', err.message);
      return null;
    }
  },

  async set(key, value, ttlSeconds = null) {
    try {
      const client = await getRedisClient();
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
      return true;
    } catch (err) {
      logger.error('Redis SET error', err.message);
      return false;
    }
  },

  async del(key) {
    try {
      const client = await getRedisClient();
      await client.del(key);
      return true;
    } catch (err) {
      logger.error('Redis DEL error', err.message);
      return false;
    }
  },

  async exists(key) {
    try {
      const client = await getRedisClient();
      return (await client.exists(key)) === 1;
    } catch (err) {
      logger.error('Redis EXISTS error', err.message);
      return false;
    }
  },

  async ttl(key) {
    try {
      const client = await getRedisClient();
      return await client.ttl(key);
    } catch (err) {
      logger.error('Redis TTL error', err.message);
      return -1;
    }
  },

  async keys(pattern) {
    try {
      const client = await getRedisClient();
      return await client.keys(pattern);
    } catch (err) {
      logger.error('Redis KEYS error', err.message);
      return [];
    }
  },

  async sadd(key, ...members) {
    try {
      const client = await getRedisClient();
      return await client.sAdd(key, members);
    } catch (err) {
      logger.error('Redis SADD error', err.message);
      return 0;
    }
  },

  async srem(key, ...members) {
    try {
      const client = await getRedisClient();
      return await client.sRem(key, members);
    } catch (err) {
      logger.error('Redis SREM error', err.message);
      return 0;
    }
  },

  async smembers(key) {
    try {
      const client = await getRedisClient();
      return await client.sMembers(key);
    } catch (err) {
      logger.error('Redis SMEMBERS error', err.message);
      return [];
    }
  },

  async incr(key) {
    try {
      const client = await getRedisClient();
      return await client.incr(key);
    } catch (err) {
      logger.error('Redis INCR error', err.message);
      return 0;
    }
  },
};

// ============================================================================
// KEY NAMESPACES
// ============================================================================
export const REDIS_KEYS = {
  // Order session for a table (20 min TTL)
  orderSession: (tableId) => `order_session:${tableId}`,
  // FCM tokens of all logged-in waiters
  waiterFcmTokens: () => `waiter_fcm_tokens`,
  // FCM token of a specific waiter
  waiterFcmToken: (waiterId) => `waiter_fcm:${waiterId}`,
  // Kitchen device FCM tokens
  kitchenFcmTokens: () => `kitchen_fcm_tokens`,
  kitchenFcmToken: (kitchenId) => `kitchen_fcm:${kitchenId}`,
  // Waiter JWT session
  waiterSession: (waiterId) => `waiter_session:${waiterId}`,
  // Kitchen JWT session
  kitchenSession: (kitchenId) => `kitchen_session:${kitchenId}`,
  // Daily order number counter (resets each day)
  dailyOrderCounter: (dateStr) => `daily_order_counter:${dateStr}`,
  // Restaurant info cache (5 min TTL)
  restaurantInfo: () => `restaurant_info`,
  // Menu cache (5 min TTL)
  menuCache: () => `menu_cache`,
};