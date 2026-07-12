import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

// ============================================================================
// MENU MANAGEMENT SERVICE
// ============================================================================
// Handles all CRUD operations for the restaurant menu (dishes)
// Includes Supabase Storage integration for dish photos.

// ============================================================================
// INTERNAL HELPERS: Supabase Storage for menu images
// ============================================================================

const BUCKET = 'menu-images';

/**
 * Extracts the storage path from a full Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/menu-images/abc/img.jpg"
 *   → "abc/img.jpg"
 * Returns null if the URL doesn't belong to our bucket.
 */
const extractStoragePath = (url) => {
  if (!url || typeof url !== 'string') return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
};

/**
 * Deletes an image from Supabase Storage by its public URL.
 * Silent on failure (logs warning but does not throw).
 */
const deleteImageFromStorage = async (imageUrl) => {
  try {
    const path = extractStoragePath(imageUrl);
    if (!path) return; // Not our image — skip

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      logger.warn(`Failed to delete image from storage: ${path}`, error.message);
    } else {
      logger.info(`Image deleted from storage: ${path}`);
    }
  } catch (err) {
    logger.warn('deleteImageFromStorage error', err.message);
  }
};

/**
 * Deletes ALL images in a dish's folder (used when the dish is deleted).
 * Folder path: {dishId}/
 */
const deleteDishImageFolder = async (dishId) => {
  try {
    // List all files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list(dishId);

    if (listError || !files || files.length === 0) return;

    const paths = files.map((f) => `${dishId}/${f.name}`);
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) {
      logger.warn(`Failed to delete image folder for dish ${dishId}`, error.message);
    } else {
      logger.info(`Image folder deleted for dish: ${dishId} (${paths.length} files)`);
    }
  } catch (err) {
    logger.warn('deleteDishImageFolder error', err.message);
  }
};

/**
 * Uploads an image buffer/blob to Supabase Storage.
 * Returns the public URL on success, or throws on failure.
 *
 * @param {string}       dishId    - UUID of the dish (used as folder)
 * @param {Buffer|Uint8Array} fileBuffer - Raw image bytes
 * @param {string}       mimeType  - e.g. "image/jpeg"
 * @param {string}       originalName - Original filename (for extension)
 * @returns {string} Public URL of the uploaded image
 */
const uploadImageToStorage = async (dishId, fileBuffer, mimeType, originalName) => {
  // Build a unique filename using timestamp + original extension
  const ext = originalName?.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${Date.now()}.${ext}`;
  const storagePath = `${dishId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    logger.error('Failed to upload image to Supabase storage', uploadError.message);
    throw new Error('Image upload failed: ' + uploadError.message);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return urlData.publicUrl;
};

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const menuService = {
  // --------------------------------------------------------------------------
  // GET ALL MENU ITEMS (with optional filters)
  // --------------------------------------------------------------------------
  getAllMenuItems: async (filters = {}) => {
    try {
      let query = supabase
        .from('menu')
        .select(
          'dishId, dishName, price, isAvailable, category, description, imageUrl, preparationTime, spicyLevel, isVegetarian, hsnCode, createdAt, updatedAt'
        )
        .order('category', { ascending: true })
        .order('dishName', { ascending: true });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.isAvailable !== undefined) {
        query = query.eq('isAvailable', filters.isAvailable);
      }
      if (filters.isVegetarian !== undefined) {
        query = query.eq('isVegetarian', filters.isVegetarian);
      }
      if (filters.search) {
        query = query.ilike('dishName', `%${filters.search}%`);
      }

      const { data: menuItems, error } = await query;

      if (error) {
        logger.error('Failed to fetch menu items', error.message);
        return { success: false, error: 'Failed to fetch menu items' };
      }

      return { success: true, data: menuItems };
    } catch (error) {
      logger.error('Menu fetch error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // GET SINGLE MENU ITEM BY ID
  // --------------------------------------------------------------------------
  getMenuItemById: async (dishId) => {
    try {
      const { data: dish, error } = await supabase
        .from('menu')
        .select('*')
        .eq('dishId', dishId)
        .maybeSingle();

      if (error || !dish) {
        logger.error('Failed to fetch menu item', error?.message);
        return { success: false, error: 'Menu item not found' };
      }

      return { success: true, data: dish };
    } catch (error) {
      logger.error('Menu item fetch error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // GET ALL CATEGORIES (distinct list)
  // --------------------------------------------------------------------------
  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('category')
        .order('category', { ascending: true });

      if (error) {
        logger.error('Failed to fetch categories', error.message);
        return { success: false, error: 'Failed to fetch categories' };
      }

      const categories = [...new Set(data.map((item) => item.category).filter(Boolean))];
      return { success: true, data: categories };
    } catch (error) {
      logger.error('Categories fetch error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // ADD NEW MENU ITEM
  // --------------------------------------------------------------------------
  addMenuItem: async (menuData) => {
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
        hsnCode,
      } = menuData;

      if (!dishName || price === undefined || price === null) {
        return { success: false, error: 'Dish name and price are required' };
      }

      if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return { success: false, error: 'Price must be a valid non-negative number' };
      }

      const { data: dish, error } = await supabase
        .from('menu')
        .insert([
          {
            dishName: dishName.trim(),
            price: parseFloat(price),
            category: category?.trim() || null,
            description: description?.trim() || null,
            imageUrl: imageUrl?.trim() || null,
            preparationTime: preparationTime ? parseInt(preparationTime) : 15,
            spicyLevel: spicyLevel !== undefined && spicyLevel !== null ? String(spicyLevel).trim() || null : null,
            isVegetarian: isVegetarian ?? false,
            isAvailable: isAvailable ?? true,
            hsnCode: hsnCode?.trim() || null,
            createdAt: nowIST(),
            updatedAt: nowIST(),
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('Failed to add menu item', error.message);
        return { success: false, error: 'Failed to add menu item' };
      }

      logger.info(`New menu item added: ${dish.dishId} - ${dish.dishName}`);
      return { success: true, data: dish };
    } catch (error) {
      logger.error('Menu item addition error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // UPLOAD / REPLACE DISH IMAGE
  // --------------------------------------------------------------------------
  // Accepts a raw buffer + mime type. The controller is responsible for
  // parsing multipart data (using express built-in or multer).
  // If the dish already has an image stored in our bucket, it is deleted first.
  uploadDishImage: async (dishId, fileBuffer, mimeType, originalName) => {
    try {
      // 1. Fetch current dish to check for existing image
      const { data: existing, error: fetchError } = await supabase
        .from('menu')
        .select('dishId, imageUrl')
        .eq('dishId', dishId)
        .maybeSingle();

      if (fetchError || !existing) {
        return { success: false, error: 'Menu item not found' };
      }

      // 2. Delete old image from storage if it was in our bucket
      if (existing.imageUrl) {
        await deleteImageFromStorage(existing.imageUrl);
      }

      // 3. Upload new image
      const publicUrl = await uploadImageToStorage(dishId, fileBuffer, mimeType, originalName);

      // 4. Update imageUrl in DB
      const { data: dish, error: updateError } = await supabase
        .from('menu')
        .update({ imageUrl: publicUrl, updatedAt: nowIST() })
        .eq('dishId', dishId)
        .select()
        .single();

      if (updateError) {
        // Rollback: try to delete the just-uploaded image
        await deleteImageFromStorage(publicUrl);
        logger.error('Failed to update imageUrl in DB', updateError.message);
        return { success: false, error: 'Failed to save image URL' };
      }

      logger.info(`Dish image uploaded for: ${dishId} → ${publicUrl}`);
      return { success: true, data: { imageUrl: publicUrl, dish } };
    } catch (error) {
      logger.error('Dish image upload error', error.message);
      return { success: false, error: error.message };
    }
  },

  // --------------------------------------------------------------------------
  // DELETE DISH IMAGE (only, not the dish itself)
  // --------------------------------------------------------------------------
  deleteDishImage: async (dishId) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('menu')
        .select('dishId, imageUrl')
        .eq('dishId', dishId)
        .maybeSingle();

      if (fetchError || !existing) {
        return { success: false, error: 'Menu item not found' };
      }

      if (!existing.imageUrl) {
        return { success: false, error: 'No image to delete' };
      }

      // Delete from storage
      await deleteImageFromStorage(existing.imageUrl);

      // Clear imageUrl in DB
      const { error: updateError } = await supabase
        .from('menu')
        .update({ imageUrl: null, updatedAt: nowIST() })
        .eq('dishId', dishId);

      if (updateError) {
        logger.error('Failed to clear imageUrl in DB', updateError.message);
        return { success: false, error: 'Failed to clear image reference' };
      }

      logger.info(`Dish image deleted for: ${dishId}`);
      return { success: true };
    } catch (error) {
      logger.error('Dish image deletion error', error.message);
      return { success: false, error: error.message };
    }
  },

  // --------------------------------------------------------------------------
  // UPDATE MENU ITEM (partial update supported)
  // --------------------------------------------------------------------------
  // If imageUrl is explicitly set to null/empty, the old storage image is deleted.
  // If imageUrl is changed to a new external URL, old storage image is deleted.
  // For actual file uploads, use uploadDishImage() instead.
  updateMenuItem: async (dishId, updates) => {
    try {
      // Fetch existing to compare imageUrl
      const { data: existing, error: fetchError } = await supabase
        .from('menu')
        .select('dishId, imageUrl')
        .eq('dishId', dishId)
        .maybeSingle();

      if (fetchError || !existing) {
        return { success: false, error: 'Menu item not found' };
      }

      const updatePayload = { updatedAt: nowIST() };

      if (updates.dishName !== undefined) {
        if (!updates.dishName.trim()) {
          return { success: false, error: 'Dish name cannot be empty' };
        }
        updatePayload.dishName = updates.dishName.trim();
      }
      if (updates.price !== undefined) {
        if (isNaN(parseFloat(updates.price)) || parseFloat(updates.price) < 0) {
          return { success: false, error: 'Price must be a valid non-negative number' };
        }
        updatePayload.price = parseFloat(updates.price);
      }
      if (updates.category !== undefined) {
        updatePayload.category = updates.category?.trim() || null;
      }
      if (updates.description !== undefined) {
        updatePayload.description = updates.description?.trim() || null;
      }
      if (updates.imageUrl !== undefined) {
        const newUrl = updates.imageUrl?.trim() || null;
        // If imageUrl is changing AND old was in our bucket → delete old
        if (existing.imageUrl && existing.imageUrl !== newUrl) {
          await deleteImageFromStorage(existing.imageUrl);
        }
        updatePayload.imageUrl = newUrl;
      }
      if (updates.preparationTime !== undefined) {
        updatePayload.preparationTime = parseInt(updates.preparationTime);
      }
      if (updates.spicyLevel !== undefined) {
        updatePayload.spicyLevel = updates.spicyLevel?.trim() || null;
      }
      if (updates.isVegetarian !== undefined) {
        updatePayload.isVegetarian = Boolean(updates.isVegetarian);
      }
      if (updates.isAvailable !== undefined) {
        updatePayload.isAvailable = Boolean(updates.isAvailable);
      }

      const { data: dish, error } = await supabase
        .from('menu')
        .update(updatePayload)
        .eq('dishId', dishId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update menu item', error.message);
        return { success: false, error: 'Failed to update menu item' };
      }

      logger.info(`Menu item updated: ${dishId}`);
      return { success: true, data: dish };
    } catch (error) {
      logger.error('Menu item update error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // DELETE MENU ITEM (also deletes its image from storage)
  // --------------------------------------------------------------------------
  deleteMenuItem: async (dishId) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('menu')
        .select('dishId, dishName, imageUrl')
        .eq('dishId', dishId)
        .maybeSingle();

      if (fetchError || !existing) {
        return { success: false, error: 'Menu item not found' };
      }

      // Delete the dish record first
      const { error } = await supabase.from('menu').delete().eq('dishId', dishId);

      if (error) {
        logger.error('Failed to delete menu item', error.message);
        return { success: false, error: 'Failed to delete menu item' };
      }

      // After successful DB delete, clean up storage
      // deleteDishImageFolder handles all images in {dishId}/ folder
      await deleteDishImageFolder(dishId);

      logger.info(`Menu item deleted: ${dishId} - ${existing.dishName}`);
      return { success: true };
    } catch (error) {
      logger.error('Menu item deletion error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // TOGGLE MENU ITEM AVAILABILITY
  // --------------------------------------------------------------------------
  toggleMenuItemAvailability: async (dishId, isAvailable) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('menu')
        .select('dishId')
        .eq('dishId', dishId)
        .maybeSingle();

      if (fetchError || !existing) {
        return { success: false, error: 'Menu item not found' };
      }

      const { error } = await supabase
        .from('menu')
        .update({ isAvailable: Boolean(isAvailable), updatedAt: nowIST() })
        .eq('dishId', dishId);

      if (error) {
        logger.error('Failed to toggle menu item availability', error.message);
        return { success: false, error: 'Failed to update availability' };
      }

      logger.info(`Menu item ${dishId} availability set to ${isAvailable}`);
      return { success: true };
    } catch (error) {
      logger.error('Menu item availability toggle error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // BULK TOGGLE AVAILABILITY BY CATEGORY
  // --------------------------------------------------------------------------
  toggleCategoryAvailability: async (category, isAvailable) => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .update({ isAvailable: Boolean(isAvailable), updatedAt: nowIST() })
        .eq('category', category)
        .select('dishId');

      if (error) {
        logger.error('Failed to toggle category availability', error.message);
        return { success: false, error: 'Failed to update category availability' };
      }

      logger.info(
        `Category "${category}" availability set to ${isAvailable} (${data?.length || 0} items)`
      );
      return { success: true, data: { updatedCount: data?.length || 0 } };
    } catch (error) {
      logger.error('Category availability toggle error', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // GET MENU STATS (for manager dashboard)
  // --------------------------------------------------------------------------
  getMenuStats: async () => {
    try {
      const { data: allItems, error } = await supabase
        .from('menu')
        .select('dishId, isAvailable, category, isVegetarian');

      if (error) {
        logger.error('Failed to fetch menu stats', error.message);
        return { success: false, error: 'Failed to fetch menu statistics' };
      }

      const totalItems = allItems?.length || 0;
      const availableItems = allItems?.filter((i) => i.isAvailable).length || 0;
      const unavailableItems = totalItems - availableItems;
      const vegetarianItems = allItems?.filter((i) => i.isVegetarian).length || 0;

      const categoryBreakdown = {};
      allItems?.forEach((item) => {
        const cat = item.category || 'Uncategorized';
        if (!categoryBreakdown[cat]) {
          categoryBreakdown[cat] = { total: 0, available: 0 };
        }
        categoryBreakdown[cat].total += 1;
        if (item.isAvailable) categoryBreakdown[cat].available += 1;
      });

      return {
        success: true,
        data: {
          totalItems,
          availableItems,
          unavailableItems,
          vegetarianItems,
          nonVegetarianItems: totalItems - vegetarianItems,
          categoryBreakdown,
        },
      };
    } catch (error) {
      logger.error('Menu stats fetch error', error.message);
      throw error;
    }
  },
};