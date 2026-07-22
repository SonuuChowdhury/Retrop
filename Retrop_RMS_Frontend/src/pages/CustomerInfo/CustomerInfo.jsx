// ============================================================================
// CustomerInfo — /order/:tableId/info
// ============================================================================
// Customer enters their name and mobile number.
// On submit → POST /api/order/session/customer-info → navigate to waiting.
// ============================================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useOrder } from '../../context/OrderContext.jsx';
import StatusBar from '../../components/StatusBar/StatusBar.jsx';
import './CustomerInfo.css';

export default function CustomerInfo() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { sessionToken, setCustomerName, setCustomerMobile, setSession, restaurantInfo } = useOrder();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [consent, setConsent] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // ---------- Validation ----------
  function validate() {
    const errs = {};
    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Please enter your full name (at least 2 characters).';
    }
    const digits = mobile.replace(/\D/g, '');
    if (digits.length !== 10) {
      errs.mobile = 'Please enter a valid 10-digit mobile number.';
    }
    if (!consent) {
      errs.consent = 'Please accept the data collection terms to proceed.';
    }
    return errs;
  }

  // ---------- Submit ----------
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await api.submitCustomerInfo({
        tableId,
        sessionToken,
        customerName: name.trim(),
        customerMobile: mobile.replace(/\D/g, ''),
      });

      setCustomerName(name.trim());
      setCustomerMobile(mobile.replace(/\D/g, ''));
      setSession(res.data);

      navigate(`/order/${tableId}/waiting`, { replace: true });
    } catch (err) {
      // Session expired
      if (err.status === 410) {
        setServerError('Your session has expired. Please scan the QR code again.');
        return;
      }
      setServerError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <StatusBar currentStep="info" restaurantName={restaurantInfo?.restaurantName} />

      <main className="customer-info g-container">
        <div className="customer-info__hero">
          <span className="g-section-label">Table {restaurantInfo?.tableNo || ''}</span>
          <h1 className="customer-info__title">Welcome!</h1>
          <p className="customer-info__subtitle">
            Please tell us a bit about yourself so we can serve you better.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="customer-info__form" noValidate>
          {/* Name */}
          <div className="input-group">
            <label htmlFor="ci-name" className="input-label">Your Name</label>
            <input
              id="ci-name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Arjun Sharma"
              className={`input-field ${errors.name ? 'input-field--error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              maxLength={60}
            />
            {errors.name && <span className="input-error-msg">{errors.name}</span>}
          </div>

          {/* Mobile */}
          <div className="input-group">
            <label htmlFor="ci-mobile" className="input-label">Mobile Number</label>
            <input
              id="ci-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="10-digit number"
              className={`input-field ${errors.mobile ? 'input-field--error' : ''}`}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/[^\d\s\-\+]/g, ''))}
              disabled={submitting}
              maxLength={15}
            />
            {errors.mobile && <span className="input-error-msg">{errors.mobile}</span>}
          </div>

          {/* Data Privacy & Consent Notice Card */}
          <div className="customer-info__consent-card">
            <div className="customer-info__consent-header">
              <span className="customer-info__consent-icon">🔒</span>
              <span className="customer-info__consent-title">Privacy & Data Consent</span>
            </div>
            <p className="customer-info__consent-text">
              We collect this data to process your order and may share order/feedback data with the restaurant.
            </p>
            <label className="customer-info__consent-checkbox-label" htmlFor="ci-consent">
              <input
                id="ci-consent"
                type="checkbox"
                className="customer-info__consent-checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={submitting}
              />
              <span className="customer-info__consent-checkbox-text">
                I agree to the data collection terms to proceed with my order.
              </span>
            </label>
            {errors.consent && <span className="input-error-msg">{errors.consent}</span>}
          </div>

          {serverError && (
            <div className="customer-info__server-error" role="alert">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Agree & Continue →'}
          </button>
        </form>
      </main>
    </div>
  );
}
