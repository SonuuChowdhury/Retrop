import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/Users/levono/Documents/Project Workspace/Resturant-Automation/Server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing raw SQL RPC...');
  // Try to create table via exec_sql
  const sql = `
    CREATE TABLE IF NOT EXISTS test_rpc_creation (
      id SERIAL PRIMARY KEY,
      name TEXT
    );
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('exec_sql error:', error.message);
  } else {
    console.log('Successfully executed SQL via RPC!');
  }
}

run();
