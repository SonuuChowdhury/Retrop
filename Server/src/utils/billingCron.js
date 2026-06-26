import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { logger } from './logger.js';
import { nowIST } from './time.js';
import { sendRenewalReminderEmail, sendSuspensionEmail, sendPendingInvoiceEmail } from '../services/mailer.js';
import { generateInvoicePDF } from '../services/invoiceService.js';

/**
 * Helper: Fetch owner email dynamically from admin table
 */
async function getOwnerEmail(restaurantId) {
  try {
    const { data } = await supabase
      .from('admin')
      .select('email')
      .eq('restaurantId', restaurantId)
      .eq('role', 'owner')
      .maybeSingle();
    return data?.email || null;
  } catch (err) {
    logger.warn(`Failed to fetch owner email for restaurant ${restaurantId}`, err.message);
    return null;
  }
}


/**
 * Main subscription processing job.
 * Iterates through all active subscriptions to check for expiration, grace periods, and suspensions.
 */
export const runSubscriptionChecks = async () => {
  logger.info('[Billing Cron] Starting daily subscription check...');

  const today = new Date(nowIST());

  try {
    // 1. Process active subscriptions that have passed their end date
    const { data: expiredActive, error: activeErr } = await supabase
      .from('subscription')
      .select('*, retrop_restaurant(*), pricing_plan(*)')
      .eq('status', 'active')
      .lte('endDate', today.toISOString());

    if (activeErr) throw activeErr;

    logger.info(`[Billing Cron] Found ${expiredActive?.length || 0} active subscriptions past their endDate.`);

    for (const sub of expiredActive || []) {
      const plan = sub.pricing_plan;
      const restaurant = sub.retrop_restaurant;

      if (plan.planType === 'monthly') {
        // Transition to grace period (use custom days if defined, fallback to 10)
        const graceDays = sub.gracePeriodDays !== null && sub.gracePeriodDays !== undefined ? sub.gracePeriodDays : 10;
        const graceEndDate = new Date(sub.endDate);
        graceEndDate.setDate(graceEndDate.getDate() + graceDays);

        const { error: updateErr } = await supabase
          .from('subscription')
          .update({
            status: 'grace_period',
            gracePeriodEndsAt: graceEndDate.toISOString(),
            updatedAt: nowIST(),
          })
          .eq('subscriptionId', sub.subscriptionId);

        if (updateErr) {
          logger.error(`[Billing Cron] Failed to transition subscription ${sub.subscriptionId} to grace_period`, updateErr.message);
          continue;
        }

        // Generate next pending transaction (the renewal invoice)
        const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const seq = Math.floor(1000 + Math.random() * 9000); // random 4 digits for mock invoice sequence
        const invoiceNo = `RETROP/${yearMonth}/${seq}`;
        
        const baseAmount = parseFloat(plan.basePrice);
        const gstAmount = baseAmount * (parseFloat(plan.gstPercent) / 100);
        const finalAmount = baseAmount + gstAmount;

        const { data: transaction, error: txErr } = await supabase
          .from('transaction')
          .insert([{
            restaurantId: sub.restaurantId,
            subscriptionId: sub.subscriptionId,
            invoiceNo,
            paymentMethod: 'UPI', // default placeholder
            baseAmount,
            gstAmount,
            finalAmount,
            status: 'pending',
            description: `Subscription Renewal: ${plan.name} (${yearMonth})`,
            createdAt: nowIST(),
          }])
          .select()
          .single();

        if (txErr) {
          logger.error(`[Billing Cron] Failed to generate pending renewal invoice for restaurant ${sub.restaurantId}`, txErr.message);
        }

        // Send grace period warning email and the pending invoice via email
        const ownerEmail = await getOwnerEmail(sub.restaurantId);
        if (ownerEmail) {
          await sendRenewalReminderEmail(
            ownerEmail,
            restaurant.businessName,
            sub.endDate,
            0 // 0 days left
          );

          if (transaction) {
            // Fetch Retrop business config
            const { data: retropConfig } = await supabase
              .from('retrop_business_config')
              .select('*')
              .maybeSingle();

            const globalConfig = retropConfig || {
              legalName: 'Retrop Software Solutions',
              address: '123 Tech Park, Sector 62, Noida, UP, India',
              gstin: '09AAAAA1111A1Z1',
              mobile: '9876543210',
              email: 'billing@retrop.com',
              bankDetails: {},
            };

            // Generate invoice PDF in background and mail it as pending
            generateInvoicePDF(transaction, restaurant, globalConfig)
              .then(async (pdfBuffer) => {
                await sendPendingInvoiceEmail(ownerEmail, restaurant.businessName, invoiceNo, pdfBuffer, graceEndDate);
              })
              .catch((pdfErr) => {
                logger.error(`[Billing Cron] PDF invoice generation/mail failed for renewal ${invoiceNo}`, pdfErr.message);
              });
          }
        }
        logger.info(`[Billing Cron] Subscription ${sub.subscriptionId} moved to grace_period. Renewal invoice generated: ${invoiceNo}`);
      }
    }

    // 2. Process grace period subscriptions that have passed their grace deadline
    const { data: expiredGrace, error: graceErr } = await supabase
      .from('subscription')
      .select('*, retrop_restaurant(*)')
      .eq('status', 'grace_period')
      .lte('gracePeriodEndsAt', today.toISOString());

    if (graceErr) throw graceErr;

    logger.info(`[Billing Cron] Found ${expiredGrace?.length || 0} grace period subscriptions past their grace deadline.`);

    for (const sub of expiredGrace || []) {
      const restaurant = sub.retrop_restaurant;

      // 1. Update subscription status to suspended
      const { error: subUpdateErr } = await supabase
        .from('subscription')
        .update({
          status: 'suspended',
          updatedAt: nowIST(),
        })
        .eq('subscriptionId', sub.subscriptionId);

      if (subUpdateErr) {
        logger.error(`[Billing Cron] Failed to suspend subscription ${sub.subscriptionId}`, subUpdateErr.message);
        continue;
      }

      // 2. Disable restaurant registry (isActive = false)
      const { error: resUpdateErr } = await supabase
        .from('retrop_restaurant')
        .update({
          isActive: false,
          updatedAt: nowIST(),
        })
        .eq('restaurantId', sub.restaurantId);

      if (resUpdateErr) {
        logger.error(`[Billing Cron] Failed to deactivate restaurant registry ${sub.restaurantId}`, resUpdateErr.message);
      }

      // 3. Deactivate all keys for this restaurant
      const { error: keyUpdateErr } = await supabase
        .from('product_key')
        .update({
          isActive: false,
          updatedAt: nowIST(),
        })
        .eq('restaurantId', sub.restaurantId);

      if (keyUpdateErr) {
        logger.error(`[Billing Cron] Failed to deactivate product keys for restaurant ${sub.restaurantId}`, keyUpdateErr.message);
      }

      // 4. Send suspension email
      const ownerEmail = await getOwnerEmail(sub.restaurantId);
      if (ownerEmail) {
        await sendSuspensionEmail(ownerEmail, restaurant.businessName);
      }

      logger.info(`[Billing Cron] Restaurant ${sub.restaurantId} and keys suspended due to expired grace period.`);
    }

    // 3. Process upcoming renewals (7 days reminder)
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const { data: upcomingRenewals, error: upcomingErr } = await supabase
      .from('subscription')
      .select('*, retrop_restaurant(*), pricing_plan(*)')
      .eq('status', 'active')
      .gte('endDate', today.toISOString())
      .lte('endDate', sevenDaysLater.toISOString());

    if (upcomingErr) throw upcomingErr;

    logger.info(`[Billing Cron] Found ${upcomingRenewals?.length || 0} subscriptions renewing in the next 7 days.`);

    for (const sub of upcomingRenewals || []) {
      const restaurant = sub.retrop_restaurant;
      const daysLeft = Math.ceil((new Date(sub.endDate) - today) / (1000 * 60 * 60 * 24));
      
      // Send reminder email if email is configured
      const ownerEmail = await getOwnerEmail(sub.restaurantId);
      if (ownerEmail) {
        await sendRenewalReminderEmail(
          ownerEmail,
          restaurant.businessName,
          sub.endDate,
          daysLeft
        );
      }
    }

    logger.info('[Billing Cron] Subscription checks completed successfully.');
  } catch (err) {
    logger.error('[Billing Cron] Critical error running subscription checks', err.message);
  }
};

/**
 * Initializes the cron scheduler utility.
 * Runs once every day at midnight (00:00).
 */
export const initBillingScheduler = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', () => {
    runSubscriptionChecks();
  });
  logger.info('✓ Subscription Billing Scheduler Initialized (Job runs daily at 00:00)');
};
