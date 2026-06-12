// ============================================================================
// RESTAURANT INFO CONTROLLER
// ============================================================================

import { restaurantInfoService } from '../services/restaurantInfoService.js';
import { logger } from '../utils/logger.js';

// ── GET /api/manager/restaurant-info ─────────────────────────────────────────
export const getRestaurantInfo = async (req, res) => {
  try {
    const result = await restaurantInfoService.getInfo();
    if (!result.success) return res.status(500).json({ status: 'error', message: result.error });
    res.status(200).json({ status: 'success', data: result.data });
  } catch (err) {
    logger.error('Get restaurant info error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch restaurant info' });
  }
};

// ── PUT /api/manager/restaurant-info ─────────────────────────────────────────
export const updateRestaurantInfo = async (req, res) => {
  try {
    const { restaurantName, address, mobile, isGST, GSTIN, taxes } = req.body;

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

    const updates = {
      restaurantName: restaurantName.trim(),
      address: address?.trim() || null,
      mobile: mobile?.trim() || null,
      isGST: Boolean(isGST),
      GSTIN: isGST ? GSTIN?.trim() : null,
      taxes: taxes || [],
    };

    const result = await restaurantInfoService.updateInfo(updates);
    if (!result.success) return res.status(500).json({ status: 'error', message: result.error });
    res.status(200).json({ status: 'success', data: result.data, message: 'Restaurant info updated' });
  } catch (err) {
    logger.error('Update restaurant info error', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to update restaurant info' });
  }
};