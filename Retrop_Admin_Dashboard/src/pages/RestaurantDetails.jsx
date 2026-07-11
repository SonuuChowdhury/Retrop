import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';
import { ArrowLeft, Key, User, Edit, Save, Plus, ShieldCheck, ShieldAlert, ToggleLeft, ToggleRight, Clipboard, Check, Eye, EyeOff, Trash2, FileText, LifeBuoy, DollarSign, Calendar, Mail, QrCode, ChevronDown } from 'lucide-react';
import { useDialog } from '../context/DialogContext';
import { useTitle } from '../context/TitleContext';

export default function RestaurantDetails() {
  const setTitle = useTitle('Loading Restaurant...');
  const { alert, confirm } = useDialog();
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // Admins CRUD States
  const [admins, setAdmins] = useState([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    mobile: '',
    email: '',
    role: 'manager',
    password: '',
  });
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormLoading, setAdminFormLoading] = useState(false);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    businessName: '',
    ownerName: '',
    gender: 'Male',
    ownerMobile: '',
    ownerEmail: '',
    businessTypeId: 'restaurant',
    hasGst: false,
    gstin: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Generated Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');

  // Action Loading States
  const [togglingRestaurant, setTogglingRestaurant] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [togglingKeyId, setTogglingKeyId] = useState(null);
  const [deletingKeyId, setDeletingKeyId] = useState(null);
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [mailLoading, setMailLoading] = useState(false);
  const [isMailDropdownOpen, setIsMailDropdownOpen] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Billing & Subscriptions States
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isSubEditModalOpen, setIsSubEditModalOpen] = useState(false);
  const [subEditLoading, setSubEditLoading] = useState(false);
  const [subEditForm, setSubEditForm] = useState({
    planId: '',
    status: 'active',
    startDate: '',
    endDate: '',
    nextBillingDate: '',
    gracePeriodEndsAt: '',
  });
  
  // Payment Validation Modal (pending renewals)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'UPI',
    upiTransactionId: '',
  });

  // Support Ticket Modal
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportForm, setSupportForm] = useState({
    title: '',
    description: '',
    cost: '500.00',
    paymentMethod: 'UPI',
    upiTransactionId: '',
  });

  useEffect(() => {
    if (!restaurant) {
      setTitle('Loading Restaurant...');
      return;
    }

    const name = restaurant.businessName || 'Restaurant Details';
    if (isEditing) {
      setTitle(`Editing ${name}`);
    } else if (isAdminModalOpen) {
      setTitle(`Managing Admins | ${name}`);
    } else if (isKeyModalOpen) {
      setTitle(`License Key Generated | ${name}`);
    } else if (qrModalOpen) {
      setTitle(`QR Code | ${name}`);
    } else if (isSubEditModalOpen) {
      setTitle(`Configuring Subscription | ${name}`);
    } else if (isPaymentModalOpen) {
      setTitle(`Confirming Renewal | ${name}`);
    } else if (isSupportModalOpen) {
      setTitle(`Creating Support Request | ${name}`);
    } else {
      setTitle(name);
    }
  }, [restaurant, isEditing, isAdminModalOpen, isKeyModalOpen, qrModalOpen, isSubEditModalOpen, isPaymentModalOpen, isSupportModalOpen, setTitle]);

  const fetchDetails = async () => {
    try {
      const res = await api.getRestaurant(restaurantId);
      if (res.status === 'success' && res.data) {
        setRestaurant(res.data);
        setEditForm({
          businessName: res.data.businessName,
          ownerName: res.data.ownerName,
          gender: res.data.gender || 'Male',
          ownerMobile: res.data.ownerMobile,
          ownerEmail: res.data.ownerEmail || '',
          businessTypeId: res.data.businessTypeId || 'restaurant',
          hasGst: res.data.hasGst || false,
          gstin: res.data.gstin || '',
        });

        // Fetch keys
        const keysRes = await api.getRestaurantKeys(restaurantId);
        if (keysRes.status === 'success' && keysRes.data) {
          setKeys(keysRes.data);
        }

        // Fetch admins
        const adminsRes = await api.getRestaurantAdmins(restaurantId);
        if (adminsRes.status === 'success' && adminsRes.data) {
          setAdmins(adminsRes.data);
        }

        // Fetch pricing plans
        const plansRes = await api.listPlans();
        if (plansRes.status === 'success' && plansRes.data) {
          setPlans(plansRes.data);
        }

        // Fetch transactions for this restaurant
        const txRes = await api.listTransactions();
        if (txRes.status === 'success' && txRes.data) {
          setTransactions(txRes.data.filter(t => t.restaurantId === restaurantId));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load restaurant details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [restaurantId]);

  const handleCreateSupportTicket = async (e) => {
    e.preventDefault();
    if (!supportForm.title.trim() || !supportForm.description.trim()) {
      await alert('Support ticket title and description are required.');
      return;
    }

    if (supportForm.paymentMethod === 'UPI' && !supportForm.upiTransactionId.trim()) {
      await alert('UPI Transaction UTR ID is required for UPI payments.');
      return;
    }

    setSupportLoading(true);
    try {
      const payload = {
        restaurantId,
        title: supportForm.title,
        description: supportForm.description,
        cost: parseFloat(supportForm.cost),
        paymentMethod: supportForm.paymentMethod,
        upiTransactionId: supportForm.paymentMethod === 'UPI' ? supportForm.upiTransactionId : null,
      };

      const res = await api.createSupportTicket(payload);
      if (res.status === 'success') {
        await alert('Support ticket created & billed successfully. Invoice generated.');
        setIsSupportModalOpen(false);
        setSupportForm({
          title: '',
          description: '',
          cost: '500.00',
          paymentMethod: 'UPI',
          upiTransactionId: '',
        });
        fetchDetails();
      }
    } catch (err) {
      await alert(err.message || 'Failed to submit support incident ticket.');
    } finally {
      setSupportLoading(false);
    }
  };

  const handleConfirmPendingPayment = async (e) => {
    e.preventDefault();
    if (paymentForm.paymentMethod === 'UPI' && !paymentForm.upiTransactionId.trim()) {
      await alert('UPI Transaction ID is required.');
      return;
    }

    const activeSub = restaurant.subscription?.[0];
    if (!activeSub) return;

    setPaymentLoading(true);
    try {
      const payload = {
        restaurantId,
        subscriptionId: activeSub.subscriptionId,
        paymentMethod: paymentForm.paymentMethod,
        upiTransactionId: paymentForm.paymentMethod === 'UPI' ? paymentForm.upiTransactionId : null,
        description: 'Subscription manual payment confirmation',
      };

      const res = await api.confirmPayment(payload);
      if (res.status === 'success') {
        await alert('Payment confirmed successfully. Active status restored.');
        setIsPaymentModalOpen(false);
        fetchDetails();
      }
    } catch (err) {
      await alert(err.message || 'Payment confirmation failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOpenSubEdit = async () => {
    const sub = restaurant.subscription?.[0];
    if (!sub) {
      await alert('No subscription details found for this business.');
      return;
    }
    const formatDateInput = (isoStr) => {
      if (!isoStr) return '';
      return isoStr.split('T')[0];
    };
    setSubEditForm({
      planId: sub.planId || '',
      status: sub.status || 'active',
      startDate: formatDateInput(sub.startDate),
      endDate: formatDateInput(sub.endDate),
      nextBillingDate: formatDateInput(sub.nextBillingDate),
      gracePeriodEndsAt: formatDateInput(sub.gracePeriodEndsAt),
    });
    setIsSubEditModalOpen(true);
  };

  const handleSaveSubEdit = async (e) => {
    e.preventDefault();
    const sub = restaurant.subscription?.[0];
    if (!sub) return;

    setSubEditLoading(true);
    try {
      const payload = {
        planId: subEditForm.planId,
        status: subEditForm.status,
        startDate: subEditForm.startDate ? new Date(subEditForm.startDate).toISOString() : null,
        endDate: subEditForm.endDate ? new Date(subEditForm.endDate).toISOString() : null,
        nextBillingDate: subEditForm.nextBillingDate ? new Date(subEditForm.nextBillingDate).toISOString() : null,
        gracePeriodEndsAt: subEditForm.gracePeriodEndsAt ? new Date(subEditForm.gracePeriodEndsAt).toISOString() : null,
      };

      const res = await api.updateSubscription(sub.subscriptionId, payload);
      if (res.status === 'success') {
        await alert('Subscription updated successfully.');
        setIsSubEditModalOpen(false);
        fetchDetails();
      }
    } catch (err) {
      await alert(err.message || 'Failed to update subscription.');
    } finally {
      setSubEditLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setEditError('');

    const { businessName, ownerName, ownerMobile } = editForm;
    if (!businessName.trim() || !ownerName.trim() || !ownerMobile.trim()) {
      setEditError('All fields are required.');
      return;
    }

    setEditLoading(true);
    try {
      const res = await api.updateRestaurant(restaurantId, editForm);
      if (res.status === 'success' && res.data) {
        setRestaurant(res.data);
        setIsEditing(false);
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update restaurant info.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!restaurant) return;
    setTogglingRestaurant(true);
    try {
      await api.toggleRestaurantStatus(restaurantId);
      setRestaurant((prev) => ({
        ...prev,
        isActive: !prev.isActive,
      }));
    } catch (err) {
      await alert(err.message || 'Failed to update status.');
    } finally {
      setTogglingRestaurant(false);
    }
  };

  const handleGenerateNewKey = async () => {
    if (!await confirm('Are you sure you want to generate a new product key?')) {
      return;
    }

    setGeneratingKey(true);
    try {
      const res = await api.generateKey(restaurantId);
      if (res.status === 'success' && res.data) {
        setGeneratedKey(res.data.keyValue);
        setIsKeyModalOpen(true);
        // Refresh keys
        const keysRes = await api.getRestaurantKeys(restaurantId);
        if (keysRes.status === 'success' && keysRes.data) {
          setKeys(keysRes.data);
        }
      }
    } catch (err) {
      await alert(err.message || 'Failed to generate key.');
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleToggleKey = async (keyId, currentStatus) => {
    setTogglingKeyId(keyId);
    try {
      await api.toggleKey(keyId);
      setKeys((prev) =>
        prev.map((k) => (k.keyId === keyId ? { ...k, isActive: !currentStatus } : k))
      );
    } catch (err) {
      await alert(err.message || 'Failed to toggle product key.');
    } finally {
      setTogglingKeyId(null);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!await confirm('Are you sure you want to permanently delete this product key? The restaurant will immediately lose access to their services until a new key is generated.')) {
      return;
    }

    setDeletingKeyId(keyId);
    try {
      const res = await api.deleteKey(keyId);
      if (res.status === 'success') {
        await alert('Product key deleted.');
        fetchDetails();
      }
    } catch (err) {
      await alert(err.message || 'Failed to delete key.');
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleOpenAddAdmin = () => {
    const hasOwner = admins.some(a => a.role === 'owner');
    const hasManager = admins.some(a => a.role === 'manager');
    
    let defaultRole = 'manager';
    if (hasOwner && !hasManager) defaultRole = 'manager';
    else if (!hasOwner && hasManager) defaultRole = 'owner';

    setAdminForm({
      name: '',
      mobile: '',
      email: '',
      role: defaultRole,
      password: '',
    });
    setEditingAdmin(null);
    setAdminFormError('');
    setIsAdminModalOpen(true);
  };

  const handleOpenEditAdmin = (admin) => {
    setAdminForm({
      name: admin.name,
      mobile: admin.mobile,
      email: admin.email || '',
      role: admin.role,
      password: '',
    });
    setEditingAdmin(admin);
    setAdminFormError('');
    setIsAdminModalOpen(true);
  };

  const handleCloseAdminModal = () => {
    setIsAdminModalOpen(false);
    setEditingAdmin(null);
    setAdminFormError('');
    setShowAdminPassword(false);
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    setAdminFormError('');

    const { name, mobile, email, role, password } = adminForm;

    if (!name.trim() || !mobile.trim() || !role) {
      setAdminFormError('Name, mobile, and role are required.');
      return;
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      setAdminFormError('Mobile number must be a valid 10-digit number.');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAdminFormError('Please enter a valid email address.');
      return;
    }

    setAdminFormLoading(true);
    try {
      if (editingAdmin) {
        const updateData = {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim() || null,
          role,
        };
        if (password) {
          updateData.password = password;
        }

        const res = await api.updateRestaurantAdmin(restaurantId, editingAdmin.adminId, updateData);
        if (res.status === 'success') {
          setIsAdminModalOpen(false);
          fetchDetails();
        }
      } else {
        const createData = {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim() || null,
          role,
          password,
        };

        const res = await api.addRestaurantAdmin(restaurantId, createData);
        if (res.status === 'success') {
          setIsAdminModalOpen(false);
          fetchDetails();
        }
      }
    } catch (err) {
      setAdminFormError(err.message || 'Failed to save admin account.');
    } finally {
      setAdminFormLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!await confirm(`Are you sure you want to permanently delete admin "${adminName}"?`)) {
      return;
    }

    setDeletingAdminId(adminId);
    try {
      const res = await api.deleteRestaurantAdmin(restaurantId, adminId);
      if (res.status === 'success') {
        await alert('Admin account deleted successfully.');
        fetchDetails();
      }
    } catch (err) {
      await alert(err.message || 'Failed to delete admin.');
    } finally {
      setDeletingAdminId(null);
    }
  };

  const handleMailCredentials = async () => {
    if (!await confirm("Are you sure you want to mail the activation product key and account login credentials to the registered admin emails?")) {
      return;
    }
    setMailLoading(true);
    try {
      const res = await api.mailRestaurantCredentials(restaurantId);
      if (res.status === 'success') {
        await alert(res.message || "Credentials and product key mailed successfully!");
      }
    } catch (err) {
      await alert(err.message || "Failed to mail credentials.");
    } finally {
      setMailLoading(false);
    }
  };

  const handleViewQrCode = async () => {
    setQrLoading(true);
    setQrModalOpen(true);
    setQrCodeImage('');
    try {
      const res = await api.getSetupQrCode(restaurantId);
      if (res.status === 'success' && res.qrCode) {
        setQrCodeImage(res.qrCode);
      } else {
        await alert(res.message || 'Failed to load QR code');
        setQrModalOpen(false);
      }
    } catch (err) {
      await alert(err.message || 'Failed to load QR code');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyKey = (keyText) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      {/* Back link */}
      <div style={styles.backContainer}>
        <Link to="/restaurants" style={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Restaurants</span>
        </Link>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={styles.skeletonContainer}>
          <SkeletonLoader width="300px" height="32px" style={{ marginBottom: '10px' }} />
          <SkeletonLoader width="150px" height="20px" style={{ marginBottom: '30px' }} />
          <div style={styles.detailsGrid}>
            <SkeletonLoader width="100%" height="250px" />
            <SkeletonLoader width="100%" height="250px" />
          </div>
        </div>
      ) : restaurant ? (
        <div>
          {/* Page Header */}
          <div style={styles.header} className="responsive-header">
            <div>
              <h1 style={styles.title}>{restaurant.businessName}</h1>
              <p style={styles.subtitle}>ID: {restaurant.restaurantId}</p>
            </div>
            <div style={styles.headerActions}>
              <button
                onClick={handleToggleStatus}
                disabled={togglingRestaurant}
                style={{
                  ...styles.statusButton,
                  backgroundColor: restaurant.isActive ? 'var(--color-success-light)' : 'var(--color-error-light)',
                  color: restaurant.isActive ? 'var(--color-success)' : 'var(--color-error)',
                  opacity: togglingRestaurant ? 0.7 : 1,
                  cursor: togglingRestaurant ? 'not-allowed' : 'pointer',
                }}
              >
                {togglingRestaurant ? (
                  <span className="spinner"></span>
                ) : restaurant.isActive ? (
                  <ShieldCheck size={18} />
                ) : (
                  <ShieldAlert size={18} />
                )}
                <span>
                  {togglingRestaurant
                    ? 'Updating...'
                    : restaurant.isActive
                    ? 'Status: Active'
                    : 'Status: Suspended'}
                </span>
              </button>
            </div>
          </div>

          <div style={styles.detailsGrid}>
            {/* Profile Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Owner & Profile</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                    <Edit size={16} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {editError && (
                <div style={styles.modalErrorBanner}>
                  <p>{editError}</p>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSaveDetails} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={editForm.businessName}
                      onChange={handleEditChange}
                      style={styles.input}
                      disabled={editLoading}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Owner Full Name</label>
                    <input
                      type="text"
                      name="ownerName"
                      value={editForm.ownerName}
                      onChange={handleEditChange}
                      style={styles.input}
                      disabled={editLoading}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Owner Email Address</label>
                    <input
                      type="email"
                      name="ownerEmail"
                      value={editForm.ownerEmail}
                      onChange={handleEditChange}
                      style={styles.input}
                      disabled={editLoading}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Gender</label>
                      <select
                        name="gender"
                        value={editForm.gender}
                        onChange={handleEditChange}
                        style={styles.select}
                        disabled={editLoading}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div style={{ ...styles.formGroup, flex: 2 }}>
                      <label style={styles.label}>Owner Mobile</label>
                      <input
                        type="tel"
                        name="ownerMobile"
                        maxLength={10}
                        value={editForm.ownerMobile}
                        onChange={handleEditChange}
                        style={styles.input}
                        disabled={editLoading}
                        required
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Business Vertical</label>
                      <select
                        name="businessTypeId"
                        value={editForm.businessTypeId}
                        onChange={handleEditChange}
                        style={styles.select}
                        disabled={editLoading}
                      >
                        <option value="restaurant">Restaurant SaaS</option>
                        <option value="gym">Gym SaaS</option>
                        <option value="manufacturing">Manufacturing Ledger</option>
                      </select>
                    </div>

                    <div style={{ ...styles.formGroup, flex: 1, justifyContent: 'center' }}>
                      <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '20px' }}>
                        <input
                          type="checkbox"
                          name="hasGst"
                          checked={editForm.hasGst}
                          onChange={(e) => setEditForm(prev => ({ ...prev, hasGst: e.target.checked }))}
                          disabled={editLoading}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span>GST Registered</span>
                      </label>
                    </div>
                  </div>

                  {editForm.hasGst && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>GSTIN (15-digit)</label>
                      <input
                        type="text"
                        name="gstin"
                        maxLength={15}
                        value={editForm.gstin}
                        onChange={handleEditChange}
                        placeholder="e.g. 09AAAAA1111A1Z1"
                        style={styles.input}
                        disabled={editLoading}
                        required
                      />
                    </div>
                  )}

                  <div style={styles.formActions}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditError('');
                      }}
                      style={styles.cancelBtn}
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.saveBtn}
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="spinner"></span>
                          <span>Saving...</span>
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={styles.profileDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Business Name</span>
                    <span style={styles.detailValue}>{restaurant.businessName}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Owner Name</span>
                    <span style={styles.detailValue}>{restaurant.ownerName}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Owner Email</span>
                    <span style={styles.detailValue}>{restaurant.ownerEmail || 'N/A'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Gender</span>
                    <span style={styles.detailValue}>{restaurant.gender || 'N/A'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Owner Mobile</span>
                    <span style={styles.detailValue}>{restaurant.ownerMobile}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Business Type</span>
                    <span style={styles.detailValue}>
                      {restaurant.businessTypeId === 'restaurant' && 'Restaurant SaaS'}
                      {restaurant.businessTypeId === 'gym' && 'Gym SaaS'}
                      {restaurant.businessTypeId === 'manufacturing' && 'Manufacturing Ledger'}
                      {!['restaurant', 'gym', 'manufacturing'].includes(restaurant.businessTypeId) && (restaurant.businessTypeId || 'Restaurant SaaS')}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>GST Status</span>
                    <span style={styles.detailValue}>
                      {restaurant.hasGst ? `GSTIN: ${restaurant.gstin}` : 'Not Registered'}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Onboarded On</span>
                    <span style={styles.detailValue}>{formatDate(restaurant.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Keys History Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Product License Keys</h2>
                {keys.length === 0 && (
                  <button onClick={handleGenerateNewKey} style={styles.newKeyBtn} disabled={generatingKey}>
                    {generatingKey ? (
                      <span className="spinner"></span>
                    ) : (
                      <Plus size={16} />
                    )}
                    <span>{generatingKey ? 'Generating...' : 'Generate Key'}</span>
                  </button>
                )}
              </div>

              <div style={styles.keysList}>
                {keys.length === 0 ? (
                  <p style={styles.noKeysText}>No keys generated for this restaurant yet.</p>
                ) : (
                  keys.map((k) => (
                    <div key={k.keyId} style={styles.keyRow}>
                      <div style={styles.keyInfo}>
                        <div style={styles.keyTextWrapper}>
                          <span style={styles.keyValue}>{k.keyValue}</span>
                          <button onClick={() => handleCopyKey(k.keyValue)} style={styles.inlineCopyBtn}>
                            {copiedKey === k.keyValue ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Clipboard size={14} />}
                          </button>
                        </div>
                        <span style={styles.keyDate}>Created: {formatDate(k.createdAt)}</span>
                      </div>

                      <div style={styles.keyActions}>
                        <button
                          onClick={() => handleToggleKey(k.keyId, k.isActive)}
                          style={styles.keyToggleBtn}
                          disabled={togglingKeyId === k.keyId}
                        >
                          {togglingKeyId === k.keyId ? (
                            <span className="spinner"></span>
                          ) : k.isActive ? (
                            <span style={styles.activeLabel}>Active</span>
                          ) : (
                            <span style={styles.inactiveLabel}>Inactive</span>
                          )}
                        </button>
                        {k.isActive && (
                          <button
                            onClick={handleViewQrCode}
                            style={styles.viewQrBtn}
                            title="View Setup QR Code"
                          >
                            <QrCode size={14} style={{ marginRight: '4px' }} />
                            <span>View QR</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteKey(k.keyId)}
                          style={{
                            marginLeft: '12px',
                            color: 'var(--color-error)',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            opacity: deletingKeyId === k.keyId ? 0.6 : 1,
                          }}
                          title="Delete Key"
                          disabled={deletingKeyId === k.keyId}
                        >
                          {deletingKeyId === k.keyId ? (
                            <span className="spinner" style={{ color: 'var(--color-error)' }}></span>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Admin Management Card */}
            <div style={{ ...styles.card, gridColumn: 'span 2', marginTop: '10px' }}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Owner Account</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                  <button
                    onClick={() => setIsMailDropdownOpen(!isMailDropdownOpen)}
                    disabled={keys.length === 0 || admins.length === 0 || mailLoading}
                    style={{
                      ...styles.mailCredentialsBtn,
                      backgroundColor: (keys.length === 0 || admins.length === 0 || mailLoading) 
                        ? 'var(--color-border)' 
                        : 'var(--color-success-light)',
                      color: (keys.length === 0 || admins.length === 0 || mailLoading) 
                        ? 'var(--color-text-muted)' 
                        : 'var(--color-success)',
                      border: (keys.length === 0 || admins.length === 0 || mailLoading) 
                        ? '1px solid var(--color-border)' 
                        : '1px solid var(--color-success)',
                      opacity: mailLoading ? 0.7 : 1,
                      cursor: (keys.length === 0 || admins.length === 0 || mailLoading) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {mailLoading ? (
                      <span className="spinner" style={{ borderLeftColor: 'var(--color-success)' }}></span>
                    ) : (
                      <Mail size={16} />
                    )}
                    <span>{mailLoading ? 'Mailing...' : 'Send Mail'}</span>
                    <ChevronDown size={14} style={{ opacity: 0.8 }} />
                  </button>

                  {isMailDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '44px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                      zIndex: 100,
                      minWidth: '240px',
                      padding: '8px',
                      animation: 'fadeInScale 0.15s ease-out forwards',
                    }}>
                      <style>{`
                        @keyframes fadeInScale {
                          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                          to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                      `}</style>
                      <button
                        onClick={() => {
                          setIsMailDropdownOpen(false);
                          handleMailCredentials();
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 12px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'var(--color-text)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>📧 Send Credentials</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', whiteSpace: 'normal', lineHeight: '1.4' }}>
                          Dispatches license key & login details to owner's email address
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.tableWrapper} className="responsive-table-container">
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Mobile</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th} style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={styles.emptyTd}>No admin accounts found.</td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr key={admin.adminId} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: '600' }}>{admin.name}</div>
                          </td>
                          <td style={styles.td}>
                            <span style={admin.role === 'owner' ? styles.activeKeyBadge : styles.inactiveKeyBadge}>
                              {admin.role === 'owner' ? 'Owner' : 'Manager'}
                            </span>
                          </td>
                          <td style={styles.td}>{admin.mobile}</td>
                          <td style={styles.td}>{admin.email || 'N/A'}</td>
                          <td style={styles.td} style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={styles.actions}>
                              <button
                                onClick={() => handleOpenEditAdmin(admin)}
                                title="Edit Admin"
                                style={styles.actionBtn}
                              >
                                <Edit size={16} />
                              </button>
                              {admin.role !== 'owner' && (
                                <button
                                  onClick={() => handleDeleteAdmin(admin.adminId, admin.name)}
                                  title="Delete Admin"
                                  style={{ ...styles.actionBtn, color: 'var(--color-error)' }}
                                  disabled={deletingAdminId === admin.adminId}
                                >
                                  {deletingAdminId === admin.adminId ? (
                                    <span className="spinner" style={{ color: 'var(--color-error)' }}></span>
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing & Subscriptions Card */}
            <div style={{ ...styles.card, gridColumn: 'span 2', marginTop: '20px' }}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Billing & Subscriptions</h2>
                <div style={styles.cardHeaderActions}>
                  <button
                    onClick={() => setIsSupportModalOpen(true)}
                    style={styles.supportBtn}
                  >
                    <LifeBuoy size={16} />
                    <span>Bill Support Incident</span>
                  </button>
                  {restaurant.subscription && restaurant.subscription.length > 0 && (
                    <button
                      onClick={handleOpenSubEdit}
                      style={styles.verifyPaymentBtn}
                    >
                      <Edit size={16} />
                      <span>Edit Subscription</span>
                    </button>
                  )}
                  {restaurant.subscription?.[0]?.status === 'pending_payment' && (
                    <button
                      onClick={() => {
                        setPaymentForm({ paymentMethod: 'UPI', upiTransactionId: '' });
                        setIsPaymentModalOpen(true);
                      }}
                      style={styles.verifyPaymentBtn}
                    >
                      <DollarSign size={16} />
                      <span>Confirm Plan Payment</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Plan Detail Grid */}
              {restaurant.subscription && restaurant.subscription.length > 0 ? (
                (() => {
                  const sub = restaurant.subscription[0];
                  const plan = sub.pricing_plan;
                  const isActive = sub.status === 'active';
                  const isGrace = sub.status === 'grace_period';
                  const isPending = sub.status === 'pending_payment';
                  const isSuspended = sub.status === 'suspended';

                  return (
                    <div style={styles.subGrid}>
                      <div style={styles.subDetail}>
                        <span style={styles.subLabel}>Current Plan</span>
                        <span style={styles.subValue}>{plan?.name || 'Custom Plan'}</span>
                      </div>
                      <div style={styles.subDetail}>
                        <span style={styles.subLabel}>Plan Type</span>
                        <span style={{ ...styles.subValue, textTransform: 'uppercase', fontWeight: 'bold' }}>{plan?.planType || 'N/A'}</span>
                      </div>
                      <div style={styles.subDetail}>
                        <span style={styles.subLabel}>Status</span>
                        <span style={{
                          ...styles.subBadge,
                          color: isActive ? 'var(--color-success)' : isGrace ? '#EAB308' : 'var(--color-error)',
                          backgroundColor: isActive ? 'var(--color-success-light)' : isGrace ? '#FEF9C3' : 'var(--color-error-light)'
                        }}>
                          {sub.status?.toUpperCase()?.replace('_', ' ')}
                        </span>
                      </div>
                      {plan?.planType === 'monthly' && (
                        <>
                          <div style={styles.subDetail}>
                            <span style={styles.subLabel}>Start Date</span>
                            <span style={styles.subValue}>{sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          </div>
                          <div style={styles.subDetail}>
                            <span style={styles.subLabel}>Expiry Date</span>
                            <span style={styles.subValue}>{sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          </div>
                          <div style={styles.subDetail}>
                            <span style={styles.subLabel}>Next Billing Date</span>
                            <span style={styles.subValue}>{sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div style={styles.noSubInfo}>
                  <p>No active subscription associated with this business yet.</p>
                </div>
              )}

              {/* Transactions Ledger */}
              <h3 style={styles.ledgerSectionTitle}>Invoices & Transaction Ledger</h3>
              <div style={styles.tableWrapper} className="responsive-table-container">
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Invoice No</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Payment Method</th>
                      <th style={styles.th}>Total (GST Inc)</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th} style={{ ...styles.th, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={styles.emptyTd}>No transaction history records found.</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.transactionId} style={styles.tr}>
                          <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: '600' }}>{tx.invoiceNo}</td>
                          <td style={styles.td}>{tx.description}</td>
                          <td style={styles.td}>
                            {tx.paymentMethod}
                            {tx.upiTransactionId && (
                              <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>Ref: {tx.upiTransactionId}</span>
                            )}
                          </td>
                          <td style={{ ...styles.td, fontWeight: '700' }}>INR {parseFloat(tx.finalAmount).toFixed(2)}</td>
                          <td style={styles.td}>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            {tx.invoiceNo ? (
                              <a
                                href={api.getInvoiceUrl(tx.transactionId)}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.downloadInvoiceBtn}
                                title="Open Tax Invoice PDF"
                              >
                                <FileText size={14} style={{ marginRight: '4px' }} />
                                <span>PDF</span>
                              </a>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: One-Time Product Key Generated Display */}
      {isKeyModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ ...styles.modalTitle, color: 'var(--color-success)' }}>
                🔑 New License Key Generated
              </h3>
              <button onClick={() => setIsKeyModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>

            <div style={styles.keyDetailsContainer}>
              <p style={styles.keyWarningText}>
                <strong>IMPORTANT:</strong> Below is the unique product key for <strong>{restaurant?.businessName}</strong>. Copy this key now. It cannot be retrieved in plaintext again.
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

      {/* Modal: Verify Plan Payment */}
      {isPaymentModalOpen && restaurant.subscription?.[0] && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Subscription Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>

            <form onSubmit={handleConfirmPendingPayment} style={styles.form}>
              <div style={styles.paymentSummaryCard}>
                <h4 style={styles.summaryTitle}>{restaurant.businessName}</h4>
                <div style={styles.summaryDetails}>
                  <div style={styles.summaryRow}>
                    <span>Plan:</span>
                    <strong>{restaurant.subscription[0].pricing_plan?.name}</strong>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Total Due (GST Inc):</span>
                    <strong>INR {(parseFloat(restaurant.subscription[0].pricing_plan?.basePrice || 0) * 1.18).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
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
                    placeholder="e.g. 312345678901"
                    value={paymentForm.upiTransactionId}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, upiTransactionId: e.target.value }))}
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
                  {paymentLoading ? 'Confirming...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bill Support Incident */}
      {isSupportModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Bill Tech Support Incident</h3>
              <button onClick={() => setIsSupportModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>

            <form onSubmit={handleCreateSupportTicket} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Incident Title</label>
                <input
                  type="text"
                  placeholder="e.g. Database Restore, QR Code Printer Setup"
                  value={supportForm.title}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, title: e.target.value }))}
                  style={styles.input}
                  disabled={supportLoading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Detailed Description</label>
                <textarea
                  placeholder="Describe the technical assistance provided"
                  value={supportForm.description}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, description: e.target.value }))}
                  style={styles.textarea}
                  disabled={supportLoading}
                  rows={3}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Support Charge (Base INR)</label>
                  <input
                    type="number"
                    value={supportForm.cost}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, cost: e.target.value }))}
                    style={styles.input}
                    disabled={supportLoading}
                    required
                  />
                </div>

                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Payment Method</label>
                  <select
                    value={supportForm.paymentMethod}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    style={styles.select}
                    disabled={supportLoading}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              {supportForm.paymentMethod === 'UPI' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>UPI Transaction ID (UTR)</label>
                  <input
                    type="text"
                    placeholder="UPI Transaction ID"
                    value={supportForm.upiTransactionId}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, upiTransactionId: e.target.value }))}
                    style={styles.input}
                    disabled={supportLoading}
                    required
                  />
                </div>
              )}

              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', borderTop: '1px dashed var(--color-border)', paddingTop: '10px', marginTop: '10px' }}>
                18% GST (INR {(parseFloat(supportForm.cost || 0) * 0.18).toFixed(2)}) will be added automatically. Total: <strong>INR {(parseFloat(supportForm.cost || 0) * 1.18).toFixed(2)}</strong>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  style={styles.modalCancelBtn}
                  disabled={supportLoading}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.modalSaveBtn} disabled={supportLoading}>
                  {supportLoading ? 'Processing...' : 'Generate Bill & Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Admin Account */}
      {isAdminModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingAdmin ? '✏️ Edit Admin Account' : '👤 Add Admin Account'}
              </h3>
              <button onClick={handleCloseAdminModal} style={styles.modalCloseBtn}>×</button>
            </div>

            {adminFormError && (
              <div style={styles.modalErrorBanner}>
                <p>{adminFormError}</p>
              </div>
            )}

            <form onSubmit={handleSaveAdmin} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  style={styles.input}
                  disabled={adminFormLoading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={adminForm.mobile}
                  onChange={(e) => {
                    const mobileVal = e.target.value;
                    setAdminForm(prev => {
                      const first5 = mobileVal.substring(0, 5);
                      return {
                        ...prev,
                        mobile: mobileVal,
                        // If it's a new account, pre-fill password dynamically
                        password: !editingAdmin ? (first5 ? `${first5}@password` : '') : prev.password
                      };
                    });
                  }}
                  style={styles.input}
                  disabled={adminFormLoading}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  style={styles.input}
                  disabled={adminFormLoading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <select
                  value={adminForm.role}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, role: e.target.value }))}
                  style={styles.select}
                  disabled={adminFormLoading || (editingAdmin && editingAdmin.role === 'owner')}
                >
                  <option 
                    value="owner" 
                    disabled={admins.some(a => a.role === 'owner') && (!editingAdmin || editingAdmin.role !== 'owner')}
                  >
                    Owner
                  </option>
                  <option 
                    value="manager" 
                    disabled={admins.some(a => a.role === 'manager') && (!editingAdmin || editingAdmin.role !== 'manager')}
                  >
                    Manager
                  </option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {editingAdmin ? 'New Password (Leave blank to keep current)' : 'Password'}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    placeholder={editingAdmin ? 'Enter new password' : 'Enter account password'}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                    style={{ ...styles.input, width: '100%', paddingRight: '40px' }}
                    disabled={adminFormLoading}
                    required={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!editingAdmin && (
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Default: first 5 digits of mobile + @password (e.g. {adminForm.mobile.substring(0, 5) || '90070'}@password)
                  </p>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCloseAdminModal}
                  style={styles.modalCancelBtn}
                  disabled={adminFormLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSaveBtn}
                  disabled={adminFormLoading}
                >
                  {adminFormLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="spinner"></span>
                      <span>Saving...</span>
                    </span>
                  ) : (
                    'Save Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Subscription */}
      {isSubEditModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '520px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>✏️ Edit Subscription Details</h3>
              <button onClick={() => setIsSubEditModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>

            {(() => {
              const isLifetime = restaurant.subscription?.[0]?.pricing_plan?.planType === 'lifetime';

              if (isLifetime) {
                const subPlan = plans.find(p => p.planId === subEditForm.planId) || restaurant.subscription?.[0]?.pricing_plan;
                return (
                  <div style={styles.form}>
                    <div style={styles.lifetimeBanner}>
                      <span style={{ fontSize: '18px', marginRight: '8px' }}>✨</span>
                      <span>This restaurant is on a <strong>Lifetime Plan</strong>. No expiration or renewal dates apply.</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px' }}>
                      <div style={styles.formGroup}>
                        <span style={styles.infoLabel}>Subscription Plan</span>
                        <span style={styles.infoValue}>{subPlan?.name || 'Lifetime Plan'}</span>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.infoLabel}>Plan Type</span>
                        <span style={{ ...styles.infoValue, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                          {subPlan?.planType || 'LIFETIME'}
                        </span>
                      </div>
                      <div style={styles.formGroup}>
                        <span style={styles.infoLabel}>Status</span>
                        <span style={{
                          ...styles.subBadge,
                          display: 'inline-block',
                          alignSelf: 'flex-start',
                          color: subEditForm.status === 'active' ? 'var(--color-success)' : 'var(--color-error)',
                          backgroundColor: subEditForm.status === 'active' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                          marginTop: '4px'
                        }}>
                          {subEditForm.status?.toUpperCase()?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div style={styles.modalFooter}>
                      <button
                        type="button"
                        onClick={() => setIsSubEditModalOpen(false)}
                        style={styles.modalCancelBtn}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <form onSubmit={handleSaveSubEdit} style={styles.form}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Subscription Plan</label>
                      <select
                        value={subEditForm.planId}
                        onChange={(e) => setSubEditForm(prev => ({ ...prev, planId: e.target.value }))}
                        style={styles.select}
                        disabled={subEditLoading}
                        required
                      >
                        <option value="" disabled>Select a Pricing Plan</option>
                        {plans.map((p) => (
                          <option key={p.planId} value={p.planId}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Status</label>
                      <select
                        value={subEditForm.status}
                        onChange={(e) => setSubEditForm(prev => ({ ...prev, status: e.target.value }))}
                        style={styles.select}
                        disabled={subEditLoading}
                        required
                      >
                        <option value="active">Active</option>
                        <option value="grace_period">Grace Period</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending_payment">Pending Payment</option>
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Start Date</label>
                      <input
                        type="date"
                        value={subEditForm.startDate}
                        onChange={(e) => setSubEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                        style={styles.input}
                        disabled={subEditLoading}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>End Date</label>
                      <input
                        type="date"
                        value={subEditForm.endDate}
                        onChange={(e) => setSubEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                        style={styles.input}
                        disabled={subEditLoading}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Next Billing Date</label>
                      <input
                        type="date"
                        value={subEditForm.nextBillingDate}
                        onChange={(e) => setSubEditForm(prev => ({ ...prev, nextBillingDate: e.target.value }))}
                        style={styles.input}
                        disabled={subEditLoading}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Grace Period Ends At</label>
                      <input
                        type="date"
                        value={subEditForm.gracePeriodEndsAt}
                        onChange={(e) => setSubEditForm(prev => ({ ...prev, gracePeriodEndsAt: e.target.value }))}
                        style={styles.input}
                        disabled={subEditLoading}
                      />
                    </div>
                  </div>

                  <div style={styles.modalFooter}>
                    <button
                      type="button"
                      onClick={() => setIsSubEditModalOpen(false)}
                      style={styles.modalCancelBtn}
                      disabled={subEditLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.modalSaveBtn}
                      disabled={subEditLoading}
                    >
                      {subEditLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="spinner"></span>
                          <span>Saving...</span>
                        </span>
                      ) : (
                        'Save Details'
                      )}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: View Setup QR Code */}
      {qrModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📱 App Configuration QR Code</h3>
              <button onClick={() => setQrModalOpen(false)} style={styles.modalCloseBtn}>×</button>
            </div>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              {qrLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span className="spinner"></span>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Generating encrypted QR code...</p>
                </div>
              ) : qrCodeImage ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', maxWidth: '360px', margin: '0 auto' }}>
                    Scan this QR code from the settings menu of the Retrop RMS App to automatically configure the Server URL and Product License Key.
                  </p>
                  <img
                    src={qrCodeImage}
                    alt="Setup QR Code"
                    style={{
                      width: '240px',
                      height: '240px',
                      border: '8px solid white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      backgroundColor: 'white',
                      display: 'inline-block',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'center' }}>
                    <a
                      href={qrCodeImage}
                      download={`setup_qr_${restaurantId}.png`}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Download PNG
                    </a>
                    <button
                      onClick={() => setQrModalOpen(false)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--color-error)' }}>Failed to load QR code.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  backContainer: {
    marginBottom: '20px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    transition: 'var(--transition)',
    ':hover': {
      color: 'var(--color-primary)',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--color-text)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    fontFamily: 'monospace',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
  },
  statusButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
  },
  errorBanner: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-error-light)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-error)',
    marginBottom: '24px',
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
  },
  card: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow)',
    height: 'fit-content',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '14px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-primary)',
  },
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '15px',
    color: 'var(--color-text)',
    fontWeight: '500',
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
    transition: 'var(--transition)',
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
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
  cancelBtn: {
    padding: '10px 16px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-border)',
    color: 'var(--color-text)',
    fontWeight: '600',
    fontSize: '13px',
  },
  saveBtn: {
    padding: '10px 16px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '13px',
  },
  newKeyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    fontSize: '13px',
    fontWeight: '600',
  },
  mailCredentialsBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'var(--transition)',
  },
  keysList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  noKeysText: {
    color: 'var(--color-text-muted)',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px 0',
  },
  keyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  keyInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  keyTextWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  keyValue: {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text)',
  },
  inlineCopyBtn: {
    color: 'var(--color-text-muted)',
    ':hover': {
      color: 'var(--color-text)',
    },
  },
  keyDate: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  keyActions: {
    display: 'flex',
    alignItems: 'center',
  },
  keyToggleBtn: {
    borderRadius: '4px',
    padding: '4px 8px',
  },
  activeLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-success)',
    backgroundColor: 'var(--color-success-light)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  inactiveLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    backgroundColor: 'var(--color-border)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  // Modal Style Copies for keys modal
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
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  modalSaveBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '14px',
  },
  // Table styling
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '16px',
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
    cursor: 'pointer',
  },
  emptyTd: {
    padding: '40px 16px',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
  },
  // New billing & sub styles
  cardHeaderActions: {
    display: 'flex',
    gap: '12px',
  },
  supportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  verifyPaymentBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-primary-light)',
    border: '1px solid var(--color-primary)',
    color: 'var(--color-primary)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  subGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  subDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  subLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
  },
  subValue: {
    fontSize: '14px',
    color: 'var(--color-text)',
  },
  subBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    width: 'fit-content',
  },
  noSubInfo: {
    textAlign: 'center',
    padding: '20px',
    color: 'var(--color-text-muted)',
    fontSize: '13px',
    border: '1px dashed var(--color-border)',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  ledgerSectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--color-text)',
    marginTop: '24px',
    marginBottom: '8px',
  },
  downloadInvoiceBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    color: 'var(--color-primary)',
    fontSize: '12px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  paymentSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
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
  viewQrBtn: {
    marginLeft: '12px',
    backgroundColor: 'var(--color-primary-light)',
    border: '1px solid var(--color-primary)',
    borderRadius: '4px',
    color: 'var(--color-primary)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  modalCancelBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  lifetimeBanner: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    border: '1px solid rgba(234, 88, 12, 0.2)',
    color: '#F97316',
    fontSize: '14px',
    marginBottom: '16px',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
    display: 'block',
  },
  infoValue: {
    fontSize: '14px',
    color: 'var(--color-text)',
    fontWeight: '600',
    display: 'block',
  },
};
