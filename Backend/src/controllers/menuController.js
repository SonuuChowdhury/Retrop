import { menuService } from '../services/menuService.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// MENU CONTROLLER
// ============================================================================

// ============================================================================
// GET ALL MENU ITEMS
// ============================================================================
export const getAllMenuItems = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      isAvailable: req.query.isAvailable !== undefined
        ? req.query.isAvailable === 'true'
        : undefined,
      isVegetarian: req.query.isVegetarian !== undefined
        ? req.query.isVegetarian === 'true'
        : undefined,
      search: req.query.search,
    };

    const result = await menuService.getAllMenuItems(filters);
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get all menu items error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch menu items' });
  }
};

// ============================================================================
// GET SINGLE MENU ITEM BY ID
// ============================================================================
export const getMenuItemById = async (req, res) => {
  try {
    const { dishId } = req.params;

    const result = await menuService.getMenuItemById(dishId);
    if (!result.success) {
      return res.status(404).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get menu item by ID error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch menu item' });
  }
};

// ============================================================================
// GET ALL CATEGORIES
// ============================================================================
export const getMenuCategories = async (req, res) => {
  try {
    const result = await menuService.getCategories();
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get menu categories error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch categories' });
  }
};

// ============================================================================
// ADD NEW MENU ITEM
// ============================================================================
export const addMenuItem = async (req, res) => {
  try {
    const {
      dishName,
      price,
      category,
      description,
      imageUrl,
      preparationTime,
      spicyLevel,
      isVegetarian,
      isAvailable,
    } = req.body;

    if (!dishName || price === undefined || price === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Dish name and price are required',
      });
    }

    const result = await menuService.addMenuItem({
      dishName,
      price,
      category,
      description,
      imageUrl,
      preparationTime,
      spicyLevel,
      isVegetarian,
      isAvailable,
    });

    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    res.status(201).json({
      status: 'success',
      message: 'Menu item added successfully',
      data: result.data,
    });
  } catch (error) {
    logger.error('Add menu item error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to add menu item' });
  }
};

// ============================================================================
// UPDATE MENU ITEM
// ============================================================================
export const updateMenuItem = async (req, res) => {
  try {
    const { dishId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No update fields provided',
      });
    }

    const result = await menuService.updateMenuItem(dishId, updates);
    if (!result.success) {
      return res.status(result.error === 'Menu item not found' ? 404 : 400).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Menu item updated successfully',
      data: result.data,
    });
  } catch (error) {
    logger.error('Update menu item error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to update menu item' });
  }
};

// ============================================================================
// DELETE MENU ITEM
// ============================================================================
export const deleteMenuItem = async (req, res) => {
  try {
    const { dishId } = req.params;

    const result = await menuService.deleteMenuItem(dishId);
    if (!result.success) {
      return res.status(result.error === 'Menu item not found' ? 404 : 400).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    logger.error('Delete menu item error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to delete menu item' });
  }
};

// ============================================================================
// TOGGLE MENU ITEM AVAILABILITY
// ============================================================================
export const toggleMenuItemAvailability = async (req, res) => {
  try {
    const { dishId } = req.params;
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'isAvailable field is required',
      });
    }

    const result = await menuService.toggleMenuItemAvailability(dishId, isAvailable);
    if (!result.success) {
      return res.status(result.error === 'Menu item not found' ? 404 : 400).json({
        status: 'error',
        message: result.error,
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Menu item ${isAvailable ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    logger.error('Toggle menu item availability error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to update availability' });
  }
};

// ============================================================================
// TOGGLE ENTIRE CATEGORY AVAILABILITY
// ============================================================================
export const toggleCategoryAvailability = async (req, res) => {
  try {
    const { category } = req.params;
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'isAvailable field is required',
      });
    }

    const result = await menuService.toggleCategoryAvailability(category, isAvailable);
    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    res.status(200).json({
      status: 'success',
      message: `Category "${category}" ${isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: result.data,
    });
  } catch (error) {
    logger.error('Toggle category availability error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to update category' });
  }
};

// ============================================================================
// GET MENU STATS
// ============================================================================
export const getMenuStats = async (req, res) => {
  try {
    const result = await menuService.getMenuStats();
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    logger.error('Get menu stats error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch menu statistics' });
  }
};