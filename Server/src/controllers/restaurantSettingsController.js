import { restaurantSettingsService } from '../services/restaurantSettingsService.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// RESTAURANT SETTINGS CONTROLLER
// ============================================================================

// ============================================================================
// GET SETTINGS
// GET /api/manager/settings
// ============================================================================
// Returns the current isRestaurantOpen flag and metadata.
// ============================================================================
export const getRestaurantSettings = async (req, res) => {
  try {
    const result = await restaurantSettingsService.getSettings();

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    logger.error('Get restaurant settings error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch restaurant settings',
    });
  }
};

// ============================================================================
// TOGGLE RESTAURANT OPEN / CLOSED
// PATCH /api/manager/settings/toggle
// ============================================================================
// Body: { "isRestaurantOpen": true | false }
//
// When closing (false):
//   - Updates restaurant_settings.isRestaurantOpen = false
//   - Sets ALL waiter.isActive = false
//
// When opening (true):
//   - Updates restaurant_settings.isRestaurantOpen = true
//   - Waiters remain inactive — manager manually reactivates them as needed
// ============================================================================
export const toggleRestaurantOpen = async (req, res) => {
  try {
    const { isRestaurantOpen } = req.body;

    if (isRestaurantOpen === undefined || isRestaurantOpen === null) {
      return res.status(400).json({
        status: 'error',
        message: 'isRestaurantOpen (boolean) is required in the request body',
      });
    }

    if (typeof isRestaurantOpen !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isRestaurantOpen must be a boolean (true or false)',
      });
    }

    const { adminId } = req.admin;

    const result = await restaurantSettingsService.toggleRestaurantOpen(
      isRestaurantOpen,
      adminId,
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error,
      });
    }

    const response = {
      status: 'success',
      message: isRestaurantOpen
        ? 'Restaurant is now OPEN'
        : 'Restaurant is now CLOSED — all waiters have been deactivated',
      data: result.data,
    };

    // Attach warning if waiter deactivation had an issue (non-fatal)
    if (result.warning) {
      response.warning = result.warning;
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error('Toggle restaurant open error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update restaurant settings',
    });
  }
};