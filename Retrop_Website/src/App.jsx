// ============================================================================
// ROOT ROUTER & APPLICATION ENTRY (App.jsx)
// ============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import CookieConsent from './components/CookieConsent';
import { useAnalytics } from './hooks/useAnalytics';

function AnalyticsTracker() {
  useAnalytics();
  return null;
}

// ── Public Website Pages ─────────────────────────────────────────────────────
import Home          from './pages/Home';
import Services      from './pages/Services';
import Downloads     from './pages/Downloads';
import DownloadApp   from './pages/DownloadApp';
import About         from './pages/About';
import Contact       from './pages/Contact';
import NotFound      from './pages/NotFound';

// ── Documentation ────────────────────────────────────────────────────────────
import Docs          from './pages/Docs';
import RMSOverview   from './pages/docs/RMSOverview';
import RMSApp        from './pages/docs/RMSApp';
import RMSOrdering   from './pages/docs/RMSOrdering';
import RMSPortal     from './pages/docs/RMSPortal';

// ── Legal Pages ───────────────────────────────────────────────────────────────
import PrivacyPolicy   from './pages/PrivacyPolicy';
import TermsOfService  from './pages/TermsOfService';
import CookiePolicy    from './pages/CookiePolicy';

// ── Auth Pages ────────────────────────────────────────────────────────────────
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// ── Dashboard ─────────────────────────────────────────────────────────────────
import BusinessSelector from './pages/BusinessSelector';
import Dashboard        from './pages/Dashboard';   // legacy /dashboard/retrop-rms

import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsTracker />
        <CookieConsent />

        <Routes>
          {/* ── Public Website ─────────────────────────────────────────────── */}
          <Route path="/"         element={<Home />}     />
          <Route path="/services" element={<Services />} />
          <Route path="/downloads"          element={<Downloads />} />
          <Route path="/downloads/:appId"   element={<DownloadApp />} />
          <Route path="/about"    element={<About />}    />
          <Route path="/contact"  element={<Contact />}  />

          {/* ── Documentation ──────────────────────────────────────────────── */}
          <Route path="/docs"               element={<Docs />}        />
          <Route path="/docs/rms"           element={<RMSOverview />} />
          <Route path="/docs/rms/app"       element={<RMSApp />}      />
          <Route path="/docs/rms/ordering"  element={<RMSOrdering />} />
          <Route path="/docs/rms/portal"    element={<RMSPortal />}   />

          {/* ── Legal ──────────────────────────────────────────────────────── */}
          <Route path="/privacy-policy"   element={<PrivacyPolicy />}  />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy"    element={<CookiePolicy />}   />

          {/* ── Auth ───────────────────────────────────────────────────────── */}
          <Route path="/login"           element={<Login />}          />
          <Route path="/signup"          element={<Signup />}         />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* Legacy redirect */}
          <Route path="/reset-password"  element={<Navigate to="/login" replace />} />

          {/* ── Protected Dashboard ────────────────────────────────────────── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <BusinessSelector />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/retrop-rms"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ── 404 ────────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
