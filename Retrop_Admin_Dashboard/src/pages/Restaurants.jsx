import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';
import { Plus, ToggleLeft, ToggleRight, Key, Edit, Trash2, Eye, Clipboard, Check, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    businessName: '',
    ownerName: '',
    gender: 'Male',
    ownerMobile: '',
    ownerEmail: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Action Loading States
  const [togglingRestaurantId, setTogglingRestaurantId] = useState(null);
  const [deletingRestaurantId, setDeletingRestaurantId] = useState(null);
  const [generatingKeyRestaurantId, setGeneratingKeyRestaurantId] = useState(null);
  const [deletingKeyId, setDeletingKeyId] = useState(null);

  // Generated Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [targetRestaurantName, setTargetRestaurantName] = useState('');

  const fetchRestaurants = async () => {
    try {
      const res = await api.listRestaurants();
      if (res.status === 'success' && res.data) {
        setRestaurants(res.data);
      }
    } catch (err) {
      setError('Failed to fetch restaurants list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRestaurant((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setCreateError('');

    const { businessName, ownerName, ownerMobile, ownerEmail } = newRestaurant;
    if (!businessName.trim() || !ownerName.trim() || !ownerMobile.trim()) {
      setCreateError('Business name, owner name, and mobile are required.');
      return;
    }
    if (!/^\d{10}$/.test(ownerMobile.trim())) {
      setCreateError('Mobile number must be a valid 10-digit number.');
      return;
    }
    if (ownerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
      setCreateError('Please enter a valid email address.');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.createRestaurant(newRestaurant);
      if (res.status === 'success' && res.data) {
        // Successfully created restaurant, automatically generate the first product key
        const keyRes = await api.generateKey(res.data.restaurantId);
        
        setIsCreateModalOpen(false);
        // Reset form
        setNewRestaurant({
          businessName: '',
          ownerName: '',
          gender: 'Male',
          ownerMobile: '',
          ownerEmail: '',
        });

        // Show generated key modal
        if (keyRes.status === 'success' && keyRes.data) {
          setGeneratedKey(keyRes.data.keyValue);
          setTargetRestaurantName(res.data.businessName);
          setIsKeyModalOpen(true);
        }

        // Refresh list
        fetchRestaurants();
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create restaurant.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (restaurantId, currentStatus) => {
    setTogglingRestaurantId(restaurantId);
    try {
      await api.toggleRestaurantStatus(restaurantId);
      // Update local state
      setRestaurants((prev) =>
        prev.map((r) =>
          r.restaurantId === restaurantId ? { ...r, isActive: !currentStatus } : r
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setTogglingRestaurantId(null);
    }
  };

  const handleDeleteRestaurant = async (restaurantId, businessName) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently delete "${businessName}"?\n\nThis will instantly delete the restaurant registry, all staff accounts, menus, active tables, custom info, settings, and all active order history permanently! This action CANNOT be undone.`)) {
      return;
    }

    setDeletingRestaurantId(restaurantId);
    try {
      const res = await api.deleteRestaurant(restaurantId);
      if (res.status === 'success') {
        alert('Restaurant deleted successfully.');
        fetchRestaurants();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete restaurant.');
    } finally {
      setDeletingRestaurantId(null);
    }
  };

  const handleGenerateNewKey = async (restaurantId, businessName) => {
    if (!window.confirm(`Are you sure you want to generate a new product key for "${businessName}"?`)) {
      return;
    }

    setGeneratingKeyRestaurantId(restaurantId);
    try {
      const res = await api.generateKey(restaurantId);
      if (res.status === 'success' && res.data) {
        setGeneratedKey(res.data.keyValue);
        setTargetRestaurantName(businessName);
        setIsKeyModalOpen(true);
        fetchRestaurants();
      }
    } catch (err) {
      alert(err.message || 'Failed to generate key.');
    } finally {
      setGeneratingKeyRestaurantId(null);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to permanently delete this product key? The restaurant will immediately lose access to their services until a new key is generated.')) {
      return;
    }

    setDeletingKeyId(keyId);
    try {
      const res = await api.deleteKey(keyId);
      if (res.status === 'success') {
        alert('Product key deleted.');
        fetchRestaurants();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete key.');
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleCopyKey = (keyText) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Restaurants</h1>
          <p style={styles.subtitle}>Onboard, control subscriptions, and manage license keys</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} style={styles.createButton}>
          <Plus size={18} />
          <span>Add Restaurant</span>
        </button>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <p>{error}</p>
        </div>
      )}

      {/* Restaurants Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Business Name</th>
                <th style={styles.th}>Owner Name</th>
                <th style={styles.th}>Contact Info</th>
                <th style={styles.th}>Key Status</th>
                <th style={styles.th}>Business Status</th>
                <th style={styles.th} style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><SkeletonLoader width="140px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="110px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="120px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="130px" height="18px" /></td>
                    <td style={styles.td}><SkeletonLoader width="70px" height="18px" /></td>
                    <td style={styles.td} style={{ ...styles.td, textAlign: 'right' }}><SkeletonLoader width="80px" height="18px" style={{ marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTd}>
                    No restaurants registered yet. Click "Add Restaurant" to onboard your first client.
                  </td>
                </tr>
              ) : (
                restaurants.map((res) => {
                  const activeKey = res.keys?.find(k => k.isActive);
                  return (
                    <tr key={res.restaurantId} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.businessCell}>
                          <Link to={`/restaurants/${res.restaurantId}`} style={styles.businessName}>
                            {res.businessName}
                          </Link>
                        </div>
                      </td>
                      <td style={styles.td}>{res.ownerName}</td>
                      <td style={styles.td}>
                        <div style={styles.contactCell}>
                          <span style={styles.mobile}>{res.ownerMobile}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {res.keys && res.keys.length > 0 ? (
                          <div style={styles.keyBadgeContainer}>
                            <span style={styles.keyText}>{res.keys[0].keyValue}</span>
                            {res.keys[0].isActive ? (
                              <span style={styles.activeKeyBadge}>Active</span>
                            ) : (
                              <span style={styles.inactiveKeyBadge}>Inactive</span>
                            )}
                            <button
                              onClick={() => handleDeleteKey(res.keys[0].keyId)}
                              title="Delete License Key"
                              style={styles.deleteKeyInlineBtn}
                              disabled={deletingKeyId === res.keys[0].keyId}
                            >
                              {deletingKeyId === res.keys[0].keyId ? (
                                <span className="spinner" style={{ color: 'var(--color-error)' }}></span>
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span style={styles.inactiveKeyBadge}>No Key</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleToggleStatus(res.restaurantId, res.isActive)}
                          style={styles.statusToggleBtn}
                          disabled={togglingRestaurantId === res.restaurantId}
                        >
                          {togglingRestaurantId === res.restaurantId ? (
                            <div style={{ ...styles.statusRow, color: 'var(--color-text-muted)' }}>
                              <span className="spinner" style={{ marginRight: '6px' }}></span>
                              <span>Updating...</span>
                            </div>
                          ) : res.isActive ? (
                            <div style={{ ...styles.statusRow, color: 'var(--color-success)' }}>
                              <ToggleRight size={24} />
                              <span>Active</span>
                            </div>
                          ) : (
                            <div style={{ ...styles.statusRow, color: 'var(--color-text-muted)' }}>
                              <ToggleLeft size={24} />
                              <span>Suspended</span>
                            </div>
                          )}
                        </button>
                      </td>
                      <td style={styles.td} style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actions}>
                          {res.keyCount === 0 && (
                            <button
                              onClick={() => handleGenerateNewKey(res.restaurantId, res.businessName)}
                              title="Generate New Product Key"
                              style={styles.actionBtn}
                              disabled={generatingKeyRestaurantId === res.restaurantId}
                            >
                              {generatingKeyRestaurantId === res.restaurantId ? (
                                <span className="spinner" style={{ color: 'var(--color-primary)' }}></span>
                              ) : (
                                <Key size={16} />
                              )}
                            </button>
                          )}
                          <Link
                            to={`/restaurants/${res.restaurantId}`}
                            title="View / Edit Details"
                            style={styles.actionBtn}
                          >
                            <ArrowUpRight size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeleteRestaurant(res.restaurantId, res.businessName)}
                            title="Delete Restaurant"
                            style={{ ...styles.actionBtn, color: 'var(--color-error)' }}
                            disabled={deletingRestaurantId === res.restaurantId}
                          >
                            {deletingRestaurantId === res.restaurantId ? (
                              <span className="spinner" style={{ color: 'var(--color-error)' }}></span>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Restaurant */}
      {isCreateModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Onboard New Restaurant</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>

            {createError && (
              <div style={styles.modalErrorBanner}>
                <p>{createError}</p>
              </div>
            )}

            <form onSubmit={handleCreateRestaurant} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Restaurant / Cafe Name</label>
                <input
                  type="text"
                  name="businessName"
                  placeholder="e.g. Husna Foods"
                  value={newRestaurant.businessName}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={createLoading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Owner Full Name</label>
                <input
                  type="text"
                  name="ownerName"
                  placeholder="e.g. Mohd Husna"
                  value={newRestaurant.ownerName}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={createLoading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Owner Email Address</label>
                <input
                  type="email"
                  name="ownerEmail"
                  placeholder="e.g. owner@example.com"
                  value={newRestaurant.ownerEmail}
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={createLoading}
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Gender</label>
                  <select
                    name="gender"
                    value={newRestaurant.gender}
                    onChange={handleInputChange}
                    style={styles.select}
                    disabled={createLoading}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ ...styles.formGroup, flex: 2 }}>
                  <label style={styles.label}>Owner Mobile Number</label>
                  <input
                    type="tel"
                    name="ownerMobile"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={newRestaurant.ownerMobile}
                    onChange={handleInputChange}
                    style={styles.input}
                    disabled={createLoading}
                    required
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={styles.modalCancelBtn}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSaveBtn}
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="spinner"></span>
                      <span>Onboarding...</span>
                    </span>
                  ) : (
                    'Onboard & Generate Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: One-Time Product Key Generated Display */}
      {isKeyModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle} style={{ ...styles.modalTitle, color: 'var(--color-success)' }}>
                🔑 License Key Generated
              </h3>
              <button onClick={() => setIsKeyModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>

            <div style={styles.keyDetailsContainer}>
              <p style={styles.keyWarningText}>
                <strong>IMPORTANT:</strong> Below is the unique product key for <strong>{targetRestaurantName}</strong>. Copy this key now. It cannot be retrieved in plaintext again for security.
              </p>

              <div style={styles.keyDisplayBox}>
                <span style={styles.generatedKeyText}>{generatedKey}</span>
                <button onClick={() => handleCopyKey(generatedKey)} style={styles.copyBtn}>
                  {copiedKey === generatedKey ? (
                    <Check size={18} style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Clipboard size={18} />
                  )}
                </button>
              </div>

              <div style={styles.appConfigInstruction}>
                <p style={styles.instructionText}>
                  <strong>How to use:</strong>
                </p>
                <ol style={styles.instructionList}>
                  <li>Open the Restaurant Management System app on tablet/mobile.</li>
                  <li>Tap the <strong>Settings icon (⚙)</strong> on the home screen.</li>
                  <li>Enter the server URL and paste this <strong>Product Key</strong>.</li>
                  <li>Save configuration and proceed to log in.</li>
                </ol>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                style={{ ...styles.modalSaveBtn, width: '100%' }}
              >
                I have copied the key
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'var(--transition)',
  },
  errorBanner: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-error-light)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-error)',
    marginBottom: '24px',
  },
  tableCard: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: 'var(--shadow)',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1px solid var(--color-border)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid var(--color-border)',
    ':last-child': {
      borderBottom: 'none',
    },
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: 'var(--color-text)',
  },
  businessCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  businessName: {
    color: 'var(--color-text)',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'var(--transition)',
    ':hover': {
      color: 'var(--color-primary)',
    },
  },
  contactCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  mobile: {
    fontWeight: '500',
  },
  gender: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  keyBadgeContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  deleteKeyInlineBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    color: 'var(--color-error)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginLeft: '4px',
  },
  keyText: {
    fontFamily: 'monospace',
    backgroundColor: 'var(--color-border)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  activeKeyBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-success)',
    backgroundColor: 'var(--color-success-light)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  inactiveKeyBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    backgroundColor: 'var(--color-border)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  statusToggleBtn: {
    display: 'flex',
    alignItems: 'center',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    transition: 'var(--transition)',
    ':hover': {
      borderColor: 'var(--color-primary)',
      color: 'var(--color-primary)',
    },
  },
  emptyTd: {
    padding: '40px 16px',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: 'var(--shadow)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  modalCloseBtn: {
    fontSize: '24px',
    color: 'var(--color-text-muted)',
    lineHeight: 1,
    ':hover': {
      color: 'var(--color-text)',
    },
  },
  modalErrorBanner: {
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-error-light)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-error)',
    fontSize: '14px',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
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
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'var(--color-text)',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
  modalCancelBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-border)',
    color: 'var(--color-text)',
    fontWeight: '600',
    fontSize: '14px',
  },
  modalSaveBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '14px',
  },
  keyDetailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  keyWarningText: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: 'var(--color-text-muted)',
  },
  keyDisplayBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#000000',
    border: '1px solid var(--color-border)',
  },
  generatedKeyText: {
    fontFamily: 'monospace',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    letterSpacing: '1px',
  },
  copyBtn: {
    color: 'var(--color-text-muted)',
    ':hover': {
      color: 'var(--color-text)',
    },
  },
  appConfigInstruction: {
    marginTop: '8px',
  },
  instructionText: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  instructionList: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    paddingLeft: '20px',
    lineHeight: '1.6',
  },
};
