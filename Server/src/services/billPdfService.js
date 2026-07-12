import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger.js';

/**
 * Generates a PDF invoice for a customer dining order.
 * Returns a Promise resolving to a Buffer.
 * 
 * @param {Object} order - Order database record
 * @param {Object} restaurant - Restaurant details record
 * @param {Object} settings - Restaurant settings record
 */
export const generateOrderBillPDF = (order, restaurant, settings) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- COLOR PALETTE ---
      const primaryColor = '#1e293b'; // Slate 800
      const accentColor = '#e85d3a';  // Retrop Orange Accent
      const textColor = '#334155';    // Slate 700
      const mutedTextColor = '#64748b'; // Slate 500
      const lightBgColor = '#f8fafc'; // Slate 50

      // Draw Top Accent bar
      doc.rect(0, 0, 595, 12).fill(accentColor);

      // --- HEADER SECTION ---
      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .text(restaurant?.businessName || 'Retrop Restaurant', 40, 35, { bold: true })
        .fontSize(9)
        .fillColor(textColor)
        .text(restaurant?.address || '', 40, 65, { width: 280, lineGap: 2 });

      if (restaurant?.ownerMobile) {
        doc.text(`Contact: ${restaurant.ownerMobile}`, 40, 105);
      }

      // --- BILL METADATA (Right-aligned) ---
      doc
        .fontSize(16)
        .fillColor(primaryColor)
        .text('BILL RECEIPT', 350, 35, { align: 'right', bold: true })
        .fontSize(9)
        .fillColor(textColor);

      const isTaxEnabled = settings?.isTaxEnabled !== false;
      const metadataLines = [
        `Invoice No: ${order.invoiceNo || 'N/A'}`,
        `Order No: #${order.dailyOrderNo || 'N/A'}`,
        `Table No: Table ${order.tableNo || 'N/A'}`,
        `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}`,
        `Time: ${new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      ];

      if (order.isPaymentCompleted) {
        metadataLines.push(`Payment Status: PAID (${order.paymentMethod || 'Cash'})`);
      } else {
        metadataLines.push(`Payment Status: UNPAID`);
      }

      const metadataText = metadataLines.join('\n');
      doc.text(metadataText, 350, 55, { align: 'right', lineGap: 3 });

      // Calculate separator line position
      const metadataHeight = doc.heightOfString(metadataText, { width: 200, lineGap: 3 });
      const separatorY = 55 + metadataHeight + 15;
      doc.moveTo(40, separatorY).lineTo(555, separatorY).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // --- CUSTOMER DETAILS ---
      const customerY = separatorY + 15;
      doc
        .fontSize(10)
        .fillColor(accentColor)
        .text('CUSTOMER DETAILS:', 40, customerY, { bold: true })
        .fontSize(9)
        .fillColor(textColor)
        .text(`Name: ${order.customerName || order.customer?.name || 'Guest'}`, 40, customerY + 15)
        .text(`Mobile: ${order.mobile || 'N/A'}`, 40, customerY + 28);

      // --- ITEMS TABLE ---
      let tableY = customerY + 60;
      
      // Header row
      doc.rect(40, tableY, 515, 20).fill(lightBgColor);
      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .text('Item Description', 50, tableY + 6, { bold: true })
        .text('Price (₹)', 290, tableY + 6, { bold: true, width: 60, align: 'right' })
        .text('Qty', 380, tableY + 6, { bold: true, width: 40, align: 'center' })
        .text('Amount (₹)', 460, tableY + 6, { bold: true, width: 85, align: 'right' });

      // Separator under header
      doc.moveTo(40, tableY + 20).lineTo(555, tableY + 20).strokeColor('#cbd5e1').lineWidth(1).stroke();

      let currentY = tableY + 25;
      const items = order.ordersInfo || [];

      for (const item of items) {
        if (currentY > 700) {
          doc.addPage();
          doc.rect(0, 0, 595, 12).fill(accentColor);
          currentY = 40;
        }

        const amt = item.price * item.quantity;
        doc
          .fillColor(textColor)
          .fontSize(9)
          .text(item.dishName, 50, currentY, { width: 220 })
          .text(item.price.toFixed(2), 290, currentY, { width: 60, align: 'right' })
          .text(String(item.quantity), 380, currentY, { width: 40, align: 'center' })
          .text(amt.toFixed(2), 460, currentY, { width: 85, align: 'right' });

        const textHeight = doc.heightOfString(item.dishName, { width: 220 });
        currentY += Math.max(textHeight, 15) + 6;

        // Line under item
        doc.moveTo(40, currentY - 3).lineTo(555, currentY - 3).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      }

      // --- BILL SUMMARY ---
      let summaryY = currentY + 10;
      if (summaryY > 680) {
        doc.addPage();
        doc.rect(0, 0, 595, 12).fill(accentColor);
        summaryY = 40;
      }

      const boxWidth = 220;
      const boxX = 335;
      
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discount = order.discountAmount || 0;
      const taxableAmount = subtotal - discount;
      
      const gstRate = settings?.gstRate !== undefined ? parseFloat(settings.gstRate) : 5.00;
      const gstAmt = order.gstAmount !== undefined ? parseFloat(order.gstAmount) : (isTaxEnabled ? taxableAmount * (gstRate / 100) : 0);
      const finalAmount = order.finalAmount !== undefined ? parseFloat(order.finalAmount) : (taxableAmount + gstAmt);

      doc.rect(boxX, summaryY, boxWidth, 90).fill('#f8fafc');
      doc.rect(boxX, summaryY, boxWidth, 90).strokeColor('#e2e8f0').lineWidth(1).stroke();

      let sumItemY = summaryY + 8;
      doc.fillColor(textColor).fontSize(8.5);

      // Subtotal
      doc.text('Subtotal:', boxX + 10, sumItemY).text(`₹${subtotal.toFixed(2)}`, boxX + 110, sumItemY, { align: 'right', width: 100 });
      sumItemY += 15;

      // Discount
      if (discount > 0) {
        doc.text('Discount:', boxX + 10, sumItemY).text(`- ₹${discount.toFixed(2)}`, boxX + 110, sumItemY, { align: 'right', width: 100 });
        sumItemY += 15;
      }

      // GST Tax
      if (isTaxEnabled && gstAmt > 0) {
        doc.text(`GST (${gstRate}%):`, boxX + 10, sumItemY).text(`₹${gstAmt.toFixed(2)}`, boxX + 110, sumItemY, { align: 'right', width: 100 });
        sumItemY += 15;
      }

      // Grand Total
      doc.moveTo(boxX, sumItemY - 2).lineTo(boxX + boxWidth, sumItemY - 2).strokeColor('#cbd5e1').stroke();
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .text('Grand Total:', boxX + 10, sumItemY, { bold: true })
        .text(`₹${finalAmount.toFixed(2)}`, boxX + 110, sumItemY, { align: 'right', width: 100, bold: true });

      // --- FOOTER MESSAGE ---
      doc
        .fillColor(mutedTextColor)
        .fontSize(9)
        .text('Thank you for dining with us!', 40, 750, { align: 'center' })
        .text('Powered by Retrop Restaurant Automation Solutions', 40, 765, { align: 'center' });

      doc.end();
    } catch (err) {
      logger.error('generateOrderBillPDF error', err.message);
      reject(err);
    }
  });
};
