import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';
import { Save, AlertCircle, CheckCircle, Shield, Building, Percent } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Settings() {
  const [config, setConfig] = useState({
    legalName: '',
    address: '',
    gstin: '',
    mobile: '',
    email: '',
    gstRate: 18.00,
    bankDetails: {
      bankName: '',
      accountNo: '',
      ifsc: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.getBusinessConfig();
        if (res.status === 'success' && res.data) {
          setConfig({
            legalName: res.data.legalName || '',
            address: res.data.address || '',
            gstin: res.data.gstin || '',
            mobile: res.data.mobile || '',
            email: res.data.email || '',
            gstRate: res.data.gstRate || 18.00,
            bankDetails: res.data.bankDetails || { bankName: '', accountNo: '', ifsc: '' },
          });
        }
      } catch (err) {
        setError('Failed to load Retrop business settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value,
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!config.legalName.trim() || !config.address.trim() || !config.gstin.trim() || !config.mobile.trim() || !config.email.trim()) {
      setError('All standard business information fields are required.');
      return;
    }

    if (config.gstin.trim().length !== 15) {
      setError('GSTIN must be a valid 15-character ID.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateBusinessConfig(config);
      if (res.status === 'success' && res.data) {
        setSuccess('Retrop billing credentials and business configuration updated successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Retrop Settings</h1>
          <p style={styles.subtitle}>Configure Retrop legal credentials, tax variables, and bank settings for customer invoicing</p>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.successBanner}>
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.skeletonContainer}>
            <SkeletonLoader width="100%" height="40px" style={{ marginBottom: '16px' }} />
            <SkeletonLoader width="100%" height="150px" style={{ marginBottom: '16px' }} />
            <SkeletonLoader width="80%" height="40px" />
          </div>
        ) : (
          <form onSubmit={handleSave} style={styles.form}>
            {/* Section 1: Business profile */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <Shield size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={styles.sectionTitle}>Business Legal Profile</h3>
              </div>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Legal Business Entity Name</label>
                  <input
                    type="text"
                    name="legalName"
                    value={config.legalName}
                    onChange={handleInputChange}
                    placeholder="e.g. Retrop Software Solutions"
                    style={styles.input}
                    disabled={saving}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Corporate GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={config.gstin}
                    onChange={handleInputChange}
                    placeholder="15-character GSTIN code"
                    maxLength={15}
                    style={styles.input}
                    disabled={saving}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Email</label>
                  <input
                    type="email"
                    name="email"
                    value={config.email}
                    onChange={handleInputChange}
                    placeholder="e.g. billing@retrop.com"
                    style={styles.input}
                    disabled={saving}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Phone / Mobile</label>
                  <input
                    type="text"
                    name="mobile"
                    value={config.mobile}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 98765 43210"
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
              </div>

              <div style={{ ...styles.formGroup, marginTop: '16px' }}>
                <label style={styles.label}>Official Billing Address</label>
                <textarea
                  name="address"
                  value={config.address}
                  onChange={handleInputChange}
                  placeholder="Full office address"
                  style={styles.textarea}
                  disabled={saving}
                  rows={3}
                />
              </div>
            </div>

            {/* Section 2: Taxation */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <Percent size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={styles.sectionTitle}>Taxation Settings</h3>
              </div>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Standard GST Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="gstRate"
                    value={config.gstRate}
                    onChange={handleInputChange}
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Bank details */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <Building size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={styles.sectionTitle}>Retrop Bank Details (For Invoice Wire Transfers)</h3>
              </div>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bank name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={config.bankDetails?.bankName || ''}
                    onChange={handleBankChange}
                    placeholder="e.g. HDFC Bank"
                    style={styles.input}
                    disabled={saving}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Account Number</label>
                  <input
                    type="text"
                    name="accountNo"
                    value={config.bankDetails?.accountNo || ''}
                    onChange={handleBankChange}
                    placeholder="e.g. 50100012345678"
                    style={styles.input}
                    disabled={saving}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc"
                    value={config.bankDetails?.ifsc || ''}
                    onChange={handleBankChange}
                    placeholder="e.g. HDFC0000123"
                    style={styles.input}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div style={styles.footer}>
              <button type="submit" style={styles.saveBtn} disabled={saving}>
                {saving ? (
                  <span className="spinner" style={{ marginRight: '8px' }}></span>
                ) : (
                  <Save size={18} />
                )}
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--color-text)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  card: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: 'var(--shadow)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  section: {
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '24px',
    ':last-of-type': {
      borderBottom: 'none',
      paddingBottom: 0,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'var(--transition)',
    ':focus': {
      borderColor: 'var(--color-primary)',
    },
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--color-text)',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'var(--transition)',
    ':focus': {
      borderColor: 'var(--color-primary)',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'var(--transition)',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-error-light)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-error)',
    marginBottom: '24px',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-success-light)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: 'var(--color-success)',
    marginBottom: '24px',
  },
  skeletonContainer: {
    padding: '10px 0',
  },
};
