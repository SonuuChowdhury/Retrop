// ============================================================================
// MANAGER ANALYTICS SCREEN  (REDESIGNED)
// ============================================================================
// • Date-wise grouping with sticky section headers using SectionList
// • Infinite scroll loading in chunks of 20
// • Custom date-range selector bar with preset buttons & modal picker
// • Detailed invoice receipt modal (OrderDetailModal) with tax extraction
// • Robust waiter null-check optional chaining throughout
// • Fixed tab bar wrapping & alignment styling
// ============================================================================

import React, {
  useEffect, useState, useCallback, useRef, useMemo, memo,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, Modal, TextInput, SectionList, Platform, Share, Alert
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';
import { SkeletonLoader, SkeletonCard, SkeletonKPI, SkeletonRow } from '@/components/SkeletonLoader/SkeletonLoader';

const STALE_AFTER_MS = 2 * 60 * 1000;

// ============================================================================
// TYPES
// ============================================================================

interface SalesData {
  today: { totalSales: number; ordersCount: number; completedOrders: number; averageOrderValue: number };
  weekly: { dailySales: Record<string, number>; totalSales: number; ordersCount: number; averageDaily: string };
  monthly: { month: string; totalSales: number; ordersCount: number; averageOrderValue: string };
}
interface DishEntry { dishId: string; dishName: string; category: string; price: number; quantity: number }
interface OrderEntry {
  ordersId: string; dailyOrderNo: number; invoiceNo?: string; tableNo: number; orderStatus: string; totalAmount: number;
  finalAmount: number | null; taxBreakdown?: { name: string; percent: number; amount: number; inclusive?: boolean }[];
  discountBreakdown?: { name: string; percent: number; amount: number }[];
  discountAmount?: number;
  isPaymentCompleted: boolean; paymentMethod: string; createdAt: string;
  waiter?: { waiterName: string; mobile?: string } | null;
  customer?: { name: string; mobile: string } | null;
}
interface CustomerEntry { mobile: string; name: string; orderCount: number }
interface AnalyticsData {
  sales?: SalesData;
  dishes?: { bestSelling: DishEntry[] };
  paymentMethods?: Record<string, number>;
  orderStatus?: Record<string, number>;
  customers?: { top: CustomerEntry[] };
  completionTime?: { averageMinutes: number };
}
type TabKey = 'sales' | 'orders' | 'dishes' | 'payments' | 'customers';
type DateFilter = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;
const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
function relativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

// ── Calculate Date Ranges for Filters ──────────────────────────────────────
const getDateRange = (filter: DateFilter, customStart?: string, customEnd?: string) => {
  const now = new Date();
  const from = new Date();
  const to = new Date();

  if (filter === 'today') {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (filter === 'yesterday') {
    from.setDate(now.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    to.setDate(now.getDate() - 1);
    to.setHours(23, 59, 59, 999);
  } else if (filter === '7days') {
    from.setDate(now.getDate() - 7);
    from.setHours(0, 0, 0, 0);
  } else if (filter === '30days') {
    from.setDate(now.getDate() - 30);
    from.setHours(0, 0, 0, 0);
  } else if (filter === 'custom' && customStart && customEnd) {
    const s = new Date(customStart);
    s.setHours(0, 0, 0, 0);
    const e = new Date(customEnd);
    e.setHours(23, 59, 59, 999);
    return { from: s.toISOString(), to: e.toISOString() };
  }

  return { from: from.toISOString(), to: to.toISOString() };
};

// ============================================================================
// STYLISH MODAL: ORDER DETAILS INVOICE RECEIPT
// ============================================================================

interface OrderDetailModalProps {
  visible: boolean;
  orderId: string | null;
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  colors: any;
}

function OrderDetailModal({ visible, orderId, onClose, getAuthHeaders, colors }: OrderDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  useEffect(() => {
    if (!visible || !orderId) return;
    setLoading(true);
    setDetail(null);

    fetch(ENDPOINTS.MANAGER_ANALYTICS_ORDER_DETAIL(orderId), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(json => {
        if (json?.status === 'success') {
          setDetail(json.data);
        }
      })
      .catch(err => console.warn('Fetch order detail error', err))
      .finally(() => setLoading(false));
  }, [visible, orderId]);

  const invoice = useMemo(() => {
    if (!detail) return null;
    const { order, restaurantInfo } = detail;
    const isInclusive = restaurantInfo?.taxType === 'inclusive' || order?.taxBreakdown?.some((t: any) => t.inclusive);
    const totalTaxPercent = order?.taxBreakdown?.reduce((sum: number, t: any) => sum + (Number(t.percent) || 0), 0) || 0;
    const divisor = 1 + totalTaxPercent / 100;

    const items = (order.ordersInfo || []).map((item: any) => {
      const originalPrice = Number(item.price) || 0;
      const price = isInclusive ? parseFloat((originalPrice / divisor).toFixed(2)) : originalPrice;
      const quantity = Number(item.quantity) || 0;
      return {
        ...item,
        price,
        total: price * quantity,
      };
    });

    const subTotalForInclusive = order.finalAmount
      ? (Number(order.finalAmount) - (order.taxBreakdown?.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0) || 0))
      : Number(order.totalAmount);
    const subtotal = isInclusive ? parseFloat(subTotalForInclusive.toFixed(2)) : (Number(order.totalAmount) || 0);

    return {
      order: {
        ...order,
        taxBreakdown: (order.taxBreakdown || []).map((t: any) => ({
          ...t,
          percent: Number(t.percent) || 0,
          amount: Number(t.amount) || 0,
        })),
      },
      restaurantInfo,
      items,
      subtotal,
      isInclusive,
      grandTotal: Number(order.finalAmount ?? order.totalAmount) || 0,
      discountBreakdown: (order.discountBreakdown ?? []).map((d: any) => ({
        ...d,
        percent: Number(d.percent) || 0,
        amount: Number(d.amount) || 0,
      })),
      discountAmount: Number(order.discountAmount) || 0,
    };
  }, [detail]);

  const handleShareBill = async () => {
    if (!invoice) return;
    try {
      const { order, restaurantInfo, items, subtotal, grandTotal } = invoice;
      let text = `=================================\n`;
      text += `${restaurantInfo?.restaurantName || 'Restaurant'}\n`;
      if (restaurantInfo?.address) text += `${restaurantInfo.address}\n`;
      if (restaurantInfo?.mobile) text += `Tel: ${restaurantInfo.mobile}\n`;
      text += `=================================\n`;
      if (order.invoiceNo) text += `Invoice No: ${order.invoiceNo}\n`;
      text += `Order No: #${order.dailyOrderNo} | Table: ${order.tableNo}\n`;
      text += `Date: ${new Date(order.createdAt).toLocaleString()}\n`;
      text += `Payment: ${order.paymentMethod?.toUpperCase() || 'Pending'}\n`;
      text += `---------------------------------\n`;
      for (const item of items) {
        text += `${item.dishName} x${item.quantity} - ₹${item.total.toFixed(2)}\n`;
      }
      text += `---------------------------------\n`;
      text += `Subtotal: ₹${subtotal.toFixed(2)}\n`;
      for (const disc of invoice.discountBreakdown) {
        text += `Discount (${disc.name}): -₹${disc.amount.toFixed(2)}\n`;
      }
      for (const tax of order.taxBreakdown || []) {
        text += `${tax.name} (${tax.percent}%${tax.inclusive ? ' Incl.' : ''}): ₹${tax.amount.toFixed(2)}\n`;
      }
      text += `---------------------------------\n`;
      text += `TOTAL: ₹${grandTotal.toFixed(2)}\n`;
      text += `=================================\n`;
      text += `Thank you for your visit!\n`;

      await Share.share({
        message: text,
        title: order.invoiceNo ? `Receipt - ${order.invoiceNo}` : `Receipt - Order #${order.dailyOrderNo}`,
      });
    } catch (err: any) {
      console.warn('Share error:', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      const { order, restaurantInfo, items, subtotal, grandTotal } = invoice;
      
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .subtitle { font-size: 14px; color: #666; margin-bottom: 3px; }
              .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
              .meta-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
              .meta-label { color: #666; }
              .meta-val { font-weight: bold; }
              .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .items-table th { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 14px; }
              .items-table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 14px; }
              .text-right { text-align: right; }
              .totals { margin-top: 15px; }
              .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
              .total-row.grand { font-size: 18px; font-weight: bold; border-top: 1px solid #333; padding-top: 8px; margin-top: 8px; }
              .discount-row { color: #2a9d5c; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${restaurantInfo?.restaurantName || 'Restaurant'}</div>
              ${restaurantInfo?.address ? `<div class="subtitle">${restaurantInfo.address}</div>` : ''}
              ${restaurantInfo?.mobile ? `<div class="subtitle">📞 ${restaurantInfo.mobile}</div>` : ''}
              ${restaurantInfo?.isGST && restaurantInfo?.GSTIN ? `<div class="subtitle">GSTIN: ${restaurantInfo.GSTIN}</div>` : ''}
            </div>
            
            <div class="divider"></div>
            
            ${order.invoiceNo ? `<div style="text-align:center; font-size: 13px; color: #888; margin-bottom: 6px;">Invoice No: <strong>${order.invoiceNo}</strong></div>` : ''}
            <div class="meta-row">
              <div><span class="meta-label">Order No:</span> <span class="meta-val">#${order.dailyOrderNo}</span></div>
              <div><span class="meta-label">Table:</span> <span class="meta-val">Table ${order.tableNo}</span></div>
            </div>
            <div class="meta-row">
              <div><span class="meta-label">Date:</span> <span class="meta-val">${new Date(order.createdAt).toLocaleString()}</span></div>
              <div><span class="meta-label">Payment:</span> <span class="meta-val">${order.paymentMethod?.toUpperCase() || 'Pending'}</span></div>
            </div>
            <div class="meta-row">
              <div><span class="meta-label">Customer:</span> <span class="meta-val">${order.customer?.name ?? 'Guest'} (${order.customer?.mobile ?? '—'})</span></div>
              <div><span class="meta-label">Waiter:</span> <span class="meta-val">${order.waiter?.waiterName ?? 'Self/QR'}</span></div>
            </div>
            
            <div class="divider"></div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right" style="width: 60px;">Qty</th>
                  <th class="text-right" style="width: 80px;">Price</th>
                  <th class="text-right" style="width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>
                      <div>${item.dishName}</div>
                      ${item.remarks ? `<div style="font-size: 11px; color: #e67e22; font-style: italic;">Note: ${item.remarks}</div>` : ''}
                    </td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">₹${item.price.toFixed(2)}</td>
                    <td class="text-right">₹${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="divider"></div>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              
              ${(invoice.discountBreakdown || []).map((disc: any) => `
                <div class="total-row discount-row">
                  <span>🏷️ ${disc.name} (${disc.percent}% off)</span>
                  <span>-₹${disc.amount.toFixed(2)}</span>
                </div>
              `).join('')}
              
              ${(order.taxBreakdown || []).map((tax: any) => `
                <div class="total-row">
                  <span>${tax.name} (${tax.percent}%${tax.inclusive ? ' Incl.' : ''})</span>
                  <span>₹${tax.amount.toFixed(2)}</span>
                </div>
              `).join('')}
              
              <div class="total-row grand">
                <span>TOTAL</span>
                <span>₹${grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Please visit again 😊</p>
            </div>
          </body>
        </html>
      `;

      // Step 1: Generate the PDF as base64 to bypass reading permission restrictions in temp/cache dirs
      console.log('[PDF] Generating PDF...');
      const { base64 } = await Print.printToFileAsync({
        html: htmlContent,
        base64: true,
      });

      if (!base64) {
        throw new Error('PDF generation failed to output base64 data.');
      }

      // Step 2: Write base64 to the app's documentDirectory (which is always readable & writable by the app)
      const fileName = `invoice_${order.invoiceNo ?? order.dailyOrderNo}_${Date.now()}.pdf`;
      const shareUri = (FileSystem.documentDirectory ?? '') + fileName;
      console.log('[PDF] Writing to document directory:', shareUri);
      await FileSystem.writeAsStringAsync(shareUri, base64, { encoding: 'base64' });
      console.log('[PDF] File written successfully.');

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType: 'application/pdf',
          dialogTitle: order.invoiceNo ? `Invoice - ${order.invoiceNo}` : `Invoice - Order #${order.dailyOrderNo}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this platform.');
      }
    } catch (err: any) {
      console.warn('[PDF] generation/sharing error:', err);
      Alert.alert('Error', `Failed to generate PDF invoice.\n\n${(err as any)?.message ?? String(err)}`);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalSt.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[modalSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[modalSt.header, { borderBottomColor: colors.border }]}>
            <Text style={[modalSt.title, { color: colors.text }]}>Invoice Receipt</Text>
            <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ padding: 24, gap: 12 }}>
              <SkeletonLoader width={100} height={20} />
              <SkeletonLoader width={180} height={14} />
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
              <SkeletonRow />
              <SkeletonRow />
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
              <SkeletonLoader width="100%" height={50} />
            </View>
          ) : invoice ? (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={modalSt.scroll}>
              {/* Restaurant Meta */}
              <View style={modalSt.restaurantSection}>
                <Text style={[modalSt.restaurantName, { color: colors.text }]}>{invoice.restaurantInfo?.restaurantName}</Text>
                {invoice.restaurantInfo?.address && (
                  <Text style={[modalSt.restaurantSub, { color: colors.textSecondary }]}>{invoice.restaurantInfo.address}</Text>
                )}
                {invoice.restaurantInfo?.mobile && (
                  <Text style={[modalSt.restaurantSub, { color: colors.textSecondary }]}>📞 {invoice.restaurantInfo.mobile}</Text>
                )}
                {invoice.restaurantInfo?.isGST && invoice.restaurantInfo?.GSTIN && (
                  <Text style={[modalSt.gstin, { color: colors.primary }]}>GSTIN: {invoice.restaurantInfo.GSTIN}</Text>
                )}
              </View>

              <View style={[modalSt.divider, { backgroundColor: colors.border }]} />

              {/* Order Meta */}
              <View style={modalSt.metaGrid}>
                <View style={modalSt.metaCol}>
                  <Text style={[modalSt.metaLabel, { color: colors.textSecondary }]}>ORDER NO</Text>
                  <Text style={[modalSt.metaValue, { color: colors.text }]}>#{invoice.order.dailyOrderNo}</Text>
                </View>
                <View style={modalSt.metaCol}>
                  <Text style={[modalSt.metaLabel, { color: colors.textSecondary }]}>TABLE</Text>
                  <Text style={[modalSt.metaValue, { color: colors.text }]}>Table {invoice.order.tableNo}</Text>
                </View>
                <View style={modalSt.metaCol}>
                  <Text style={[modalSt.metaLabel, { color: colors.textSecondary }]}>STATUS</Text>
                  <Text style={[modalSt.metaValue, { color: colors.primary, textTransform: 'capitalize' }]}>{invoice.order.orderStatus}</Text>
                </View>
              </View>

              {invoice.order.invoiceNo && (
                <View style={[modalSt.invoiceNoRow, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                  <Text style={[modalSt.invoiceNoLabel, { color: colors.textSecondary }]}>INVOICE NO</Text>
                  <Text style={[modalSt.invoiceNoValue, { color: colors.primary }]}>{invoice.order.invoiceNo}</Text>
                </View>
              )}

              <View style={modalSt.metaGrid}>
                <View style={modalSt.metaCol}>
                  <Text style={[modalSt.metaLabel, { color: colors.textSecondary }]}>CUSTOMER</Text>
                  <Text style={[modalSt.metaValue, { color: colors.text }]}>{invoice.order.customer?.name ?? 'Guest'}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>{invoice.order.customer?.mobile ?? '—'}</Text>
                </View>
                <View style={modalSt.metaCol}>
                  <Text style={[modalSt.metaLabel, { color: colors.textSecondary }]}>WAITER</Text>
                  <Text style={[modalSt.metaValue, { color: colors.text }]}>{invoice.order.waiter?.waiterName ?? 'Self/QR'}</Text>
                </View>
                <View style={modalSt.metaCol}>
                  <Text style={[modalSt.metaLabel, { color: colors.textSecondary }]}>PAYMENT</Text>
                  <Text style={[modalSt.metaValue, { color: invoice.order.isPaymentCompleted ? colors.success : colors.error }]}>
                    {invoice.order.paymentMethod?.toUpperCase() ?? 'PENDING'}
                  </Text>
                </View>
              </View>

              <View style={[modalSt.divider, { backgroundColor: colors.border }]} />

              {/* Items List */}
              <Text style={[modalSt.sectionTitle, { color: colors.text }]}>Items Summary</Text>
              {(invoice.items ?? []).map((item: any, i: number) => (
                <View key={i} style={modalSt.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[modalSt.itemName, { color: colors.text }]}>{item.dishName}</Text>
                    {item.remarks && <Text style={{ fontSize: 11, color: colors.warning }}>Note: {item.remarks}</Text>}
                  </View>
                  <Text style={[modalSt.itemQty, { color: colors.textSecondary }]}>×{item.quantity}</Text>
                  <Text style={[modalSt.itemTotal, { color: colors.text }]}>₹{item.total.toFixed(2)}</Text>
                </View>
              ))}

              <View style={[modalSt.divider, { backgroundColor: colors.border }]} />

              {/* Totals Box */}
              <View style={modalSt.totalsBox}>
                <View style={modalSt.totalsRow}>
                  <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
                  <Text style={{ color: colors.text }}>₹{invoice.subtotal.toFixed(2)}</Text>
                </View>

                {/* ISSUE 9: Discount rows */}
                {(invoice.discountBreakdown ?? []).map((disc: any, i: number) => (
                  <View key={i} style={modalSt.totalsRow}>
                    <Text style={{ color: '#2a9d5c', fontWeight: '700' }}>🏷️ {disc.name} ({disc.percent}% off)</Text>
                    <Text style={{ color: '#2a9d5c', fontWeight: '700' }}>-₹{(Number(disc.amount) || 0).toFixed(2)}</Text>
                  </View>
                ))}

                {invoice.discountAmount > 0 && (invoice.discountBreakdown ?? []).length === 0 && (
                  <View style={modalSt.totalsRow}>
                    <Text style={{ color: '#2a9d5c', fontWeight: '700' }}>🏷️ Discount</Text>
                    <Text style={{ color: '#2a9d5c', fontWeight: '700' }}>-₹{invoice.discountAmount.toFixed(2)}</Text>
                  </View>
                )}

                {/* ISSUE 5: Tax rows */}
                {(invoice.order.taxBreakdown ?? []).map((tax: any, i: number) => (
                  <View key={i} style={modalSt.totalsRow}>
                    <Text style={{ color: colors.textSecondary }}>
                      {tax.name} ({tax.percent}%{tax.inclusive ? ' Incl.' : ''})
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>₹{(Number(tax.amount) || 0).toFixed(2)}</Text>
                  </View>
                ))}

                <View style={[modalSt.totalsRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 6 }]}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Total Amount</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>₹{invoice.grandTotal.toFixed(2)}</Text>
                </View>
              </View>

              {invoice.isInclusive && (
                <Text style={[modalSt.inclusiveNote, { color: colors.textSecondary }]}>
                  * Dishes are inclusive of taxes. Taxes have been extracted for display.
                </Text>
              )}

              {/* Timeline Log */}
              {invoice.order.ordersUpdateInfo && invoice.order.ordersUpdateInfo.length > 0 && (
                <>
                  <View style={[modalSt.divider, { backgroundColor: colors.border }]} />
                  <Text style={[modalSt.sectionTitle, { color: colors.text, marginBottom: 8 }]}>Order Log History</Text>
                  {invoice.order.ordersUpdateInfo.map((log: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                      <MaterialCommunityIcons name="history" size={14} color={colors.textSecondary} style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>
                        <Text style={{ fontWeight: '700' }}>{log.action?.toUpperCase()}</Text> by {log.customer ? 'Customer' : 'Staff'} at {new Date(log.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          ) : (
            <Text style={{ textAlign: 'center', margin: 20, color: colors.textSecondary }}>Invoice details unavailable</Text>
          )}

          {invoice && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 }}>
              <Pressable
                onPress={handleDownloadPDF}
                style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5 }, { borderColor: colors.success, backgroundColor: colors.success + '10' }]}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={18} color={colors.success} />
                <Text style={{ fontWeight: '700', fontSize: 13, color: colors.success }}>Save PDF</Text>
              </Pressable>
            </View>
          )}

          <Pressable onPress={onClose} style={[modalSt.closeBtn, { backgroundColor: colors.primary }]}>
            <Text style={modalSt.closeBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '92%', borderWidth: 1, flexDirection: 'column' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  scroll: { paddingVertical: 14, paddingBottom: 65 },
  restaurantSection: { alignItems: 'center', gap: 4 },
  restaurantName: { fontSize: 20, fontWeight: '900' },
  restaurantSub: { fontSize: 12 },
  gstin: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  divider: { height: 1, marginVertical: 14 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaCol: { flex: 1, gap: 2 },
  metaLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  metaValue: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  itemName: { fontSize: 13, fontWeight: '600' },
  itemQty: { fontSize: 13, fontWeight: '600' },
  itemTotal: { fontSize: 13, fontWeight: '700', minWidth: 50, textAlign: 'right' },
  totalsBox: { gap: 6, marginTop: 4 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inclusiveNote: { fontSize: 10.5, fontStyle: 'italic', marginTop: 8 },
  closeBtn: { padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  invoiceNoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1,
    marginBottom: 12,
  },
  invoiceNoLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  invoiceNoValue: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});

// ============================================================================
// SUB-COMPONENTS (memoised for perf)
// ============================================================================

const StaleBanner = memo(({ onRefresh, colors }: { onRefresh: () => void; colors: any }) => (
  <Animated.View entering={FadeInDown.duration(300)} style={[bannerSt.banner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
    <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
    <Text style={[bannerSt.text, { color: colors.text }]}>Data may be outdated</Text>
    <Pressable onPress={onRefresh} style={[bannerSt.btn, { backgroundColor: colors.primary }]}>
      <Text style={bannerSt.btnText}>Refresh</Text>
    </Pressable>
  </Animated.View>
));
const bannerSt = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 12, gap: 8 },
  text: { flex: 1, fontSize: 13, fontWeight: '500' },
  btn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

const ErrorBanner = memo(({ message, onRetry, colors }: { message: string; onRetry: () => void; colors: any }) => (
  <Animated.View entering={FadeInDown.duration(300)} style={[errSt.banner, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}>
    <MaterialCommunityIcons name="wifi-off" size={16} color={colors.error} />
    <Text style={[errSt.text, { color: colors.error }]} numberOfLines={2}>{message}</Text>
    <Pressable onPress={onRetry}><Text style={[errSt.retry, { color: colors.primary }]}>Retry</Text></Pressable>
  </Animated.View>
));
const errSt = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14, gap: 8 },
  text: { flex: 1, fontSize: 13, fontWeight: '600' },
  retry: { fontSize: 13, fontWeight: '700' },
});

const KpiCard = memo(({ icon, label, value, sub, accent, delay, colors }: {
  icon: string; label: string; value: string; sub?: string; accent: string; delay: number; colors: any;
}) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(380)} style={[kpiSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[kpiSt.iconCircle, { backgroundColor: accent + '18' }]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={accent} />
    </View>
    <Text style={[kpiSt.value, { color: colors.text }]}>{value}</Text>
    <Text style={[kpiSt.label, { color: colors.textSecondary }]}>{label}</Text>
    {sub ? <Text style={[kpiSt.sub, { color: accent }]}>{sub}</Text> : null}
  </Animated.View>
));
const kpiSt = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 14, alignItems: 'center', minWidth: 100 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center', marginBottom: 2 },
  sub: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});

const SectionHeader = memo(({ title, colors, delay = 0 }: { title: string; colors: any; delay?: number }) => (
  <Animated.Text entering={FadeInDown.delay(delay).duration(300)} style={[secSt.title, { color: colors.text }]}>
    {title}
  </Animated.Text>
));
const secSt = StyleSheet.create({ title: { fontSize: 16, fontWeight: '700', letterSpacing: 0.1, marginBottom: 12, marginTop: 20 } });

const MiniBarChart = memo(({ data, colors }: { data: Record<string, number>; colors: any }) => {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return (
    <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[chartSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[chartSt.title, { color: colors.textSecondary }]}>Daily Revenue</Text>
      <View style={chartSt.bars}>
        {entries.map(([date, val]) => {
          const pct = val / max;
          const label = days[new Date(date).getDay()] ?? date.slice(5);
          return (
            <View key={date} style={chartSt.barCol}>
              <Text style={[chartSt.barVal, { color: colors.textSecondary }]}>{val > 0 ? fmt(val) : ''}</Text>
              <View style={chartSt.barTrack}>
                <View style={[chartSt.bar, { height: `${Math.max(pct * 100, 4)}%`, backgroundColor: colors.primary, opacity: 0.7 + pct * 0.3 }]} />
              </View>
              <Text style={[chartSt.barLabel, { color: colors.textSecondary }]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
});
const chartSt = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 4 },
  title: { fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  bars: { flexDirection: 'row', height: 100, gap: 6, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barVal: { fontSize: 8, fontWeight: '600', marginBottom: 3 },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, fontWeight: '600', marginTop: 4 },
});

const PaymentBreakdown = memo(({ data, colors }: { data: Record<string, number>; colors: any }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const PALETTE = [colors.primary, colors.success, colors.warning, '#7C4DFF'];
  return (
    <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[pieSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[pieSt.title, { color: colors.textSecondary }]}>Payment Methods</Text>
      {Object.entries(data).map(([method, amount], i) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        const accent = PALETTE[i % PALETTE.length];
        // ISSUE 6: Normalize payment method labels
        const label = method === 'upi' ? 'UPI'
          : method === 'cash' ? 'CASH'
          : method === 'online' || method === 'card' ? 'CARD'
          : method.toUpperCase();
        return (
          <View key={method} style={pieSt.row}>
            <View style={[pieSt.dot, { backgroundColor: accent }]} />
            <Text style={[pieSt.method, { color: colors.text }]}>{label}</Text>
            <View style={pieSt.barWrap}>
              <View style={[pieSt.barFill, { width: `${pct}%` as any, backgroundColor: accent }]} />
            </View>
            <Text style={[pieSt.pct, { color: colors.textSecondary }]}>{pct.toFixed(0)}%</Text>
            <Text style={[pieSt.amount, { color: colors.text }]}>{fmt(amount)}</Text>
          </View>
        );
      })}
    </Animated.View>
  );
});
const pieSt = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1.5, padding: 16 },
  title: { fontSize: 12, fontWeight: '600', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  method: { fontSize: 13, fontWeight: '600', width: 44 },
  barWrap: { flex: 1, height: 8, backgroundColor: '#00000010', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, maxWidth: '100%' },
  pct: { fontSize: 12, fontWeight: '600', width: 30, textAlign: 'right' },
  amount: { fontSize: 12, fontWeight: '700', width: 60, textAlign: 'right' },
});

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  ordering:  { color: '#7C4DFF', icon: 'clock-outline',          label: 'Ordering' },
  preparing: { color: '#FF9800', icon: 'fire',                   label: 'Preparing' },
  ready:     { color: '#2196F3', icon: 'check-circle-outline',   label: 'Ready' },
  serving:   { color: '#00BCD4', icon: 'room-service-outline',   label: 'Serving' },
  completed: { color: '#4CAF50', icon: 'check-all',              label: 'Completed' },
  cancelled: { color: '#F44336', icon: 'close-circle-outline',   label: 'Cancelled' },
};

const OrderStatusGrid = memo(({ data, colors }: { data: Record<string, number>; colors: any }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <Animated.View entering={FadeInUp.delay(80).duration(400)} style={statusSt.grid}>
      {Object.entries(data).map(([status, count], i) => {
        const cfg = STATUS_CONFIG[status] ?? { color: colors.primary, icon: 'circle-outline', label: status };
        return (
          <Animated.View key={status} entering={FadeInDown.delay(i * 60 + 80).duration(350)}
            style={[statusSt.pill, { backgroundColor: colors.card, borderColor: cfg.color + '40' }]}>
            <View style={[statusSt.iconWrap, { backgroundColor: cfg.color + '15' }]}>
              <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
            </View>
            <Text style={[statusSt.count, { color: colors.text }]}>{fmtNum(count)}</Text>
            <Text style={[statusSt.label, { color: colors.textSecondary }]}>{cfg.label}</Text>
            {total > 0 && count > 0 && <Text style={[statusSt.pct, { color: cfg.color }]}>{((count / total) * 100).toFixed(0)}%</Text>}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
});
const statusSt = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { width: '47%', borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  count: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  pct: { fontSize: 10, fontWeight: '700' },
});

const DishRow = memo(({ dish, rank, colors, delay }: { dish: DishEntry; rank: number; colors: any; delay: number }) => {
  const CAT_COLORS: Record<string, string> = { 'Main Course': '#FF6B35', Starter: '#7C4DFF', Dessert: '#E91E8C', Beverages: '#2196F3' };
  const accent = CAT_COLORS[dish.category] ?? colors.primary;
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(340)} style={[dishSt.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[dishSt.rank, { backgroundColor: rank <= 3 ? accent + '20' : colors.background }]}>
        <Text style={[dishSt.rankNum, { color: rank <= 3 ? accent : colors.textSecondary }]}>#{rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[dishSt.name, { color: colors.text }]} numberOfLines={1}>{dish.dishName}</Text>
        <View style={dishSt.meta}>
          <View style={[dishSt.catPill, { backgroundColor: accent + '15' }]}>
            <Text style={[dishSt.cat, { color: accent }]}>{dish.category}</Text>
          </View>
        </View>
      </View>
      <Text style={[dishSt.price, { color: colors.text }]}>₹{dish.price}</Text>
    </Animated.View>
  );
});
const dishSt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 8, gap: 12 },
  rank: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rankNum: { fontSize: 12, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  meta: { flexDirection: 'row', gap: 6 },
  catPill: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 },
  cat: { fontSize: 10, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
});

const AnalyticsOrderRow = memo(({ order, colors, delay, onTap }: { order: OrderEntry; colors: any; delay: number; onTap: () => void }) => {
  const METHOD_ICON: Record<string, string> = { Cash: 'cash', UPI: 'cellphone-nfc', Card: 'credit-card-outline', cash: 'cash', upi: 'cellphone-nfc', online: 'credit-card-outline' };
  const statusCfg = STATUS_CONFIG[order.orderStatus] ?? { color: colors.primary, icon: 'circle', label: order.orderStatus };
  return (
    <Pressable onPress={onTap}>
      <Animated.View entering={FadeInDown.delay(delay).duration(340)} style={[aOrderSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={aOrderSt.top}>
          <View style={aOrderSt.topLeft}>
            <View style={[aOrderSt.tableChip, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="table-chair" size={13} color={colors.primary} />
              <Text style={[aOrderSt.tableText, { color: colors.primary }]}>Table {order.tableNo}</Text>
            </View>
            <Text style={[aOrderSt.customer, { color: colors.text }]}>{order.customer?.name ?? 'Guest'}</Text>
            <Text style={[aOrderSt.waiter, { color: colors.textSecondary }]}>by {order.waiter?.waiterName ?? 'Self/QR'}</Text>
          </View>
          <View style={aOrderSt.topRight}>
            <Text style={[aOrderSt.amount, { color: colors.text }]}>₹{order.finalAmount ?? order.totalAmount}</Text>
            <View style={[aOrderSt.statusPill, { backgroundColor: statusCfg.color + '18' }]}>
              <Text style={[aOrderSt.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>
        </View>
        <View style={[aOrderSt.divider, { backgroundColor: colors.border }]} />
        <View style={aOrderSt.bottom}>
          <View style={aOrderSt.payRow}>
            <MaterialCommunityIcons name={(METHOD_ICON[order.paymentMethod] ?? 'cash') as any} size={13} color={colors.textSecondary} />
            <Text style={[aOrderSt.payText, { color: colors.textSecondary }]}>{order.paymentMethod || 'Pending'}</Text>
            {order.isPaymentCompleted && (
              <View style={[aOrderSt.paidPill, { backgroundColor: colors.success + '18' }]}>
                <Text style={[aOrderSt.paidText, { color: colors.success }]}>Paid</Text>
              </View>
            )}
          </View>
          <Text style={[aOrderSt.time, { color: colors.textSecondary }]}>{relativeTime(order.createdAt)}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
});
const aOrderSt = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topLeft: { flex: 1, gap: 3 },
  topRight: { alignItems: 'flex-end', gap: 6 },
  tableChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 2 },
  tableText: { fontSize: 11, fontWeight: '700' },
  customer: { fontSize: 15, fontWeight: '700' },
  waiter: { fontSize: 12, fontWeight: '500' },
  amount: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statusPill: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payText: { fontSize: 12, fontWeight: '500' },
  paidPill: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  paidText: { fontSize: 10, fontWeight: '700' },
  time: { fontSize: 11, fontWeight: '500' },
});

const CustomerRow = memo(({ customer, rank, colors, delay }: { customer: CustomerEntry; rank: number; colors: any; delay: number }) => {
  const initials = customer.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(340)} style={[custSt.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[custSt.avatar, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[custSt.initials, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[custSt.name, { color: colors.text }]}>{customer.name}</Text>
        <Text style={[custSt.mobile, { color: colors.textSecondary }]}>{customer.mobile}</Text>
      </View>
      <View style={custSt.right}>
        <Text style={[custSt.rank, { color: colors.textSecondary }]}>#{rank}</Text>
        <View style={[custSt.badge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[custSt.badgeText, { color: colors.primary }]}>{customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}</Text>
        </View>
      </View>
    </Animated.View>
  );
});
const custSt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 8, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  mobile: { fontSize: 12, fontWeight: '500' },
  right: { alignItems: 'flex-end', gap: 4 },
  rank: { fontSize: 11, fontWeight: '600' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

const EmptyState = memo(({ message, icon, colors }: { message: string; icon: string; colors: any }) => (
  <Animated.View entering={FadeIn.duration(300)} style={[empSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <MaterialCommunityIcons name={icon as any} size={36} color={colors.textSecondary} />
    <Text style={[empSt.text, { color: colors.textSecondary }]}>{message}</Text>
  </Animated.View>
));
const empSt = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 36, borderRadius: 16, borderWidth: 1.5, gap: 10 },
  text: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
});

// ============================================================================
// TAB CONTENT components
// ============================================================================

const SalesTab = memo(({ data, colors }: { data?: SalesData; colors: any }) => {
  if (!data) return <EmptyState message="Sales data unavailable" icon="chart-line" colors={colors} />;
  return (
    <>
      <SectionHeader title="Today" colors={colors} delay={0} />
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
        <KpiCard icon="cash-multiple" label="Revenue"   value={fmt(data.today.totalSales)}        accent={colors.primary} delay={60}  colors={colors} />
        <KpiCard icon="receipt"       label="Orders"    value={`${data.today.ordersCount}`}       accent={colors.success} delay={120} colors={colors} />
        <KpiCard icon="trending-up"   label="Avg Order" value={fmt(data.today.averageOrderValue)} accent="#7C4DFF"        delay={180} colors={colors} />
      </View>
      <SectionHeader title="This Week" colors={colors} delay={200} />
      {Object.keys(data.weekly.dailySales).length > 0 && <MiniBarChart data={data.weekly.dailySales} colors={colors} />}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <KpiCard icon="cash-multiple"  label="Total"     value={fmt(data.weekly.totalSales)}                   accent={colors.primary} delay={240} colors={colors} />
        <KpiCard icon="receipt"        label="Orders"    value={`${data.weekly.ordersCount}`}                  accent={colors.success} delay={280} colors={colors} />
        <KpiCard icon="calendar-today" label="Daily Avg" value={fmt(parseFloat(data.weekly.averageDaily))}     accent="#2196F3"        delay={320} colors={colors} />
      </View>
      <SectionHeader title={`Month: ${data.monthly.month}`} colors={colors} delay={360} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <KpiCard icon="cash-multiple" label="Total"     value={fmt(data.monthly.totalSales)}                    accent={colors.primary} delay={380} colors={colors} />
        <KpiCard icon="receipt"       label="Orders"    value={`${data.monthly.ordersCount}`}                   accent={colors.success} delay={420} colors={colors} />
        <KpiCard icon="trending-up"   label="Avg Order" value={fmt(parseFloat(data.monthly.averageOrderValue))} accent="#E91E8C"        delay={460} colors={colors} />
      </View>
    </>
  );
});

const DishesTab = memo(({ data, colors }: { data?: { bestSelling: DishEntry[] }; colors: any }) => (
  <>
    <SectionHeader title="Best-Selling Dishes" colors={colors} delay={0} />
    {(!data || data.bestSelling.length === 0)
      ? <EmptyState message="No dish data yet" icon="food-outline" colors={colors} />
      : data.bestSelling.map((d, i) => <DishRow key={d.dishId} dish={d} rank={i + 1} colors={colors} delay={i * 50} />)
    }
  </>
));

const PaymentsTab = memo(({ paymentMethods, colors }: { paymentMethods?: Record<string, number>; colors: any }) => (
  <>
    <SectionHeader title="Payment Methods" colors={colors} delay={0} />
    {(!paymentMethods || Object.keys(paymentMethods).length === 0)
      ? <EmptyState message="No payment data yet" icon="cash-multiple" colors={colors} />
      : <PaymentBreakdown data={paymentMethods} colors={colors} />
    }
  </>
));

const CustomersTab = memo(({ data, colors }: { data?: { top: CustomerEntry[] }; colors: any }) => (
  <>
    <SectionHeader title="Top Customers" colors={colors} delay={0} />
    {(!data || data.top.length === 0)
      ? <EmptyState message="No customer data yet" icon="account-group-outline" colors={colors} />
      : data.top.map((c, i) => <CustomerRow key={c.mobile} customer={c} rank={i + 1} colors={colors} delay={i * 50} />)
    }
  </>
));

// ============================================================================
// MAIN ANALYTICS SCREEN
// ============================================================================

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'sales',     label: 'Sales',     icon: 'chart-line' },
  { key: 'orders',    label: 'Orders',    icon: 'receipt' },
  { key: 'dishes',    label: 'Dishes',    icon: 'food-outline' },
  { key: 'payments',  label: 'Payments',  icon: 'cash-multiple' },
  { key: 'customers', label: 'Customers', icon: 'account-group-outline' },
];

const PRESETS: { key: DateFilter; label: string }[] = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7days',     label: '7 Days' },
  { key: '30days',    label: '30 Days' },
  { key: 'custom',    label: 'Custom' },
];

export default function AnalyticsScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  // General state
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('sales');

  // Orders Tab specific states
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersRefreshing, setOrdersRefreshing] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [ordersOffset, setOrdersOffset] = useState(0);

  // Date Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Invoice Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchedAt = useRef<number | null>(null);

  // ── Fetch aggregate statistics (Sales, Dishes, etc) ──────────────────────
  const fetchAnalytics = useCallback(async () => {
    try {
      const aggRes = await fetch(ENDPOINTS.ANALYTICS, { headers: getAuthHeaders() });
      const aggJson = await aggRes.json();

      if (aggJson?.status === 'success' || aggJson?.status === 'partial') {
        setData(aggJson.data);
        fetchedAt.current = Date.now();
        setIsStale(false);
        setError(null);
      } else {
        setError(aggJson?.message ?? 'Failed to load analytics.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders]);

  // ── Fetch orders list (paginated & filtered) ─────────────────────────────
  const fetchOrders = useCallback(async (reset = false) => {
    if (ordersLoading) return;
    setOrdersLoading(true);

    const nextOffset = reset ? 0 : ordersOffset;
    const { from, to } = getDateRange(dateFilter, customStart, customEnd);

    try {
      let url = `${ENDPOINTS.MANAGER_ANALYTICS_ORDERS}?limit=20&offset=${nextOffset}`;
      if (from) url += `&from=${encodeURIComponent(from)}`;
      if (to) url += `&to=${encodeURIComponent(to)}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();

      if (json.status === 'success') {
        const fetched = json.data || [];
        if (reset) {
          setOrders(fetched);
          setOrdersOffset(fetched.length);
        } else {
          setOrders(prev => [...prev, ...fetched]);
          setOrdersOffset(prev => prev + fetched.length);
        }
        setHasMoreOrders(json.meta?.hasMore ?? (fetched.length === 20));
      }
    } catch (err) {
      console.warn('Fetch orders error', err);
    } finally {
      setOrdersLoading(false);
      setOrdersRefreshing(false);
    }
  }, [dateFilter, customStart, customEnd, ordersOffset, ordersLoading, searchQuery, getAuthHeaders]);

  // Initial loads
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Fetch orders when dates change, search query changes, or tab switches to orders
  useEffect(() => {
    if (activeTab === 'orders') {
      const delayDebounceFn = setTimeout(() => {
        fetchOrders(true);
      }, searchQuery ? 400 : 0);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [activeTab, dateFilter, customStart, customEnd, searchQuery]);

  // Stale banner timer check
  useEffect(() => {
    const interval = setInterval(() => {
      if (fetchedAt.current && Date.now() - fetchedAt.current > STALE_AFTER_MS) {
        setIsStale(true);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Group orders by local date for SectionList sticky headers
  const groupedOrders = useMemo(() => {
    const groups: Record<string, OrderEntry[]> = {};
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(o);
    });

    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
    }));
  }, [orders]);

  // Apply Custom Date range selection
  const handleApplyCustomDates = () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(tempStart) || !regex.test(tempEnd)) {
      alert('Please use the format YYYY-MM-DD');
      return;
    }
    setCustomStart(tempStart);
    setCustomEnd(tempEnd);
    setDateFilter('custom');
    setShowDatePicker(false);
  };

  const activeTabContent = useMemo(() => {
    if (!data) return null;
    switch (activeTab) {
      case 'sales':     return <SalesTab data={data.sales} colors={c} />;
      case 'dishes':    return <DishesTab data={data.dishes} colors={c} />;
      case 'payments':  return <PaymentsTab paymentMethods={data.paymentMethods} colors={c} />;
      case 'customers': return <CustomersTab data={data.customers} colors={c} />;
      default: return null;
    }
  }, [activeTab, data, c]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background, paddingHorizontal: 16, paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12, alignItems: 'center' }}>
          <SkeletonLoader width={140} height={32} />
          <SkeletonLoader width={38} height={38} borderRadius={10} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, width: '100%', marginBottom: 16 }}>
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} width={70} height={32} borderRadius={10} />)}
        </View>
        <View style={{ width: '100%', gap: 10 }}>
          <SkeletonCard colors={c} />
          <SkeletonCard colors={c} />
        </View>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: c.text }]}>Analytics</Text>
        <Pressable
          onPress={() => {
            if (activeTab === 'orders') {
              setOrdersRefreshing(true);
              fetchOrders(true);
            } else {
              setRefreshing(true);
              fetchAnalytics();
            }
          }}
          disabled={refreshing || ordersRefreshing}
          style={[styles.refreshBtn, { backgroundColor: c.card, borderColor: c.border }]}
        >
          {refreshing || ordersRefreshing ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <MaterialCommunityIcons name="refresh" size={18} color={c.primary} />
          )}
        </Pressable>
      </View>

      {/* Main Tab bar */}
      <View style={{ height: 48, marginBottom: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
          style={{ flexGrow: 0 }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && [styles.tabActive, { backgroundColor: c.primary }], !active && { borderColor: c.border }]}
              >
                <MaterialCommunityIcons name={tab.icon as any} size={14} color={active ? '#fff' : c.textSecondary} />
                <Text style={[styles.tabLabel, { color: active ? '#fff' : c.textSecondary, fontWeight: active ? '700' : '500' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* CONDITIONAL CONTENT VIEW: ORDERS vs REST OF TABS */}
      {activeTab === 'orders' ? (
        <View style={{ flex: 1 }}>
          {/* Search Bar */}
          <View style={[styles.searchBarContainer, { backgroundColor: c.card, borderColor: c.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={c.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder="Search by Invoice No..."
              placeholderTextColor={c.textSecondary + '75'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={16} color={c.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Preset Date Range Buttons */}
          <View style={{ height: 40, marginVertical: 6 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetContainer}>
              {PRESETS.map((preset) => {
                const active = dateFilter === preset.key;
                return (
                  <Pressable
                    key={preset.key}
                    onPress={() => {
                      if (preset.key === 'custom') {
                        // Prefill inputs
                        const todayStr = new Date().toISOString().split('T')[0];
                        setTempStart(customStart || todayStr);
                        setTempEnd(customEnd || todayStr);
                        setShowDatePicker(true);
                      } else {
                        setDateFilter(preset.key);
                      }
                    }}
                    style={[styles.presetBtn, active && { backgroundColor: c.primary + '18', borderColor: c.primary }, !active && { borderColor: c.border }]}
                  >
                    <Text style={[styles.presetLabel, { color: active ? c.primary : c.textSecondary, fontWeight: active ? '700' : '500' }]}>
                      {preset.label === 'Custom' && customStart && customEnd
                        ? `${customStart.slice(5)} to ${customEnd.slice(5)}`
                        : preset.label
                      }
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* SectionList Grouped Orders list */}
          {ordersLoading && orders.length === 0 ? (
            <View style={{ flex: 1, paddingHorizontal: 16, gap: 10, paddingTop: 10 }}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          ) : orders.length === 0 ? (
            <EmptyState message="No orders found for this date range" icon="receipt" colors={c} />
          ) : (
            <SectionList
              sections={groupedOrders}
              keyExtractor={(item) => item.ordersId}
              renderItem={({ item, index }) => (
                <AnalyticsOrderRow
                  order={item}
                  colors={c}
                  delay={index * 30}
                  onTap={() => {
                    setSelectedOrderId(item.ordersId);
                    setShowDetailModal(true);
                  }}
                />
              )}
              renderSectionHeader={({ section: { title } }) => (
                <View style={[styles.stickySectionHeader, { backgroundColor: c.background }]}>
                  <Text style={[styles.stickyHeaderTitle, { color: c.text }]}>{title}</Text>
                </View>
              )}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
              stickySectionHeadersEnabled={true}
              refreshControl={
                <RefreshControl
                  refreshing={ordersRefreshing}
                  onRefresh={() => {
                    setOrdersRefreshing(true);
                    fetchOrders(true);
                  }}
                  tintColor={c.primary}
                />
              }
              onEndReached={() => {
                if (hasMoreOrders && !ordersLoading) {
                  fetchOrders(false);
                }
              }}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                ordersLoading ? (
                  <View style={{ paddingVertical: 14 }}>
                    <ActivityIndicator size="small" color={c.primary} />
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} tintColor={c.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {isStale && <StaleBanner onRefresh={fetchAnalytics} colors={c} />}
          {error && <ErrorBanner message={error} onRetry={fetchAnalytics} colors={c} />}
          {!error && activeTabContent}
          {!data && !error && !loading && (
            <EmptyState message="No data yet. Place some orders first!" icon="chart-line" colors={c} />
          )}
        </ScrollView>
      )}

      {/* Custom Date Selector Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
          <Pressable style={[styles.datePickerCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => {}}>
            <Text style={[styles.datePickerTitle, { color: c.text }]}>Custom Date Range</Text>
            <Text style={{ fontSize: 12, color: c.textSecondary, marginBottom: 16 }}>Format: YYYY-MM-DD</Text>

            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Start Date</Text>
            <TextInput
              style={[styles.dateInput, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
              value={tempStart}
              onChangeText={setTempStart}
              placeholder="e.g. 2026-06-10"
              placeholderTextColor={c.textSecondary + '70'}
            />

            <Text style={[styles.inputLabel, { color: c.textSecondary, marginTop: 12 }]}>End Date</Text>
            <TextInput
              style={[styles.dateInput, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
              value={tempEnd}
              onChangeText={setTempEnd}
              placeholder="e.g. 2026-06-13"
              placeholderTextColor={c.textSecondary + '70'}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Pressable onPress={() => setShowDatePicker(false)} style={[styles.dialogBtn, { borderWidth: 1, borderColor: c.border }]}>
                <Text style={{ color: c.text, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleApplyCustomDates} style={[styles.dialogBtn, { backgroundColor: c.primary }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Invoice Details Modal */}
      <OrderDetailModal
        visible={showDetailModal}
        orderId={selectedOrderId}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOrderId(null);
        }}
        getAuthHeaders={getAuthHeaders}
        colors={c}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  refreshBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  // Fixed horizontal tab bar layout to avoid wrap
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 6,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1,
  },
  tabActive: { borderWidth: 0 },
  tabLabel: { fontSize: 13 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 6 },

  // Sticky Section Header styling
  stickySectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 10,
    elevation: 3,
  },
  stickyHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Preset container
  presetContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
  },
  presetBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  presetLabel: {
    fontSize: 12,
  },

  // Date picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  datePickerCard: { width: '100%', borderRadius: 16, padding: 20, borderWidth: 1 },
  datePickerTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4 },
  dateInput: { padding: 10, borderRadius: 8, borderWidth: 1.5, fontSize: 14 },
  dialogBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
