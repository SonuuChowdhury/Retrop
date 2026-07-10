import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve('c:/Users/levono/Documents/Project Workspace/Resturant-Automation/Server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Retrop Owner Seeder & Diagnoser ---');
  
  // 1. Verify schema migration
  const { data: cols, error: colError } = await supabase
    .from('retrop_restaurant')
    .select('ownerId')
    .limit(1);

  if (colError && colError.message.includes('ownerId')) {
    console.error('\n❌ ERROR: Migration has not been applied yet!');
    console.error('Please run the SQL scripts in your Supabase SQL Editor first:');
    console.log('1. Server/src/migrations/006_owner_system.sql');
    console.log('2. Server/src/migrations/007_inventory.sql');
    console.log('\nAfter running the SQL migrations, execute this seeder script again to link existing restaurants.');
    process.exit(1);
  }

  // 2. Fetch all restaurants that do not have an ownerId linked
  const { data: restaurants, error: restError } = await supabase
    .from('retrop_restaurant')
    .select('*');

  if (restError) {
    console.error('Failed to fetch restaurants:', restError.message);
    process.exit(1);
  }

  console.log(`Found ${restaurants.length} restaurants in database.`);

  for (const rest of restaurants) {
    if (!rest.ownerId) {
      console.log(`\nRestaurant "${rest.businessName}" is missing an Owner Account.`);
      
      const email = `${rest.ownerMobile}@retrop.com`;
      const defaultPassword = rest.ownerMobile.substring(0, 5) + '@password';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Check if owner already exists in retrop_owner
      let { data: owner } = await supabase
        .from('retrop_owner')
        .select('ownerId')
        .eq('mobile', rest.ownerMobile)
        .maybeSingle();

      if (!owner) {
        console.log(`Creating owner profile for ${rest.ownerName} (${rest.ownerMobile})...`);
        const { data: newOwner, error: createError } = await supabase
          .from('retrop_owner')
          .insert([{
            name: rest.ownerName,
            email: email,
            mobile: rest.ownerMobile,
            password: hashedPassword,
            needsPasswordReset: true,
            isActive: true
          }])
          .select()
          .single();

        if (createError) {
          console.error(`Failed to create owner for ${rest.ownerName}:`, createError.message);
          continue;
        }
        owner = newOwner;
      }

      // Link owner to restaurant
      console.log(`Linking owner account to restaurant "${rest.businessName}"...`);
      const { error: linkError } = await supabase
        .from('retrop_restaurant')
        .update({ ownerId: owner.ownerId })
        .eq('restaurantId', rest.restaurantId);

      if (linkError) {
        console.error('Failed to link restaurant:', linkError.message);
      } else {
        console.log(`✅ Success! Owner profile created & linked.`);
        console.log(`Credentials for Owner Portal:`);
        console.log(`- Login Mobile: ${rest.ownerMobile}`);
        console.log(`- Default Password: ${defaultPassword}`);
      }
    } else {
      console.log(`Restaurant "${rest.businessName}" is already linked to ownerId: ${rest.ownerId}`);
    }
  }
}

run();
