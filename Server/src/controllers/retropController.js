// ============================================================================
// RETROP CONTROLLER
// ============================================================================
// All Retrop super admin API endpoints.
// Routes are prefixed with /api/retrop/*
// Protected by retropAuth middleware (except /auth/login and /auth/refresh)
// ============================================================================

import { retropAuthService } from '../services/retropAuthService.js';
import { productKeyService } from '../services/productKeyService.js';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';
import bcrypt from 'bcryptjs';

// ── Helper: create default settings + info rows for a new restaurant ──────────
async function bootstrapRestaurant(restaurantId, businessName) {
  await supabase.from('restaurant_settings').insert([{
    restaurantId,
    isRestaurantOpen: false,
    updatedAt: nowIST(),
  }]);

  await supabase.from('restaurant_info').insert([{
    restaurantId,
    restaurantName: businessName,
    createdAt: nowIST(),
    updatedAt: nowIST(),
  }]);
}

// ── Helper: create default manager account for a new restaurant ───────────────
async function createDefaultManager(restaurantId, ownerName, ownerMobile, ownerEmail) {
  // Default password: mobile number (they should change on first login)
  const hashedPassword = await bcrypt.hash(ownerMobile, 10);
  await supabase.from('admin').insert([{
    restaurantId,
    mobile: ownerMobile,
    password: hashedPassword,
    name: ownerName,
    role: 'owner', // marked as owner
    email: ownerEmail ? ownerEmail.trim() : null,
    isActive: true,
    createdAt: nowIST(),
    updatedAt: nowIST(),
  }]);
}

export const retropController = {

  // ==========================================================================
  // AUTH
  // ==========================================================================

  // POST /api/retrop/auth/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
      }

      const result = await retropAuthService.login(
        email,
        password,
        req.ip,
        req.headers['user-agent']
      );

      if (!result.success) {
        return res.status(result.code || 401).json({ success: false, message: result.error });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      logger.error('retropController.login error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // POST /api/retrop/auth/refresh
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token required' });
      }

      const result = await retropAuthService.refresh(refreshToken);
      if (!result.success) {
        return res.status(result.code || 401).json({ success: false, message: result.error });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      logger.error('retropController.refreshToken error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // POST /api/retrop/auth/logout
  logout: async (req, res) => {
    try {
      await retropAuthService.logout(req.retropAdmin.adminId);
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      logger.error('retropController.logout error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/retrop/auth/me
  me: async (req, res) => {
    return res.status(200).json({ success: true, data: req.retropAdmin });
  },

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  // GET /api/retrop/dashboard
  getDashboard: async (req, res) => {
    try {
      const [
        { count: totalRestaurants },
        { count: activeRestaurants },
        { count: activeKeys },
        { data: recentRestaurants },
      ] = await Promise.all([
        supabase.from('retrop_restaurant').select('*', { count: 'exact', head: true }),
        supabase.from('retrop_restaurant').select('*', { count: 'exact', head: true }).eq('isActive', true),
        supabase.from('product_key').select('*', { count: 'exact', head: true }).eq('isActive', true),
        supabase.from('retrop_restaurant')
          .select('restaurantId, businessName, ownerName, ownerMobile, isActive, createdAt')
          .order('createdAt', { ascending: false })
          .limit(5),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalRestaurants: totalRestaurants || 0,
            activeRestaurants: activeRestaurants || 0,
            inactiveRestaurants: (totalRestaurants || 0) - (activeRestaurants || 0),
            activeKeys: activeKeys || 0,
          },
          recentRestaurants: recentRestaurants || [],
        },
      });
    } catch (err) {
      logger.error('retropController.getDashboard error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // ==========================================================================
  // RESTAURANT MANAGEMENT
  // ==========================================================================

  // POST /api/retrop/restaurants
  createRestaurant: async (req, res) => {
    try {
      const { businessName, ownerName, gender, ownerMobile, ownerEmail } = req.body;

      if (!businessName || !ownerName || !ownerMobile) {
        return res.status(400).json({
          success: false,
          message: 'businessName, ownerName, and ownerMobile are required',
        });
      }

      // Create restaurant registry entry
      const { data: restaurant, error } = await supabase
        .from('retrop_restaurant')
        .insert([{
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          gender: gender || null,
          ownerMobile: ownerMobile.trim(),
          isActive: true,
          createdAt: nowIST(),
          updatedAt: nowIST(),
        }])
        .select()
        .single();

      if (error) {
        if (error.message.includes('ownerMobile')) {
          return res.status(409).json({ success: false, message: 'A restaurant with this mobile number already exists' });
        }
        logger.error('Create restaurant DB error', error.message);
        return res.status(500).json({ success: false, message: 'Failed to create restaurant' });
      }

      // Bootstrap: create settings, info, and default owner admin account
      await bootstrapRestaurant(restaurant.restaurantId, businessName);
      await createDefaultManager(restaurant.restaurantId, ownerName, ownerMobile, ownerEmail);

      logger.info(`New restaurant created: ${businessName} (${restaurant.restaurantId})`);

      return res.status(201).json({
        success: true,
        data: restaurant,
        message: `Restaurant created. Default manager login: mobile=${ownerMobile}, password=${ownerMobile}`,
      });
    } catch (err) {
      logger.error('retropController.createRestaurant error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/retrop/restaurants
  listRestaurants: async (req, res) => {
    try {
      const { data: restaurants, error } = await supabase
        .from('retrop_restaurant')
        .select(`
          restaurantId, businessName, ownerName, gender, ownerMobile, isActive, createdAt,
          product_key (keyId, keyValue, isActive, createdAt)
        `)
        .order('createdAt', { ascending: false });

      if (error) {
        logger.error('List restaurants error', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch restaurants' });
      }

      // Attach active key info for each restaurant
      const enriched = restaurants.map(r => {
        const keys = r.product_key || [];
        return {
          ...r,
          keys,
          activeKey: keys.find(k => k.isActive) || null,
          keyCount: keys.length,
          product_key: undefined, // strip raw array from response
        };
      });

      return res.status(200).json({ success: true, data: enriched });
    } catch (err) {
      logger.error('retropController.listRestaurants error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/retrop/restaurants/:restaurantId
  getRestaurant: async (req, res) => {
    try {
      const { restaurantId } = req.params;

      const { data, error } = await supabase
        .from('retrop_restaurant')
        .select(`
          *,
          product_key (keyId, keyValue, isActive, createdAt, updatedAt)
        `)
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      return res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.getRestaurant error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // PATCH /api/retrop/restaurants/:restaurantId
  updateRestaurant: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { businessName, ownerName, gender, ownerMobile } = req.body;

      const updates = {};
      if (businessName)  updates.businessName = businessName.trim();
      if (ownerName)     updates.ownerName    = ownerName.trim();
      if (gender)        updates.gender       = gender;
      if (ownerMobile)   updates.ownerMobile  = ownerMobile.trim();
      updates.updatedAt = nowIST();

      const { data, error } = await supabase
        .from('retrop_restaurant')
        .update(updates)
        .eq('restaurantId', restaurantId)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      logger.info(`Restaurant updated: ${restaurantId}`);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.updateRestaurant error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // PATCH /api/retrop/restaurants/:restaurantId/status
  toggleRestaurantStatus: async (req, res) => {
    try {
      const { restaurantId } = req.params;

      const { data: current } = await supabase
        .from('retrop_restaurant')
        .select('isActive, businessName')
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (!current) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      const newStatus = !current.isActive;

      const { data, error } = await supabase
        .from('retrop_restaurant')
        .update({ isActive: newStatus, updatedAt: nowIST() })
        .eq('restaurantId', restaurantId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to update status' });
      }

      logger.info(`Restaurant ${restaurantId} (${current.businessName}) status set to isActive=${newStatus}`);
      return res.status(200).json({
        success: true,
        data,
        message: `Restaurant ${newStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (err) {
      logger.error('retropController.toggleRestaurantStatus error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
  
  // DELETE /api/retrop/restaurants/:restaurantId
  deleteRestaurant: async (req, res) => {
    try {
      const { restaurantId } = req.params;

      // 1. Clean up menu images from Supabase Storage
      try {
        const { data: menuItems } = await supabase
          .from('menu')
          .select('dishId')
          .eq('restaurantId', restaurantId);

        if (menuItems && menuItems.length > 0) {
          for (const item of menuItems) {
            const { data: files } = await supabase.storage
              .from('menu-images')
              .list(item.dishId);

            if (files && files.length > 0) {
              const paths = files.map((f) => `${item.dishId}/${f.name}`);
              await supabase.storage.from('menu-images').remove(paths);
              logger.info(`Storage cleanup: deleted images for dish ${item.dishId}`);
            }
          }
        }
      } catch (storageErr) {
        logger.warn('Failed to delete storage images during restaurant delete', storageErr.message);
      }

      // 2. Explicit DB cleanup to ensure no orphaned/set-null data remains in tenant tables
      const tablesToDelete = [
        'login_attempt',
        'admin_session',
        'manager_session',
        'waiter_session',
        'kitchen_session',
        'waiter_daily_stats',
        'restaurant_settings',
        'restaurant_info',
        'product_key',
        'restaurant_table',
        'menu',
        'orders',
        'customer',
        'admin',
        'waiter',
        'kitchen'
      ];

      for (const table of tablesToDelete) {
        try {
          const { error: delErr } = await supabase
            .from(table)
            .delete()
            .eq('restaurantId', restaurantId);
          
          if (delErr) {
            logger.warn(`Manual delete from table ${table} failed or partial`, delErr.message);
          }
        } catch (tableErr) {
          logger.warn(`Error deleting from table ${table}`, tableErr.message);
        }
      }

      // 3. Delete the restaurant registry itself
      const { data, error } = await supabase
        .from('retrop_restaurant')
        .delete()
        .eq('restaurantId', restaurantId)
        .select()
        .maybeSingle();

      if (error) {
        logger.error('Delete restaurant DB error', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete restaurant registry' });
      }

      if (!data) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      logger.info(`Restaurant deleted: ${data.businessName} (${restaurantId})`);
      return res.status(200).json({
        success: true,
        message: 'Restaurant and all associated tenant data deleted successfully',
      });
    } catch (err) {
      logger.error('retropController.deleteRestaurant error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // ==========================================================================
  // PRODUCT KEY MANAGEMENT
  // ==========================================================================

  // POST /api/retrop/keys/generate/:restaurantId
  generateKey: async (req, res) => {
    try {
      const { restaurantId } = req.params;

      // Verify restaurant exists
      const { data: restaurant } = await supabase
        .from('retrop_restaurant')
        .select('restaurantId, businessName')
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      const result = await productKeyService.generateKey(restaurantId);
      if (!result.success) {
        return res.status(result.code || 500).json({ success: false, message: result.error });
      }

      logger.info(`Key generated for ${restaurant.businessName}: ${result.data.keyValue}`);
      return res.status(201).json({
        success: true,
        data: result.data,
        message: 'Product key generated. Copy it now — it will be masked in future views.',
      });
    } catch (err) {
      logger.error('retropController.generateKey error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // PATCH /api/retrop/keys/:keyId/toggle
  toggleKey: async (req, res) => {
    try {
      const { keyId } = req.params;
      const result = await productKeyService.toggleKey(keyId);

      if (!result.success) {
        return res.status(result.code || 500).json({ success: false, message: result.error });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
        message: `Key ${result.data.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (err) {
      logger.error('retropController.toggleKey error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // DELETE /api/retrop/keys/:keyId
  deleteKey: async (req, res) => {
    try {
      const { keyId } = req.params;

      const { data, error } = await supabase
        .from('product_key')
        .delete()
        .eq('keyId', keyId)
        .select()
        .maybeSingle();

      if (error) {
        logger.error('Delete key DB error', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete key' });
      }

      if (!data) {
        return res.status(404).json({ success: false, message: 'Key not found' });
      }

      logger.info(`Product key deleted: ${data.keyValue} (${keyId})`);
      return res.status(200).json({
        success: true,
        message: 'Product key deleted successfully',
      });
    } catch (err) {
      logger.error('retropController.deleteKey error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/retrop/keys/:restaurantId
  getRestaurantKeys: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const result = await productKeyService.getKeysForRestaurant(restaurantId);

      if (!result.success) {
        return res.status(500).json({ success: false, message: result.error });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      logger.error('retropController.getRestaurantKeys error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/retrop/keys
  listAllKeys: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('product_key')
        .select(`
          keyId, keyValue, isActive, createdAt,
          retrop_restaurant (restaurantId, businessName, ownerName)
        `)
        .order('createdAt', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch keys' });
      }

      return res.status(200).json({ success: true, data: data });
    } catch (err) {
      logger.error('retropController.listAllKeys error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/retrop/restaurants/:restaurantId/admins
  getRestaurantAdmins: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { data, error } = await supabase
        .from('admin')
        .select('adminId, name, mobile, email, role, isActive, createdAt')
        .eq('restaurantId', restaurantId);

      if (error) {
        logger.error('Get restaurant admins DB error', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch admins' });
      }

      return res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.getRestaurantAdmins error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // POST /api/retrop/restaurants/:restaurantId/admins
  addRestaurantAdmin: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { name, mobile, email, role, password } = req.body;

      if (!name || !mobile || !role || !password) {
        return res.status(400).json({ success: false, message: 'name, mobile, role, and password are required' });
      }

      if (role !== 'owner' && role !== 'manager') {
        return res.status(400).json({ success: false, message: 'Role must be either owner or manager' });
      }

      // Check current admins count and roles
      const { data: existingAdmins, error: fetchError } = await supabase
        .from('admin')
        .select('adminId, role')
        .eq('restaurantId', restaurantId);

      if (fetchError) {
        logger.error('Fetch existing admins error', fetchError.message);
        return res.status(500).json({ success: false, message: 'Failed to check current admins limit' });
      }

      if (existingAdmins && existingAdmins.length >= 2) {
        return res.status(400).json({ success: false, message: 'A restaurant can have at most 2 admins (1 owner and 1 manager)' });
      }

      const hasSameRole = existingAdmins && existingAdmins.some(a => a.role === role);
      if (hasSameRole) {
        return res.status(400).json({ success: false, message: `An admin with role "${role}" already exists. Only 1 owner and 1 manager are allowed.` });
      }

      // Insert new admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data: newAdmin, error: insertError } = await supabase
        .from('admin')
        .insert([{
          restaurantId,
          name: name.trim(),
          mobile: mobile.trim(),
          email: email ? email.trim() : null,
          role,
          password: hashedPassword,
          isActive: true,
          createdAt: nowIST(),
          updatedAt: nowIST(),
        }])
        .select('adminId, name, mobile, email, role, isActive')
        .single();

      if (insertError) {
        if (insertError.message.includes('mobile')) {
          return res.status(409).json({ success: false, message: 'An admin with this mobile number already exists for this restaurant' });
        }
        logger.error('Add admin DB error', insertError.message);
        return res.status(500).json({ success: false, message: 'Failed to create admin' });
      }

      return res.status(201).json({ success: true, data: newAdmin, message: 'Admin added successfully' });
    } catch (err) {
      logger.error('retropController.addRestaurantAdmin error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // PATCH /api/retrop/restaurants/:restaurantId/admins/:adminId
  updateRestaurantAdmin: async (req, res) => {
    try {
      const { restaurantId, adminId } = req.params;
      const { name, mobile, email, role, password, isActive } = req.body;

      const updates = {};
      if (name) updates.name = name.trim();
      if (mobile) updates.mobile = mobile.trim();
      if (email !== undefined) updates.email = email ? email.trim() : null;
      if (isActive !== undefined) updates.isActive = isActive;
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }

      if (role) {
        if (role !== 'owner' && role !== 'manager') {
          return res.status(400).json({ success: false, message: 'Role must be either owner or manager' });
        }

        // Verify role uniqueness (ignore current adminId)
        const { data: existingAdmins, error: fetchError } = await supabase
          .from('admin')
          .select('adminId, role')
          .eq('restaurantId', restaurantId)
          .neq('adminId', adminId);

        if (fetchError) {
          logger.error('Fetch other admins error', fetchError.message);
          return res.status(500).json({ success: false, message: 'Failed to verify admin role uniqueness' });
        }

        const hasSameRole = existingAdmins && existingAdmins.some(a => a.role === role);
        if (hasSameRole) {
          return res.status(400).json({ success: false, message: `An admin with role "${role}" already exists. Only 1 owner and 1 manager are allowed.` });
        }
        updates.role = role;
      }

      updates.updatedAt = nowIST();

      const { data: updatedAdmin, error: updateError } = await supabase
        .from('admin')
        .update(updates)
        .eq('restaurantId', restaurantId)
        .eq('adminId', adminId)
        .select('adminId, name, mobile, email, role, isActive')
        .maybeSingle();

      if (updateError) {
        if (updateError.message.includes('mobile')) {
          return res.status(409).json({ success: false, message: 'An admin with this mobile number already exists for this restaurant' });
        }
        logger.error('Update admin DB error', updateError.message);
        return res.status(500).json({ success: false, message: 'Failed to update admin' });
      }

      if (!updatedAdmin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      return res.status(200).json({ success: true, data: updatedAdmin, message: 'Admin updated successfully' });
    } catch (err) {
      logger.error('retropController.updateRestaurantAdmin error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // DELETE /api/retrop/restaurants/:restaurantId/admins/:adminId
  deleteRestaurantAdmin: async (req, res) => {
    try {
      const { restaurantId, adminId } = req.params;

      const { data, error } = await supabase
        .from('admin')
        .delete()
        .eq('restaurantId', restaurantId)
        .eq('adminId', adminId)
        .select()
        .maybeSingle();

      if (error) {
        logger.error('Delete admin DB error', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete admin' });
      }

      if (!data) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      logger.info(`Restaurant admin deleted: ${data.name} (${adminId})`);
      return res.status(200).json({ success: true, message: 'Admin deleted successfully' });
    } catch (err) {
      logger.error('retropController.deleteRestaurantAdmin error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};
