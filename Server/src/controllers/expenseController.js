// ============================================================================
// EXPENSE CONTROLLER — Phase 6: Expense Tracking & Day Close
// ============================================================================
// Manages daily expense entries and end-of-day cash register closing.
// All endpoints protected by authMiddleware + requireRole(['manager']).
// ============================================================================

import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST, todayDateIST } from '../utils/time.js';

export const expenseController = {

  // GET /api/manager/expenses?date=YYYY-MM-DD&startDate=...&endDate=...
  getExpenses: async (req, res) => {
    try {
      const { date, startDate, endDate } = req.query;

      let query = supabase
        .from('expense')
        .select('*, admin:createdBy(name)')
        .order('expenseDate', { ascending: false })
        .order('createdAt', { ascending: false });

      if (date) {
        query = query.eq('expenseDate', date);
      } else if (startDate && endDate) {
        query = query.gte('expenseDate', startDate).lte('expenseDate', endDate);
      } else {
        // Default: today
        query = query.eq('expenseDate', todayDateIST());
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = (data || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);

      return res.status(200).json({
        success: true,
        data: data || [],
        meta: {
          count: (data || []).length,
          totalAmount: parseFloat(total.toFixed(2)),
        }
      });
    } catch (err) {
      logger.error('expenseController.getExpenses error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
    }
  },

  // POST /api/manager/expenses
  // Body: { amount, category, description?, paymentMode?, expenseDate? }
  createExpense: async (req, res) => {
    try {
      const { amount, category, description, paymentMode, expenseDate } = req.body;

      if (!amount || !category) {
        return res.status(400).json({ success: false, message: 'amount and category are required' });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
      }

      const { data, error } = await supabase
        .from('expense')
        .insert([{
          amount: parseFloat(amount),
          category: category.trim(),
          description: description?.trim() || null,
          paymentMode: paymentMode || 'Cash',
          expenseDate: expenseDate || todayDateIST(),
          createdBy: req.admin?.adminId || null,
          createdAt: nowIST(),
          updatedAt: nowIST(),
        }])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Expense logged successfully',
        data
      });
    } catch (err) {
      logger.error('expenseController.createExpense error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to log expense' });
    }
  },

  // DELETE /api/manager/expenses/:expenseId
  deleteExpense: async (req, res) => {
    try {
      const { expenseId } = req.params;

      const { data, error } = await supabase
        .from('expense')
        .delete()
        .eq('expenseId', expenseId)
        .select();

      if (error) throw error;
      if (!data || !data.length) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }

      return res.status(200).json({ success: true, message: 'Expense deleted' });
    } catch (err) {
      logger.error('expenseController.deleteExpense error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to delete expense' });
    }
  },

  // GET /api/manager/day-close?date=YYYY-MM-DD
  // Also auto-computes expected cash from sales and expenses for the date
  getDayClose: async (req, res) => {
    try {
      const date = req.query.date || todayDateIST();

      // 1. Fetch existing close record for the date
      const { data: closeRecord } = await supabase
        .from('day_close')
        .select('*, admin:closedBy(name)')
        .eq('closeDate', date)
        .maybeSingle();

      // 2. Compute cash sales for the date
      const { data: cashOrders } = await supabase
        .from('orders')
        .select('finalAmount, totalAmount')
        .eq('paymentMethod', 'Cash')
        .eq('isPaymentCompleted', true)
        .gte('completedAt', `${date}T00:00:00.000Z`)
        .lte('completedAt', `${date}T23:59:59.999Z`);

      const cashSales = (cashOrders || []).reduce((sum, o) => {
        return sum + parseFloat(o.finalAmount || o.totalAmount || 0);
      }, 0);

      // 3. Compute cash expenses for the date
      const { data: cashExpenses } = await supabase
        .from('expense')
        .select('amount')
        .eq('paymentMode', 'Cash')
        .eq('expenseDate', date);

      const cashExpensesTotal = (cashExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);

      return res.status(200).json({
        success: true,
        data: {
          closeRecord: closeRecord || null,
          isClosed: !!closeRecord,
          computed: {
            date,
            cashSales: parseFloat(cashSales.toFixed(2)),
            cashExpenses: parseFloat(cashExpensesTotal.toFixed(2)),
          }
        }
      });
    } catch (err) {
      logger.error('expenseController.getDayClose error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch day-close data' });
    }
  },

  // POST /api/manager/day-close
  // Body: { openingCash, actualCash, notes?, date? }
  closeDay: async (req, res) => {
    try {
      const { openingCash, actualCash, notes, date } = req.body;
      const closeDate = date || todayDateIST();

      if (openingCash === undefined || openingCash === null || actualCash === undefined || actualCash === null) {
        return res.status(400).json({ success: false, message: 'openingCash and actualCash are required' });
      }

      // Check if already closed today
      const { data: existing } = await supabase
        .from('day_close')
        .select('closeId')
        .eq('closeDate', closeDate)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Day register for ${closeDate} is already closed`
        });
      }

      // Compute cash sales
      const { data: cashOrders } = await supabase
        .from('orders')
        .select('finalAmount, totalAmount')
        .eq('paymentMethod', 'Cash')
        .eq('isPaymentCompleted', true)
        .gte('completedAt', `${closeDate}T00:00:00.000Z`)
        .lte('completedAt', `${closeDate}T23:59:59.999Z`);

      const cashSales = parseFloat(((cashOrders || []).reduce((sum, o) => {
        return sum + parseFloat(o.finalAmount || o.totalAmount || 0);
      }, 0)).toFixed(2));

      // Compute cash expenses
      const { data: cashExpenses } = await supabase
        .from('expense')
        .select('amount')
        .eq('paymentMode', 'Cash')
        .eq('expenseDate', closeDate);

      const cashExpensesTotal = parseFloat(((cashExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0)).toFixed(2));

      const opening = parseFloat(openingCash);
      const actual = parseFloat(actualCash);
      const expected = parseFloat((opening + cashSales - cashExpensesTotal).toFixed(2));
      const variance = parseFloat((actual - expected).toFixed(2));

      const { data, error } = await supabase
        .from('day_close')
        .insert([{
          closeDate,
          openingCash: opening,
          cashSales,
          cashExpenses: cashExpensesTotal,
          expectedCash: expected,
          actualCash: actual,
          variance,
          notes: notes?.trim() || null,
          closedBy: req.admin?.adminId || null,
          createdAt: nowIST(),
        }])
        .select()
        .single();

      if (error) throw error;

      const isLargeVariance = Math.abs(variance) > 100;

      return res.status(201).json({
        success: true,
        message: isLargeVariance
          ? `Day closed with a variance of ₹${Math.abs(variance).toFixed(2)}. Please investigate.`
          : 'Day register closed successfully',
        data,
        alert: isLargeVariance ? `Cash variance exceeds ₹100 — Actual: ₹${actual}, Expected: ₹${expected}` : null
      });
    } catch (err) {
      logger.error('expenseController.closeDay error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to close day register' });
    }
  },
};
