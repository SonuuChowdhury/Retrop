// ============================================================================
// STAFF CONTROLLER — Phase 9: Unified Staff & Custom Roles
// ============================================================================
// Provides aggregated management of all restaurant staff:
//   - Managers  → admin table (role: manager)
//   - Waiters   → waiter table
//   - Chefs     → kitchen table
//   - Others    → retrop_other_staff table (free-text role like Cashier, Valet)
//
// All endpoints are protected by ownerAuthMiddleware.
// ============================================================================

import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';
import bcrypt from 'bcryptjs';

export const staffController = {

  // GET /api/owner/staff
  // Returns aggregated object: { managers, waiters, chefs, others }
  getAllStaff: async (req, res) => {
    try {
      if (!req.restaurantId) {
        return res.status(200).json({
          success: true,
          data: { managers: [], waiters: [], chefs: [], others: [] }
        });
      }

      const [managersRes, waitersRes, chefsRes, othersRes] = await Promise.all([
        supabase
          .from('admin')
          .select('adminId, name, mobile, email, role, isActive, lastLogIn, createdAt')
          .order('name', { ascending: true }),
        supabase
          .from('waiter')
          .select('waiterId, waiterName, mobile, isActive, lastLogIn, createdAt')
          .order('waiterName', { ascending: true }),
        supabase
          .from('kitchen')
          .select('kitchenId, kitchenName, mobile, isActive, lastLogIn, createdAt')
          .order('kitchenName', { ascending: true }),
        supabase
          .from('retrop_other_staff')
          .select('staffId, name, mobile, role, isActive, lastLogIn, createdAt')
          .order('name', { ascending: true }),
      ]);

      if (managersRes.error) throw managersRes.error;
      if (waitersRes.error) throw waitersRes.error;
      if (chefsRes.error) throw chefsRes.error;
      if (othersRes.error) throw othersRes.error;

      return res.status(200).json({
        success: true,
        data: {
          managers: managersRes.data || [],
          waiters: waitersRes.data || [],
          chefs: chefsRes.data || [],
          others: othersRes.data || [],
        }
      });
    } catch (err) {
      logger.error('staffController.getAllStaff error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to load staff list' });
    }
  },

  // POST /api/owner/staff
  // Body: { type: 'manager'|'waiter'|'chef'|'other', name, mobile, password, role? (for other), email? (for manager) }
  createStaff: async (req, res) => {
    try {
      const { type, name, mobile, password, role, email } = req.body;

      if (!type || !name || !mobile || !password) {
        return res.status(400).json({
          success: false,
          message: 'type, name, mobile and password are required'
        });
      }

      if (!['manager', 'waiter', 'chef', 'other'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'type must be one of: manager, waiter, chef, other'
        });
      }

      if (type === 'other' && !role) {
        return res.status(400).json({
          success: false,
          message: 'role is required when type is "other" (e.g. Cashier, Storekeeper)'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const now = nowIST();

      let insertResult;

      if (type === 'manager') {
        // Check duplicate mobile
        const { data: existing } = await supabase
          .from('admin')
          .select('adminId')
          .eq('mobile', mobile.trim())
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'A manager with this mobile number already exists'
          });
        }

        insertResult = await supabase
          .from('admin')
          .insert([{
            name: name.trim(),
            mobile: mobile.trim(),
            password: hashedPassword,
            email: email ? email.trim().toLowerCase() : null,
            role: 'manager',
            isActive: true,
            createdAt: now,
            updatedAt: now,
          }])
          .select('adminId, name, mobile, role, isActive')
          .single();

      } else if (type === 'waiter') {
        const { data: existing } = await supabase
          .from('waiter')
          .select('waiterId')
          .eq('mobile', mobile.trim())
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'A waiter with this mobile number already exists'
          });
        }

        insertResult = await supabase
          .from('waiter')
          .insert([{
            waiterName: name.trim(),
            mobile: mobile.trim(),
            password: hashedPassword,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          }])
          .select('waiterId, waiterName, mobile, isActive')
          .single();

      } else if (type === 'chef') {
        const { data: existing } = await supabase
          .from('kitchen')
          .select('kitchenId')
          .eq('mobile', mobile.trim())
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'A chef/kitchen account with this mobile number already exists'
          });
        }

        insertResult = await supabase
          .from('kitchen')
          .insert([{
            kitchenName: name.trim(),
            mobile: mobile.trim(),
            password: hashedPassword,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          }])
          .select('kitchenId, kitchenName, mobile, isActive')
          .single();

      } else {
        // type === 'other'
        const { data: existing } = await supabase
          .from('retrop_other_staff')
          .select('staffId')
          .eq('mobile', mobile.trim())
          .maybeSingle();

        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'A staff member with this mobile number already exists'
          });
        }

        insertResult = await supabase
          .from('retrop_other_staff')
          .insert([{
            name: name.trim(),
            mobile: mobile.trim(),
            password: hashedPassword,
            role: role.trim(),
            isActive: true,
            createdAt: now,
            updatedAt: now,
          }])
          .select('staffId, name, mobile, role, isActive')
          .single();
      }

      if (insertResult.error) {
        logger.error(`staffController.createStaff (${type}) insert error`, insertResult.error.message);
        return res.status(500).json({ success: false, message: `Failed to create ${type} account` });
      }

      return res.status(201).json({
        success: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} account created successfully`,
        data: { type, ...insertResult.data }
      });
    } catch (err) {
      logger.error('staffController.createStaff error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to create staff member' });
    }
  },

  // DELETE /api/owner/staff/:type/:id
  deleteStaff: async (req, res) => {
    try {
      const { type, id } = req.params;

      if (!['manager', 'waiter', 'chef', 'other'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid staff type' });
      }

      let deleteResult;

      if (type === 'manager') {
        // Fetch manager profile to protect default owner accounts from deletion
        const { data: admin, error: fetchErr } = await supabase
          .from('admin')
          .select('role')
          .eq('adminId', id)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!admin) {
          return res.status(404).json({ success: false, message: 'Manager not found' });
        }

        if (admin.role === 'owner') {
          return res.status(403).json({
            success: false,
            message: 'Owner accounts cannot be deleted from the staff registry'
          });
        }

        deleteResult = await supabase
          .from('admin')
          .delete()
          .eq('adminId', id)
          .select();
      } else if (type === 'waiter') {
        deleteResult = await supabase
          .from('waiter')
          .delete()
          .eq('waiterId', id)
          .select();
      } else if (type === 'chef') {
        deleteResult = await supabase
          .from('kitchen')
          .delete()
          .eq('kitchenId', id)
          .select();
      } else {
        deleteResult = await supabase
          .from('retrop_other_staff')
          .delete()
          .eq('staffId', id)
          .select();
      }

      if (deleteResult.error) throw deleteResult.error;
      if (!deleteResult.data || !deleteResult.data.length) {
        return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      return res.status(200).json({ success: true, message: 'Staff member removed successfully' });
    } catch (err) {
      logger.error('staffController.deleteStaff error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to remove staff member' });
    }
  },

  // PUT /api/owner/staff/:type/:id/password
  updateStaffPassword: async (req, res) => {
    try {
      const { type, id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ success: false, message: 'New password is required' });
      }

      if (!['manager', 'waiter', 'chef', 'other'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid staff type' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const now = nowIST();
      let updateResult;

      if (type === 'manager') {
        updateResult = await supabase
          .from('admin')
          .update({ password: hashedPassword, updatedAt: now })
          .eq('adminId', id)
          .select();
      } else if (type === 'waiter') {
        updateResult = await supabase
          .from('waiter')
          .update({ password: hashedPassword, updatedAt: now })
          .eq('waiterId', id)
          .select();
      } else if (type === 'chef') {
        updateResult = await supabase
          .from('kitchen')
          .update({ password: hashedPassword, updatedAt: now })
          .eq('kitchenId', id)
          .select();
      } else {
        updateResult = await supabase
          .from('retrop_other_staff')
          .update({ password: hashedPassword, updatedAt: now })
          .eq('staffId', id)
          .select();
      }

      if (updateResult.error) throw updateResult.error;
      if (!updateResult.data || !updateResult.data.length) {
        return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      logger.error('staffController.updateStaffPassword error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update password' });
    }
  },
};
