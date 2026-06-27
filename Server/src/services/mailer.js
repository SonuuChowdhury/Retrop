import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { encryptSetupPayload } from '../utils/crypto.js';
import QRCode from 'qrcode';

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
async function getRetropConfig() {
  try {
    const { data } = await supabase
      .from('retrop_business_config')
      .select('*')
      .maybeSingle();
    if (data) {
      return {
        legalName: data.legalName || 'Retrop Software Solutions',
        isTaxEnabled: data.isTaxEnabled !== false,
        gstRate: data.gstRate !== undefined ? parseFloat(data.gstRate) : 18.00,
        gstin: data.gstin || '',
      };
    }
  } catch (err) {
    logger.warn('Failed to fetch config from retrop_business_config', err.message);
  }
  return {
    legalName: 'Retrop Software Solutions',
    isTaxEnabled: true,
    gstRate: 18.00,
    gstin: '09AAAAA1111A1Z1',
  };
}

async function getRetropLegalName() {
  const config = await getRetropConfig();
  return config.legalName;
}

/**
 * Sends a welcome email to a newly onboarded client.
 */
export const sendWelcomeEmail = async (clientEmail, businessName, ownerName, mobile, gender) => {
  const legalName = await getRetropLegalName();
  const subject = `Welcome to ${legalName} - Account Activated`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #ea580c; text-align: center; margin-top: 0; font-weight: 600;">Welcome to ${legalName}</h2>
      <p>Dear <strong>${ownerName}</strong>,</p>
      <p>Thank you for choosing ${legalName} for <strong>${businessName}</strong>. We are pleased to confirm that your account is now active and registered in our system.</p>
      
      <div style="background-color: #f9fafb; padding: 16px; border-left: 4px solid #ea580c; margin: 24px 0; border-radius: 0 6px 6px 0;">
         <h4 style="margin: 0 0 12px 0; color: #ea580c; font-size: 16px;">Registered Owner Details</h4>
         <p style="margin: 6px 0; font-size: 14px;"><strong>Owner Name:</strong> ${ownerName}</p>
         <p style="margin: 6px 0; font-size: 14px;"><strong>Owner Email:</strong> ${clientEmail || 'N/A'}</p>
         <p style="margin: 6px 0; font-size: 14px;"><strong>Owner Mobile:</strong> ${mobile}</p>
         <p style="margin: 6px 0; font-size: 14px;"><strong>Gender:</strong> ${gender || 'N/A'}</p>
      </div>

      <p>Your application settings and billing details will be sent to you as soon as your registration is completed by the administrative team.</p>
      <p>If you have any questions or require assistance, please feel free to contact our support department.</p>
      
      <p style="margin-top: 24px;">Sincerely,<br/><strong>The ${legalName} Team</strong></p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
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
  const config = await getRetropConfig();
  const legalName = config.legalName;
  const subject = `Invoice ${invoiceNo} from ${legalName}`;
  
  let planDetailsHtml = `
    <div style="background-color: #f9fafb; padding: 16px; border-left: 4px solid #059669; margin: 24px 0; border-radius: 0 6px 6px 0;">
       <h4 style="margin: 0 0 12px 0; color: #059669; font-size: 16px;">Billing & Plan Details</h4>
       <p style="margin: 6px 0; font-size: 14px;"><strong>Owner Name:</strong> ${ownerName || 'N/A'}</p>
       <p style="margin: 6px 0; font-size: 14px;"><strong>Plan Name:</strong> ${planName || 'N/A'}</p>
       <p style="margin: 6px 0; font-size: 14px;"><strong>Plan Type:</strong> ${planType === 'monthly' ? 'Monthly Subscription' : planType === 'lifetime' ? 'Lifetime License' : 'Support Incident'}</p>
  `;

  if (planType === 'monthly' && nextBillingDate) {
    planDetailsHtml += `
       <p style="margin: 6px 0; font-size: 14px;"><strong>Next Billing Date:</strong> ${new Date(nextBillingDate).toLocaleDateString('en-IN')}</p>
    `;
  }

  planDetailsHtml += `</div>`;

  const taxNote = config.isTaxEnabled 
    ? `(inclusive of ${config.gstRate}% GST)` 
    : '(no tax applicable)';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #059669; text-align: center; margin-top: 0; font-weight: 600;">Payment Confirmed</h2>
      <p>Dear <strong>${ownerName || ''}</strong>,</p>
      <p>We are pleased to inform you that we have successfully processed your payment for <strong>${businessName}</strong>.</p>
      <p>Please find attached invoice <strong>${invoiceNo}</strong> ${taxNote} for your records.</p>
      
      ${planDetailsHtml}
      
      <p>If this transaction was completed via UPI, you can access your full transaction history anytime through the administration panel.</p>

      <p style="margin-top: 24px;">Sincerely,<br/><strong>The ${legalName} Billing Team</strong></p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
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
  const config = await getRetropConfig();
  const legalName = config.legalName;
  const isGracePeriod = daysRemaining <= 0;
  const subject = isGracePeriod 
    ? `URGENT ACTION REQUIRED: Subscription Expired for ${businessName}`
    : `Subscription Renewal Notice - ${businessName}`;
  
  const textTitle = isGracePeriod ? 'Subscription Expired - Immediate Action Required' : 'Subscription Renewal Notice';
  const textInfo = isGracePeriod
    ? `Your subscription expired on <strong>${new Date(nextBillingDate).toLocaleDateString('en-IN')}</strong>. You are currently in the 10-day grace period. To ensure uninterrupted service, please settle the outstanding invoice immediately.`
    : `This is a reminder that your subscription for <strong>${businessName}</strong> is scheduled for renewal on <strong>${new Date(nextBillingDate).toLocaleDateString('en-IN')}</strong> (${daysRemaining} days remaining).`;

  const taxNote = config.isTaxEnabled 
    ? `${config.gstRate}% GST applicable` 
    : 'No tax applicable';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937; line-height: 1.6;">
      <h2 style="color: ${isGracePeriod ? '#dc2626' : '#ea580c'}; text-align: center; margin-top: 0; font-weight: 600;">${textTitle}</h2>
      <p>Dear Partner,</p>
      <p>${textInfo}</p>
      
      <div style="background-color: #f9fafb; padding: 16px; border-left: 4px solid ${isGracePeriod ? '#dc2626' : '#ea580c'}; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <h4 style="margin: 0 0 12px 0; color: ${isGracePeriod ? '#dc2626' : '#ea580c'}; font-size: 16px;">Billing Details</h4>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Base Rate:</strong> ${taxNote}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Outstanding Bill:</strong> Please review and complete your payment via the administrative panel link.</p>
      </div>

      <p>Thank you for your prompt attention to this matter.</p>
      <p style="margin-top: 24px;">Sincerely,<br/><strong>The ${legalName} Billing Team</strong></p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
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
  const subject = `SERVICE SUSPENDED: ${businessName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #dc2626; text-align: center; margin-top: 0; font-weight: 600;">Service Suspension Notice</h2>
      <p>Dear Partner,</p>
      <p>We regret to inform you that the services for <strong>${businessName}</strong> have been suspended due to non-payment of outstanding subscription fees past the grace period.</p>
      <p>Consequently, your license key and associated login sessions have been temporarily deactivated.</p>
      
      <div style="background-color: #fef2f2; padding: 16px; border-left: 4px solid #dc2626; margin: 24px 0; color: #991b1b; border-radius: 0 6px 6px 0; font-size: 14px;">
        To reactivate your license key and resume restaurant operations, please settle your outstanding balance immediately via UPI or Cash through the administrative portal.
      </div>

      <p>Thank you for your prompt attention to this matter.</p>
      <p style="margin-top: 24px;">Sincerely,<br/><strong>The ${legalName} Billing Team</strong></p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
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
  const config = await getRetropConfig();
  const legalName = config.legalName;
  const subject = `Pending Invoice ${invoiceNo} - Renewal for ${businessName}`;
  const taxNote = config.isTaxEnabled 
    ? `(inclusive of ${config.gstRate}% GST)` 
    : '(no tax applicable)';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #ea580c; text-align: center; margin-top: 0; font-weight: 600;">Subscription Renewal Invoice</h2>
      <p>Dear Partner,</p>
      <p>A renewal invoice has been generated for your subscription to <strong>${businessName}</strong>.</p>
      <p>Please find attached invoice <strong>${invoiceNo}</strong> ${taxNote}. Payment for this period is currently outstanding.</p>
      <p><strong>Grace Period Ends:</strong> ${new Date(gracePeriodEndsAt).toLocaleDateString('en-IN')}</p>
      
      <div style="background-color: #fffbef; padding: 16px; border-left: 4px solid #ea580c; margin: 24px 0; color: #9a3412; border-radius: 0 6px 6px 0; font-size: 14px;">
         Please complete your payment via UPI or Cash through the administration panel before the grace period expires to ensure uninterrupted service.
      </div>

      <p style="margin-top: 24px;">Sincerely,<br/><strong>The ${legalName} Billing Team</strong></p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
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
export const sendCredentialsEmail = async (clientEmail, businessName, productKey, adminsInfo, serverUrl) => {
  const legalName = await getRetropLegalName();
  const subject = `RMS Application Activation & Login Credentials - ${businessName}`;
  
  let adminsHtml = '';
  adminsInfo.forEach(admin => {
    const defaultPassword = admin.mobile.substring(0, 5) + '@password';
    adminsHtml += `
      <div style="margin-bottom: 12px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; font-size: 14px;">
        <strong style="color: #374151; display: block; margin-bottom: 4px;">Role: ${admin.role.toUpperCase()} (${admin.name})</strong>
        <strong>Username / Mobile:</strong> ${admin.mobile}<br/>
        <strong>Default Password:</strong> ${defaultPassword}
      </div>
    `;
  });

  let qrCodeAttachment = null;
  let qrCodeHtml = '';
  if (serverUrl) {
    try {
      const cipherText = encryptSetupPayload(serverUrl, productKey);
      const qrDataUrl = await QRCode.toDataURL(cipherText, { errorCorrectionLevel: 'H' });
      const base64Data = qrDataUrl.split(',')[1];
      qrCodeAttachment = {
        filename: 'setup-qrcode.png',
        content: Buffer.from(base64Data, 'base64'),
        cid: 'setupqrcode',
      };
      qrCodeHtml = `
        <div style="background-color: #f0fdf4; padding: 20px; border: 1.5px dashed #16a34a; border-radius: 8px; text-align: center; margin: 24px 0;">
           <h4 style="margin: 0 0 8px 0; color: #16a34a; font-size: 16px;">App Quick Configuration QR Code</h4>
           <p style="margin: 0 0 16px 0; font-size: 13px; color: #15803d;">
             Scan the QR code below from the app settings menu to automatically configure your connection and activate the product license key.
           </p>
           <div style="text-align: center;">
             <img src="cid:setupqrcode" alt="App Configuration QR Code" style="width: 200px; height: 200px; display: inline-block;" />
           </div>
        </div>
      `;
    } catch (qrErr) {
      logger.error('Failed to generate QR Code for credentials email', qrErr.message);
    }
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #ea580c; text-align: center; margin-top: 0; font-weight: 600;">RMS Configuration Details</h2>
      <p>Dear Partner,</p>
      <p>The configuration of your Restaurant Management System (RMS) has been successfully completed for <strong>${businessName}</strong>.</p>
      
      <div style="background-color: #fef2f2; padding: 16px; border-left: 4px solid #dc2626; margin: 24px 0; border-radius: 0 6px 6px 0;">
         <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px;">Product License Key</h4>
         <code style="font-family: monospace; font-size: 16px; font-weight: bold; color: #dc2626; background: #fff5f5; padding: 6px 12px; border-radius: 4px; border: 1px solid #fca5a5; display: inline-block;">${productKey}</code>
      </div>

      <h4 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px; font-size: 16px;">Login Accounts & Credentials</h4>
      ${adminsHtml}
      
      <div style="background-color: #eff6ff; padding: 16px; border-left: 4px solid #2563eb; margin: 24px 0; color: #1e3a8a; font-size: 14px; line-height: 1.5; border-radius: 0 6px 6px 0;">
        <strong>Configuration Instructions:</strong><br/>
        Please follow the steps below to configure your application with these credentials:
        <ol style="margin-top: 8px; padding-left: 20px; margin-bottom: 0;">
          <li>Open the RMS App on your tablet or mobile device.</li>
          <li>Go to Settings, tap the edit icon, and scan the <strong>Configuration QR Code</strong> shown below.</li>
          <li>Save the configuration and log in with your administrative credentials.</li>
        </ol>
      </div>

      ${qrCodeHtml}

      <p>If you require any technical assistance during this setup, please contact our support department.</p>
      <p style="margin-top: 24px;">Sincerely,<br/><strong>The ${legalName} Support Team</strong></p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
        ${legalName} &copy; 2026. All rights reserved.
      </p>
    </div>
  `;

  const attachments = [];
  if (qrCodeAttachment) {
    attachments.push(qrCodeAttachment);
  }

  return sendEmail({ to: clientEmail, subject, html, attachments });
};
