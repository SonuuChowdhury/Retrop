import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config({silent: true});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Supabase credentials missing', 'Check .env file for SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('waiter').select('count', { count: 'exact' });
    if (error) throw error;
    logger.info('✓ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection failed', error.message);
    return false;
  }
};
