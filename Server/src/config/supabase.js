import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { AsyncLocalStorage } from 'async_hooks';

// Context for multi-tenant isolation
export const tenantContext = new AsyncLocalStorage();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // changed from SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  logger.error('Supabase credentials missing', 'Check .env file for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const rawSupabase = createClient(supabaseUrl, supabaseKey);

// Multi-tenant proxy to automatically scope all database queries by restaurantId
export const supabase = new Proxy(rawSupabase, {
  get(target, prop) {
    if (prop === 'from') {
      return (tableName) => {
        const queryBuilder = target.from(tableName);
        
        const tenantTables = [
          'admin', 'admin_session', 'waiter', 'waiter_session', 'waiter_daily_stats',
          'kitchen', 'kitchen_session', 'manager_session', 'login_attempt',
          'restaurant_settings', 'restaurant_info', 'menu', 'restaurant_table',
          'customer', 'orders', 'vendor', 'inventory_item', 'purchase_entry', 'recipe', 'stock_adjustment'
        ];
        
        if (tenantTables.includes(tableName)) {
          const store = tenantContext.getStore();
          if (store && store.restaurantId) {
            return new Proxy(queryBuilder, {
              get(builderTarget, builderProp) {
                const origMethod = builderTarget[builderProp];
                if (typeof origMethod === 'function') {
                  return (...args) => {
                    // Automatically inject restaurantId into inserts/upserts payload
                    if (builderProp === 'insert' || builderProp === 'upsert') {
                      const payload = args[0];
                      if (Array.isArray(payload)) {
                        payload.forEach(item => {
                          if (item && typeof item === 'object' && !item.restaurantId) {
                            item.restaurantId = store.restaurantId;
                          }
                        });
                      } else if (payload && typeof payload === 'object') {
                        if (!payload.restaurantId) {
                          payload.restaurantId = store.restaurantId;
                        }
                      }
                    }

                    const result = origMethod.apply(builderTarget, args);

                    // Auto-append .eq('restaurantId', store.restaurantId) to query methods
                    if (result && typeof result.eq === 'function') {
                      return result.eq('restaurantId', store.restaurantId);
                    }

                    return result;
                  };
                }
                return origMethod;
              }
            });
          }
        }
        return queryBuilder;
      };
    }
    return target[prop];
  }
});

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await rawSupabase.from('waiter').select('count', { count: 'exact' });
    if (error) throw error;
    logger.info('✓ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection failed', error.message);
    return false;
  }
};