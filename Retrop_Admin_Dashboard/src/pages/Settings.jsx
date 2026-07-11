import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';
import { Save, AlertCircle, CheckCircle, Shield, Percent } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTitle } from '../context/TitleContext';

export default function Settings() {
  useTitle('Settings');
  const [config, setConfig] = useState({
    legalName: '',
    address: '',
    gstin: '',
    mobile: '',
    email: '',
    gstRate: 18.00,
    isTaxEnabled: true,
    bankDetails: {},
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
            isTaxEnabled: res.data.isTaxEnabled !== false,
            bankDetails: res.data.bankDetails || {},
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


  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!config.legalName.trim() || !config.address.trim() || !config.mobile.trim() || !config.email.trim()) {
      setError('All standard business information fields are required.');
      return;
    }

    if (config.isTaxEnabled) {
      if (!config.gstin.trim()) {
        setError('Corporate GSTIN is required when tax is enabled.');
        return;
      }
      if (config.gstin.trim().length !== 15) {
        setError('GSTIN must be a valid 15-character ID.');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.updateBusinessConfig(config);
      if (res.status === 'success' && res.data) {
        if (res.data.dbMigrationRequired) {
          setError('Settings saved, but the "isTaxEnabled" column is missing in your database. Please run the SQL migration script "Server/src/migrations/005_taxation_flag.sql" in your Supabase SQL Editor to fully enable tax configuration.');
        } else {
          setSuccess('Retrop billing credentials and business configuration updated successfully.');
        }
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
          <p style={styles.subtitle}>Configure Retrop legal credentials and tax variables for customer invoicing</p>
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
              
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.toggleLabel}>Apply Tax / GST on Invoices</span>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, isTaxEnabled: !prev.isTaxEnabled }))}
                  style={config.isTaxEnabled ? styles.toggleBtnActive : styles.toggleBtnInactive}
                  disabled={saving}
                >
                  <span style={config.isTaxEnabled ? styles.toggleSliderActive : styles.toggleSliderInactive} />
                </button>
              </div>

              {config.isTaxEnabled && (
                <div style={styles.formGrid}>
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
              )}
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
  toggleLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text)',
  },
  toggleBtnActive: {
    width: '50px',
    height: '26px',
    borderRadius: '13px',
    backgroundColor: 'var(--color-primary)',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '0 3px',
    transition: 'background-color 0.2s ease',
  },
  toggleBtnInactive: {
    width: '50px',
    height: '26px',
    borderRadius: '13px',
    backgroundColor: '#374151',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '0 3px',
    transition: 'background-color 0.2s ease',
  },
  toggleSliderActive: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    right: '3px',
    transition: 'all 0.2s ease',
  },
  toggleSliderInactive: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: '3px',
    transition: 'all 0.2s ease',
  },
};
