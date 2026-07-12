import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Generates a PDF invoice for a given transaction.
 * Returns a Promise that resolves to a Buffer containing the PDF data.
 * 
 * @param {Object} transaction - Transaction database record
 * @param {Object} restaurant - Restaurant database record
 * @param {Object} retropConfig - Retrop configuration database record
 */
export const generateInvoicePDF = (transaction, restaurant, retropConfig) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch subscription with pricing plan details to enrich the bill
      let subscription = null;
      let plan = null;
      if (transaction.subscriptionId) {
        try {
          const { data: subData } = await supabase
            .from('subscription')
            .select('*, pricing_plan(*)')
            .eq('subscriptionId', transaction.subscriptionId)
            .maybeSingle();
          if (subData) {
            subscription = subData;
            plan = subData.pricing_plan;
          }
        } catch (dbErr) {
          logger.warn('Failed to fetch plan details for invoice PDF', dbErr.message);
        }
      }

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- COLOR PALETTE ---
      const primaryColor = '#0f172a'; // Slate 900
      const accentColor = '#ea580c';  // Orange 600
      const textColor = '#1e293b';    // Slate 800
      const mutedTextColor = '#64748b'; // Slate 500
      const lightBgColor = '#f8fafc'; // Slate 50

      // Draw Top Accent bar
      doc.rect(0, 0, 595, 15).fill(accentColor);

      // --- HEADER SECTION ---
      doc
        .fillColor(primaryColor)
        .fontSize(24)
        .text('RETROP', 50, 45, { bold: true })
        .fontSize(9)
        .fillColor(textColor)
        .text(retropConfig.legalName, 50, 80, { bold: true })
        .text(retropConfig.address, 50, 95, { width: 250, lineGap: 2 })
        .text(`Email: ${retropConfig.email} | Support: ${retropConfig.mobile}`, 50, 130);

      const isTaxEnabled = retropConfig.isTaxEnabled !== false;

      // --- INVOICE METADATA (Right-aligned) ---
      doc
        .fontSize(16)
        .fillColor(primaryColor)
        .text(isTaxEnabled ? 'TAX INVOICE' : 'INVOICE', 350, 45, { align: 'right', bold: true })
        .fontSize(9)
        .fillColor(textColor);

      const metadataLines = [
        `Invoice No: ${transaction.invoiceNo}`,
        `Date: ${new Date(transaction.createdAt || Date.now()).toLocaleDateString('en-IN')}`
      ];
      if (isTaxEnabled) {
        metadataLines.push(`GSTIN: ${retropConfig.gstin}`);
      }
      metadataLines.push(`Payment Mode: ${transaction.paymentMethod}`);
      if (transaction.paymentMethod === 'UPI' && transaction.upiTransactionId) {
        metadataLines.push(`UPI UTR: ${transaction.upiTransactionId}`);
      }
      if (plan) {
        metadataLines.push(`Plan Name: ${plan.name} (${plan.planType.toUpperCase()})`);
        if (plan.planType === 'monthly' && subscription && subscription.startDate && subscription.endDate) {
          const fromDate = new Date(subscription.startDate).toLocaleDateString('en-IN');
          const toDate = new Date(subscription.endDate).toLocaleDateString('en-IN');
          metadataLines.push(`Period: ${fromDate} to ${toDate}`);
        }
      }

      const metadataText = metadataLines.join('\n');
      doc.text(metadataText, 350, 70, { align: 'right', lineGap: 3 });

      // Calculate dynamic separator position based on metadata block height
      const metadataHeight = doc.heightOfString(metadataText, { width: 195, lineGap: 3 });
      const separatorY = 70 + metadataHeight + 15;
      doc.moveTo(50, separatorY).lineTo(545, separatorY).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // --- BILL TO SECTION ---
      const billToY = separatorY + 20;
      doc
        .fontSize(10)
        .fillColor(accentColor)
        .text('BILL TO (CLIENT DETAILS):', 50, billToY, { bold: true })
        .fontSize(9)
        .fillColor(textColor)
        .text(restaurant.businessName, 50, billToY + 15, { bold: true })
        .text(`Owner: ${restaurant.ownerName}`, 50, billToY + 30)
        .text(`Contact: ${restaurant.ownerMobile}`, 50, billToY + 45);

      if (restaurant.hasGst && restaurant.gstin) {
        doc.text(`Client GSTIN: ${restaurant.gstin}`, 50, billToY + 60, { bold: true });
      }

      // --- INVOICE ITEMS TABLE ---
      let currentHeight = billToY + 85;

      // Table Header Box
      doc
        .fillColor(primaryColor)
        .rect(50, currentHeight, 495, 22)
        .fill();

      doc
        .fillColor('#ffffff')
        .fontSize(8)
        .text('DESCRIPTION / LINE ITEM', 60, currentHeight + 7, { bold: true });

      if (isTaxEnabled) {
        doc
          .text('TAX RATE', 300, currentHeight + 7, { bold: true, align: 'right', width: 60 })
          .text('BASE PRICE', 370, currentHeight + 7, { bold: true, align: 'right', width: 80 });
      }

      doc.text(isTaxEnabled ? 'TOTAL (INR)' : 'AMOUNT (INR)', 465, currentHeight + 7, { bold: true, align: 'right', width: 75 });

      currentHeight += 22;

      // Table Row Background (higher padding to show dates if monthly)
      const rowHeight = (plan && plan.planType === 'monthly') ? 44 : 36;
      doc
        .fillColor(lightBgColor)
        .rect(50, currentHeight, 495, rowHeight)
        .fill();

      doc
        .fillColor(textColor)
        .fontSize(9)
        .text(transaction.description, 60, currentHeight + 10, { width: isTaxEnabled ? 230 : 390, bold: true });

      if (plan && plan.planType === 'monthly' && subscription && subscription.startDate && subscription.endDate) {
        const fromDate = new Date(subscription.startDate).toLocaleDateString('en-IN');
        const toDate = new Date(subscription.endDate).toLocaleDateString('en-IN');
        doc
          .fontSize(8)
          .fillColor(mutedTextColor)
          .text(`Validity Cycle: ${fromDate} to ${toDate}`, 60, currentHeight + 24, { width: isTaxEnabled ? 230 : 390 });
      }

      if (isTaxEnabled) {
        const rateVal = transaction.baseAmount > 0 
          ? ((transaction.gstAmount / transaction.baseAmount) * 100).toFixed(2)
          : (retropConfig.gstRate !== undefined ? parseFloat(retropConfig.gstRate).toFixed(2) : '18.00');
        doc
          .text(`${rateVal}%`, 300, currentHeight + 14, { align: 'right', width: 60 })
          .text(`INR ${parseFloat(transaction.baseAmount).toFixed(2)}`, 370, currentHeight + 14, { align: 'right', width: 80 });
      }

      doc.text(`INR ${parseFloat(transaction.finalAmount).toFixed(2)}`, 465, currentHeight + 14, { align: 'right', width: 75, bold: true });

      // Draw bottom row line
      doc.moveTo(50, currentHeight + rowHeight).lineTo(545, currentHeight + rowHeight).strokeColor('#cbd5e1').lineWidth(1).stroke();

      currentHeight += rowHeight;

      // --- CALCULATIONS / SUMMARY ---
      const rightX = 350;
      if (isTaxEnabled) {
        const halfGst = (parseFloat(transaction.gstAmount) / 2).toFixed(2);
        const rateVal = transaction.baseAmount > 0 
          ? ((transaction.gstAmount / transaction.baseAmount) * 100)
          : (retropConfig.gstRate !== undefined ? parseFloat(retropConfig.gstRate) : 18.00);
        const halfRate = (rateVal / 2).toFixed(2);

        doc
          .fontSize(9)
          .fillColor(mutedTextColor)
          .text('Subtotal:', rightX, currentHeight + 15, { width: 100 })
          .fillColor(textColor)
          .text(`INR ${parseFloat(transaction.baseAmount).toFixed(2)}`, 450, currentHeight + 15, { align: 'right', width: 95 })
          
          .fillColor(mutedTextColor)
          .text(`CGST (${halfRate}%):`, rightX, currentHeight + 30, { width: 100 })
          .fillColor(textColor)
          .text(`INR ${halfGst}`, 450, currentHeight + 30, { align: 'right', width: 95 })
          
          .fillColor(mutedTextColor)
          .text(`SGST (${halfRate}%):`, rightX, currentHeight + 45, { width: 100 })
          .fillColor(textColor)
          .text(`INR ${halfGst}`, 450, currentHeight + 45, { align: 'right', width: 95 });

        // Draw double line for grand total
        doc.moveTo(350, currentHeight + 63).lineTo(545, currentHeight + 63).strokeColor('#cbd5e1').lineWidth(1.5).stroke();

        doc
          .fontSize(11)
          .fillColor(primaryColor)
          .text('Grand Total:', rightX, currentHeight + 70, { bold: true, width: 100 })
          .text(`INR ${parseFloat(transaction.finalAmount).toFixed(2)}`, 450, currentHeight + 70, { bold: true, align: 'right', width: 95 });

        doc.moveTo(350, currentHeight + 88).lineTo(545, currentHeight + 88).strokeColor('#cbd5e1').lineWidth(1.5).stroke();
      } else {
        // Direct Total Amount without GST breakdown
        doc
          .fontSize(11)
          .fillColor(primaryColor)
          .text('Total Amount:', rightX, currentHeight + 15, { bold: true, width: 100 })
          .text(`INR ${parseFloat(transaction.finalAmount).toFixed(2)}`, 450, currentHeight + 15, { bold: true, align: 'right', width: 95 });

        doc.moveTo(350, currentHeight + 33).lineTo(545, currentHeight + 33).strokeColor('#cbd5e1').lineWidth(1.5).stroke();
      }

      // --- TERMS & CONDITIONS SECTION ---
      let tcHeight = isTaxEnabled ? currentHeight + 120 : currentHeight + 65;
      const tcText = [
        '1. Subscription package activations, incident billings, and platform setup fees are strictly NON-REFUNDABLE once processed.',
        '2. Monthly subscription validity dates are specified inside the line item above. Ensure payment renewals are cleared before expiration to prevent automatic POS service suspension.',
        '3. This document is a digitally generated tax invoice under applicable Indian GST rules and does not require a physical signature.'
      ].join('\n\n');

      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .text('TERMS, CONDITIONS & IMPORTANT POLICIES:', 50, tcHeight, { bold: true })
        .fontSize(8)
        .fillColor(mutedTextColor)
        .text(tcText, 50, tcHeight + 15, { width: 495, lineGap: 4 });

      // --- FOOTER NOTE ---
      doc
        .fontSize(8)
        .fillColor(mutedTextColor)
        .text('Thank you for choosing Retrop as your technology partner!', 50, 750, { align: 'center', bold: true });

      doc.end();
    } catch (err) {
      logger.error('generateInvoicePDF Error', err.message);
      reject(err);
    }
  });
};

/**
 * Uploads generated PDF invoice to Supabase Storage and returns the public URL.
 * 
 * @param {string} invoiceNo - Unique invoice identifier
 * @param {Buffer} pdfBuffer - PDF invoice data
 */
export const uploadInvoiceToStorage = async (invoiceNo, pdfBuffer) => {
  try {
    const filename = `${invoiceNo.replace(/\//g, '_')}.pdf`;
    const storagePath = `invoices/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('menu-images') // reuse menu-images bucket or we can configure another bucket
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      logger.error('Failed to upload PDF invoice to storage', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('menu-images').getPublicUrl(storagePath);
    return data.publicUrl;
  } catch (err) {
    logger.error('uploadInvoiceToStorage error', err.message);
    return null;
  }
};
