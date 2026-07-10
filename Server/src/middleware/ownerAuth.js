// ============================================================================
// OWNER AUTHENTICATION MIDDLEWARE
// ============================================================================
// Verifies JWT token and validates owner session for owner portal routes.
// Automatically resolves the restaurantId for the owner and attaches it to req.
// ============================================================================

import { verifyOwnerToken } from '../services/ownerAuthService.js';
import { supabase, tenantContext } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const ownerAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header',
      });
    }

    const accessToken = authHeader.substring(7);

    // 1. Verify token signature
    const decoded = verifyOwnerToken(accessToken);
    if (!decoded || decoded.type !== 'retrop_owner') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
      });
    }

    // 2. Validate session in DB
    const { data: session, error: sessionErr } = await supabase
      .from('retrop_owner_session')
      .select('*')
      .eq('accessToken', accessToken)
      .eq('isActive', true)
      .maybeSingle();

    if (sessionErr || !session) {
      return res.status(401).json({
        success: false,
        message: 'Session has expired or is inactive. Please log in again.',
      });
    }

    // 3. Fetch owner profile
    const { data: owner, error: ownerErr } = await supabase
      .from('retrop_owner')
      .select('*')
      .eq('ownerId', decoded.ownerId)
      .maybeSingle();

    if (ownerErr || !owner) {
      return res.status(401).json({
        success: false,
        message: 'Owner profile not found',
      });
    }

    if (!owner.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Owner account is deactivated',
      });
    }

    // 4. Resolve owner's restaurant (under simplified single-restaurant model)
    const { data: restaurant, error: restErr } = await supabase
      .from('retrop_restaurant')
      .select('restaurantId, businessName')
      .eq('ownerId', owner.ownerId)
      .maybeSingle();

    if (restErr) {
      logger.error(`Error resolving restaurant for owner ${owner.ownerId}:`, restErr.message);
    }

    if (restaurant) {
      // Bind multi-tenant context for Supabase automatic query scoping
      tenantContext.enterWith({ restaurantId: restaurant.restaurantId });
    }

    // Attach to request object
    req.owner = {
      ownerId: owner.ownerId,
      name: owner.name,
      email: owner.email,
      mobile: owner.mobile,
    };
    req.restaurant = restaurant || null;
    req.restaurantId = restaurant ? restaurant.restaurantId : null;
    req.accessToken = accessToken;

    logger.debug(`Owner auth passed for owner: ${owner.ownerId}, restaurantId: ${req.restaurantId}`);
    next();
  } catch (error) {
    logger.error('Owner auth middleware error', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};
