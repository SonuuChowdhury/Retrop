import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

// ============================================================================
// MENU MANAGEMENT SERVICE
// ============================================================================
// Handles all CRUD operations for the restaurant menu (dishes)

export const menuService = {
  // --------------------------------------------------------------------------
  // GET ALL MENU ITEMS (with optional filters)
  // --------------------------------------------------------------------------
  getAllMenuItems: async (filters = {}) => {
    try {
      let query = supabase
        .from('menu')
        .select('dishId, dishName, price, isAvailable, category, description, imageUrl, preparationTime, spicyLevel, isVegetarian, createdAt, updatedAt')
        .order('category', { ascending: true })
        .order('dishName', { ascending: true });

      // Optional filters
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

      // Extract unique non-null categories
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
      } = menuData;

      // Validate required fields
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
            spicyLevel: spicyLevel?.trim() || null,
            isVegetarian: isVegetarian ?? false,
            isAvailable: isAvailable ?? true,
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
  // UPDATE MENU ITEM (partial update supported)
  // --------------------------------------------------------------------------
  updateMenuItem: async (dishId, updates) => {
    try {
      // Verify item exists
      const { data: existing, error: fetchError } = await supabase
        .from('menu')
        .select('dishId')
        .eq('dishId', dishId)
        .maybeSingle();

      if (fetchError || !existing) {
        return { success: false, error: 'Menu item not found' };
      }

      // Build safe update object (only include fields that were provided)
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
        updatePayload.imageUrl = updates.imageUrl?.trim() || null;
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
  // DELETE MENU ITEM
  // --------------------------------------------------------------------------
  deleteMenuItem: async (dishId) => {
    try {
      // Verify item exists
      const { data: existing, error: fetchError } = await supabase
        .from('menu')
        .select('dishId, dishName')
        .eq('dishId', dishId)
        .maybeSingle();

      if (fetchError || !existing) {
        return { success: false, error: 'Menu item not found' };
      }

      const { error } = await supabase
        .from('menu')
        .delete()
        .eq('dishId', dishId);

      if (error) {
        logger.error('Failed to delete menu item', error.message);
        return { success: false, error: 'Failed to delete menu item' };
      }

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

      logger.info(`Category "${category}" availability set to ${isAvailable} (${data?.length || 0} items)`);
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

      // Group by category
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