import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { daysAgoStartIST } from '../utils/time.js';

// ============================================================================
// TABLE MANAGEMENT SERVICE
// ============================================================================

export const tableService = {
  // Get all tables with status
  getAllTables: async () => {
    try {
      const { data: tables, error } = await supabase
        .from('restaurant_table')
        .select(`
          tableId,
          tableNo,
          capacity,
          isAvailable,
          currentOrder,
          createdAt,
          updatedAt
        `)
        .order('tableNo', { ascending: true });

      if (error) {
        logger.error('Failed to fetch tables', error.message);
        return { success: false, error: 'Failed to fetch tables' };
      }

      return { success: true, data: tables };
    } catch (error) {
      logger.error('Tables fetch error', error.message);
      throw error;
    }
  },

  // Get table details with current order info
  getTableDetails: async (tableNo) => {
    try {
      const { data: table, error: tableError } = await supabase
        .from('restaurant_table')
        .select('*')
        .eq('tableNo', tableNo)
        .maybeSingle();

      if (tableError || !table) {
        logger.error('Failed to fetch table', tableError?.message);
        return { success: false, error: 'Table not found' };
      }

      // Get current order details if exists
      let currentOrderDetails = null;
      if (table.currentOrder) {
        const { data: order } = await supabase
          .from('orders')
          .select(`
            ordersId,
            orderStatus,
            totalAmount,
            createdAt,
            waiter(waiterName, mobile),
            customer(name, mobile)
          `)
          .eq('ordersId', table.currentOrder)
          .maybeSingle();

        currentOrderDetails = order;
      }

      return {
        success: true,
        data: {
          ...table,
          currentOrderDetails,
        },
      };
    } catch (error) {
      logger.error('Table details fetch error', error.message);
      throw error;
    }
  },

  // Get available tables count
  getAvailableTablesCount: async () => {
    try {
      const { data: tables, error } = await supabase
        .from('restaurant_table')
        .select('tableNo')
        .eq('isAvailable', true);

      if (error) {
        logger.error('Failed to fetch available tables', error.message);
        return { success: false, error: 'Failed to fetch table count' };
      }

      return {
        success: true,
        data: { availableTablesCount: tables?.length || 0 },
      };
    } catch (error) {
      logger.error('Available tables count fetch error', error.message);
      throw error;
    }
  },

  // Add new table
  addTable: async (tableNo, capacity = 2) => {
    try {
      const { data: existing } = await supabase
        .from('restaurant_table')
        .select('tableNo')
        .eq('tableNo', tableNo)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Table number already exists' };
      }

      const { data: table, error } = await supabase
        .from('restaurant_table')
        .insert([{ tableNo, capacity, isAvailable: true }])
        .select()
        .single();

      if (error) {
        logger.error('Failed to add table', error.message);
        return { success: false, error: 'Failed to add table' };
      }

      logger.info(`New table added: ${table.tableId}`);
      return { success: true, data: table };
    } catch (error) {
      logger.error('Table addition error', error.message);
      throw error;
    }
  },

  // Delete table
  deleteTable: async (tableNo) => {
    try {
      const { data: table } = await supabase
        .from('restaurant_table')
        .select('currentOrder, isAvailable')
        .eq('tableNo', tableNo)
        .maybeSingle();

      if (!table) {
        return { success: false, error: 'Table not found' };
      }

      if (table.currentOrder || !table.isAvailable) {
        return { success: false, error: 'Cannot delete table while it is occupied or serving' };
      }

      // Also double-check the orders table for any active orders
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('ordersId')
        .eq('tableNo', tableNo)
        .not('orderStatus', 'in', '("completed","cancelled")');

      if (activeOrders && activeOrders.length > 0) {
        return { success: false, error: 'Cannot delete table with active orders in preparation or service' };
      }

      const { error } = await supabase
        .from('restaurant_table')
        .delete()
        .eq('tableNo', tableNo);

      if (error) {
        logger.error('Failed to delete table', error.message);
        return { success: false, error: 'Failed to delete table' };
      }

      logger.info(`Table deleted: ${tableNo}`);
      return { success: true };
    } catch (error) {
      logger.error('Table deletion error', error.message);
      throw error;
    }
  },

  // Update table capacity
  updateTableCapacity: async (tableNo, capacity) => {
    try {
      const { error } = await supabase
        .from('restaurant_table')
        .update({ capacity })
        .eq('tableNo', tableNo);

      if (error) {
        logger.error('Failed to update table capacity', error.message);
        return { success: false, error: 'Failed to update table' };
      }

      logger.info(`Table ${tableNo} capacity updated to ${capacity}`);
      return { success: true };
    } catch (error) {
      logger.error('Table update error', error.message);
      throw error;
    }
  },

  // Mark table as available
  markTableAvailable: async (tableNo) => {
    try {
      const { error } = await supabase
        .from('restaurant_table')
        .update({ isAvailable: true, currentOrder: null })
        .eq('tableNo', tableNo);

      if (error) {
        logger.error('Failed to mark table available', error.message);
        return { success: false, error: 'Failed to update table' };
      }

      logger.info(`Table ${tableNo} marked as available`);
      return { success: true };
    } catch (error) {
      logger.error('Mark available error', error.message);
      throw error;
    }
  },

  // Mark table as occupied
  markTableOccupied: async (tableNo, orderId) => {
    try {
      const { error } = await supabase
        .from('restaurant_table')
        .update({ isAvailable: false, currentOrder: orderId })
        .eq('tableNo', tableNo);

      if (error) {
        logger.error('Failed to mark table occupied', error.message);
        return { success: false, error: 'Failed to update table' };
      }

      logger.info(`Table ${tableNo} marked as occupied`);
      return { success: true };
    } catch (error) {
      logger.error('Mark occupied error', error.message);
      throw error;
    }
  },

  // Get table statistics
  getTableStatistics: async () => {
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('restaurant_table')
        .select('isAvailable');

      if (tablesError) {
        logger.error('Failed to fetch table stats', tablesError.message);
        return { success: false, error: 'Failed to fetch statistics' };
      }

      const totalTables = tables?.length || 0;
      const availableTables = tables?.filter((t) => t.isAvailable).length || 0;
      const occupiedTables = totalTables - availableTables;
      const occupancyRate = totalTables > 0 ? ((occupiedTables / totalTables) * 100).toFixed(2) : 0;

      return {
        success: true,
        data: {
          totalTables,
          availableTables,
          occupiedTables,
          occupancyRate: `${occupancyRate}%`,
        },
      };
    } catch (error) {
      logger.error('Table statistics fetch error', error.message);
      throw error;
    }
  },

  // Get table occupancy trend by date (IST-aware)
  getTableOccupancyTrend: async (days = 7) => {
    try {
      const startDate = daysAgoStartIST(days);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('tableNo, createdAt, updatedAt')
        .gte('createdAt', startDate)
        .eq('orderStatus', 'completed');

      if (error) {
        logger.error('Failed to fetch occupancy trend', error.message);
        return { success: false, error: 'Failed to fetch trend data' };
      }

      // Group by IST date
      const occupancyByDate = {};
      orders.forEach((order) => {
        const date = order.createdAt.split('T')[0];
        if (!occupancyByDate[date]) occupancyByDate[date] = 0;
        occupancyByDate[date] += 1;
      });

      return { success: true, data: occupancyByDate };
    } catch (error) {
      logger.error('Occupancy trend fetch error', error.message);
      throw error;
    }
  },
};