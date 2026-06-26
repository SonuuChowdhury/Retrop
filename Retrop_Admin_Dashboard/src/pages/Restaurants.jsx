import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';
import { Plus, ToggleLeft, ToggleRight, Key, Trash2, Clipboard, Check, ArrowUpRight, DollarSign, CreditCard, Shield, AlertCircle, Percent, Edit2, Calendar, ShieldCheck, HelpCircle, Save, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';

export default function Restaurants() {
  const { alert, confirm } = useDialog();
  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants' or 'plans'
  const [allPlans, setAllPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [plansSuccess, setPlansSuccess] = useState('');

  // Modal: Create/Edit Plan Form States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planModalLoading, setPlanModalLoading] = useState(false);
  const [planForm, setPlanForm] = useState({
    businessTypeId: 'restaurant',
    name: '',
    planType: 'monthly',
    billingCycleDays: 28,
    basePrice: '',
    gstPercent: 18.00,
    description: '',
    isActive: true,
  });

  // Modal: Create Restaurant Form States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    businessName: '',
    ownerName: '',
    gender: 'Male',
    ownerMobile: '',
    ownerEmail: '',
    businessTypeId: 'restaurant',
    hasGst: false,
    gstin: '',
    planId: '',
    billingCycleDays: 28,
    gracePeriodDays: 10,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal: Confirm Payment Form States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPendingData, setPaymentPendingData] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'UPI',
    upiTransactionId: '',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Generated Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [targetRestaurantName, setTargetRestaurantName] = useState('');

  // Action Loading States
  const [togglingRestaurantId, setTogglingRestaurantId] = useState(null);
  const [deletingRestaurantId, setDeletingRestaurantId] = useState(null);
  const [generatingKeyRestaurantId, setGeneratingKeyRestaurantId] = useState(null);

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

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.listPlans();
      if (res.status === 'success' && res.data) {
        setAllPlans(res.data);
        const activePlans = res.data.filter(p => p.isActive && p.planType !== 'support');
        setPlans(activePlans);
        // Default to first active plan in onboarding
        if (activePlans.length > 0) {
          setNewRestaurant(prev => ({
            ...prev,
            planId: prev.planId || activePlans[0].planId,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load pricing plans', err);
      setPlansError('Failed to fetch subscription plans list.');
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchPlans();
  }, []);

  // Pricing Plans CRUD Handlers
  const openCreatePlanModal = () => {
    setEditingPlanId(null);
    setPlanForm({
      businessTypeId: 'restaurant',
      name: '',
      planType: 'monthly',
      billingCycleDays: 28,
      basePrice: '',
      gstPercent: 18.00,
      description: '',
      isActive: true,
    });
    setPlansError('');
    setPlansSuccess('');
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlanId(plan.planId);
    setPlanForm({
      businessTypeId: plan.businessTypeId || 'restaurant',
      name: plan.name || '',
      planType: plan.planType || 'monthly',
      billingCycleDays: plan.billingCycleDays || 28,
      basePrice: plan.basePrice || '',
      gstPercent: plan.gstPercent || 18.00,
      description: plan.description || '',
      isActive: plan.isActive !== undefined ? plan.isActive : true,
    });
    setPlansError('');
    setPlansSuccess('');
    setIsPlanModalOpen(true);
  };

  const handlePlanInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlanForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setPlansError('');
    setPlansSuccess('');

    if (!planForm.name.trim() || planForm.basePrice === '') {
      setPlansError('Plan name and base price are required.');
      return;
    }

    setPlanModalLoading(true);
    try {
      if (editingPlanId) {
        // Update plan
        const res = await api.updatePlan(editingPlanId, planForm);
        if (res.status === 'success') {
          setPlansSuccess(`Plan "${planForm.name}" updated successfully.`);
          setIsPlanModalOpen(false);
          fetchPlans();
        }
      } else {
        // Create plan
        const res = await api.createPlan(planForm);
        if (res.status === 'success') {
          setPlansSuccess(`Plan "${planForm.name}" created successfully.`);
          setIsPlanModalOpen(false);
          fetchPlans();
        }
      }
    } catch (err) {
      setPlansError(err.message || 'Failed to save pricing plan.');
    } finally {
      setPlanModalLoading(false);
    }
  };

  const handleDeletePlan = async (planId, name) => {
    if (!await confirm(`Are you sure you want to delete the plan "${name}"? This action cannot be undone.`)) {
      return;
    }
    setPlansError('');
    setPlansSuccess('');
    try {
      const res = await api.deletePlan(planId);
      if (res.status === 'success') {
        setPlansSuccess(`Plan "${name}" deleted.`);
        fetchPlans();
      }
    } catch (err) {
      setPlansError(err.message || 'Failed to delete plan.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRestaurant((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setCreateError('');

    const { businessName, ownerName, ownerMobile, ownerEmail, hasGst, gstin } = newRestaurant;
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
    if (hasGst && (!gstin.trim() || gstin.trim().length !== 15)) {
      setCreateError('GSTIN is required and must be exactly 15 characters.');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.createRestaurant(newRestaurant);
      if (res.status === 'success' && res.data) {
        setIsCreateModalOpen(false);

        // Transition immediately to Payment Confirmation Modal
        setPaymentPendingData({
          restaurantId: res.data.restaurantId,
          subscriptionId: res.data.subscription?.subscriptionId,
          businessName: res.data.businessName,
          ownerEmail: res.data.ownerEmail,
          planId: newRestaurant.planId,
        });
        setPaymentForm({ paymentMethod: 'UPI', upiTransactionId: '' });
        setPaymentSuccess(false);
        setIsPaymentModalOpen(true);

        // Reset creation form
        setNewRestaurant({
          businessName: '',
          ownerName: '',
          gender: 'Male',
          ownerMobile: '',
          ownerEmail: '',
          businessTypeId: 'restaurant',
          hasGst: false,
          gstin: '',
          planId: plans[0]?.planId || '',
          billingCycleDays: 28,
          gracePeriodDays: 10,
        });

        // Refresh list
        fetchRestaurants();
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create restaurant.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentPendingData?.subscriptionId) {
      await alert("Error: Subscription ID is missing.\n\nThis happens because the required 'billingCycleDays' and 'gracePeriodDays' columns are missing in the 'subscription' table of your database.\n\nTo resolve this:\n1. Go to your Supabase SQL Editor.\n2. Run the SQL commands in 'Server/src/migrations/004_custom_billing.sql' (or run: ALTER TABLE subscription ADD COLUMN IF NOT EXISTS \"billingCycleDays\" INTEGER DEFAULT 28; ALTER TABLE subscription ADD COLUMN IF NOT EXISTS \"gracePeriodDays\" INTEGER DEFAULT 10;)\n3. Reload the Supabase cache by running: NOTIFY pgrst, 'reload schema';\n4. Re-try creating the restaurant.");
      return;
    }
    setPaymentLoading(true);
    try {
      const payload = {
        restaurantId: paymentPendingData.restaurantId,
        subscriptionId: paymentPendingData.subscriptionId,
        paymentMethod: paymentForm.paymentMethod,
        upiTransactionId: paymentForm.paymentMethod === 'UPI' ? paymentForm.upiTransactionId : null,
        description: 'Plan payment confirmation',
      };

      const res = await api.confirmPayment(payload);
      if (res.status === 'success') {
        setPaymentSuccess(true);
        fetchRestaurants();
      }
    } catch (err) {
      await alert(err.message || 'Failed to confirm payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleGenerateKeyAfterPayment = async () => {
    setGeneratingKeyRestaurantId(paymentPendingData.restaurantId);
    try {
      const res = await api.generateKey(paymentPendingData.restaurantId);
      if (res.status === 'success' && res.data) {
        setIsPaymentModalOpen(false);
        setGeneratedKey(res.data.keyValue);
        setTargetRestaurantName(paymentPendingData.businessName);
        setIsKeyModalOpen(true);
        fetchRestaurants();
      }
    } catch (err) {
      await alert(err.message || 'Failed to generate key.');
    } finally {
      setGeneratingKeyRestaurantId(null);
    }
  };

  const handleToggleStatus = async (restaurantId, currentStatus) => {
    setTogglingRestaurantId(restaurantId);
    try {
      await api.toggleRestaurantStatus(restaurantId);
      setRestaurants((prev) =>
        prev.map((r) =>
          r.restaurantId === restaurantId ? { ...r, isActive: !currentStatus } : r
        )
      );
    } catch (err) {
      await alert(err.message || 'Failed to update status.');
    } finally {
      setTogglingRestaurantId(null);
    }
  };

  const handleDeleteRestaurant = async (restaurantId, businessName) => {
    if (!await confirm(`⚠️ WARNING: Are you sure you want to permanently delete "${businessName}"?\n\nThis will instantly delete the restaurant registry, all staff accounts, menus, active tables, custom info, settings, and all active order history permanently! This action CANNOT be undone.`)) {
      return;
    }

    setDeletingRestaurantId(restaurantId);
    try {
      const res = await api.deleteRestaurant(restaurantId);
      if (res.status === 'success') {
        await alert('Restaurant deleted successfully.');
        fetchRestaurants();
      }
    } catch (err) {
      await alert(err.message || 'Failed to delete restaurant.');
    } finally {
      setDeletingRestaurantId(null);
    }
  };

  const handleGenerateNewKey = async (restaurantId, businessName) => {
    if (!await confirm(`Are you sure you want to generate a new product key for "${businessName}"?`)) {
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
      await alert(err.message || 'Failed to generate key.');
    } finally {
      setGeneratingKeyRestaurantId(null);
    }
  };

  const handleCopyKey = (keyText) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const getPlanDetails = (planId) => {
    return plans.find(p => p.planId === planId);
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {activeTab === 'restaurants' ? 'Restaurants' : 'Subscriptions & Pricing'}
          </h1>
          <p style={styles.subtitle}>
            {activeTab === 'restaurants'
              ? 'Onboard, control subscriptions, and manage license keys'
              : 'Configure subscription packages, billing frequencies, and support incident fees'
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {activeTab === 'restaurants' ? (
            <button onClick={() => setIsCreateModalOpen(true)} style={styles.createButton}>
              <Plus size={18} />
              <span>Add Restaurant</span>
            </button>
          ) : (
            <button onClick={openCreatePlanModal} style={styles.createButton}>
              <Plus size={18} />
              <span>Add Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('restaurants')}
          style={{
            ...styles.tabButton,
            borderBottom: activeTab === 'restaurants' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'restaurants' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'restaurants' ? '600' : '500',
          }}
        >
          Restaurants Directory
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            ...styles.tabButton,
            borderBottom: activeTab === 'plans' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'plans' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'plans' ? '600' : '500',
          }}
        >
          Subscription Plans
        </button>
      </div>

      {activeTab === 'restaurants' ? (
        <>
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
                    <th style={styles.th}>Restaurant Name</th>
                    <th style={styles.th}>Owner Name</th>
                    <th style={styles.th}>Mobile</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}><SkeletonLoader width="140px" height="18px" /></td>
                        <td style={styles.td}><SkeletonLoader width="110px" height="18px" /></td>
                        <td style={styles.td}><SkeletonLoader width="120px" height="18px" /></td>
                        <td style={styles.td}><SkeletonLoader width="70px" height="18px" /></td>
                        <td style={{ ...styles.td, textAlign: 'right' }}><SkeletonLoader width="80px" height="18px" style={{ marginLeft: 'auto' }} /></td>
                      </tr>
                    ))
                  ) : restaurants.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={styles.emptyTd}>
                        No restaurants registered yet. Click "Add Restaurant" to onboard your first client.
                      </td>
                    </tr>
                  ) : (
                    restaurants.map((res) => {
                      const activeSub = res.activeSubscription;
                      const isPendingPayment = activeSub?.status === 'pending_payment';
                      const isSuspended = activeSub?.status === 'suspended';

                      return (
                        <tr key={res.restaurantId} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={styles.businessCell}>
                              <Link to={`/restaurants/${res.restaurantId}`} style={styles.businessName}>
                                {res.businessName}
                              </Link>
                              {activeSub && (
                                <span style={{
                                  ...styles.planBadge,
                                  color: isPendingPayment ? 'var(--color-error)' : isSuspended ? 'var(--color-text-muted)' : 'var(--color-success)',
                                  backgroundColor: isPendingPayment ? 'var(--color-error-light)' : isSuspended ? 'var(--color-border)' : 'var(--color-success-light)'
                                }}>
                                  {isPendingPayment ? 'Pending Payment' : isSuspended ? 'Suspended' : 'Paid Plan'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>{res.ownerName}</td>
                          <td style={styles.td}>
                            <div style={styles.contactCell}>
                              <span style={styles.mobile}>{res.ownerMobile}</span>
                            </div>
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
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={styles.actions}>
                              {res.keyCount === 0 && (
                                <button
                                  onClick={() => {
                                    if (isPendingPayment) {
                                      // Open payment confirmation modal
                                      setPaymentPendingData({
                                        restaurantId: res.restaurantId,
                                        subscriptionId: activeSub.subscriptionId,
                                        businessName: res.businessName,
                                        planId: activeSub.planId,
                                      });
                                      setPaymentForm({ paymentMethod: 'UPI', upiTransactionId: '' });
                                      setPaymentSuccess(false);
                                      setIsPaymentModalOpen(true);
                                    } else {
                                      handleGenerateNewKey(res.restaurantId, res.businessName);
                                    }
                                  }}
                                  title={isPendingPayment ? "Collect Pending Payment" : "Generate New Product Key"}
                                  style={{
                                    ...styles.actionBtn,
                                    color: isPendingPayment ? 'var(--color-error)' : 'var(--color-text-muted)',
                                    borderColor: isPendingPayment ? 'var(--color-error)' : 'var(--color-border)',
                                    backgroundColor: isPendingPayment ? 'var(--color-error-light)' : 'transparent'
                                  }}
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
        </>
      ) : (
        <>
          {plansError && (
            <div style={styles.plansErrorBanner}>
              <AlertCircle size={20} />
              <span>{plansError}</span>
            </div>
          )}

          {plansSuccess && (
            <div style={styles.plansSuccessBanner}>
              <CheckCircle size={20} />
              <span>{plansSuccess}</span>
            </div>
          )}

          {/* Subscription Plans Grid */}
          <div style={styles.plansGrid}>
            {plansLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={styles.skeletonPlanCard}>
                  <SkeletonLoader width="60%" height="24px" style={{ marginBottom: '12px' }} />
                  <SkeletonLoader width="40%" height="32px" style={{ marginBottom: '16px' }} />
                  <SkeletonLoader width="100%" height="80px" />
                </div>
              ))
            ) : allPlans.length === 0 ? (
              <div style={styles.emptyPlansState}>No subscription plans configured. Click "Add Plan" to create one.</div>
            ) : (
              allPlans.map((plan) => {
                const isMonthly = plan.planType === 'monthly';
                const isLifetime = plan.planType === 'lifetime';
                const isSupport = plan.planType === 'support';

                return (
                  <div key={plan.planId} style={{
                    ...styles.planCard,
                    opacity: plan.isActive ? 1 : 0.6,
                    border: plan.isActive ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
                  }}>
                    <div style={styles.planHeader}>
                      <div style={styles.planIconWrapper}>
                        {isMonthly && <Calendar size={20} style={{ color: 'var(--color-primary)' }} />}
                        {isLifetime && <ShieldCheck size={20} style={{ color: 'var(--color-success)' }} />}
                        {isSupport && <HelpCircle size={20} style={{ color: '#0ea5e9' }} />}
                      </div>
                      <div style={styles.planMeta}>
                        {!plan.isActive && <span style={styles.inactiveBadge}>Inactive</span>}
                        <span style={styles.verticalBadge}>{plan.businessTypeId?.toUpperCase()}</span>
                        <span style={styles.typeBadge}>{plan.planType}</span>
                      </div>
                    </div>

                    <h3 style={styles.planName}>{plan.name}</h3>
                    <p style={styles.planDesc}>{plan.description || 'No description provided.'}</p>

                    <div style={styles.priceContainer}>
                      <span style={styles.priceSymbol}>INR</span>
                      <span style={styles.priceValue}>{parseFloat(plan.basePrice).toLocaleString('en-IN')}</span>
                      <span style={styles.priceTax}>+ {plan.gstPercent}% GST</span>
                    </div>

                    {isMonthly && (
                      <div style={styles.cycleInfo}>
                        Billing Cycle: <strong>{plan.billingCycleDays} Days</strong>
                      </div>
                    )}

                    <div style={styles.planActions}>
                      <button onClick={() => openEditPlanModal(plan)} style={styles.editPlanBtn}>
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button onClick={() => handleDeletePlan(plan.planId, plan.name)} style={styles.planActions.deleteBtn ? styles.planActions.deleteBtn : styles.deletePlanBtn}>
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

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
                <AlertCircle size={16} style={{ marginRight: '6px' }} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRestaurant} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Restaurant Name</label>
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

                <div style={styles.formGroup}>
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

                <div style={styles.formGroup}>
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

                <div style={styles.formGroup}>
                  <label style={styles.label}>SaaS Pricing Plan</label>
                  <select
                    name="planId"
                    value={newRestaurant.planId}
                    onChange={handleInputChange}
                    style={styles.select}
                    disabled={createLoading}
                    required
                  >
                    {plans.map(p => (
                      <option key={p.planId} value={p.planId}>
                        {p.name} (INR {parseFloat(p.basePrice).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                {plans.find(p => p.planId === newRestaurant.planId)?.planType === 'monthly' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Billing Cycle (Days)</label>
                      <input
                        type="number"
                        name="billingCycleDays"
                        min="1"
                        placeholder="e.g. 28"
                        value={newRestaurant.billingCycleDays || 28}
                        onChange={handleInputChange}
                        style={styles.input}
                        disabled={createLoading}
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Grace Period (Days)</label>
                      <input
                        type="number"
                        name="gracePeriodDays"
                        min="0"
                        placeholder="e.g. 10"
                        value={newRestaurant.gracePeriodDays !== undefined ? newRestaurant.gracePeriodDays : 10}
                        onChange={handleInputChange}
                        style={styles.input}
                        disabled={createLoading}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              {/* GST configuration */}
              <div style={styles.gstBox}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="hasGst"
                    checked={newRestaurant.hasGst}
                    onChange={handleInputChange}
                    disabled={createLoading}
                    style={styles.checkbox}
                  />
                  <span>Client GSTIN Available?</span>
                </label>
                
                {newRestaurant.hasGst && (
                  <div style={{ ...styles.formGroup, marginTop: '8px' }}>
                    <label style={styles.label}>Client GSTIN</label>
                    <input
                      type="text"
                      name="gstin"
                      placeholder="15-character GSTIN code"
                      maxLength={15}
                      value={newRestaurant.gstin}
                      onChange={handleInputChange}
                      style={styles.input}
                      disabled={createLoading}
                      required
                    />
                  </div>
                )}
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
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Payment */}
      {isPaymentModalOpen && paymentPendingData && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} style={{ ...styles.modalContent, maxWidth: '460px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Onboarding Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>

            {!paymentSuccess ? (
              <form onSubmit={handleConfirmPayment} style={styles.form}>
                <div style={styles.paymentSummaryCard}>
                  <h4 style={styles.summaryTitle}>{paymentPendingData.businessName}</h4>
                  {paymentPendingData.planId && getPlanDetails(paymentPendingData.planId) && (
                    <div style={styles.summaryDetails}>
                      <div style={styles.summaryRow}>
                        <span>Plan:</span>
                        <strong>{getPlanDetails(paymentPendingData.planId).name}</strong>
                      </div>
                      <div style={styles.summaryRow}>
                        <span>Base Price:</span>
                        <span>INR {parseFloat(getPlanDetails(paymentPendingData.planId).basePrice).toFixed(2)}</span>
                      </div>
                      <div style={styles.summaryRow}>
                        <span>GST (18%):</span>
                        <span>INR {(parseFloat(getPlanDetails(paymentPendingData.planId).basePrice) * 0.18).toFixed(2)}</span>
                      </div>
                      <div style={{ ...styles.summaryRow, borderTop: '1px dashed var(--color-border)', paddingTop: '8px', marginTop: '8px', fontSize: '15px' }}>
                        <span>Grand Total:</span>
                        <strong>INR {(parseFloat(getPlanDetails(paymentPendingData.planId).basePrice) * 1.18).toFixed(2)}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentInputChange}
                    style={styles.select}
                    disabled={paymentLoading}
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Cash">Cash Payment</option>
                  </select>
                </div>

                {paymentForm.paymentMethod === 'UPI' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>UPI Transaction ID (UTR)</label>
                    <input
                      type="text"
                      name="upiTransactionId"
                      placeholder="e.g. 312345678901"
                      value={paymentForm.upiTransactionId}
                      onChange={handlePaymentInputChange}
                      style={styles.input}
                      disabled={paymentLoading}
                      required
                    />
                  </div>
                )}

                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    style={styles.modalCancelBtn}
                    disabled={paymentLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.modalSaveBtn} disabled={paymentLoading}>
                    {paymentLoading ? (
                      <span className="spinner"></span>
                    ) : (
                      'Confirm Paid Status'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div style={styles.successContainer}>
                <div style={styles.successIconBox}>
                  <Check size={32} style={{ color: 'var(--color-success)' }} />
                </div>
                <h4 style={styles.successHeading}>Payment Verified!</h4>
                <p style={styles.successText}>
                  The payment for <strong>{paymentPendingData.businessName}</strong> has been logged. Welcome email and invoice PDF have been dispatched.
                </p>
                <button
                  onClick={handleGenerateKeyAfterPayment}
                  style={styles.generateKeyBtn}
                  disabled={generatingKeyRestaurantId === paymentPendingData.restaurantId}
                >
                  {generatingKeyRestaurantId === paymentPendingData.restaurantId ? (
                    <span className="spinner" style={{ marginRight: '6px' }}></span>
                  ) : (
                    <Key size={16} style={{ marginRight: '6px' }} />
                  )}
                  <span>Generate Product License Key</span>
                </button>
              </div>
            )}
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

      {/* Modal: Create/Edit Plan */}
      {isPlanModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingPlanId ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}</h3>
              <button onClick={() => setIsPlanModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>

            {plansError && (
              <div style={styles.modalErrorBanner}>
                <AlertCircle size={16} style={{ marginRight: '6px' }} />
                <span>{plansError}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} style={styles.form}>
              <div style={styles.formGrid}>
                {/* We hardcode Restaurant SaaS as vertical but keep the control disabled to avoid confusing the user */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Business Vertical</label>
                  <select
                    name="businessTypeId"
                    value={planForm.businessTypeId}
                    onChange={handlePlanInputChange}
                    style={styles.select}
                    disabled={true}
                  >
                    <option value="restaurant">Restaurant SaaS</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Plan Name</label>
                  <input
                    type="text"
                    name="name"
                    value={planForm.name}
                    onChange={handlePlanInputChange}
                    placeholder="e.g. Monthly Standard, Support Ticket"
                    style={styles.input}
                    disabled={planModalLoading}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Plan Type</label>
                  <select
                    name="planType"
                    value={planForm.planType}
                    onChange={handlePlanInputChange}
                    style={styles.select}
                    disabled={planModalLoading || !!editingPlanId}
                  >
                    <option value="monthly">Monthly Subscription</option>
                    <option value="lifetime">One-time Buy (Lifetime)</option>
                    <option value="support">Service Support Incident</option>
                  </select>
                </div>

                {planForm.planType === 'monthly' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Cycle Days (Default 28)</label>
                    <input
                      type="number"
                      name="billingCycleDays"
                      value={planForm.billingCycleDays}
                      onChange={handlePlanInputChange}
                      style={styles.input}
                      disabled={planModalLoading}
                    />
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Base Price (INR before GST)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="basePrice"
                    value={planForm.basePrice}
                    onChange={handlePlanInputChange}
                    placeholder="Price"
                    style={styles.input}
                    disabled={planModalLoading}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>GST Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="gstPercent"
                    value={planForm.gstPercent}
                    onChange={handlePlanInputChange}
                    style={styles.input}
                    disabled={planModalLoading}
                  />
                </div>
              </div>

              <div style={{ ...styles.formGroup, marginTop: '10px' }}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={planForm.description}
                  onChange={handlePlanInputChange}
                  placeholder="Summarize plan details or service inclusions"
                  style={styles.textarea}
                  disabled={planModalLoading}
                  rows={3}
                />
              </div>

              <div style={styles.gstBox}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={planForm.isActive}
                    onChange={handlePlanInputChange}
                    disabled={planModalLoading}
                    style={styles.checkbox}
                  />
                  <span>Is Plan Active & Available?</span>
                </label>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  style={styles.modalCancelBtn}
                  disabled={planModalLoading}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.modalSaveBtn} disabled={planModalLoading}>
                  {planModalLoading ? (
                    <span className="spinner"></span>
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Plan</span>
                </button>
              </div>
            </form>
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
    alignItems: 'flex-start',
    gap: '4px',
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
  planBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  contactCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  mobile: {
    fontWeight: '500',
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
    maxWidth: '520px',
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
  },
  modalErrorBanner: {
    display: 'flex',
    alignItems: 'center',
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--color-text)',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'var(--color-text)',
    outline: 'none',
  },
  gstBox: {
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    color: 'var(--color-text)',
  },
  checkbox: {
    width: '16px',
    height: '16px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
  modalCancelBtn: {
    padding: '10px 16px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-border)',
    color: 'var(--color-text)',
    fontWeight: '600',
    fontSize: '13px',
  },
  modalSaveBtn: {
    padding: '10px 16px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '13px',
  },
  paymentSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '16px',
  },
  summaryTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--color-text)',
    marginBottom: '12px',
  },
  summaryDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px 10px 10px 10px',
  },
  successIconBox: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-success-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  successHeading: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-success)',
    marginBottom: '8px',
  },
  successText: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  generateKeyBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'var(--transition)',
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
  tabsContainer: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '24px',
  },
  tabButton: {
    padding: '12px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'var(--transition)',
    outline: 'none',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  planCard: {
    backgroundColor: 'var(--color-card)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow)',
    transition: 'var(--transition)',
    position: 'relative',
    overflow: 'hidden',
  },
  planHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  planIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-border)',
  },
  planMeta: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  verticalBadge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--color-text-muted)',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  typeBadge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  inactiveBadge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'var(--color-error-light)',
    color: 'var(--color-error)',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-text)',
    marginBottom: '8px',
  },
  planDesc: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    lineHeight: '1.5',
    marginBottom: '20px',
    flex: 1,
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginBottom: '12px',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '16px',
  },
  priceSymbol: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
  },
  priceValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--color-text)',
  },
  priceTax: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginLeft: 'auto',
  },
  cycleInfo: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    marginBottom: '16px',
  },
  planActions: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
  },
  editPlanBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'var(--transition)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outline: 'none',
  },
  deletePlanBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    color: 'var(--color-error)',
    backgroundColor: 'transparent',
    fontSize: '13px',
    transition: 'var(--transition)',
    cursor: 'pointer',
    outline: 'none',
  },
  skeletonPlanCard: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '24px',
  },
  emptyPlansState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
  },
  plansErrorBanner: {
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
  plansSuccessBanner: {
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
};
