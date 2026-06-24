import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';

// Transporter configuration using environment variables with Gmail defaults
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = parseInt(process.env.EMAIL_PORT || '465');
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

let transporter = null;

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for 587/others
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
  logger.info(`✓ Mailer configured: host=${emailHost}, port=${emailPort}, user=${emailUser}`);
} else {
  logger.warn('Mailer warnings: EMAIL_USER and EMAIL_PASS missing in environment variables. Email dispatches will be mocked.');
}

/**
 * Sends an email with optional attachments.
 */
export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const legalName = await getRetropLegalName();
    if (!transporter) {
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return { success: true, message: 'Email mock dispatch successful (SMTP config missing)' };
    }

    const mailOptions = {
      from: `"${legalName} Support" <${emailUser}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, info };
  } catch (err) {
    logger.error(`Failed to send email to ${to}`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Sends a welcome email to a newly onboarded client.
 */
async function getRetropLegalName() {
  try {
    const { data } = await supabase
      .from('retrop_business_config')
      .select('legalName')
      .maybeSingle();
    if (data?.legalName) return data.legalName;
  } catch (err) {
    logger.warn('Failed to fetch legal name from retrop_business_config', err.message);
  }
  return 'Retrop Software Solutions';
}

/**
 * Sends a welcome email to a newly onboarded client.
 */
export const sendWelcomeEmail = async (clientEmail, businessName, ownerName, mobile, gender) => {
  const legalName = await getRetropLegalName();
  const subject = `Welcome to ${legalName} - Account Activated! 🎉`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; color: #333;">
      <h2 style="color: #FF6B35; text-align: center;">Welcome to ${legalName}!</h2>
      <p>Dear <strong>${ownerName}</strong>,</p>
      <p>Thank you for choosing ${legalName} for <strong>${businessName}</strong>. We are thrilled to partner with you!</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B35; margin: 20px 0;">
         <h4 style="margin-top: 0; color: #FF6B35;">Registered Owner Details</h4>
         <p style="margin: 5px 0;"><strong>Owner Name:</strong> ${ownerName}</p>
         <p style="margin: 5px 0;"><strong>Owner Email:</strong> ${clientEmail || 'N/A'}</p>
         <p style="margin: 5px 0;"><strong>Owner Mobile:</strong> ${mobile}</p>
         <p style="margin: 5px 0;"><strong>Gender:</strong> ${gender || 'N/A'}</p>
      </div>

      <p>The app and bill details wil be sent to you when ever ypouo are registered for the usage by Retrop</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${legalName} &copy; 2026. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail({ to: clientEmail, subject, html });
};

/**
 * Sends an invoice receipt email.
 */
export const sendInvoiceEmail = async (clientEmail, businessName, invoiceNo, invoiceBuffer, planName, planType, nextBillingDate, ownerName) => {
  const legalName = await getRetropLegalName();
  const subject = `Invoice ${invoiceNo} from ${legalName} 📄`;
  
  let planDetailsHtml = `
    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0;">
       <h4 style="margin-top: 0; color: #10B981;">Billing & Plan Details</h4>
       <p style="margin: 5px 0;"><strong>Owner Name:</strong> ${ownerName || 'N/A'}</p>
       <p style="margin: 5px 0;"><strong>Plan Name:</strong> ${planName || 'N/A'}</p>
       <p style="margin: 5px 0;"><strong>Plan Type:</strong> ${planType === 'monthly' ? 'Monthly Subscription' : planType === 'lifetime' ? 'One-time Buy (Lifetime)' : 'Support Incident'}</p>
  `;

  if (planType === 'monthly' && nextBillingDate) {
    planDetailsHtml += `
       <p style="margin: 5px 0;"><strong>Next Billing Date:</strong> ${new Date(nextBillingDate).toLocaleDateString('en-IN')}</p>
    `;
  }

  planDetailsHtml += `</div>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; color: #333;">
      <h2 style="color: #10B981; text-align: center;">Payment Confirmed</h2>
      <p>Hello <strong>${ownerName || ''}</strong>,</p>
      <p>We have successfully processed your payment for <strong>${businessName}</strong>.</p>
      <p>Please find attached your invoice <strong>${invoiceNo}</strong> (including 18% GST) for your records.</p>
      
      ${planDetailsHtml}
      
      <p>If you paid via UPI, your transaction details have been logged in the transaction history page on your admin panel.</p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${legalName} &copy; 2026. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail({
    to: clientEmail,
    subject,
    html,
    attachments: [
      {
        filename: `${invoiceNo.replace(/\//g, '_')}.pdf`,
        content: invoiceBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

/**
 * Sends a renewal warning email (days remaining in subscription / grace period warning)
 */
export const sendRenewalReminderEmail = async (clientEmail, businessName, nextBillingDate, daysRemaining) => {
  const legalName = await getRetropLegalName();
  const isGracePeriod = daysRemaining <= 0;
  const subject = isGracePeriod 
    ? `⚠️ ACTION REQUIRED: Your subscription for ${businessName} has expired!`
    : `Upcoming Subscription Renewal for ${businessName}`;
  
  const textTitle = isGracePeriod ? 'Subscription Expired!' : 'Subscription Renewal Notice';
  const textInfo = isGracePeriod
    ? `Your subscription expired on <strong>${new Date(nextBillingDate).toLocaleDateString()}</strong>. You are currently in the <strong>10-day grace period</strong>. Please pay your pending invoice immediately to avoid service suspension.`
    : `This is a reminder that your subscription for <strong>${businessName}</strong> is due for renewal on <strong>${new Date(nextBillingDate).toLocaleDateString()}</strong> (${daysRemaining} days left).`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; color: #333;">
      <h2 style="color: ${isGracePeriod ? '#EF4444' : '#FF6B35'}; text-align: center;">${textTitle}</h2>
      <p>Dear Partner,</p>
      <p>${textInfo}</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid ${isGracePeriod ? '#EF4444' : '#FF6B35'}; margin: 20px 0;">
        <h4 style="margin-top: 0; color: ${isGracePeriod ? '#EF4444' : '#FF6B35'};">Bill Details</h4>
        <p style="margin: 5px 0;"><strong>Base Rate:</strong> 18% GST applicable</p>
        <p style="margin: 5px 0;"><strong>To Pay:</strong> Check your super-admin panel for invoice links.</p>
      </div>

      <p>Thank you for your business!</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${legalName} &copy; 2026. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail({ to: clientEmail, subject, html });
};

/**
 * Sends a service suspension notice.
 */
export const sendSuspensionEmail = async (clientEmail, businessName) => {
  const legalName = await getRetropLegalName();
  const subject = `❌ SERVICE SUSPENDED: ${businessName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; color: #333;">
      <h2 style="color: #EF4444; text-align: center;">Services Suspended</h2>
      <p>Dear Partner,</p>
      <p>We regret to inform you that your services for <strong>${businessName}</strong> have been suspended due to non-payment of subscription fees after the 10-day grace period.</p>
      <p>Your license key and login sessions have been temporarily deactivated.</p>
      
      <div style="background-color: #FDF2F2; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0; color: #9B1C1C;">
        Please make payment immediately via UPI or Cash at the administrative portal to reactivate your product key and resume operations.
      </div>

      <p>Thank you,</p>
      <p>${legalName} Billing Team</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${legalName} &copy; 2026. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail({ to: clientEmail, subject, html });
};

/**
 * Sends a pending invoice bill email containing the invoice PDF.
 */
export const sendPendingInvoiceEmail = async (clientEmail, businessName, invoiceNo, invoiceBuffer, gracePeriodEndsAt) => {
  const legalName = await getRetropLegalName();
  const subject = `Urgent: Pending Invoice ${invoiceNo} for ${businessName} 📄`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; color: #333;">
      <h2 style="color: #FF6B35; text-align: center;">Subscription Renewal Generated</h2>
      <p>Hello,</p>
      <p>A new subscription renewal invoice has been generated for <strong>${businessName}</strong>.</p>
      <p>Please find attached your invoice <strong>${invoiceNo}</strong> (including 18% GST). Payment is currently pending.</p>
      <p><strong>Grace Period Ends:</strong> ${new Date(gracePeriodEndsAt).toLocaleDateString('en-IN')}</p>
      
      <div style="background-color: #FFFBEB; padding: 15px; border-left: 4px solid #FF6B35; margin: 20px 0; color: #B45309;">
         Please make payment via UPI or Cash on your super-admin panel before the grace period ends to ensure uninterrupted service.
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${legalName} &copy; 2026. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail({
    to: clientEmail,
    subject,
    html,
    attachments: [
      {
        filename: `${invoiceNo.replace(/\//g, '_')}.pdf`,
        content: invoiceBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

/**
 * Sends credentials email containing the product key, admin details, and passwords.
 */
export const sendCredentialsEmail = async (clientEmail, businessName, productKey, adminsInfo) => {
  const legalName = await getRetropLegalName();
  const subject = `RMS Application Activation & Login Credentials - ${businessName} 🔑`;
  
  let adminsHtml = '';
  adminsInfo.forEach(admin => {
    const defaultPassword = admin.mobile.substring(0, 5) + '@password';
    adminsHtml += `
      <div style="margin-bottom: 15px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
        <strong style="color: #374151;">Role: ${admin.role.toUpperCase()} (${admin.name})</strong><br/>
        <strong>Username / Mobile:</strong> ${admin.mobile}<br/>
        <strong>Default Password:</strong> ${defaultPassword}
      </div>
    `;
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; color: #333;">
      <h2 style="color: #FF6B35; text-align: center;">RMS Configuration Details</h2>
      <p>Hello,</p>
      <p>Your Restaurant Management System (RMS) configuration has been successfully completed for <strong>${businessName}</strong>.</p>
      
      <div style="background-color: #FFF5F5; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0;">
         <h4 style="margin-top: 0; color: #B91C1C;">🔑 Product License Key</h4>
         <code style="font-family: monospace; font-size: 16px; font-weight: bold; color: #EF4444; background: #FFF5F5; padding: 4px 8px; border-radius: 4px; border: 1px solid #FCA5A5; display: inline-block;">${productKey}</code>
      </div>

      <h4 style="color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px;">Login Accounts & Credentials</h4>
      ${adminsHtml}
      
      <div style="background-color: #EFF6FF; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0; color: #1E3A8A; font-size: 13px; line-height: 1.5;">
        <strong>Instructions:</strong><br/>
        Please follow the instructions given by Retrop to use these credentials for a smart and easy flow.
        <ol style="margin-top: 6px; padding-left: 20px;">
          <li>Open the RMS App on your tablet or mobile device.</li>
          <li>Go to Settings (⚙) and paste your server URL and the <strong>Product License Key</strong> shown above.</li>
          <li>Save configuration and log in with your account credentials.</li>
        </ol>
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">
        ${legalName} &copy; 2026. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail({ to: clientEmail, subject, html });
};
