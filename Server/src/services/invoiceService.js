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
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- COLOR PALETTE ---
      const primaryColor = '#FF6B35';
      const secondaryColor = '#2EC4B6';
      const textColor = '#333333';
      const mutedTextColor = '#777777';

      // --- HEADER SECTION ---
      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .text(retropConfig.legalName, 50, 50, { bold: true })
        .fontSize(10)
        .fillColor(textColor)
        .text(retropConfig.legalName, 50, 75)
        .text(retropConfig.address, 50, 90, { width: 250 })
        .text(`Email: ${retropConfig.email} | Mobile: ${retropConfig.mobile}`, 50, 130);

      const isTaxEnabled = retropConfig.isTaxEnabled !== false;

      // --- INVOICE METADATA (Right-aligned) ---
      doc
        .fontSize(18)
        .fillColor(primaryColor)
        .text(isTaxEnabled ? 'TAX INVOICE' : 'INVOICE', 350, 50, { align: 'right', bold: true })
        .fontSize(10)
        .fillColor(textColor)
        .text(`Invoice No: ${transaction.invoiceNo}`, 350, 75, { align: 'right' })
        .text(`Date: ${new Date(transaction.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 350, 90, { align: 'right' });

      if (isTaxEnabled) {
        doc.text(`Our GSTIN: ${retropConfig.gstin}`, 350, 105, { align: 'right', bold: true });
      }

      doc.text(`Payment Mode: ${transaction.paymentMethod}`, 350, isTaxEnabled ? 120 : 105, { align: 'right' });

      if (transaction.paymentMethod === 'UPI' && transaction.upiTransactionId) {
        doc.text(`UPI Ref No: ${transaction.upiTransactionId}`, 350, isTaxEnabled ? 135 : 120, { align: 'right' });
      }

      // Draw a line separator
      doc.moveTo(50, 160).lineTo(545, 160).strokeColor('#dddddd').lineWidth(1).stroke();

      // --- BILL TO SECTION ---
      doc
        .fontSize(12)
        .fillColor(secondaryColor)
        .text('BILL TO:', 50, 180, { bold: true })
        .fontSize(10)
        .fillColor(textColor)
        .text(restaurant.businessName, 50, 195, { bold: true })
        .text(`Owner: ${restaurant.ownerName}`, 50, 210)
        .text(`Mobile: ${restaurant.ownerMobile}`, 50, 225);

      if (restaurant.hasGst && restaurant.gstin) {
        doc.text(`Client GSTIN: ${restaurant.gstin}`, 50, 240, { bold: true });
      }

      // --- INVOICE ITEMS TABLE ---
      let currentHeight = 280;

      // Table Header
      doc
        .fillColor('#f5f5f5')
        .rect(50, currentHeight, 495, 20)
        .fill();

      doc
        .fillColor(textColor)
        .fontSize(9)
        .text('DESCRIPTION', 60, currentHeight + 5, { bold: true });

      if (isTaxEnabled) {
        doc
          .text('TAX RATE', 300, currentHeight + 5, { bold: true, align: 'right', width: 60 })
          .text('BASE PRICE', 370, currentHeight + 5, { bold: true, align: 'right', width: 80 });
      }

      doc.text(isTaxEnabled ? 'TOTAL (INR)' : 'AMOUNT (INR)', 460, currentHeight + 5, { bold: true, align: 'right', width: 80 });

      currentHeight += 20;

      // Table Row
      doc
        .fontSize(10)
        .text(transaction.description, 60, currentHeight + 10, { width: isTaxEnabled ? 230 : 390 });

      if (isTaxEnabled) {
        const rateVal = transaction.baseAmount > 0 
          ? ((transaction.gstAmount / transaction.baseAmount) * 100).toFixed(2)
          : (retropConfig.gstRate !== undefined ? parseFloat(retropConfig.gstRate).toFixed(2) : '18.00');
        doc
          .text(`${rateVal}%`, 300, currentHeight + 10, { align: 'right', width: 60 })
          .text(`INR ${parseFloat(transaction.baseAmount).toFixed(2)}`, 370, currentHeight + 10, { align: 'right', width: 80 });
      }

      doc.text(`INR ${parseFloat(transaction.finalAmount).toFixed(2)}`, 460, currentHeight + 10, { align: 'right', width: 80 });

      // Draw bottom row line
      doc.moveTo(50, currentHeight + 35).lineTo(545, currentHeight + 35).strokeColor('#dddddd').lineWidth(1).stroke();

      currentHeight += 35;

      // --- CALCULATIONS / SUMMARY ---
      const rightX = 350;
      if (isTaxEnabled) {
        const halfGst = (parseFloat(transaction.gstAmount) / 2).toFixed(2);
        const rateVal = transaction.baseAmount > 0 
          ? ((transaction.gstAmount / transaction.baseAmount) * 100)
          : (retropConfig.gstRate !== undefined ? parseFloat(retropConfig.gstRate) : 18.00);
        const halfRate = (rateVal / 2).toFixed(2);

        doc
          .fontSize(10)
          .text('Subtotal:', rightX, currentHeight + 15, { width: 100 })
          .text(`INR ${parseFloat(transaction.baseAmount).toFixed(2)}`, 450, currentHeight + 15, { align: 'right', width: 95 })
          
          .text(`CGST (${halfRate}%):`, rightX, currentHeight + 30, { width: 100 })
          .text(`INR ${halfGst}`, 450, currentHeight + 30, { align: 'right', width: 95 })
          
          .text(`SGST (${halfRate}%):`, rightX, currentHeight + 45, { width: 100 })
          .text(`INR ${halfGst}`, 450, currentHeight + 45, { align: 'right', width: 95 });

        // Draw double line for grand total
        doc.moveTo(350, currentHeight + 65).lineTo(545, currentHeight + 65).strokeColor('#dddddd').lineWidth(1).stroke();

        doc
          .fontSize(12)
          .fillColor(primaryColor)
          .text('Grand Total:', rightX, currentHeight + 72, { bold: true, width: 100 })
          .text(`INR ${parseFloat(transaction.finalAmount).toFixed(2)}`, 450, currentHeight + 72, { bold: true, align: 'right', width: 95 });

        doc.moveTo(350, currentHeight + 92).lineTo(545, currentHeight + 92).strokeColor('#dddddd').lineWidth(1).stroke();
      } else {
        // Direct Total Amount without GST breakdown
        doc
          .fontSize(12)
          .fillColor(primaryColor)
          .text('Total Amount:', rightX, currentHeight + 15, { bold: true, width: 100 })
          .text(`INR ${parseFloat(transaction.finalAmount).toFixed(2)}`, 450, currentHeight + 15, { bold: true, align: 'right', width: 95 });

        doc.moveTo(350, currentHeight + 35).lineTo(545, currentHeight + 35).strokeColor('#dddddd').lineWidth(1).stroke();
      }



      // --- FOOTER NOTE ---
      doc
        .fontSize(9)
        .fillColor(mutedTextColor)
        .text('This is a computer-generated tax invoice and does not require signature.', 50, 750, { align: 'center' })
        .text('Thank you for your business!', 50, 765, { align: 'center', bold: true });

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
