import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// RESTAURANT OPEN CHECK MIDDLEWARE (Customer side)
// ============================================================================
// Prevents any order flow endpoints from executing if the restaurant is closed.
// ============================================================================

export const requireRestaurantOpen = async (req, res, next) => {
  try {
    const { data: settings, error } = await supabase
      .from('restaurant_settings')
      .select('isRestaurantOpen')
      .single();

    if (error || !settings) {
      logger.error('Failed to fetch restaurant settings in middleware:', error?.message);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error checking restaurant status',
      });
    }

    if (!settings.isRestaurantOpen) {
      logger.warn(`Rejected customer request on ${req.path} - Restaurant is closed`);
      return res.status(403).json({
        status: 'error',
        message: 'Restaurant is currently closed. Please try again later.',
        code: 403
      });
    }

    next();
  } catch (error) {
    logger.error('Restaurant open check middleware error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify restaurant status',
    });
  }
};
