// ============================================================================
// INVENTORY & BOM PORTAL CONTROLLER
// ============================================================================
// Handles Vendors, Stock Items, Recipes (BOM), and Purchases.
// Automatically tenant-scoped via ownerAuthMiddleware and Supabase Proxy.
// ============================================================================

import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

export const inventoryController = {

  // GET /api/owner/menu
  getMenuItems: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .order('dishName', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      logger.error('inventoryController.getMenuItems error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
    }
  },

  // ==========================================================================
  // VENDORS CRUD
  // ==========================================================================

  getVendors: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('vendor')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      logger.error('inventoryController.getVendors error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch vendors' });
    }
  },

  createVendor: async (req, res) => {
    try {
      const { name, mobile, email, gstin, address, paymentTerms } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Vendor name is required' });
      }

      const { data, error } = await supabase
        .from('vendor')
        .insert([{
          name: name.trim(),
          mobile: mobile ? mobile.trim() : null,
          email: email ? email.trim().toLowerCase() : null,
          gstin: gstin ? gstin.trim().toUpperCase() : null,
          address: address || null,
          paymentTerms: paymentTerms || null,
          isActive: true,
          createdAt: nowIST(),
          updatedAt: nowIST()
        }])
        .select()
        .single();

      if (error) {
        if (error.message.includes('mobile')) {
          return res.status(409).json({ success: false, message: 'A vendor with this mobile number already exists' });
        }
        throw error;
      }

      return res.status(201).json({ success: true, message: 'Vendor created successfully', data });
    } catch (err) {
      logger.error('inventoryController.createVendor error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to create vendor' });
    }
  },

  updateVendor: async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { name, mobile, email, gstin, address, paymentTerms, isActive } = req.body;

      const updates = { updatedAt: nowIST() };
      if (name !== undefined) updates.name = name.trim();
      if (mobile !== undefined) updates.mobile = mobile ? mobile.trim() : null;
      if (email !== undefined) updates.email = email ? email.trim().toLowerCase() : null;
      if (gstin !== undefined) updates.gstin = gstin ? gstin.trim().toUpperCase() : null;
      if (address !== undefined) updates.address = address;
      if (paymentTerms !== undefined) updates.paymentTerms = paymentTerms;
      if (isActive !== undefined) updates.isActive = Boolean(isActive);

      const { data, error } = await supabase
        .from('vendor')
        .update(updates)
        .eq('vendorId', vendorId)
        .select();

      if (error) throw error;
      if (!data || !data.length) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }

      return res.status(200).json({ success: true, message: 'Vendor updated successfully', data: data[0] });
    } catch (err) {
      logger.error('inventoryController.updateVendor error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update vendor' });
    }
  },

  deleteVendor: async (req, res) => {
    try {
      const { vendorId } = req.params;

      const { data, error } = await supabase
        .from('vendor')
        .delete()
        .eq('vendorId', vendorId)
        .select();

      if (error) throw error;
      if (!data || !data.length) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }

      return res.status(200).json({ success: true, message: 'Vendor deleted successfully' });
    } catch (err) {
      logger.error('inventoryController.deleteVendor error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to delete vendor' });
    }
  },

  // ==========================================================================
  // INVENTORY ITEMS CRUD
  // ==========================================================================

  getItems: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('inventory_item')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      logger.error('inventoryController.getItems error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch inventory items' });
    }
  },

  createItem: async (req, res) => {
    try {
      const { name, unit, category, reorderLevel, currentStock, costPerUnit } = req.body;
      if (!name || !unit) {
        return res.status(400).json({ success: false, message: 'Item name and unit are required' });
      }

      const { data, error } = await supabase
        .from('inventory_item')
        .insert([{
          name: name.trim(),
          unit: unit.trim(),
          category: category ? category.trim() : 'Uncategorized',
          reorderLevel: reorderLevel ? parseFloat(reorderLevel) : 0,
          currentStock: currentStock ? parseFloat(currentStock) : 0,
          costPerUnit: costPerUnit ? parseFloat(costPerUnit) : 0,
          isActive: true,
          createdAt: nowIST(),
          updatedAt: nowIST()
        }])
        .select()
        .single();

      if (error) {
        if (error.message.includes('name')) {
          return res.status(409).json({ success: false, message: 'An inventory item with this name already exists' });
        }
        throw error;
      }

      return res.status(201).json({ success: true, message: 'Inventory item created successfully', data });
    } catch (err) {
      logger.error('inventoryController.createItem error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to create inventory item' });
    }
  },

  updateItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { name, unit, category, reorderLevel, currentStock, costPerUnit, isActive } = req.body;

      const updates = { updatedAt: nowIST() };
      if (name !== undefined) updates.name = name.trim();
      if (unit !== undefined) updates.unit = unit.trim();
      if (category !== undefined) updates.category = category ? category.trim() : 'Uncategorized';
      if (reorderLevel !== undefined) updates.reorderLevel = parseFloat(reorderLevel);
      if (currentStock !== undefined) updates.currentStock = parseFloat(currentStock);
      if (costPerUnit !== undefined) updates.costPerUnit = parseFloat(costPerUnit);
      if (isActive !== undefined) updates.isActive = Boolean(isActive);

      const { data, error } = await supabase
        .from('inventory_item')
        .update(updates)
        .eq('itemId', itemId)
        .select();

      if (error) throw error;
      if (!data || !data.length) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      return res.status(200).json({ success: true, message: 'Inventory item updated successfully', data: data[0] });
    } catch (err) {
      logger.error('inventoryController.updateItem error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update inventory item' });
    }
  },

  deleteItem: async (req, res) => {
    try {
      const { itemId } = req.params;

      const { data, error } = await supabase
        .from('inventory_item')
        .delete()
        .eq('itemId', itemId)
        .select();

      if (error) throw error;
      if (!data || !data.length) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      return res.status(200).json({ success: true, message: 'Inventory item deleted successfully' });
    } catch (err) {
      logger.error('inventoryController.deleteItem error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to delete inventory item' });
    }
  },

  // ==========================================================================
  // RECIPES / BOM CRUD
  // ==========================================================================

  getRecipes: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('recipe')
        .select('*');

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      logger.error('inventoryController.getRecipes error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch recipes' });
    }
  },

  saveRecipe: async (req, res) => {
    try {
      const { dishId, ingredients, yieldQuantity } = req.body;
      if (!dishId || !ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ success: false, message: 'dishId and ingredients list are required' });
      }

      // Check if recipe already exists for this dish
      const { data: existingRecipe } = await supabase
        .from('recipe')
        .select('recipeId')
        .eq('dishId', dishId)
        .maybeSingle();

      let result;
      if (existingRecipe) {
        // Update
        result = await supabase
          .from('recipe')
          .update({
            ingredients,
            yieldQuantity: yieldQuantity ? parseFloat(yieldQuantity) : 1,
            updatedAt: nowIST()
          })
          .eq('recipeId', existingRecipe.recipeId)
          .select()
          .single();
      } else {
        // Insert
        result = await supabase
          .from('recipe')
          .insert([{
            dishId,
            ingredients,
            yieldQuantity: yieldQuantity ? parseFloat(yieldQuantity) : 1,
            createdAt: nowIST(),
            updatedAt: nowIST()
          }])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      return res.status(200).json({ success: true, message: 'Recipe saved successfully', data: result.data });
    } catch (err) {
      logger.error('inventoryController.saveRecipe error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to save recipe' });
    }
  },

  deleteRecipe: async (req, res) => {
    try {
      const { dishId } = req.params;

      const { data, error } = await supabase
        .from('recipe')
        .delete()
        .eq('dishId', dishId)
        .select();

      if (error) throw error;
      if (!data || !data.length) {
        return res.status(404).json({ success: false, message: 'Recipe not found' });
      }

      return res.status(200).json({ success: true, message: 'Recipe deleted successfully' });
    } catch (err) {
      logger.error('inventoryController.deleteRecipe error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to delete recipe' });
    }
  },

  // ==========================================================================
  // PURCHASES (INVOICES)
  // ==========================================================================

  getPurchases: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('purchase_entry')
        .select(`
          purchaseId, invoiceNo, totalAmount, paymentStatus, paymentMethod, purchaseDate, notes, createdAt,
          vendor: vendorId (vendorId, name)
        `)
        .order('purchaseDate', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      logger.error('inventoryController.getPurchases error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch purchase entries' });
    }
  },

  createPurchase: async (req, res) => {
    try {
      const { vendorId, invoiceNo, items, totalAmount, paymentStatus, paymentMethod, purchaseDate, notes } = req.body;
      if (!items || !Array.isArray(items) || !items.length || !totalAmount || !purchaseDate) {
        return res.status(400).json({ success: false, message: 'items, totalAmount, and purchaseDate are required' });
      }

      // Insert Purchase Entry
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchase_entry')
        .insert([{
          vendorId: vendorId || null,
          invoiceNo: invoiceNo || null,
          items,
          totalAmount: parseFloat(totalAmount),
          paymentStatus: paymentStatus || 'unpaid',
          paymentMethod: paymentMethod || null,
          purchaseDate,
          notes: notes || null,
          createdAt: nowIST(),
          updatedAt: nowIST()
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Update Inventory stock values and costs dynamically
      for (const item of items) {
        const { itemId, quantity, unitPrice } = item;
        if (!itemId || !quantity) continue;

        // Fetch current item to get existing stock
        const { data: invItem, error: fetchError } = await supabase
          .from('inventory_item')
          .select('currentStock')
          .eq('itemId', itemId)
          .maybeSingle();

        if (fetchError || !invItem) {
          logger.warn(`Failed to fetch inventory item ${itemId} during purchase update`);
          continue;
        }

        const newStock = parseFloat(invItem.currentStock || 0) + parseFloat(quantity);
        
        // Update stock level and last cost per unit
        await supabase
          .from('inventory_item')
          .update({
            currentStock: newStock,
            costPerUnit: parseFloat(unitPrice || 0),
            updatedAt: nowIST()
          })
          .eq('itemId', itemId);
      }

      return res.status(201).json({ success: true, message: 'Purchase entry created & stock levels updated successfully', data: purchase });
    } catch (err) {
      logger.error('inventoryController.createPurchase error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to log purchase entry' });
    }
  }
};
