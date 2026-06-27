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
import { generateInvoicePDF, uploadInvoiceToStorage } from '../services/invoiceService.js';
import { sendWelcomeEmail, sendInvoiceEmail, sendCredentialsEmail } from '../services/mailer.js';
import { encryptSetupPayload } from '../utils/crypto.js';
import QRCode from 'qrcode';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => uuidRegex.test(id);

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
  // Default password: first 5 digits of mobile + @password
  const defaultPassword = ownerMobile.substring(0, 5) + '@password';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
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
      // 1. Fetch total sales from transaction table where status = 'paid'
      const { data: transactions, error: txError } = await supabase
        .from('transaction')
        .select('finalAmount')
        .eq('status', 'paid');
      
      if (txError) throw txError;
      const totalSales = transactions ? transactions.reduce((sum, t) => sum + parseFloat(t.finalAmount || 0), 0) : 0;

      // 2. Fetch all businesses to do vertical grouping
      const { data: businesses, error: busError } = await supabase
        .from('retrop_restaurant')
        .select('restaurantId, businessName, ownerName, ownerMobile, isActive, businessTypeId, createdAt');

      if (busError) throw busError;

      // 3. Count active product keys
      const { count: activeKeysCount, error: keyError } = await supabase
        .from('product_key')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true);
      
      if (keyError) throw keyError;

      const totalBusinesses = businesses?.length || 0;
      const activeBusinesses = businesses?.filter(b => b.isActive).length || 0;
      const inactiveBusinesses = totalBusinesses - activeBusinesses;

      // Calculate type breakdowns
      const byBusinessType = {
        restaurant: { total: 0, active: 0, displayName: 'Restaurant SaaS' },
        gym: { total: 0, active: 0, displayName: 'Gym SaaS' },
        manufacturing: { total: 0, active: 0, displayName: 'Manufacturing Ledger' },
      };

      businesses?.forEach(b => {
        const type = b.businessTypeId || 'restaurant';
        if (!byBusinessType[type]) {
          byBusinessType[type] = { total: 0, active: 0, displayName: type.charAt(0).toUpperCase() + type.slice(1) };
        }
        byBusinessType[type].total += 1;
        if (b.isActive) {
          byBusinessType[type].active += 1;
        }
      });

      // Get 5 most recent registrations
      const recentBusinesses = [...(businesses || [])]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalSales,
            totalBusinesses,
            activeBusinesses,
            inactiveBusinesses,
            activeKeys: activeKeysCount || 0,
            byBusinessType
          },
          recentRestaurants: recentBusinesses
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
      const { businessName, ownerName, gender, ownerMobile, ownerEmail, businessTypeId, hasGst, gstin, planId, billingCycleDays, gracePeriodDays } = req.body;

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
          businessTypeId: businessTypeId || 'restaurant',
          hasGst: hasGst || false,
          gstin: hasGst ? gstin.trim() : null,
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

      // Create a pending subscription linked to pricing plan
      let subscription = null;
      if (planId) {
        if (!isValidUUID(planId)) {
          return res.status(400).json({ success: false, message: 'Invalid planId format' });
        }
        const { data: subData, error: subErr } = await supabase
          .from('subscription')
          .insert([{
            restaurantId: restaurant.restaurantId,
            planId: planId,
            status: 'pending_payment',
            billingCycleDays: billingCycleDays ? parseInt(billingCycleDays) : 28,
            gracePeriodDays: gracePeriodDays ? parseInt(gracePeriodDays) : 10,
            createdAt: nowIST(),
            updatedAt: nowIST(),
          }])
          .select()
          .single();

        if (subErr) {
          logger.error('Failed to create pending subscription during onboarding', subErr.message);
        } else {
          subscription = subData;
        }
      }

      logger.info(`New restaurant created: ${businessName} (${restaurant.restaurantId})`);

      return res.status(201).json({
        success: true,
        data: {
          ...restaurant,
          subscription
        },
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
          restaurantId, businessName, ownerName, gender, ownerMobile, isActive, businessTypeId, hasGst, gstin, createdAt,
          product_key (keyId, keyValue, isActive, createdAt),
          subscription (subscriptionId, planId, status, startDate, endDate, nextBillingDate)
        `)
        .order('createdAt', { ascending: false });

      if (error) {
        logger.error('List restaurants error', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch restaurants' });
      }

      // Attach active key info for each restaurant
      const enriched = restaurants.map(r => {
        const keys = r.product_key || [];
        const subscriptions = r.subscription || [];
        return {
          ...r,
          keys,
          activeKey: keys.find(k => k.isActive) || null,
          keyCount: keys.length,
          product_key: undefined, // strip raw array from response
          subscriptions,
          activeSubscription: subscriptions.find(s => s.status === 'active' || s.status === 'grace_period') || subscriptions[0] || null,
          subscription: undefined
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
      if (!isValidUUID(restaurantId)) {
        return res.status(400).json({ success: false, message: 'Invalid restaurantId format' });
      }

      const { data, error } = await supabase
        .from('retrop_restaurant')
        .select(`
          *,
          product_key (keyId, keyValue, isActive, createdAt, updatedAt),
          subscription (subscriptionId, planId, status, startDate, endDate, nextBillingDate, pricing_plan(name, planType, basePrice, billingCycleDays))
        `)
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      // Fetch owner's email from admin table
      let ownerEmail = null;
      try {
        const { data: ownerAdmin } = await supabase
          .from('admin')
          .select('email')
          .eq('restaurantId', restaurantId)
          .eq('role', 'owner')
          .maybeSingle();
        if (ownerAdmin?.email) {
          ownerEmail = ownerAdmin.email.trim();
        }
      } catch (adminErr) {
        logger.warn('Failed to fetch owner email for getRestaurant', adminErr.message);
      }

      const enriched = {
        ...data,
        ownerEmail
      };

      return res.status(200).json({ success: true, data: enriched });
    } catch (err) {
      logger.error('retropController.getRestaurant error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // PATCH /api/retrop/restaurants/:restaurantId
  updateRestaurant: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      if (!isValidUUID(restaurantId)) {
        return res.status(400).json({ success: false, message: 'Invalid restaurantId format' });
      }
      const { businessName, ownerName, gender, ownerMobile, businessTypeId, hasGst, gstin, ownerEmail } = req.body;

      const updates = {};
      if (businessName !== undefined)  updates.businessName = businessName.trim();
      if (ownerName !== undefined)     updates.ownerName    = ownerName.trim();
      if (gender !== undefined)        updates.gender       = gender;
      if (ownerMobile !== undefined)   updates.ownerMobile  = ownerMobile.trim();
      if (businessTypeId !== undefined) updates.businessTypeId = businessTypeId;
      if (hasGst !== undefined)        updates.hasGst       = Boolean(hasGst);
      if (hasGst !== undefined) {
        updates.gstin = hasGst ? (gstin?.trim()?.toUpperCase() || null) : null;
      } else if (gstin !== undefined) {
        updates.gstin = gstin?.trim()?.toUpperCase() || null;
      }
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

      // Sync owner's details to the admin table where role = 'owner'
      const adminUpdates = {};
      if (ownerName !== undefined) adminUpdates.name = ownerName.trim();
      if (ownerMobile !== undefined) adminUpdates.mobile = ownerMobile.trim();
      if (ownerEmail !== undefined) adminUpdates.email = ownerEmail ? ownerEmail.trim() : null;

      if (Object.keys(adminUpdates).length > 0) {
        adminUpdates.updatedAt = nowIST();
        await supabase
          .from('admin')
          .update(adminUpdates)
          .eq('restaurantId', restaurantId)
          .eq('role', 'owner');
      }

      logger.info(`Restaurant updated: ${restaurantId}`);
      
      const enriched = {
        ...data,
        ownerEmail: ownerEmail !== undefined ? (ownerEmail ? ownerEmail.trim() : null) : null
      };

      return res.status(200).json({ success: true, data: enriched });
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

      if (!name || !mobile || !role) {
        return res.status(400).json({ success: false, message: 'name, mobile, and role are required' });
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

      // Default password logic
      const defaultPassword = mobile.trim().substring(0, 5) + '@password';
      const passwordToUse = password || defaultPassword;

      // Insert new admin
      const hashedPassword = await bcrypt.hash(passwordToUse, 10);
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

        // Fetch current admin to verify role demotion
        const { data: currentAdmin, error: currentAdminErr } = await supabase
          .from('admin')
          .select('role')
          .eq('restaurantId', restaurantId)
          .eq('adminId', adminId)
          .maybeSingle();

        if (currentAdminErr) {
          logger.error('Fetch current admin error', currentAdminErr.message);
          return res.status(500).json({ success: false, message: 'Failed to verify current admin role' });
        }

        if (currentAdmin && currentAdmin.role === 'owner' && role !== 'owner') {
          return res.status(400).json({ success: false, message: 'The owner role cannot be changed to manager as every restaurant must have an owner.' });
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

      // Check current admin role first
      const { data: adminToDelete, error: fetchErr } = await supabase
        .from('admin')
        .select('role, name')
        .eq('restaurantId', restaurantId)
        .eq('adminId', adminId)
        .maybeSingle();

      if (fetchErr) {
        logger.error('Fetch admin for delete error', fetchErr.message);
        return res.status(500).json({ success: false, message: 'Failed to verify admin role' });
      }

      if (!adminToDelete) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      if (adminToDelete.role === 'owner') {
        return res.status(400).json({ success: false, message: 'The owner admin account cannot be deleted because the system requires an active owner for billing and administration.' });
      }

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

  // ==========================================================================
  // RETROP OWN BUSINESS CONFIG & PLANS ENDPOINTS
  // ==========================================================================

  // GET /api/retrop/config
  getBusinessConfig: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('retrop_business_config')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.getBusinessConfig error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch business details' });
    }
  },

  // PUT /api/retrop/config
  updateBusinessConfig: async (req, res) => {
    try {
      const { legalName, address, gstin, mobile, email, bankDetails, gstRate, isTaxEnabled } = req.body;
      
      const { data: existing } = await supabase
        .from('retrop_business_config')
        .select('configId')
        .maybeSingle();

      const payload = {
        legalName: legalName?.trim(),
        address: address?.trim(),
        gstin: isTaxEnabled !== false ? gstin?.trim()?.toUpperCase() : '',
        mobile: mobile?.trim(),
        email: email?.trim(),
        bankDetails: bankDetails || {},
        gstRate: gstRate !== undefined ? parseFloat(gstRate) : 18.00,
        isTaxEnabled: isTaxEnabled !== undefined ? !!isTaxEnabled : true,
        updatedAt: nowIST(),
      };

      let result;
      if (existing) {
        result = await supabase
          .from('retrop_business_config')
          .update(payload)
          .eq('configId', existing.configId)
          .select()
          .single();

        const isMissingColumnError = result.error && (
          result.error.code === 'PGRST204' ||
          result.error.message.includes('column "isTaxEnabled"') ||
          result.error.message.includes("isTaxEnabled' column")
        );
        if (isMissingColumnError) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.isTaxEnabled;
          result = await supabase
            .from('retrop_business_config')
            .update(fallbackPayload)
            .eq('configId', existing.configId)
            .select()
            .single();
          if (!result.error && result.data) {
            result.data.dbMigrationRequired = true;
          }
        }
      } else {
        result = await supabase
          .from('retrop_business_config')
          .insert([payload])
          .select()
          .single();

        const isMissingColumnError = result.error && (
          result.error.code === 'PGRST204' ||
          result.error.message.includes('column "isTaxEnabled"') ||
          result.error.message.includes("isTaxEnabled' column")
        );
        if (isMissingColumnError) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.isTaxEnabled;
          result = await supabase
            .from('retrop_business_config')
            .insert([fallbackPayload])
            .select()
            .single();
          if (!result.error && result.data) {
            result.data.dbMigrationRequired = true;
          }
        }
      }

      if (result.error) throw result.error;
      logger.info('Retrop business configuration updated.');
      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      logger.error('retropController.updateBusinessConfig error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update business details' });
    }
  },

  // GET /api/retrop/plans
  listPlans: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('pricing_plan')
        .select('*')
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.listPlans error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch pricing plans' });
    }
  },

  // POST /api/retrop/plans
  createPlan: async (req, res) => {
    try {
      const { businessTypeId, name, planType, billingCycleDays, basePrice, gstPercent, description } = req.body;
      if (!businessTypeId || !name || !planType || basePrice === undefined) {
        return res.status(400).json({ success: false, message: 'businessTypeId, name, planType, and basePrice are required' });
      }

      const { data, error } = await supabase
        .from('pricing_plan')
        .insert([{
          businessTypeId,
          name: name.trim(),
          planType,
          billingCycleDays: planType === 'monthly' ? (billingCycleDays ? parseInt(billingCycleDays) : 28) : null,
          basePrice: parseFloat(basePrice),
          gstPercent: gstPercent !== undefined ? parseFloat(gstPercent) : 18.00,
          description: description?.trim(),
          isActive: true,
          createdAt: nowIST(),
          updatedAt: nowIST(),
        }])
        .select()
        .single();

      if (error) throw error;
      logger.info(`Pricing plan created: ${data.name}`);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.createPlan error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to create pricing plan' });
    }
  },

  // PUT /api/retrop/plans/:planId
  updatePlan: async (req, res) => {
    try {
      const { planId } = req.params;
      const { name, basePrice, gstPercent, description, isActive } = req.body;

      const updates = { updatedAt: nowIST() };
      if (name) updates.name = name.trim();
      if (basePrice !== undefined) updates.basePrice = parseFloat(basePrice);
      if (gstPercent !== undefined) updates.gstPercent = parseFloat(gstPercent);
      if (description !== undefined) updates.description = description.trim();
      if (isActive !== undefined) updates.isActive = Boolean(isActive);

      const { data, error } = await supabase
        .from('pricing_plan')
        .update(updates)
        .eq('planId', planId)
        .select()
        .single();

      if (error) throw error;
      logger.info(`Pricing plan updated: ${planId}`);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.updatePlan error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update pricing plan' });
    }
  },

  // DELETE /api/retrop/plans/:planId
  deletePlan: async (req, res) => {
    try {
      const { planId } = req.params;
      const { data, error } = await supabase
        .from('pricing_plan')
        .delete()
        .eq('planId', planId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, message: 'Plan not found' });
      
      logger.info(`Pricing plan deleted: ${planId}`);
      return res.status(200).json({ success: true, message: 'Plan deleted successfully' });
    } catch (err) {
      logger.error('retropController.deletePlan error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to delete pricing plan' });
    }
  },

  // GET /api/retrop/transactions
  listTransactions: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('transaction')
        .select('*, retrop_restaurant(businessName, ownerName, ownerMobile)')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.listTransactions error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch transaction logs' });
    }
  },

  // GET /api/retrop/subscriptions
  listSubscriptions: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('subscription')
        .select('*, retrop_restaurant(businessName, ownerName, ownerMobile), pricing_plan(name, planType, basePrice)')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('retropController.listSubscriptions error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch subscriptions list' });
    }
  },

  // POST /api/retrop/transactions/confirm
  confirmPayment: async (req, res) => {
    try {
      const { restaurantId, subscriptionId, paymentMethod, upiTransactionId, description } = req.body;
      if (!restaurantId || !subscriptionId || !paymentMethod) {
        return res.status(400).json({ success: false, message: 'restaurantId, subscriptionId, and paymentMethod are required' });
      }

      if (!isValidUUID(restaurantId) || !isValidUUID(subscriptionId)) {
        return res.status(400).json({ success: false, message: 'Invalid UUID format for restaurantId or subscriptionId' });
      }

      if (paymentMethod === 'UPI' && !upiTransactionId) {
        return res.status(400).json({ success: false, message: 'UPI Ref Transaction ID is required when payment method is UPI' });
      }

      // Fetch restaurant
      const { data: restaurant, error: resErr } = await supabase
        .from('retrop_restaurant')
        .select('*')
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (resErr || !restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      // Fetch subscription & plan
      const { data: subscription, error: subErr } = await supabase
        .from('subscription')
        .select('*, pricing_plan(*)')
        .eq('subscriptionId', subscriptionId)
        .maybeSingle();

      if (subErr || !subscription) {
        return res.status(404).json({ success: false, message: 'Subscription record not found' });
      }

      // Fetch Retrop business config
      const { data: retropConfig } = await supabase
        .from('retrop_business_config')
        .select('*')
        .maybeSingle();

      const globalConfig = retropConfig || {
        legalName: 'Retrop Software Solutions',
        address: '123 Tech Park, Sector 62, Noida, UP, India',
        gstin: '09AAAAA1111A1Z1',
        mobile: '9876543210',
        email: 'billing@retrop.com',
        bankDetails: {},
      };

      const isTaxEnabled = globalConfig.isTaxEnabled !== false;
      const plan = subscription.pricing_plan;
      const baseAmount = parseFloat(plan.basePrice);
      const gstPercent = isTaxEnabled ? (parseFloat(plan.gstPercent) || 18.00) : 0;
      const gstAmount = baseAmount * (gstPercent / 100);
      const finalAmount = baseAmount + gstAmount;

      // Generate invoice number: INV-YYYY-MM-RAND
      const today = new Date(nowIST());
      const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const seq = Math.floor(1000 + Math.random() * 9000);
      const invoiceNo = `RETROP/${yearMonth}/${seq}`;

      // Insert transaction as paid
      const { data: transaction, error: txErr } = await supabase
        .from('transaction')
        .insert([{
          restaurantId,
          subscriptionId,
          invoiceNo,
          paymentMethod,
          upiTransactionId: paymentMethod === 'UPI' ? upiTransactionId.trim() : null,
          baseAmount,
          gstAmount,
          finalAmount,
          status: 'paid',
          description: description || `Payment for ${plan.name}`,
          createdAt: nowIST(),
        }])
        .select()
        .single();

      if (txErr) throw txErr;

      // Update subscription status to active and calculate dates
      const startDate = new Date(nowIST());
      let endDate = null;
      if (plan.planType === 'monthly') {
        endDate = new Date(startDate);
        const cycleDays = subscription.billingCycleDays || plan.billingCycleDays || 28;
        endDate.setDate(endDate.getDate() + cycleDays);
      }

      const { error: subUpdateErr } = await supabase
        .from('subscription')
        .update({
          status: 'active',
          startDate: startDate.toISOString(),
          endDate: endDate ? endDate.toISOString() : null,
          nextBillingDate: endDate ? endDate.toISOString() : null,
          gracePeriodEndsAt: null,
          updatedAt: nowIST(),
        })
        .eq('subscriptionId', subscriptionId);

      if (subUpdateErr) throw subUpdateErr;

      // Ensure the restaurant is marked active in retrop_restaurant (reactivate if suspended)
      await supabase
        .from('retrop_restaurant')
        .update({ isActive: true, updatedAt: nowIST() })
        .eq('restaurantId', restaurantId);

      // Fetch owner's email from admin table
      let ownerEmail = 'partner@retrop.com';
      try {
        const { data: ownerAdmin } = await supabase
          .from('admin')
          .select('email')
          .eq('restaurantId', restaurantId)
          .eq('role', 'owner')
          .maybeSingle();
        if (ownerAdmin?.email) {
          ownerEmail = ownerAdmin.email.trim();
        }
      } catch (adminErr) {
        logger.warn('Failed to fetch owner email for restaurant', adminErr.message);
      }

      // Generate invoice PDF in background and mail it
      generateInvoicePDF(transaction, restaurant, globalConfig)
        .then(async (pdfBuffer) => {
          // Send welcome mail if it's the initial payment (status was pending_payment)
          if (subscription.status === 'pending_payment') {
            await sendWelcomeEmail(ownerEmail, restaurant.businessName, restaurant.ownerName, restaurant.ownerMobile, restaurant.gender);
          }
          // Send receipt email with PDF attachment
          await sendInvoiceEmail(ownerEmail, restaurant.businessName, invoiceNo, pdfBuffer, plan.name, plan.planType, endDate ? endDate.toISOString() : null, restaurant.ownerName);
        })
        .catch((pdfErr) => {
          logger.error('PDF invoice generation/mail pipeline failed', pdfErr.message);
        });

      logger.info(`Payment confirmed for restaurant ${restaurantId}. Invoice: ${invoiceNo}`);
      return res.status(200).json({
        success: true,
        data: transaction,
        message: 'Payment confirmed successfully. Welcome emails and invoice dispatched.',
      });
    } catch (err) {
      logger.error('retropController.confirmPayment error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to confirm payment transaction' });
    }
  },

  // POST /api/retrop/support-tickets
  createSupportTicket: async (req, res) => {
    try {
      const { restaurantId, title, description, cost, paymentMethod, upiTransactionId } = req.body;
      if (!restaurantId || !title || !description) {
        return res.status(400).json({ success: false, message: 'restaurantId, title, and description are required' });
      }

      if (!isValidUUID(restaurantId)) {
        return res.status(400).json({ success: false, message: 'Invalid restaurantId format' });
      }

      // Check restaurant plan type eligibility (Monthly/Lifetime only)
      const { data: sub, error: subFetchErr } = await supabase
        .from('subscription')
        .select('*, pricing_plan(*)')
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (subFetchErr) {
        logger.error('Failed to fetch subscription for support ticket', subFetchErr.message);
      }

      if (!sub || !sub.pricing_plan || !['monthly', 'lifetime'].includes(sub.pricing_plan.planType)) {
        return res.status(400).json({
          success: false,
          message: 'Tech support incidents can only be billed to restaurants under a One-Time Buy or Subscription model.'
        });
      }

      const ticketCost = cost !== undefined ? parseFloat(cost) : 500.00;

      // 1. Create support ticket in DB
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_service_ticket')
        .insert([{
          restaurantId,
          title: title.trim(),
          description: description.trim(),
          cost: ticketCost,
          ticketStatus: paymentMethod ? 'open' : 'pending_payment',
        }])
        .select()
        .single();

      if (ticketErr) throw ticketErr;

      let transaction = null;

      // 2. If payment details are supplied immediately, confirm payment and generate invoice
      if (paymentMethod) {
        const { data: restaurant } = await supabase
          .from('retrop_restaurant')
          .select('*')
          .eq('restaurantId', restaurantId)
          .maybeSingle();

        const { data: retropConfig } = await supabase
          .from('retrop_business_config')
          .select('*')
          .maybeSingle();

        const globalConfig = retropConfig || {
          legalName: 'Retrop Software Solutions',
          address: '123 Tech Park, Sector 62, Noida, UP, India',
          gstin: '09AAAAA1111A1Z1',
          mobile: '9876543210',
          email: 'billing@retrop.com',
          bankDetails: {},
        };

        const isTaxEnabled = globalConfig.isTaxEnabled !== false;
        const baseAmount = parseFloat(ticketCost);
        const gstPercent = isTaxEnabled ? (globalConfig.gstRate !== undefined ? parseFloat(globalConfig.gstRate) : 18.00) : 0;
        const gstAmount = baseAmount * (gstPercent / 100);
        const finalAmount = baseAmount + gstAmount;

        const today = new Date(nowIST());
        const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const seq = Math.floor(1000 + Math.random() * 9000);
        const invoiceNo = `RETROP/SUPPORT/${yearMonth}/${seq}`;

        const { data: txData, error: txErr } = await supabase
          .from('transaction')
          .insert([{
            restaurantId,
            invoiceNo,
            paymentMethod,
            upiTransactionId: paymentMethod === 'UPI' ? upiTransactionId?.trim() : null,
            baseAmount,
            gstAmount,
            finalAmount,
            status: 'paid',
            description: `Tech Support Service: ${title}`,
            createdAt: nowIST(),
          }])
          .select()
          .single();

        if (txErr) throw txErr;
        transaction = txData;

        let ownerEmail = 'partner@retrop.com';
        try {
          const { data: ownerAdmin } = await supabase
            .from('admin')
            .select('email')
            .eq('restaurantId', restaurantId)
            .eq('role', 'owner')
            .maybeSingle();
          if (ownerAdmin?.email) {
            ownerEmail = ownerAdmin.email.trim();
          }
        } catch (adminErr) {
          logger.warn('Failed to fetch owner email for support ticket', adminErr.message);
        }

        // Generate PDF and email
        generateInvoicePDF(transaction, restaurant, globalConfig)
          .then(async (pdfBuffer) => {
            await sendInvoiceEmail(
              ownerEmail,
              restaurant.businessName,
              invoiceNo,
              pdfBuffer,
              sub.pricing_plan.name,
              'support',
              null,
              restaurant.ownerName
            );
          })
          .catch((pdfErr) => {
            logger.error('PDF invoice generation for support ticket failed', pdfErr.message);
          });
      }

      logger.info(`Support ticket created for restaurant ${restaurantId}: ${title}`);
      return res.status(201).json({
        success: true,
        data: {
          ticket,
          transaction
        },
        message: 'Support service ticket logged successfully.',
      });
    } catch (err) {
      logger.error('retropController.createSupportTicket error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to create support service ticket' });
    }
  },

  // PUT /api/retrop/subscriptions/:subscriptionId
  updateSubscription: async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { planId, status, startDate, endDate, nextBillingDate, gracePeriodEndsAt } = req.body;

      if (!subscriptionId) {
        return res.status(400).json({ success: false, message: 'subscriptionId is required' });
      }

      // Check if subscription exists
      const { data: subscription, error: fetchErr } = await supabase
        .from('subscription')
        .select('*')
        .eq('subscriptionId', subscriptionId)
        .maybeSingle();

      if (fetchErr || !subscription) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }

      const updates = {
        updatedAt: nowIST()
      };
      if (planId !== undefined) updates.planId = planId;
      if (status !== undefined) updates.status = status;
      if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate).toISOString() : null;
      if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate).toISOString() : null;
      if (nextBillingDate !== undefined) updates.nextBillingDate = nextBillingDate ? new Date(nextBillingDate).toISOString() : null;
      if (gracePeriodEndsAt !== undefined) updates.gracePeriodEndsAt = gracePeriodEndsAt ? new Date(gracePeriodEndsAt).toISOString() : null;

      const { data: updatedSub, error: updateErr } = await supabase
        .from('subscription')
        .update(updates)
        .eq('subscriptionId', subscriptionId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Handle cascading restaurant activation/deactivation based on subscription status changes
      if (status && status !== subscription.status) {
        const restaurantId = subscription.restaurantId;
        if (status === 'active') {
          // Set restaurant isActive to true
          await supabase
            .from('retrop_restaurant')
            .update({ isActive: true, updatedAt: nowIST() })
            .eq('restaurantId', restaurantId);
        } else if (status === 'suspended') {
          // Set restaurant isActive to false and deactivate key
          await supabase
            .from('retrop_restaurant')
            .update({ isActive: false, updatedAt: nowIST() })
            .eq('restaurantId', restaurantId);

          await supabase
            .from('product_key')
            .update({ isActive: false, updatedAt: nowIST() })
            .eq('restaurantId', restaurantId);
        }
      }

      logger.info(`Subscription updated: ${subscriptionId}`);
      return res.status(200).json({ success: true, data: updatedSub, message: 'Subscription details updated successfully.' });
    } catch (err) {
      logger.error('retropController.updateSubscription error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update subscription details' });
    }
  },

  // GET /api/retrop/transactions/:transactionId/invoice
  getTransactionInvoice: async (req, res) => {
    try {
      const { transactionId } = req.params;

      // 1. Fetch transaction with its restaurant details
      const { data: transaction, error: txErr } = await supabase
        .from('transaction')
        .select('*, retrop_restaurant(*)')
        .eq('transactionId', transactionId)
        .maybeSingle();

      if (txErr || !transaction) {
        return res.status(404).json({ success: false, message: 'Transaction record not found' });
      }

      const restaurant = transaction.retrop_restaurant;
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant details associated with transaction not found' });
      }

      // 2. Fetch Retrop business config
      const { data: retropConfig } = await supabase
        .from('retrop_business_config')
        .select('*')
        .maybeSingle();

      const globalConfig = retropConfig || {
        legalName: 'Retrop Software Solutions',
        address: '123 Tech Park, Sector 62, Noida, UP, India',
        gstin: '09AAAAA1111A1Z1',
        mobile: '9876543210',
        email: 'billing@retrop.com',
        bankDetails: {},
      };

      // 3. Generate dynamic PDF
      const pdfBuffer = await generateInvoicePDF(transaction, restaurant, globalConfig);

      // 4. Stream PDF back to client
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice_${transaction.invoiceNo.replace(/\//g, '_')}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      logger.error('retropController.getTransactionInvoice error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to generate dynamic invoice PDF' });
    }
  },

  // POST /api/retrop/restaurants/:restaurantId/mail-credentials
  mailCredentials: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      if (!isValidUUID(restaurantId)) {
        return res.status(400).json({ success: false, message: 'Invalid restaurantId format' });
      }

      // Fetch restaurant
      const { data: restaurant, error: resErr } = await supabase
        .from('retrop_restaurant')
        .select('restaurantId, businessName')
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (resErr || !restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      // Fetch active product key
      const { data: keys, error: keyErr } = await supabase
        .from('product_key')
        .select('keyValue')
        .eq('restaurantId', restaurantId)
        .eq('isActive', true)
        .limit(1);

      if (keyErr || !keys || keys.length === 0) {
        return res.status(400).json({ success: false, message: 'Active product license key not found for this restaurant' });
      }
      const activeKey = keys[0].keyValue;

      // Fetch admins (expecting both)
      const { data: admins, error: adminErr } = await supabase
        .from('admin')
        .select('name, mobile, email, role')
        .eq('restaurantId', restaurantId);

      if (adminErr || !admins || admins.length < 2) {
        return res.status(400).json({ success: false, message: 'Both admin accounts (owner and manager) must be added before mailing credentials' });
      }

      // Get target email (owner only)
      const ownerAdmin = admins.find(a => a.role === 'owner');
      if (!ownerAdmin || !ownerAdmin.email) {
        return res.status(400).json({ success: false, message: 'Owner account must have a registered email address to receive credentials' });
      }

      const toEmail = ownerAdmin.email.trim();
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const serverUrl = `${protocol}://${req.get('host')}`.replace(/\/+$/, '');
      const mailResult = await sendCredentialsEmail(toEmail, restaurant.businessName, activeKey, admins, serverUrl);
      if (!mailResult.success) {
        logger.error('Failed to send credentials email', mailResult.error);
        return res.status(500).json({ success: false, message: `Failed to dispatch credentials email: ${mailResult.error}` });
      }

      return res.status(200).json({ success: true, message: `Credentials successfully mailed to: ${toEmail}` });
    } catch (err) {
      logger.error('retropController.mailCredentials error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/retrop/restaurants/:restaurantId/setup-qrcode
  getSetupQrCode: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      if (!isValidUUID(restaurantId)) {
        return res.status(400).json({ success: false, message: 'Invalid restaurantId format' });
      }

      // Fetch active product key
      const { data: keys, error: keyErr } = await supabase
        .from('product_key')
        .select('keyValue')
        .eq('restaurantId', restaurantId)
        .eq('isActive', true)
        .limit(1);

      if (keyErr || !keys || keys.length === 0) {
        return res.status(400).json({ success: false, message: 'Active product license key not found for this restaurant' });
      }
      const activeKey = keys[0].keyValue;

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const serverUrl = `${protocol}://${req.get('host')}`.replace(/\/+$/, '');

      // Encrypt the setup payload
      const cipherText = encryptSetupPayload(serverUrl, activeKey);

      // Generate QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(cipherText, { errorCorrectionLevel: 'H' });

      return res.status(200).json({ success: true, qrCode: qrCodeDataUrl });
    } catch (err) {
      logger.error('retropController.getSetupQrCode error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to generate setup QR code' });
    }
  },
};
