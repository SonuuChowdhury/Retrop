// ============================================================================
// RESTAURANT INFO CONTROLLER
// ============================================================================

import { restaurantInfoService } from '../services/restaurantInfoService.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { nowIST } from '../utils/time.js';

// ── GET /api/manager/restaurant-info ─────────────────────────────────────────
export const getRestaurantInfo = async (req, res) => {
  try {
    const result = await restaurantInfoService.getInfo();
    if (!result.success) return res.status(500).json({ status: 'error', message: result.error });

    // Fetch the restaurant open/closed status
    const { data: settings } = await supabase
      .from('restaurant_settings')
      .select('isRestaurantOpen')
      .maybeSingle();

    const data = {
      ...result.data,
      isRestaurantOpen: settings ? settings.isRestaurantOpen : false,
    };

    res.status(200).json({ status: 'success', success: true, data });
  } catch (err) {
    logger.error('Get restaurant info error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch restaurant info' });
  }
};

// ── PUT /api/manager/restaurant-info ─────────────────────────────────────────
export const updateRestaurantInfo = async (req, res) => {
  try {
    const { restaurantName, address, mobile, isGST, GSTIN, taxes, taxType, discounts, googleReviewLink } = req.body;

    // Validate
    if (!restaurantName?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Restaurant name is required' });
    }
    if (isGST && !GSTIN?.trim()) {
      return res.status(400).json({ status: 'error', message: 'GSTIN is required when GST is enabled' });
    }
    if (taxes && !Array.isArray(taxes)) {
      return res.status(400).json({ status: 'error', message: 'taxes must be an array' });
    }
    // Validate taxes format: [{name, percent}]
    if (taxes) {
      for (const tax of taxes) {
        if (!tax.name || typeof tax.percent !== 'number' || tax.percent < 0 || tax.percent > 100) {
          return res.status(400).json({ status: 'error', message: 'Each tax must have name (string) and percent (0-100)' });
        }
      }
    }
    // Validate taxType
    if (taxType && !['inclusive', 'exclusive'].includes(taxType)) {
      return res.status(400).json({ status: 'error', message: 'taxType must be "inclusive" or "exclusive"' });
    }
    // Validate discounts format: [{name, percent, isActive}]
    if (discounts) {
      if (!Array.isArray(discounts)) {
        return res.status(400).json({ status: 'error', message: 'discounts must be an array' });
      }
      for (const disc of discounts) {
        if (!disc.name || typeof disc.percent !== 'number' || disc.percent < 0 || disc.percent > 100) {
          return res.status(400).json({ status: 'error', message: 'Each discount must have name (string) and percent (0-100)' });
        }
      }
    }

    // Fetch existing info to detect if isGST has changed
    const existingInfo = await restaurantInfoService.getInfo();
    let gstChangedAt = existingInfo.success && existingInfo.data ? existingInfo.data.gstChangedAt : null;
    const oldIsGST = existingInfo.success && existingInfo.data ? Boolean(existingInfo.data.isGST) : false;
    if (Boolean(isGST) !== oldIsGST) {
      gstChangedAt = nowIST();
    }

    const { logoUrl } = req.body;

    const updates = {
      restaurantName: restaurantName.trim(),
      address: address?.trim() || null,
      mobile: mobile?.trim() || null,
      isGST: Boolean(isGST),
      GSTIN: isGST ? GSTIN?.trim() : null,
      taxes: taxes || [],
      taxType: taxType || 'exclusive',
      discounts: discounts || [],
      gstChangedAt,
      logoUrl: logoUrl || (existingInfo.success && existingInfo.data ? existingInfo.data.logoUrl : null),
      googleReviewLink: googleReviewLink?.trim() || null,
    };

    const result = await restaurantInfoService.updateInfo(updates);
    if (!result.success) return res.status(500).json({ status: 'error', message: result.error });
    res.status(200).json({ status: 'success', success: true, data: result.data, message: 'Restaurant info updated' });
  } catch (err) {
    logger.error('Update restaurant info error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update restaurant info' });
  }
};