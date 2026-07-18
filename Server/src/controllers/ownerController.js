// ============================================================================
// OWNER PORTAL CONTROLLER
// ============================================================================
// Handles all requests from the Retrop Owner Portal (web app).
// Protected by ownerAuthMiddleware.
// ============================================================================

import { validateImageBuffer } from '../utils/imageSecurity.js';
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

      const totalCOGS = orders.reduce((sum, order) => sum + parseFloat(order.costOfGoods || 0), 0);
      const totalProfit = orders.reduce((sum, order) => sum + parseFloat(order.grossProfit || 0), 0);
      const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

      const ordersCount = orders.length;
      const averageOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

      // Get loyalty info
      let totalLoyaltyPoints = 0;
      let loyaltyCustomersCount = 0;
      try {
        const { data: loyaltyData } = await supabase
          .from('loyalty_points')
          .select('totalPoints');
        if (loyaltyData) {
          totalLoyaltyPoints = loyaltyData.reduce((sum, item) => sum + item.totalPoints, 0);
          loyaltyCustomersCount = loyaltyData.length;
        }
      } catch (_) {}

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
            totalCOGS: parseFloat(totalCOGS.toFixed(2)),
            totalProfit: parseFloat(totalProfit.toFixed(2)),
            profitMargin: parseFloat(profitMargin.toFixed(2)),
            totalLoyaltyPoints,
            loyaltyCustomersCount,
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

      const format = (req.query.format || 'csv').toLowerCase();

      const { data: orders, error } = await supabase
        .from('orders')
        .select('ordersId, tableNo, totalAmount, discountAmount, gstAmount, finalAmount, createdAt')
        .eq('isPaymentCompleted', true)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Build CSV or XLS (TSV formatted for Excel)
      const delimiter = format === 'xls' ? '\t' : ',';
      let content = ['Order ID', 'Date', 'Table No', 'Subtotal (INR)', 'Discount (INR)', 'GST Tax (INR)', 'Total Paid (INR)'].join(delimiter) + '\n';
      
      if (orders && orders.length) {
        orders.forEach(o => {
          const date = new Date(o.createdAt).toLocaleDateString('en-IN');
          const subtotal = o.totalAmount || 0;
          const discount = o.discountAmount || 0;
          const tax = o.gstAmount || 0;
          const total = o.finalAmount || subtotal;
          
          if (format === 'xls') {
            content += `${o.ordersId}\t${date}\tTable ${o.tableNo}\t${subtotal}\t${discount}\t${tax}\t${total}\n`;
          } else {
            content += `"${o.ordersId}","${date}","Table ${o.tableNo}",${subtotal},${discount},${tax},${total}\n`;
          }
        });
      }

      if (format === 'xls') {
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename="sales_report_${req.restaurantId.substring(0, 8)}.xls"`);
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sales_report_${req.restaurantId.substring(0, 8)}.csv"`);
      }
      return res.status(200).send(content);
    } catch (err) {
      logger.error('ownerController.exportSalesReport error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
  },


  // POST /api/owner/restaurant/logo
  uploadLogo: async (req, res) => {
    try {
      const { image, mimeType, fileName } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, message: 'Image base64 data is required' });
      }

      if (!req.restaurantId) {
        return res.status(400).json({ success: false, message: 'No restaurant linked to owner' });
      }

      let fileBuffer;
      try {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        fileBuffer = Buffer.from(base64Data, 'base64');
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid base64 image data' });
      }

      // Security validation (Size limit 2MB + MIME Whitelist + Magic Bytes)
      const securityCheck = validateImageBuffer(fileBuffer, mimeType, 2);
      if (!securityCheck.valid) {
        return res.status(400).json({ success: false, message: securityCheck.error });
      }

      const filename = `${req.restaurantId}_${Date.now()}.${securityCheck.safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-logos')
        .upload(filename, fileBuffer, {
          contentType: securityCheck.mimeType,
          upsert: true,
        });


      if (uploadError) {
        logger.error('Failed to upload logo to Supabase storage', uploadError.message);
        return res.status(500).json({ success: false, message: 'Logo upload failed: ' + uploadError.message });
      }

      const { data: urlData } = supabase.storage.from('restaurant-logos').getPublicUrl(filename);
      const logoUrl = urlData.publicUrl;

      // Update restaurant_info table
      const { data: existing } = await supabase
        .from('restaurant_info')
        .select('infoId')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('restaurant_info')
          .update({ logoUrl, updatedAt: nowIST() })
          .eq('infoId', existing.infoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('restaurant_info')
          .insert([{ logoUrl, restaurantId: req.restaurantId, createdAt: nowIST(), updatedAt: nowIST() }]);
        if (error) throw error;
      }

      return res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: { logoUrl }
      });
    } catch (err) {
      logger.error('ownerController.uploadLogo error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // GET /api/owner/gst/gstr1
  getGstr1Report: async (req, res) => {
    try {
      if (!req.restaurantId) {
        return res.status(400).json({ success: false, message: 'No restaurant linked to owner' });
      }

      const { month, year } = req.query; // e.g. month=07, year=2026
      if (!month || !year) {
        return res.status(400).json({ success: false, message: 'month and year are required' });
      }

      const startDate = `${year}-${month.padStart(2, '0')}-01T00:00:00.000Z`;
      const endDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.padStart(2, '0')}-${endDay}T23:59:59.999Z`;

      // Fetch completed orders within date range
      const { data: orders, error } = await supabase
        .from('orders')
        .select('totalAmount, discountAmount, gstAmount, taxBreakdown, createdAt')
        .eq('isPaymentCompleted', true)
        .gte('createdAt', startDate)
        .lte('createdAt', endDate);

      if (error) throw error;

      // Fetch restaurant info for GSTIN & POS
      const { data: restaurantInfo } = await supabase
        .from('restaurant_info')
        .select('GSTIN, isGST')
        .maybeSingle();

      const gstin = restaurantInfo?.GSTIN || '';
      const pos = gstin.substring(0, 2) || '07'; // fallback to '07'

      // Aggregate by tax rate
      const rateAggregation = {};

      (orders || []).forEach(order => {
        const subtotal = parseFloat(order.totalAmount || 0) - parseFloat(order.discountAmount || 0);

        // Find rates from taxBreakdown
        const breakdown = order.taxBreakdown || [];
        if (breakdown.length > 0) {
          const totalRate = breakdown.reduce((sum, t) => sum + parseFloat(t.percent || 0), 0);
          const totalTax = parseFloat(order.gstAmount || 0);

          if (!rateAggregation[totalRate]) {
            rateAggregation[totalRate] = { txval: 0, tax: 0 };
          }
          rateAggregation[totalRate].txval += subtotal;
          rateAggregation[totalRate].tax += totalTax;
        } else {
          // No tax
          if (!rateAggregation[0]) {
            rateAggregation[0] = { txval: 0, tax: 0 };
          }
          rateAggregation[0].txval += subtotal;
          rateAggregation[0].tax += 0;
        }
      });

      const b2cs = Object.entries(rateAggregation).map(([rateStr, data]) => {
        const rate = parseFloat(rateStr);
        const txval = parseFloat(data.txval.toFixed(2));
        const tax = parseFloat(data.tax.toFixed(2));
        const halfTax = parseFloat((tax / 2).toFixed(2));

        return {
          sply_ty: 'INTRA',
          pos,
          rt: rate,
          txval,
          iamt: 0.0,
          camt: halfTax, // CGST
          samt: halfTax, // SGST
          csamt: 0.0
        };
      });

      const gstr1Json = {
        gstin,
        fp: `${month.padStart(2, '0')}${year}`,
        cur_gt: 0.0,
        gt: 0.0,
        b2cs
      };

      return res.status(200).json({ success: true, data: gstr1Json });
    } catch (err) {
      logger.error('ownerController.getGstr1Report error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to generate GSTR-1 report' });
    }
  },

  // GET /api/owner/gst/gstr3b
  getGstr3bReport: async (req, res) => {
    try {
      if (!req.restaurantId) {
        return res.status(400).json({ success: false, message: 'No restaurant linked to owner' });
      }

      const { month, year } = req.query;
      if (!month || !year) {
        return res.status(400).json({ success: false, message: 'month and year are required' });
      }

      const startMonth = month.padStart(2, '0');
      const endDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      
      const salesStart = `${year}-${startMonth}-01T00:00:00.000Z`;
      const salesEnd = `${year}-${startMonth}-${endDay}T23:59:59.999Z`;

      const purchaseStart = `${year}-${startMonth}-01`;
      const purchaseEnd = `${year}-${startMonth}-${endDay}`;

      // 1. Outward supplies (sales)
      const { data: sales, error: salesErr } = await supabase
        .from('orders')
        .select('finalAmount, gstAmount')
        .eq('isPaymentCompleted', true)
        .gte('createdAt', salesStart)
        .lte('createdAt', salesEnd);

      if (salesErr) throw salesErr;

      // 2. Inward supplies (purchases for ITC)
      const { data: purchases, error: purchaseErr } = await supabase
        .from('purchase_entry')
        .select('totalAmount')
        .gte('purchaseDate', purchaseStart)
        .lte('purchaseDate', purchaseEnd);

      if (purchaseErr) throw purchaseErr;

      // Calculations
      let totalSalesVal = 0;
      let totalSalesTax = 0;
      (sales || []).forEach(o => {
        const amt = parseFloat(o.finalAmount || 0);
        const tax = parseFloat(o.gstAmount || 0);
        totalSalesVal += (amt - tax);
        totalSalesTax += tax;
      });

      let totalPurchaseVal = 0;
      (purchases || []).forEach(p => {
        totalPurchaseVal += parseFloat(p.totalAmount || 0);
      });

      // Standard restaurant inputs carry standard 5% tax (2.5% CGST + 2.5% SGST)
      const itcTax = totalPurchaseVal * 0.05;
      const itcHalfTax = itcTax / 2;

      const salesHalfTax = totalSalesTax / 2;

      const gstr3bJson = {
        gstin: (await supabase.from('restaurant_info').select('GSTIN').maybeSingle()).data?.GSTIN || '',
        fp: `${startMonth}${year}`,
        "3.1_outward_supplies": {
          "a_outward_taxable_supplies": {
            taxable_value: parseFloat(totalSalesVal.toFixed(2)),
            integrated_tax: 0.0,
            central_tax: parseFloat(salesHalfTax.toFixed(2)),
            state_ut_tax: parseFloat(salesHalfTax.toFixed(2)),
            cess: 0.0
          },
          "b_outward_zero_rated_supplies": { taxable_value: 0.0, integrated_tax: 0.0, cess: 0.0 },
          "c_other_outward_supplies": { taxable_value: 0.0, integrated_tax: 0.0, cess: 0.0 },
          "d_inward_supplies_reverse_charge": { taxable_value: 0.0, integrated_tax: 0.0, central_tax: 0.0, state_ut_tax: 0.0, cess: 0.0 },
          "e_non_gst_outward_supplies": { taxable_value: 0.0, integrated_tax: 0.0, cess: 0.0 }
        },
        "4_eligible_itc": {
          "A_itc_available": {
            "1_import_of_goods": { integrated_tax: 0.0, cess: 0.0 },
            "2_import_of_services": { integrated_tax: 0.0, cess: 0.0 },
            "3_inward_supplies_liable_reverse_charge": { integrated_tax: 0.0, cess: 0.0 },
            "4_inward_supplies_isd": { integrated_tax: 0.0, cess: 0.0 },
            "5_all_other_itc": {
              integrated_tax: 0.0,
              central_tax: parseFloat(itcHalfTax.toFixed(2)),
              state_ut_tax: parseFloat(itcHalfTax.toFixed(2)),
              cess: 0.0
            }
          }
        }
      };

      return res.status(200).json({ success: true, data: gstr3bJson });
    } catch (err) {
      logger.error('ownerController.getGstr3bReport error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to generate GSTR-3B report' });
    }
  },

  // GET /api/owner/orders
  getOrders: async (req, res) => {
    try {
      const restaurantId = req.restaurantId;
      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'No restaurant associated with this owner' });
      }

      const {
        from, to, status, waiterId, tableNo, search,
        limit = '20', offset = '0',
      } = req.query;

      const lim = Math.min(parseInt(limit) || 20, 100);
      const off = parseInt(offset) || 0;

      let query = supabase
        .from('orders')
        .select(`
          ordersId, dailyOrderNo, invoiceNo, tableNo, orderStatus, ordersInfo,
          ordersUpdateInfo, totalAmount, finalAmount, taxBreakdown, gstAmount,
          paymentMethod, isPaymentCompleted, createdAt, completedAt, servedAt,
          customer(name, mobile),
          waiter:waiterId(waiterName, mobile)
        `, { count: 'exact' })
        .eq('restaurantId', restaurantId)
        .order('createdAt', { ascending: false })
        .range(off, off + lim - 1);

      if (from)      query = query.gte('createdAt', from);
      if (to)        query = query.lte('createdAt', to);
      if (status)    query = query.eq('orderStatus', status);
      if (waiterId)  query = query.eq('waiterId', waiterId);
      if (tableNo)   query = query.eq('tableNo', parseInt(tableNo));
      if (search && search.trim()) {
        query = query.ilike('invoiceNo', `%${search.trim()}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return res.status(200).json({
        success: true,
        data,
        meta: { total: count ?? 0, limit: lim, offset: off, hasMore: (off + lim) < (count ?? 0) },
      });
    } catch (err) {
      logger.error('ownerController.getOrders error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
  },

  // GET /api/owner/reviews
  getReviews: async (req, res) => {
    try {
      const restaurantId = req.restaurantId;
      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'No restaurant associated with this owner' });
      }

      const { limit = '20', offset = '0' } = req.query;
      const lim = Math.min(parseInt(limit) || 20, 100);
      const off = parseInt(offset) || 0;

      const { data, error, count } = await supabase
        .from('customer_feedback')
        .select(`
          feedbackId,
          rating,
          comment,
          mobile,
          createdAt,
          orders:orderId (
            ordersId,
            dailyOrderNo,
            invoiceNo,
            tableNo,
            totalAmount,
            finalAmount,
            customer(name)
          )
        `, { count: 'exact' })
        .eq('restaurantId', restaurantId)
        .order('createdAt', { ascending: false })
        .range(off, off + lim - 1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data,
        meta: { total: count ?? 0, limit: lim, offset: off, hasMore: (off + lim) < (count ?? 0) },
      });
    } catch (err) {
      logger.error('ownerController.getReviews error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch customer reviews' });
    }
  },

  // GET /api/owner/orders/:orderId/pdf
  getOrderBillPDF: async (req, res) => {
    try {
      const { orderId } = req.params;
      const restaurantId = req.restaurantId;

      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'No restaurant associated with this owner' });
      }

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('ordersId', orderId)
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (orderErr || !order) {
        return res.status(404).json({ success: false, message: 'Order receipt not found.' });
      }

      const { data: restaurant } = await supabase
        .from('retrop_restaurant')
        .select('*')
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      const { data: settings } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      const { generateOrderBillPDF } = await import('../services/billPdfService.js');
      const pdfBuffer = await generateOrderBillPDF(order, restaurant, settings);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="bill_${order.invoiceNo || orderId}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      logger.error('ownerController.getOrderBillPDF error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to generate order bill PDF' });
    }
  }
};

