import { formatCurrency, formatDate } from '../../utils/formatters.js';
import './BillView.css';

export default function BillView({ order, restaurantInfo }) {
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
        <div className="bill__meta-row">
          <span>Order #</span>
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
        {order.ordersInfo?.map((item, i) => (
          <div key={i} className="bill__item-row">
            <span className="bill__col-name">{item.dishName}</span>
            <span className="bill__col-qty">{item.quantity}</span>
            <span className="bill__col-price">{formatCurrency(item.price)}</span>
            <span className="bill__col-total">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="bill__divider" />

      {/* Totals */}
      <div className="bill__totals">
        <div className="bill__total-row">
          <span>Subtotal</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>

        {order.taxBreakdown?.map((tax, i) => (
          <div key={i} className="bill__total-row bill__total-row--tax">
            <span>{tax.name} ({tax.percent}%)</span>
            <span>{formatCurrency(tax.amount)}</span>
          </div>
        ))}

        <div className="bill__total-row bill__total-row--grand">
          <span>TOTAL</span>
          <span>{formatCurrency(order.finalAmount ?? order.totalAmount)}</span>
        </div>
      </div>

      <div className="bill__divider" />

      {/* Footer */}
      <div className="bill__footer">
        <p>Thank you for your visit!</p>
        <p>Please come again 😊</p>
      </div>
    </div>
  );
}
