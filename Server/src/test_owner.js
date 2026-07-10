import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/Users/levono/Documents/Project Workspace/Resturant-Automation/Server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase key/url not loaded. Check .env path.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying owners from retrop_owner...');
  const { data: owners, error } = await supabase.from('retrop_owner').select('*');
  if (error) {
    console.error('Error fetching owners:', error.message);
  } else {
    console.log(`Found ${owners.length} owners:`);
    console.log(JSON.stringify(owners, null, 2));
  }

  console.log('Querying restaurants...');
  const { data: restaurants, error: error2 } = await supabase.from('retrop_restaurant').select('restaurantId, businessName, ownerName, ownerMobile, ownerId');
  if (error2) {
    console.error('Error fetching restaurants:', error2.message);
  } else {
    console.log(JSON.stringify(restaurants, null, 2));
  }
}

run();
