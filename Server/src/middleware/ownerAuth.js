// ============================================================================
// OWNER AUTHENTICATION MIDDLEWARE
// ============================================================================
// Verifies JWT token and validates owner session for owner portal routes.
// Automatically resolves the restaurantId for the owner and attaches it to req.
// ============================================================================

import jwt from 'jsonwebtoken';
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

    // ── 1. Try Portal User Authentication First ──────────────────────────────
    const portalSecret = process.env.PORTAL_JWT_SECRET || 'retrop_portal_jwt_secret_key_2026';
    let portalDecoded = null;
    try {
      portalDecoded = jwt.verify(accessToken, portalSecret);
    } catch {}

    if (portalDecoded && portalDecoded.userId) {
      // Verify active portal session
      const { data: portalSession } = await supabase
        .from('portal_user_session')
        .select('sessionId, userId, isActive')
        .eq('accessToken', accessToken)
        .eq('isActive', true)
        .maybeSingle();

      if (portalSession) {
        // Fetch portal user details
        const { data: portalUser } = await supabase
          .from('portal_user')
          .select('*')
          .eq('userId', portalDecoded.userId)
          .maybeSingle();

        if (portalUser && portalUser.isActive) {
          // Resolve selected restaurant ID from X-Restaurant-Id header or portal_user_business
          let restaurantId = req.headers['x-restaurant-id'] || req.headers['x-product-key'];

          if (!restaurantId) {
            const { data: userBiz } = await supabase
              .from('portal_user_business')
              .select('restaurantId')
              .eq('userId', portalUser.userId)
              .limit(1)
              .maybeSingle();
            if (userBiz) restaurantId = userBiz.restaurantId;
          }

          let restaurant = null;
          if (restaurantId) {
            const { data: restData } = await supabase
              .from('retrop_restaurant')
              .select('restaurantId, businessName')
              .eq('restaurantId', restaurantId)
              .maybeSingle();
            restaurant = restData;
          }

          if (restaurantId) {
            tenantContext.enterWith({ restaurantId });
          }

          req.owner = {
            ownerId: portalUser.userId,
            name: portalUser.name,
            email: portalUser.email,
            mobile: portalUser.mobile,
          };
          req.restaurant = restaurant;
          req.restaurantId = restaurantId || null;
          req.accessToken = accessToken;

          return next();
        }
      }
    }

    // ── 2. Fallback to Legacy Owner Authentication ───────────────────────────
    const decoded = verifyOwnerToken(accessToken);
    if (!decoded || decoded.type !== 'retrop_owner') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
      });
    }

    // Validate session in DB
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

    // Fetch owner profile
    const { data: owner, error: ownerErr } = await supabase
      .from('retrop_owner')
      .select('*')
      .eq('ownerId', decoded.ownerId)
      .maybeSingle();

    if (ownerErr || !owner || !owner.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Owner profile not found or inactive',
      });
    }

    // Resolve owner's restaurant
    let restaurantId = req.headers['x-restaurant-id'];
    let restaurant = null;

    if (restaurantId) {
      const { data: restData } = await supabase
        .from('retrop_restaurant')
        .select('restaurantId, businessName')
        .eq('restaurantId', restaurantId)
        .maybeSingle();
      restaurant = restData;
    } else {
      const { data: restData } = await supabase
        .from('retrop_restaurant')
        .select('restaurantId, businessName')
        .eq('ownerId', owner.ownerId)
        .maybeSingle();
      restaurant = restData;
      if (restaurant) restaurantId = restaurant.restaurantId;
    }

    if (restaurantId) {
      tenantContext.enterWith({ restaurantId });
    }

    req.owner = {
      ownerId: owner.ownerId,
      name: owner.name,
      email: owner.email,
      mobile: owner.mobile,
    };
    req.restaurant = restaurant || null;
    req.restaurantId = restaurantId || null;
    req.accessToken = accessToken;

    next();
  } catch (error) {
    logger.error('Owner auth middleware error', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

