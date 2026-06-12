// ============================================================================
// App.jsx
// ============================================================================
// Root router for the ENTIRE frontend project.
//
// Two distinct flows share the same app:
//   1. Main Restaurant Website  →  /  (existing Home page + all its sections)
//   2. Customer Order Flow      →  /order/:tableId/*  and  /bill/:orderId
//
// The OrderProvider wraps ONLY the order routes — the main website doesn't
// need cart/session state.
// ============================================================================

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// ── Main website (existing) ───────────────────────────────────────────────
import { useRestaurantData } from './hooks/useRestaurantData.js';
import Home from './pages/Home/Home.jsx';
import Loader from './components/Loader/Loader.jsx';

// ── Order flow (new) ──────────────────────────────────────────────────────
import { OrderProvider } from './context/OrderContext.jsx';
import QRLanding    from './pages/QRLanding/QRLanding.jsx';
import CustomerInfo from './pages/CustomerInfo/CustomerInfo.jsx';
import WaitingWaiter from './pages/WaitingWaiter/WaitingWaiter.jsx';
import Menu         from './pages/Menu/Menu.jsx';
import Cart         from './pages/Cart/Cart.jsx';
import OrderPlaced  from './pages/OrderPlaced/OrderPlaced.jsx';
import ThankYou     from './pages/ThankYou/ThankYou.jsx';
import NotFound     from './pages/NotFound/NotFound.jsx';

// ── Main website wrapper ──────────────────────────────────────────────────
function WebsiteRoutes() {
  const { data, loading, error } = useRestaurantData();

  if (loading) return <Loader />;
  if (error) return (
    <div className="app-error">
      <p>Failed to load restaurant data. Please check <code>public/data.json</code>.</p>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Home data={data} />} />
    </Routes>
  );
}

// ── Root app ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* ── Main restaurant website ─────────────────────────────────────── */}
      <Route path="/" element={<WebsiteRoutes />} />

      {/* ── Customer order flow (QR scan → order → bill) ────────────────── */}
      <Route
        path="/order/*"
        element={
          <OrderProvider>
            <Routes>
              {/* Entry point — QR code points here */}
              <Route path=":tableId"              element={<QRLanding />} />
              <Route path=":tableId/info"         element={<CustomerInfo />} />
              <Route path=":tableId/waiting"      element={<WaitingWaiter />} />
              <Route path=":tableId/menu"         element={<Menu />} />
              <Route path=":tableId/cart"         element={<Cart />} />
              <Route path=":tableId/placed/:orderId" element={<OrderPlaced />} />
            </Routes>
          </OrderProvider>
        }
      />

      {/* ── Bill / Thank you page (standalone, no session needed) ─────── */}
      <Route
        path="/bill/:orderId"
        element={
          <OrderProvider>
            <ThankYou />
          </OrderProvider>
        }
      />

      {/* ── 404 ───────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
