// ============================================================================
// PRODUCT KEY SERVICE
// ============================================================================
// Generates, resolves, and manages Retrop product keys.
// Key format: RETROP-XXXX-XXXX-XXXX (hex segments)
// ============================================================================

import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

// ── Key Generator ─────────────────────────────────────────────────────────────
// Produces a key like: RETROP-A3F9-B2E1-7C4D
function generateKeyValue() {
  const hex = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
  return `RETROP-${hex()}-${hex()}-${hex()}`;
}

export const productKeyService = {

  // ── Generate a new key for a restaurant ─────────────────────────────────────
  // Deactivates any existing active key first, then creates a new one.
  generateKey: async (restaurantId) => {
    try {
      // Check if any key already exists for this restaurant
      const { count, error: countError } = await supabase
        .from('product_key')
        .select('*', { count: 'exact', head: true })
        .eq('restaurantId', restaurantId);

      if (countError) {
        logger.error('Check existing keys DB error', countError.message);
        return { success: false, error: 'Database check failed', code: 500 };
      }

      if (count && count > 0) {
        return {
          success: false,
          error: 'A product key already exists for this restaurant. Delete the current key first before generating a new one.',
          code: 400
        };
      }

      // Generate unique key (retry up to 5 times in case of collision)
      let keyValue;
      let attempts = 0;
      while (attempts < 5) {
        keyValue = generateKeyValue();
        const { data: existing } = await supabase
          .from('product_key')
          .select('keyId')
          .eq('keyValue', keyValue)
          .maybeSingle();
        if (!existing) break;
        attempts++;
      }

      if (!keyValue) {
        return { success: false, error: 'Failed to generate unique key', code: 500 };
      }

      const { data, error } = await supabase
        .from('product_key')
        .insert([{
          keyValue,
          restaurantId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        logger.error('Generate key DB error', error.message);
        return { success: false, error: 'Failed to create key', code: 500 };
      }

      logger.info(`Product key generated for restaurant ${restaurantId}: ${keyValue}`);
      return { success: true, data };
    } catch (err) {
      logger.error('generateKey error', err.message);
      return { success: false, error: 'Internal error', code: 500 };
    }
  },

  // ── Resolve a key value → restaurantId ──────────────────────────────────────
  // Used by productKeyAuth middleware on every request.
  // Returns null if key invalid or inactive.
  resolveKey: async (keyValue) => {
    try {
      const { data, error } = await supabase
        .from('product_key')
        .select(`
          keyId, keyValue, isActive, restaurantId,
          retrop_restaurant!inner (restaurantId, businessName, isActive)
        `)
        .eq('keyValue', keyValue)
        .maybeSingle();

      if (error || !data) return null;

      return {
        keyId: data.keyId,
        restaurantId: data.restaurantId,
        keyIsActive: data.isActive,
        restaurantIsActive: data.retrop_restaurant.isActive,
        businessName: data.retrop_restaurant.businessName,
      };
    } catch (err) {
      logger.error('resolveKey error', err.message);
      return null;
    }
  },

  // ── Toggle key active status ─────────────────────────────────────────────────
  toggleKey: async (keyId) => {
    try {
      const { data: current, error: fetchError } = await supabase
        .from('product_key')
        .select('isActive')
        .eq('keyId', keyId)
        .maybeSingle();

      if (fetchError || !current) {
        return { success: false, error: 'Key not found', code: 404 };
      }

      const { data, error } = await supabase
        .from('product_key')
        .update({ isActive: !current.isActive, updatedAt: new Date().toISOString() })
        .eq('keyId', keyId)
        .select()
        .single();

      if (error) return { success: false, error: 'Failed to toggle key', code: 500 };

      logger.info(`Product key ${keyId} toggled to isActive=${data.isActive}`);
      return { success: true, data };
    } catch (err) {
      logger.error('toggleKey error', err.message);
      return { success: false, error: 'Internal error', code: 500 };
    }
  },

  // ── Get all keys for a restaurant ───────────────────────────────────────────
  getKeysForRestaurant: async (restaurantId) => {
    try {
      const { data, error } = await supabase
        .from('product_key')
        .select('*')
        .eq('restaurantId', restaurantId)
        .order('createdAt', { ascending: false });

      if (error) return { success: false, error: 'Failed to fetch keys', code: 500 };
      return { success: true, data };
    } catch (err) {
      logger.error('getKeysForRestaurant error', err.message);
      return { success: false, error: 'Internal error', code: 500 };
    }
  },
};
