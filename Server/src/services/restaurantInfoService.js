import { supabase, tenantContext } from '../config/supabase.js';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

const RESTAURANT_CACHE_TTL = 5 * 60; // 5 minutes

export const restaurantInfoService = {
  getInfo: async () => {
    try {
      const restaurantId = tenantContext.getStore()?.restaurantId;
      if (!restaurantId) {
        logger.error('Restaurant info fetch context missing');
        return { success: false, error: 'Restaurant context missing' };
      }

      // Try cache first
      const cached = await redis.get(REDIS_KEYS.restaurantInfo(restaurantId));
      if (cached) return { success: true, data: cached, cached: true };

      const { data, error } = await supabase
        .from('restaurant_info')
        .select('*')
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch restaurant info', error.message);
        return { success: false, error: 'Failed to fetch restaurant info' };
      }

      if (data) {
        await redis.set(REDIS_KEYS.restaurantInfo(restaurantId), data, RESTAURANT_CACHE_TTL);
      }

      return { success: true, data: data || {} };
    } catch (err) {
      logger.error('Restaurant info fetch error', err.message);
      return { success: false, error: 'Failed to fetch restaurant info' };
    }
  },

  updateInfo: async (updates) => {
    try {
      const restaurantId = tenantContext.getStore()?.restaurantId;
      if (!restaurantId) {
        logger.error('Restaurant info update context missing');
        return { success: false, error: 'Restaurant context missing' };
      }

      const { data: existing } = await supabase
        .from('restaurant_info')
        .select('infoId')
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('restaurant_info')
          .update({ ...updates, updatedAt: nowIST() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('restaurant_info')
          .insert([{ ...updates, createdAt: nowIST(), updatedAt: nowIST() }])
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // Invalidate cache
      await redis.del(REDIS_KEYS.restaurantInfo(restaurantId));

      logger.info(`Restaurant info updated for restaurant ${restaurantId}`);
      return { success: true, data: result };
    } catch (err) {
      logger.error('Restaurant info update error', err.message);
      return { success: false, error: 'Failed to update restaurant info' };
    }
  },
};