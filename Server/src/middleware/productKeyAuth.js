// ============================================================================
// PRODUCT KEY AUTH MIDDLEWARE
// ============================================================================
// Validates X-Product-Key header on all restaurant-facing routes.
// Resolves restaurantId and attaches to req for downstream use.
// ============================================================================

import { productKeyService } from '../services/productKeyService.js';
import { logger } from '../utils/logger.js';
import { tenantContext } from '../config/supabase.js';

export const productKeyAuth = async (req, res, next) => {
  const keyValue = req.headers['x-product-key'];

  if (!keyValue) {
    return res.status(401).json({
      success: false,
      code: 'key_missing',
      message: 'X-Product-Key header is required',
    });
  }

  const resolved = await productKeyService.resolveKey(keyValue);

  if (!resolved) {
    return res.status(401).json({
      success: false,
      code: 'key_invalid',
      message: 'Invalid product key',
    });
  }

  if (!resolved.keyIsActive) {
    return res.status(403).json({
      success: false,
      code: 'key_inactive',
      message: 'This product key has been deactivated. Please contact Retrop support.',
    });
  }

  if (!resolved.restaurantIsActive) {
    return res.status(403).json({
      success: false,
      code: 'restaurant_inactive',
      message: 'This restaurant account is currently inactive. Please contact Retrop support.',
    });
  }

  // Bind multi-tenant context for Supabase automatic query scoping
  tenantContext.enterWith({ restaurantId: resolved.restaurantId });

  // Attach to request for all downstream middleware and controllers
  req.restaurantId  = resolved.restaurantId;
  req.productKeyId  = resolved.keyId;
  req.businessName  = resolved.businessName;

  next();
};
