// ============================================================================
// RESTAURANT INFO SERVICE
// ============================================================================
// Manages restaurant details: name, address, mobile, GST, taxes.
// Cached in Redis for 5 minutes.
// ============================================================================

import { supabase } from '../config/supabase.js';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

const RESTAURANT_CACHE_TTL = 5 * 60; // 5 minutes

export const restaurantInfoService = {
  getInfo: async () => {
    try {
      // Try cache first
      const cached = await redis.get(REDIS_KEYS.restaurantInfo());
      if (cached) return { success: true, data: cached, cached: true };

      const { data, error } = await supabase
        .from('restaurant_info')
        .select('*')
        .eq('infoId', 1)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch restaurant info', error.message);
        return { success: false, error: 'Failed to fetch restaurant info' };
      }

      if (data) {
        await redis.set(REDIS_KEYS.restaurantInfo(), data, RESTAURANT_CACHE_TTL);
      }

      return { success: true, data: data || {} };
    } catch (err) {
      logger.error('Restaurant info fetch error', err.message);
      return { success: false, error: 'Failed to fetch restaurant info' };
    }
  },

  updateInfo: async (updates) => {
    try {
      const { data: existing } = await supabase
        .from('restaurant_info')
        .select('infoId')
        .eq('infoId', 1)
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('restaurant_info')
          .update({ ...updates, updatedAt: nowIST() })
          .eq('infoId', 1)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('restaurant_info')
          .insert([{ infoId: 1, ...updates, createdAt: nowIST(), updatedAt: nowIST() }])
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // Invalidate cache
      await redis.del(REDIS_KEYS.restaurantInfo());

      logger.info('Restaurant info updated');
      return { success: true, data: result };
    } catch (err) {
      logger.error('Restaurant info update error', err.message);
      return { success: false, error: 'Failed to update restaurant info' };
    }
  },
};