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
// ISSUE 10 FIX: ClosedGuard wraps order sub-pages and shows a "We're Closed"
// screen when the restaurant is closed, preventing manual URL bypass.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// ── Main website (existing) ───────────────────────────────────────────────
import { useRestaurantData } from './hooks/useRestaurantData.js';
import Home from './pages/Home/Home.jsx';
import Loader from './components/Loader/Loader.jsx';

// ── Order flow (new) ──────────────────────────────────────────────────────
import { OrderProvider } from './context/OrderContext.jsx';
import { useOrder } from './context/OrderContext.jsx';
import QRLanding    from './pages/QRLanding/QRLanding.jsx';
import CustomerInfo from './pages/CustomerInfo/CustomerInfo.jsx';
import WaitingWaiter from './pages/WaitingWaiter/WaitingWaiter.jsx';
import Menu         from './pages/Menu/Menu.jsx';
import Cart         from './pages/Cart/Cart.jsx';
import OrderPlaced  from './pages/OrderPlaced/OrderPlaced.jsx';
import ThankYou     from './pages/ThankYou/ThankYou.jsx';
import NotFound     from './pages/NotFound/NotFound.jsx';
import PublicMenu   from './pages/PublicMenu/PublicMenu.jsx';
import OrderTracking from './pages/OrderTracking/OrderTracking.jsx';

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

// ── ISSUE 10: Restaurant Closed Guard ────────────────────────────────────────
// Renders a "We're Closed" screen if the restaurant is closed.
// Only shows after the status check completes to avoid flash.
function ClosedGuard({ children }) {
  const { isRestaurantClosed, closedCheckDone } = useOrder();

  if (!closedCheckDone) {
    // While checking, show a minimal spinner to avoid flash of content
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg, #0f0f0f)',
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid var(--color-border, #333)',
          borderTopColor: 'var(--color-primary, #e85d3a)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isRestaurantClosed) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '32px 24px',
        background: 'var(--color-bg, #0f0f0f)',
        textAlign: 'center',
        fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '8px' }}>🌙</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-text, #f5f5f5)', margin: 0 }}>
          We're Closed Right Now
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted, #888)', maxWidth: '320px', lineHeight: '1.6', margin: 0 }}>
          Our kitchen is taking a break. Please come back during opening hours or ask our staff for assistance.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #666)', margin: '8px 0 0' }}>
          We look forward to serving you soon! 🙏
        </p>
      </div>
    );
  }

  return children;
}

// ── Root app ──────────────────────────────────────────────────────────────
export default function App() {
  const [keyError, setKeyError] = useState(false);

  useEffect(() => {
    const handleKeyError = () => {
      setKeyError(true);
    };
    window.addEventListener('retrop-key-error', handleKeyError);
    return () => window.removeEventListener('retrop-key-error', handleKeyError);
  }, []);

  if (keyError) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '32px 24px',
        background: 'var(--color-bg, #0f0f0f)',
        textAlign: 'center',
        fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
        color: 'var(--color-text, #f5f5f5)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '8px' }}>⚠️</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
          System Offline
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted, #888)', maxWidth: '320px', lineHeight: '1.6', margin: 0 }}>
          This restaurant's digital ordering system is temporarily unavailable. Please ask staff for assistance.
        </p>
      </div>
    );
  }

  return (
    <Routes>
      {/* ── Main restaurant website ─────────────────────────────────────── */}
      <Route path="/" element={<WebsiteRoutes />} />

      {/* ── Public read-only menu ───────────────────────────────────────── */}
      <Route path="/menu" element={<PublicMenu />} />

      {/* ── Customer order flow (QR scan → order → bill) ────────────────── */}
      <Route
        path="/order/*"
        element={
          <OrderProvider>
            <ClosedGuard>
              <Routes>
                {/* Entry point — QR code points here */}
                <Route path=":tableId"              element={<QRLanding />} />
                <Route path=":tableId/info"         element={<CustomerInfo />} />
                <Route path=":tableId/waiting"      element={<WaitingWaiter />} />
                <Route path=":tableId/menu"         element={<Menu />} />
                <Route path=":tableId/cart"         element={<Cart />} />
                <Route path=":tableId/placed/:orderId" element={<OrderTracking />} />
                <Route path=":tableId/tracking/:orderId" element={<OrderTracking />} />
              </Routes>
            </ClosedGuard>
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
