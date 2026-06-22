import { formatCurrency, formatDate } from '../../utils/formatters.js';
import './BillView.css';

export default function BillView({ order, restaurantInfo }) {
  // Determine if tax is inclusive
  const isInclusive = order.taxBreakdown?.some(tax => tax.inclusive) || order.taxType === 'inclusive';
  const totalTaxPercent = order.taxBreakdown?.reduce((sum, t) => sum + (t.percent || 0), 0) || 0;
  const divisor = 1 + totalTaxPercent / 100;

  // Helper to get pre-tax unit price
  const getDispPrice = (price) => {
    return isInclusive ? parseFloat((price / divisor).toFixed(2)) : price;
  };

  // Derive subtotal by subtracting exact stored tax amounts from grand total (finalAmount)
  // to avoid any rounding mismatches.
  const displayedSubtotal = isInclusive
    ? parseFloat((order.finalAmount - (order.taxBreakdown?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0)).toFixed(2))
    : order.totalAmount;

  return (
    <div className="bill" id="bill-content">
      {/* Restaurant header */}
      <div className="bill__header">
        {restaurantInfo?.logoUrl && (
          <img src={restaurantInfo.logoUrl} alt={restaurantInfo.restaurantName} className="bill__logo" />
        )}
        <h2 className="bill__restaurant">{restaurantInfo?.restaurantName}</h2>
        {restaurantInfo?.address && (
          <p className="bill__address">{restaurantInfo.address}</p>
        )}
        {restaurantInfo?.mobile && (
          <p className="bill__address">📞 {restaurantInfo.mobile}</p>
        )}
        {restaurantInfo?.isGST && restaurantInfo?.GSTIN && (
          <p className="bill__gstin">GSTIN: {restaurantInfo.GSTIN}</p>
        )}
      </div>

      <div className="bill__divider bill__divider--dashed" />

      {/* Order metadata */}
      <div className="bill__meta">
        {order.invoiceNo && (
          <div className="bill__meta-row bill__meta-row--invoice">
            <span>Invoice No</span>
            <span className="bill__meta-val bill__meta-val--invoice">{order.invoiceNo}</span>
          </div>
        )}
        <div className="bill__meta-row">
          <span>Order No</span>
          <span className="bill__meta-val">#{order.dailyOrderNo}</span>
        </div>
        <div className="bill__meta-row">
          <span>Table</span>
          <span className="bill__meta-val">Table {order.tableNo}</span>
        </div>
        {order.customer?.name && (
          <div className="bill__meta-row">
            <span>Customer</span>
            <span className="bill__meta-val">{order.customer.name}</span>
          </div>
        )}
        <div className="bill__meta-row">
          <span>Date & Time</span>
          <span className="bill__meta-val">{formatDate(order.createdAt)}</span>
        </div>
        <div className="bill__meta-row">
          <span>Payment</span>
          <span className="bill__meta-val bill__meta-val--badge">{order.paymentMethod || '—'}</span>
        </div>
      </div>

      <div className="bill__divider bill__divider--dashed" />

      {/* Items table */}
      <div className="bill__items">
        <div className="bill__items-header">
          <span className="bill__col-name">Item</span>
          <span className="bill__col-qty">Qty</span>
          <span className="bill__col-price">Price</span>
          <span className="bill__col-total">Total</span>
        </div>
        {order.ordersInfo?.map((item, i) => {
          const itemPrice = getDispPrice(item.price);
          const itemTotal = itemPrice * item.quantity;
          return (
            <div key={i} className="bill__item-row">
              <span className="bill__col-name">{item.dishName}</span>
              <span className="bill__col-qty">{item.quantity}</span>
              <span className="bill__col-price">{formatCurrency(itemPrice)}</span>
              <span className="bill__col-total">{formatCurrency(itemTotal)}</span>
            </div>
          );
        })}
      </div>

      <div className="bill__divider" />

      {/* Totals */}
      <div className="bill__totals">
        <div className="bill__total-row bill__total-row--grand">
          <span>Subtotal</span>
          <span>{formatCurrency(displayedSubtotal)}</span>
        </div>

        {(order.discountBreakdown || []).map((disc, i) => (
          <div key={i} className="bill__total-row bill__total-row--discount">
            <span>🏷️ {disc.name} ({disc.percent}% off)</span>
            <span>- {formatCurrency(disc.amount)}</span>
          </div>
        ))}

        {order.taxBreakdown?.map((tax, i) => (
          <div key={i} className="bill__total-row bill__total-row--tax">
            <span>{tax.name} ({tax.percent}%{tax.inclusive ? ' Incl.' : ' Excl.'})</span>
            <span>{formatCurrency(tax.amount)}</span>
          </div>
        ))}

        <div className="bill__total-row bill__total-row--grand bill__total-row--final">
          <span>TOTAL</span>
          <span>{formatCurrency(order.finalAmount ?? order.totalAmount)}</span>
        </div>
      </div>

      {isInclusive && (
        <div className="bill__inclusive-disclaimer">
          * Note: Dish menu prices are inclusive of taxes. Taxes have been extracted for itemized summary.
        </div>
      )}

      <div className="bill__divider" />

      {/* Footer */}
      <div className="bill__footer">
        <p>Thank you for your visit!</p>
        <p>Please come again 😊</p>
      </div>
    </div>
  );
}
