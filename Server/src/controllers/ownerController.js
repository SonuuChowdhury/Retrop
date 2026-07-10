// ============================================================================
// OWNER PORTAL CONTROLLER
// ============================================================================
// Handles all requests from the Retrop Owner Portal (web app).
// Protected by ownerAuthMiddleware.
// ============================================================================

import { ownerAuthService } from '../services/ownerAuthService.js';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';
import bcrypt from 'bcryptjs';

export const ownerController = {

  // ==========================================================================
  // AUTH
  // ==========================================================================

  // POST /api/owner/auth/login
  login: async (req, res) => {
    try {
      const { loginIdentifier, password } = req.body;
      if (!loginIdentifier || !password) {
        return res.status(400).json({ success: false, message: 'Email/Mobile and password are required' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent') || '';

      const result = await ownerAuthService.login(loginIdentifier, password, ipAddress, userAgent);

      if (!result.success) {
        return res.status(result.code || 401).json({ success: false, message: result.error });
      }

      if (result.needsReset) {
        return res.status(200).json({
          success: true,
          needsReset: true,
          message: 'Password reset required on first login',
          data: result.data
        });
      }

      return res.status(200).json({ success: true, needsReset: false, data: result.data });
    } catch (err) {
      logger.error('ownerController.login error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // POST /api/owner/auth/reset-password
  resetPassword: async (req, res) => {
    try {
      const { ownerId, newPassword } = req.body;
      if (!ownerId || !newPassword) {
        return res.status(400).json({ success: false, message: 'ownerId and newPassword are required' });
      }

      const result = await ownerAuthService.firstLoginResetPassword(ownerId, newPassword);
      if (!result.success) {
        return res.status(result.code || 400).json({ success: false, message: result.error });
      }

      // Log out all existing active sessions for this owner to force relogin
      await ownerAuthService.logout(ownerId);

      return res.status(200).json({ success: true, message: 'Password reset successful. Please login again.' });
    } catch (err) {
      logger.error('ownerController.resetPassword error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // POST /api/owner/auth/refresh
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token required' });
      }

      const result = await ownerAuthService.refresh(refreshToken);
      if (!result.success) {
        return res.status(result.code || 401).json({ success: false, message: result.error });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      logger.error('ownerController.refreshToken error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // POST /api/owner/auth/logout
  logout: async (req, res) => {
    try {
      await ownerAuthService.logout(req.owner.ownerId);
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      logger.error('ownerController.logout error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/owner/auth/me
  me: async (req, res) => {
    return res.status(200).json({
      success: true,
      data: {
        owner: req.owner,
        restaurant: req.restaurant,
      }
    });
  },

  // ==========================================================================
  // DASHBOARD & ANALYTICS
  // ==========================================================================

  // GET /api/owner/dashboard/summary
  getDashboardSummary: async (req, res) => {
    try {
      if (!req.restaurantId) {
        return res.status(200).json({
          success: true,
          data: {
            stats: { totalSales: 0, ordersCount: 0, averageOrderValue: 0 },
            recentOrders: [],
            topDishes: []
          }
        });
      }

      // Fetch today's date range in IST
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartISO = todayStart.toISOString();

      // Get orders for this restaurant completed today
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('createdAt', todayStartISO)
        .eq('isPaymentCompleted', true);

      if (ordersError) throw ordersError;

      const totalSales = orders.reduce((sum, order) => {
        const amt = order.finalAmount !== null ? parseFloat(order.finalAmount) : parseFloat(order.totalAmount || 0);
        return sum + amt;
      }, 0);

      const ordersCount = orders.length;
      const averageOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

      // Extract top selling dishes today
      const dishSales = {};
      orders.forEach((order) => {
        if (Array.isArray(order.ordersInfo)) {
          order.ordersInfo.forEach((item) => {
            if (!dishSales[item.dishId]) {
              dishSales[item.dishId] = { dishId: item.dishId, dishName: item.dishName || 'Unknown Dish', quantity: 0, revenue: 0 };
            }
            dishSales[item.dishId].quantity += item.quantity || 0;
            dishSales[item.dishId].revenue += (item.quantity || 0) * (item.price || 0);
          });
        }
      });

      const topDishes = Object.values(dishSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Get 5 recent orders
      const { data: recentOrders, error: recentError } = await supabase
        .from('orders')
        .select('ordersId, tableNo, totalAmount, finalAmount, isPaymentCompleted, orderStatus, createdAt')
        .order('createdAt', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalSales: parseFloat(totalSales.toFixed(2)),
            ordersCount,
            averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
          },
          recentOrders: recentOrders || [],
          topDishes
        }
      });
    } catch (err) {
      logger.error('ownerController.getDashboardSummary error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to load dashboard summary' });
    }
  },

  // ==========================================================================
  // MANAGER MANAGEMENT
  // ==========================================================================

  // GET /api/owner/managers
  getManagers: async (req, res) => {
    try {
      if (!req.restaurantId) {
        return res.status(200).json({ success: true, data: [] });
      }

      // Query from tenant-scoped admin table (automatically filtered by restaurantId)
      const { data: managers, error } = await supabase
        .from('admin')
        .select('adminId, name, mobile, role, email, isActive, lastLogIn, createdAt');

      if (error) throw error;

      return res.status(200).json({ success: true, data: managers || [] });
    } catch (err) {
      logger.error('ownerController.getManagers error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to load managers' });
    }
  },

  // POST /api/owner/managers
  createManager: async (req, res) => {
    try {
      const { name, mobile, password, email, role } = req.body;
      if (!name || !mobile || !password) {
        return res.status(400).json({ success: false, message: 'Name, mobile, and password are required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Verify if mobile number already exists for this restaurant
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin')
        .select('adminId')
        .eq('mobile', mobile.trim())
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingAdmin) {
        return res.status(409).json({ success: false, message: 'A manager with this mobile number already exists' });
      }

      // Insert new admin (restaurantId auto-injected by tenant proxy)
      const { data: newManager, error: insertError } = await supabase
        .from('admin')
        .insert([{
          name: name.trim(),
          mobile: mobile.trim(),
          password: hashedPassword,
          email: email ? email.trim() : null,
          role: role || 'manager',
          isActive: true,
          createdAt: nowIST(),
          updatedAt: nowIST()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(201).json({
        success: true,
        message: 'Manager account created successfully',
        data: {
          adminId: newManager.adminId,
          name: newManager.name,
          mobile: newManager.mobile,
          role: newManager.role
        }
      });
    } catch (err) {
      logger.error('ownerController.createManager error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to create manager' });
    }
  },

  // DELETE /api/owner/managers/:adminId
  deleteManager: async (req, res) => {
    try {
      const { adminId } = req.params;

      const { data, error } = await supabase
        .from('admin')
        .delete()
        .eq('adminId', adminId)
        .select();

      if (error) throw error;
      if (!data || !data.length) {
        return res.status(404).json({ success: false, message: 'Manager not found' });
      }

      return res.status(200).json({ success: true, message: 'Manager deleted successfully' });
    } catch (err) {
      logger.error('ownerController.deleteManager error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to delete manager' });
    }
  },

  // PUT /api/owner/managers/:adminId/password
  updateManagerPassword: async (req, res) => {
    try {
      const { adminId } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ success: false, message: 'New password is required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from('admin')
        .update({
          password: hashedPassword,
          updatedAt: nowIST()
        })
        .eq('adminId', adminId)
        .select();

      if (error) throw error;
      if (!data || !data.length) {
        return res.status(404).json({ success: false, message: 'Manager not found' });
      }

      return res.status(200).json({ success: true, message: 'Manager password updated successfully' });
    } catch (err) {
      logger.error('ownerController.updateManagerPassword error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update manager password' });
    }
  },

  // GET /api/owner/dashboard/export
  exportSalesReport: async (req, res) => {
    try {
      if (!req.restaurantId) {
        return res.status(400).json({ success: false, message: 'No restaurant linked to owner' });
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('ordersId, tableNo, totalAmount, discountAmount, gstAmount, finalAmount, createdAt')
        .eq('isPaymentCompleted', true)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Build CSV
      let csv = 'Order ID,Date,Table No,Subtotal (INR),Discount (INR),GST Tax (INR),Total Paid (INR)\n';
      
      if (orders && orders.length) {
        orders.forEach(o => {
          const date = new Date(o.createdAt).toLocaleDateString('en-IN');
          const subtotal = o.totalAmount || 0;
          const discount = o.discountAmount || 0;
          const tax = o.gstAmount || 0;
          const total = o.finalAmount || subtotal;
          
          csv += `"${o.ordersId}","${date}","Table ${o.tableNo}",${subtotal},${discount},${tax},${total}\n`;
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${req.restaurantId.substring(0, 8)}.csv"`);
      return res.status(200).send(csv);
    } catch (err) {
      logger.error('ownerController.exportSalesReport error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to generate CSV report' });
    }
  }
};
