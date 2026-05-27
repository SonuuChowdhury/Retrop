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
      isAvailable:
        req.query.isAvailable !== undefined
          ? req.query.isAvailable === 'true'
          : undefined,
      isVegetarian:
        req.query.isVegetarian !== undefined
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
// UPLOAD / REPLACE DISH IMAGE
// ============================================================================
// Accepts multipart/form-data with a single "image" field.
// Uses Express's built-in raw body parsing — no multer needed.
// The frontend must POST with Content-Type: multipart/form-data.
//
// Implementation: we use the express raw body (req.body is a Buffer when
// Content-Type is set to the image MIME type directly), OR we parse
// multipart manually. The simplest approach that avoids adding multer
// is to accept the raw binary body when Content-Type is an image type,
// OR accept base64-encoded image in JSON body.
//
// SUPPORTED UPLOAD METHODS:
// A) Direct binary: Content-Type: image/jpeg (or png/webp/gif)
//    Body: raw binary image bytes
// B) Base64 JSON: Content-Type: application/json
//    Body: { "image": "<base64string>", "mimeType": "image/jpeg", "fileName": "photo.jpg" }
// ============================================================================
export const uploadDishImage = async (req, res) => {
  try {
    const { dishId } = req.params;

    let fileBuffer;
    let mimeType;
    let originalName;

    const contentType = req.headers['content-type'] || '';

    if (contentType.startsWith('image/')) {
      // Method A: Raw binary upload
      // Express must be configured with express.raw({ type: 'image/*' }) — see index.js
      fileBuffer = req.body; // Buffer
      mimeType = contentType.split(';')[0].trim();
      originalName = req.headers['x-file-name'] || `image.${mimeType.split('/')[1] || 'jpg'}`;

      if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Empty or invalid image body',
        });
      }
    } else if (contentType.includes('application/json')) {
      // Method B: Base64 JSON
      const { image, mimeType: mt, fileName } = req.body;

      if (!image) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing "image" field (base64 encoded image)',
        });
      }

      mimeType = mt || 'image/jpeg';
      originalName = fileName || `image.${mimeType.split('/')[1] || 'jpg'}`;

      // Validate mime type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid image type. Allowed: jpeg, png, webp, gif',
        });
      }

      // Decode base64
      try {
        // Strip data URI prefix if present: "data:image/jpeg;base64,..."
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        fileBuffer = Buffer.from(base64Data, 'base64');
      } catch {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid base64 image data',
        });
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Empty image data',
        });
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message:
          'Unsupported Content-Type. Use "image/jpeg" for raw binary, or "application/json" for base64.',
      });
    }

    // Validate file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      return res.status(400).json({
        status: 'error',
        message: 'Image too large. Maximum size is 5MB.',
      });
    }

    const result = await menuService.uploadDishImage(dishId, fileBuffer, mimeType, originalName);

    if (!result.success) {
      const status = result.error === 'Menu item not found' ? 404 : 400;
      return res.status(status).json({ status: 'error', message: result.error });
    }

    res.status(200).json({
      status: 'success',
      message: 'Dish image uploaded successfully',
      data: { imageUrl: result.data.imageUrl },
    });
  } catch (error) {
    logger.error('Upload dish image error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to upload image' });
  }
};

// ============================================================================
// DELETE DISH IMAGE
// ============================================================================
export const deleteDishImage = async (req, res) => {
  try {
    const { dishId } = req.params;

    const result = await menuService.deleteDishImage(dishId);

    if (!result.success) {
      const status = result.error === 'Menu item not found' ? 404 : 400;
      return res.status(status).json({ status: 'error', message: result.error });
    }

    res.status(200).json({
      status: 'success',
      message: 'Dish image deleted successfully',
    });
  } catch (error) {
    logger.error('Delete dish image error', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to delete image' });
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
      return res
        .status(result.error === 'Menu item not found' ? 404 : 400)
        .json({ status: 'error', message: result.error });
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
      return res
        .status(result.error === 'Menu item not found' ? 404 : 400)
        .json({ status: 'error', message: result.error });
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
      return res
        .status(result.error === 'Menu item not found' ? 404 : 400)
        .json({ status: 'error', message: result.error });
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