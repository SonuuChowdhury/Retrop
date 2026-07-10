// ============================================================================
// OWNER DASHBOARD & INVENTORY MANAGEMENT (/dashboard)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  LayoutDashboard, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Sun, 
  Moon, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign,
  Plus,
  Trash2,
  Key,
  X,
  Store,
  Info,
  ChefHat,
  Truck,
  Box,
  ClipboardList,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function Dashboard() {
  const { owner, restaurant, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'overview' | 'managers' | 'settings' | 'inventory' | 'vendors' | 'recipes' | 'purchases'
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [summary, setSummary] = useState(null);
  const [managers, setManagers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [purchases, setPurchases] = useState([]);

  // Loading States
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Modals & Action Overlays
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Used for managers, vendors, and items
  const [deleteContext, setDeleteContext] = useState(null); // { type: 'manager'|'vendor'|'item'|'recipe', id: string, name: string }

  // CRUD Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Form states
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);

  // Manager Forms
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerMobile, setNewManagerMobile] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [newManagerRole, setNewManagerRole] = useState('manager');
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Vendor Forms
  const [vendorName, setVendorName] = useState('');
  const [vendorMobile, setVendorMobile] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorPaymentTerms, setVendorPaymentTerms] = useState('');

  // Stock Item Forms
  const [itemName, setItemName] = useState('');
  const [itemUnit, setItemUnit] = useState('kg');
  const [itemCategory, setItemCategory] = useState('Vegetables');
  const [itemReorderLevel, setItemReorderLevel] = useState('0');
  const [itemCurrentStock, setItemCurrentStock] = useState('0');
  const [itemCostPerUnit, setItemCostPerUnit] = useState('0');

  // Recipe Mapping Forms
  const [recipeIngredients, setRecipeIngredients] = useState([]); // [{ itemId, quantity }]
  const [recipeYield, setRecipeYield] = useState('1');

  // Purchase Entry Forms
  const [purchaseVendorId, setPurchaseVendorId] = useState('');
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePaymentStatus, setPurchasePaymentStatus] = useState('unpaid');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('UPI');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([{ itemId: '', quantity: '', unitPrice: '' }]);

  // UI notifications
  const [notifications, setNotifications] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Show a visual toast notification
  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Fetch Dashboard Summary
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.getDashboardSummary();
      if (res.success) {
        setSummary(res.data);
      } else {
        notify('Failed to load dashboard summary', 'error');
      }
    } catch (e) {
      notify(e.message || 'Error fetching dashboard stats', 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch Managers
  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const res = await api.getManagers();
      if (res.success) {
        setManagers(res.data);
      }
    } catch (e) {
      notify(e.message || 'Error fetching managers', 'error');
    } finally {
      setLoadingManagers(false);
    }
  };

  // Fetch Vendors
  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await api.getVendors();
      if (res.success) setVendors(res.data);
    } catch (e) {
      notify(e.message || 'Error fetching vendors', 'error');
    } finally {
      setLoadingVendors(false);
    }
  };

  // Fetch Inventory items
  const fetchInventoryItems = async () => {
    setLoadingItems(true);
    try {
      const res = await api.getInventoryItems();
      if (res.success) setInventoryItems(res.data);
    } catch (e) {
      notify(e.message || 'Error fetching stock items', 'error');
    } finally {
      setLoadingItems(false);
    }
  };

  // Fetch Recipes & Menu
  const fetchRecipesAndMenu = async () => {
    setLoadingRecipes(true);
    try {
      const [menuRes, recipeRes] = await Promise.all([
        api.getOwnerMenu(),
        api.getRecipes()
      ]);
      if (menuRes.success) setMenuItems(menuRes.data);
      if (recipeRes.success) setRecipes(recipeRes.data);
    } catch (e) {
      notify(e.message || 'Error loading recipe manager data', 'error');
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Fetch Purchases
  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const res = await api.getPurchases();
      if (res.success) setPurchases(res.data);
    } catch (e) {
      notify(e.message || 'Error fetching purchases', 'error');
    } finally {
      setLoadingPurchases(false);
    }
  };

  // Effect to load initial tab data
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSummary();
    } else if (activeTab === 'managers') {
      fetchManagers();
    } else if (activeTab === 'vendors') {
      fetchVendors();
    } else if (activeTab === 'inventory') {
      fetchInventoryItems();
    } else if (activeTab === 'recipes') {
      fetchInventoryItems();
      fetchRecipesAndMenu();
    } else if (activeTab === 'purchases') {
      fetchVendors();
      fetchInventoryItems();
      fetchPurchases();
    }
  }, [activeTab]);

  const handleExportSales = async () => {
    try {
      const token = localStorage.getItem('retrop_owner_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/owner/dashboard/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export sales report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      notify('Sales report exported successfully', 'success');
    } catch (err) {
      notify(err.message || 'Export failed', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ==========================================================================
  // ACTION HANDLERS
  // ==========================================================================

  // Add Manager
  const handleAddManager = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newManagerName || !newManagerMobile || !newManagerPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.createManager({
        name: newManagerName,
        mobile: newManagerMobile,
        email: newManagerEmail,
        password: newManagerPassword,
        role: newManagerRole
      });

      if (res.success) {
        notify('Manager added successfully', 'success');
        setShowAddManagerModal(false);
        setNewManagerName('');
        setNewManagerMobile('');
        setNewManagerEmail('');
        setNewManagerPassword('');
        setNewManagerRole('manager');
        fetchManagers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create manager account');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Password for Manager
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!resetPasswordVal) {
      setFormError('Please enter a new password.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.updateManagerPassword(selectedManager.adminId, resetPasswordVal);
      if (res.success) {
        notify('Password updated successfully', 'success');
        setShowResetPasswordModal(false);
        setResetPasswordVal('');
        setSelectedManager(null);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Entity Dispatcher (handles confirmation)
  const triggerDeleteConfirm = (type, id, name) => {
    setDeleteContext({ type, id, name });
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!deleteContext) return;
    setActionLoading(true);
    try {
      const { type, id } = deleteContext;
      let res;
      if (type === 'manager') {
        res = await api.deleteManager(id);
        if (res.success) fetchManagers();
      } else if (type === 'vendor') {
        res = await api.deleteVendor(id);
        if (res.success) fetchVendors();
      } else if (type === 'item') {
        res = await api.deleteInventoryItem(id);
        if (res.success) fetchInventoryItems();
      } else if (type === 'recipe') {
        res = await api.deleteRecipe(id);
        if (res.success) fetchRecipesAndMenu();
      }

      if (res && res.success) {
        notify(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');
      }
    } catch (err) {
      notify(err.message || 'Failed to delete entity', 'error');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
      setDeleteContext(null);
    }
  };

  // Vendor Save
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!vendorName) return;

    setActionLoading(true);
    try {
      const payload = {
        name: vendorName,
        mobile: vendorMobile,
        email: vendorEmail,
        gstin: vendorGstin,
        address: vendorAddress,
        paymentTerms: vendorPaymentTerms
      };

      let res;
      if (selectedVendor) {
        res = await api.updateVendor(selectedVendor.vendorId, payload);
      } else {
        res = await api.createVendor(payload);
      }

      if (res.success) {
        notify(`Vendor ${selectedVendor ? 'updated' : 'created'} successfully`, 'success');
        setShowVendorModal(false);
        setVendorName('');
        setVendorMobile('');
        setVendorEmail('');
        setVendorGstin('');
        setVendorAddress('');
        setVendorPaymentTerms('');
        setSelectedVendor(null);
        fetchVendors();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save vendor');
    } finally {
      setActionLoading(false);
    }
  };

  // Stock Item Save
  const handleSaveItem = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!itemName || !itemUnit) return;

    setActionLoading(true);
    try {
      const payload = {
        name: itemName,
        unit: itemUnit,
        category: itemCategory,
        reorderLevel: parseFloat(itemReorderLevel),
        currentStock: parseFloat(itemCurrentStock),
        costPerUnit: parseFloat(itemCostPerUnit)
      };

      let res;
      if (selectedItem) {
        res = await api.updateInventoryItem(selectedItem.itemId, payload);
      } else {
        res = await api.createInventoryItem(payload);
      }

      if (res.success) {
        notify(`Item ${selectedItem ? 'updated' : 'created'} successfully`, 'success');
        setShowItemModal(false);
        setItemName('');
        setItemUnit('kg');
        setItemCategory('Vegetables');
        setItemReorderLevel('0');
        setItemCurrentStock('0');
        setItemCostPerUnit('0');
        setSelectedItem(null);
        fetchInventoryItems();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save item');
    } finally {
      setActionLoading(false);
    }
  };

  // Recipe / BOM Save
  const openRecipeEditor = (dish) => {
    setSelectedDish(dish);
    const existing = recipes.find(r => r.dishId === dish.dishId);
    if (existing) {
      setRecipeIngredients(existing.ingredients || []);
      setRecipeYield(String(existing.yieldQuantity || 1));
    } else {
      setRecipeIngredients([]);
      setRecipeYield('1');
    }
    setShowRecipeModal(true);
  };

  const handleAddRecipeIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { itemId: '', quantity: '' }]);
  };

  const handleRemoveRecipeIngredient = (idx) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx));
  };

  const handleRecipeIngChange = (idx, field, value) => {
    const updated = [...recipeIngredients];
    updated[idx][field] = value;
    
    // Auto-resolve item unit & name if item changes
    if (field === 'itemId') {
      const matched = inventoryItems.find(i => i.itemId === value);
      if (matched) {
        updated[idx].itemName = matched.name;
        updated[idx].unit = matched.unit;
      }
    }
    setRecipeIngredients(updated);
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!selectedDish) return;
    
    const validIngs = recipeIngredients.filter(i => i.itemId && i.quantity);
    if (!validIngs.length) {
      setFormError('Please add at least one ingredient.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.saveRecipe({
        dishId: selectedDish.dishId,
        ingredients: validIngs.map(i => ({
          itemId: i.itemId,
          itemName: i.itemName || 'Unknown',
          quantity: parseFloat(i.quantity),
          unit: i.unit || 'unit'
        })),
        yieldQuantity: parseFloat(recipeYield)
      });

      if (res.success) {
        notify('Recipe saved successfully', 'success');
        setShowRecipeModal(false);
        setSelectedDish(null);
        setRecipeIngredients([]);
        setRecipeYield('1');
        fetchRecipesAndMenu();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save recipe');
    } finally {
      setActionLoading(false);
    }
  };

  // Purchase Entry Handlers
  const handleAddPurchaseRow = () => {
    setPurchaseItems([...purchaseItems, { itemId: '', quantity: '', unitPrice: '' }]);
  };

  const handleRemovePurchaseRow = (idx) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const handlePurchaseRowChange = (idx, field, value) => {
    const updated = [...purchaseItems];
    updated[idx][field] = value;
    setPurchaseItems(updated);
  };

  const calculatePurchaseTotal = () => {
    return purchaseItems.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      return sum + (q * p);
    }, 0);
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    setFormError('');

    const validItems = purchaseItems.filter(i => i.itemId && i.quantity && i.unitPrice);
    if (!validItems.length) {
      setFormError('Please add at least one valid item row with quantity and unit price.');
      return;
    }

    const total = calculatePurchaseTotal();
    setActionLoading(true);
    try {
      const res = await api.createPurchase({
        vendorId: purchaseVendorId || null,
        invoiceNo: purchaseInvoiceNo || null,
        purchaseDate,
        paymentStatus: purchasePaymentStatus,
        paymentMethod: purchasePaymentMethod,
        notes: purchaseNotes,
        items: validItems.map(i => ({
          itemId: i.itemId,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          totalPrice: parseFloat(i.quantity) * parseFloat(i.unitPrice)
        })),
        totalAmount: total
      });

      if (res.success) {
        notify('Purchase order logged and stock updated', 'success');
        setShowPurchaseModal(false);
        setPurchaseVendorId('');
        setPurchaseInvoiceNo('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setPurchasePaymentStatus('unpaid');
        setPurchaseNotes('');
        setPurchaseItems([{ itemId: '', quantity: '', unitPrice: '' }]);
        fetchPurchases();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to submit purchase order');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <div className="logo-text">RETROP</div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner Portal</p>
          </div>
          
          <ul className="sidebar-menu">
            <li className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('overview')}>
                <LayoutDashboard size={18} />
                Overview
              </button>
            </li>
            
            <li className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('inventory')}>
                <Box size={18} />
                Stock Items
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'vendors' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('vendors')}>
                <Truck size={18} />
                Vendors
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'recipes' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('recipes')}>
                <ChefHat size={18} />
                Recipes / BOM
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'purchases' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('purchases')}>
                <ClipboardList size={18} />
                Purchases
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'managers' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('managers')}>
                <Users size={18} />
                Managers
              </button>
            </li>
            
            <li className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('settings')}>
                <SettingsIcon size={18} />
                Settings
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', gap: '10px' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-panel">
        <header className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={20} style={{ color: 'var(--color-primary)' }} />
            <h1 className="panel-title">{restaurant ? restaurant.businessName : 'Retrop Restaurant'}</h1>
          </div>
          
          <div className="user-badge">
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '700', fontSize: '14px' }}>{owner?.name || 'Owner'}</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Owner</p>
            </div>
            <button 
              onClick={toggleTheme} 
              className="btn btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%', border: 'none' }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </header>

        <div className="panel-content">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Today's Summary</h2>
                <button onClick={handleExportSales} className="btn btn-secondary" style={{ gap: '8px' }}>
                  <FileSpreadsheet size={16} />
                  Export Sales CSV
                </button>
              </div>
              
              {loadingSummary ? (
                <div className="stats-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card stat-card">
                      <div className="skeleton" style={{ width: '50%', marginBottom: '12px' }}></div>
                      <div className="skeleton" style={{ width: '80%', height: '32px' }}></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stats-grid">
                  <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                    <div className="stat-label">TODAY'S REVENUE</div>
                    <div className="stat-value">₹{summary?.stats?.totalSales || 0}</div>
                  </div>
                  <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <div className="stat-label">COMPLETED ORDERS</div>
                    <div className="stat-value">{summary?.stats?.ordersCount || 0}</div>
                  </div>
                  <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                    <div className="stat-label">AVERAGE BILL VALUE</div>
                    <div className="stat-value">₹{summary?.stats?.averageOrderValue || 0}</div>
                  </div>
                </div>
              )}

              <div className="grid-2x">
                <div className="card">
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Recent Bills</h3>
                  {loadingSummary ? (
                    <div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton" style={{ width: '100%', height: '24px', marginBottom: '12px' }}></div>
                      ))}
                    </div>
                  ) : summary?.recentOrders?.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No bills settled today yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>BILL ID</th>
                            <th>TABLE</th>
                            <th>AMOUNT</th>
                            <th>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary?.recentOrders?.map((order) => (
                            <tr key={order.ordersId}>
                              <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>#{order.ordersId.substring(0, 8)}</td>
                              <td>Table {order.tableNo}</td>
                              <td style={{ fontWeight: '600' }}>₹{order.finalAmount || order.totalAmount}</td>
                              <td>
                                <span style={{ 
                                  padding: '4px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '11px', 
                                  fontWeight: '700',
                                  backgroundColor: order.isPaymentCompleted ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                  color: order.isPaymentCompleted ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>
                                  {order.isPaymentCompleted ? 'PAID' : 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Top Selling Items</h3>
                  {loadingSummary ? (
                    <div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton" style={{ width: '100%', height: '24px', marginBottom: '12px' }}></div>
                      ))}
                    </div>
                  ) : summary?.topDishes?.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No dishes sold yet.</p>
                  ) : (
                    <ul style={{ listStyle: 'none' }}>
                      {summary?.topDishes?.map((dish, idx) => (
                        <li key={dish.dishId} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>
                            <span style={{ color: 'var(--color-primary)', marginRight: '8px' }}>{idx + 1}.</span>
                            {dish.dishName}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '700' }}>{dish.quantity} sold</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STOCK ITEMS TAB */}
          {activeTab === 'inventory' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Inventory Stock Items</h2>
                <button onClick={() => { setSelectedItem(null); setShowItemModal(true); }} className="btn btn-primary">
                  <Plus size={16} />
                  Add Stock Item
                </button>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingItems ? (
                  <div style={{ padding: '24px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '28px', marginBottom: '12px' }}></div>
                    ))}
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>No inventory stock items configured.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ITEM NAME</th>
                          <th>CATEGORY</th>
                          <th>STOCK LEVEL</th>
                          <th>LAST PURCHASE UNIT PRICE</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryItems.map((item) => {
                          const isLowStock = parseFloat(item.currentStock) <= parseFloat(item.reorderLevel);
                          return (
                            <tr key={item.itemId}>
                              <td style={{ fontWeight: '600' }}>{item.name}</td>
                              <td>{item.category}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '700', color: isLowStock ? 'var(--color-danger)' : 'var(--color-text)' }}>
                                    {item.currentStock} {item.unit}
                                  </span>
                                  {isLowStock && (
                                    <span style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(230, 57, 70, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                                      <AlertTriangle size={12} />
                                      Low Stock
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontWeight: '600' }}>₹{item.costPerUnit || 0}</td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button 
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setItemName(item.name);
                                      setItemUnit(item.unit);
                                      setItemCategory(item.category || 'Vegetables');
                                      setItemReorderLevel(String(item.reorderLevel));
                                      setItemCurrentStock(String(item.currentStock));
                                      setItemCostPerUnit(String(item.costPerUnit));
                                      setShowItemModal(true);
                                    }}
                                    className="btn btn-secondary" 
                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                    title="Edit Item"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => triggerDeleteConfirm('item', item.itemId, item.name)}
                                    className="btn btn-secondary" 
                                    style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}
                                    title="Delete Item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VENDORS TAB */}
          {activeTab === 'vendors' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Supplier Registry</h2>
                <button onClick={() => { setSelectedVendor(null); setShowVendorModal(true); }} className="btn btn-primary">
                  <Plus size={16} />
                  Add Supplier
                </button>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingVendors ? (
                  <div style={{ padding: '24px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '28px', marginBottom: '12px' }}></div>
                    ))}
                  </div>
                ) : vendors.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>No supplier vendors registered.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>SUPPLIER NAME</th>
                          <th>MOBILE</th>
                          <th>EMAIL</th>
                          <th>GSTIN</th>
                          <th>PAYMENT TERMS</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((v) => (
                          <tr key={v.vendorId}>
                            <td style={{ fontWeight: '600' }}>{v.name}</td>
                            <td>{v.mobile || '-'}</td>
                            <td>{v.email || '-'}</td>
                            <td><code style={{ fontSize: '12px', fontWeight: 'bold' }}>{v.gstin || '-'}</code></td>
                            <td>{v.paymentTerms || '-'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button 
                                  onClick={() => {
                                    setSelectedVendor(v);
                                    setVendorName(v.name);
                                    setVendorMobile(v.mobile || '');
                                    setVendorEmail(v.email || '');
                                    setVendorGstin(v.gstin || '');
                                    setVendorAddress(v.address || '');
                                    setVendorPaymentTerms(v.paymentTerms || '');
                                    setShowVendorModal(true);
                                  }}
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '12px' }}
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => triggerDeleteConfirm('vendor', v.vendorId, v.name)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RECIPES / BOM TAB */}
          {activeTab === 'recipes' && (
            <div>
              <h2 className="section-title">Recipes & Bill of Materials (BOM)</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '24px', marginTop: '-12px' }}>
                Link menu items to raw ingredients to compute plate costs and track ingredient portions.
              </p>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingRecipes ? (
                  <div style={{ padding: '24px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '28px', marginBottom: '12px' }}></div>
                    ))}
                  </div>
                ) : menuItems.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>No dishes found in the menu to configure.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>DISH NAME</th>
                          <th>CATEGORY</th>
                          <th>PRICE</th>
                          <th>BOM MAPPING</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems.map((dish) => {
                          const recipe = recipes.find(r => r.dishId === dish.dishId);
                          return (
                            <tr key={dish.dishId}>
                              <td style={{ fontWeight: '600' }}>{dish.dishName}</td>
                              <td>{dish.category}</td>
                              <td style={{ fontWeight: '600' }}>₹{dish.price}</td>
                              <td>
                                {recipe ? (
                                  <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                                    <CheckCircle size={14} />
                                    {recipe.ingredients.length} Ingredients mapped
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Not configured</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button 
                                    onClick={() => openRecipeEditor(dish)}
                                    className="btn btn-primary" 
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    {recipe ? 'Edit Recipe' : 'Configure BOM'}
                                  </button>
                                  {recipe && (
                                    <button 
                                      onClick={() => triggerDeleteConfirm('recipe', dish.dishId, dish.dishName)}
                                      className="btn btn-secondary" 
                                      style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PURCHASES TAB */}
          {activeTab === 'purchases' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Stock Purchase Invoices</h2>
                <button onClick={() => { setShowPurchaseModal(true); }} className="btn btn-primary">
                  <Plus size={16} />
                  Log Purchase Order
                </button>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingPurchases ? (
                  <div style={{ padding: '24px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '28px', marginBottom: '12px' }}></div>
                    ))}
                  </div>
                ) : purchases.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>No purchase invoices logged.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>DATE</th>
                          <th>INVOICE NO</th>
                          <th>SUPPLIER</th>
                          <th>TOTAL AMOUNT</th>
                          <th>PAYMENT</th>
                          <th>LOGGED ON</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((p) => (
                          <tr key={p.purchaseId}>
                            <td style={{ fontWeight: '600' }}>{p.purchaseDate}</td>
                            <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{p.invoiceNo || 'N/A'}</td>
                            <td>{p.vendor?.name || 'Walk-in Vendor'}</td>
                            <td style={{ fontWeight: '700' }}>₹{p.totalAmount}</td>
                            <td>
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '10px', 
                                fontWeight: '700',
                                backgroundColor: p.paymentStatus === 'paid' ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                color: p.paymentStatus === 'paid' ? 'var(--color-success)' : 'var(--color-danger)',
                                textTransform: 'uppercase'
                              }}>
                                {p.paymentStatus}
                              </span>
                            </td>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MANAGERS TAB */}
          {activeTab === 'managers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Manager Accounts</h2>
                <button onClick={() => setShowAddManagerModal(true)} className="btn btn-primary">
                  <Plus size={16} />
                  Add Manager
                </button>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingManagers ? (
                  <div style={{ padding: '24px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '28px', marginBottom: '12px' }}></div>
                    ))}
                  </div>
                ) : managers.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>No manager accounts set up yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>NAME</th>
                          <th>MOBILE NUMBER</th>
                          <th>EMAIL</th>
                          <th>ROLE</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managers.map((m) => (
                          <tr key={m.adminId}>
                            <td style={{ fontWeight: '600' }}>{m.name}</td>
                            <td>{m.mobile}</td>
                            <td>{m.email || '-'}</td>
                            <td>
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '10px', 
                                fontWeight: '700',
                                backgroundColor: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                                textTransform: 'uppercase'
                              }}>
                                {m.role}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button 
                                  onClick={() => { setSelectedManager(m); setShowResetPasswordModal(true); }}
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '12px' }}
                                  title="Change password"
                                >
                                  <Key size={14} />
                                </button>
                                <button 
                                  onClick={() => triggerDeleteConfirm('manager', m.adminId, m.name)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}
                                  title="Delete manager"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="section-title">System Settings</h2>
              
              <div className="card" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <Info size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Account Information</h3>
                </div>

                <div className="settings-option">
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '14px' }}>Owner Name</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{owner?.name}</p>
                  </div>
                </div>

                <div className="settings-option">
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '14px' }}>Registered Email</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{owner?.email}</p>
                  </div>
                </div>

                <div className="settings-option">
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '14px' }}>Mobile Number</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{owner?.mobile}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '32px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <SettingsIcon size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Theme Preference</h3>
                </div>

                <div className="settings-option">
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '14px' }}>Interface Theme</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Toggle between Light and Dark interface colors.</p>
                  </div>
                  <button onClick={toggleTheme} className="btn btn-secondary" style={{ gap: '10px' }}>
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    Theme: {theme.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================================
         MODALS & DIALOG BOXES
         ====================================================================== */}

      {/* Add Manager Modal */}
      {showAddManagerModal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Add Manager Account</h3>
              <button onClick={() => { setShowAddManagerModal(false); setFormError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleAddManager}>
              <div className="form-group">
                <label>FULL NAME *</label>
                <input type="text" className="form-input" value={newManagerName} onChange={(e) => setNewManagerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>MOBILE NUMBER *</label>
                <input type="text" className="form-input" value={newManagerMobile} onChange={(e) => setNewManagerMobile(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input type="email" className="form-input" value={newManagerEmail} onChange={(e) => setNewManagerEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>PASSWORD *</label>
                <input type="password" className="form-input" value={newManagerPassword} onChange={(e) => setNewManagerPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>ROLE *</label>
                <select className="form-input" value={newManagerRole} onChange={(e) => setNewManagerRole(e.target.value)}>
                  <option value="manager">Manager</option>
                  <option value="owner">Co-Owner / Sub-Owner</option>
                </select>
              </div>
              <div className="dialog-actions">
                <button type="button" onClick={() => setShowAddManagerModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Save Manager</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Manager Password Modal */}
      {showResetPasswordModal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Change Manager Password</h3>
              <button onClick={() => { setShowResetPasswordModal(false); setFormError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>NEW PASSWORD *</label>
                <input type="password" className="form-input" value={resetPasswordVal} onChange={(e) => setResetPasswordVal(e.target.value)} required />
              </div>
              <div className="dialog-actions">
                <button type="button" onClick={() => setShowResetPasswordModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Add/Edit Modal */}
      {showVendorModal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>{selectedVendor ? 'Edit Supplier' : 'Add Supplier Vendor'}</h3>
              <button onClick={() => setShowVendorModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleSaveVendor}>
              <div className="form-group">
                <label>SUPPLIER NAME *</label>
                <input type="text" className="form-input" value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>MOBILE NUMBER</label>
                <input type="text" className="form-input" value={vendorMobile} onChange={(e) => setVendorMobile(e.target.value)} />
              </div>
              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input type="email" className="form-input" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>GSTIN</label>
                <input type="text" className="form-input" placeholder="e.g. 07AAAAA1111A1Z1" value={vendorGstin} onChange={(e) => setVendorGstin(e.target.value)} />
              </div>
              <div className="form-group">
                <label>PAYMENT TERMS</label>
                <input type="text" className="form-input" placeholder="e.g. Net 30, COD" value={vendorPaymentTerms} onChange={(e) => setVendorPaymentTerms(e.target.value)} />
              </div>
              <div className="form-group">
                <label>STREET ADDRESS</label>
                <textarea className="form-input" rows="2" value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} />
              </div>
              <div className="dialog-actions">
                <button type="button" onClick={() => setShowVendorModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Item Add/Edit Modal */}
      {showItemModal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>{selectedItem ? 'Edit Stock Item' : 'Add Stock Item'}</h3>
              <button onClick={() => setShowItemModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleSaveItem}>
              <div className="form-group">
                <label>STOCK ITEM NAME *</label>
                <input type="text" className="form-input" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Milk, Raw Chicken" required />
              </div>
              <div className="form-group">
                <label>MEASUREMENT UNIT *</label>
                <select className="form-input" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)}>
                  <option value="kg">kg (Kilogram)</option>
                  <option value="litre">litre (Litre)</option>
                  <option value="piece">piece (Piece)</option>
                  <option value="packet">packet (Packet)</option>
                  <option value="dozen">dozen (Dozen)</option>
                </select>
              </div>
              <div className="form-group">
                <label>CATEGORY</label>
                <select className="form-input" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Spices">Spices</option>
                  <option value="Meat">Meat & Seafood</option>
                  <option value="Dry Goods">Dry Goods / Grocery</option>
                  <option value="Beverages">Beverages</option>
                </select>
              </div>
              <div className="form-group">
                <label>REORDER ALERT LEVEL *</label>
                <input type="number" step="0.01" className="form-input" value={itemReorderLevel} onChange={(e) => setItemReorderLevel(e.target.value)} required />
              </div>
              
              {!selectedItem && (
                <>
                  <div className="form-group">
                    <label>INITIAL STOCK *</label>
                    <input type="number" step="0.01" className="form-input" value={itemCurrentStock} onChange={(e) => setItemCurrentStock(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>COST PER UNIT *</label>
                    <input type="number" step="0.01" className="form-input" value={itemCostPerUnit} onChange={(e) => setItemCostPerUnit(e.target.value)} required />
                  </div>
                </>
              )}

              <div className="dialog-actions">
                <button type="button" onClick={() => setShowItemModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe / BOM mapping Editor Modal */}
      {showRecipeModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Recipe BOM: {selectedDish?.dishName}</h3>
              <button onClick={() => setShowRecipeModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Map the ingredients and standard consumption portions for 1 yield portion of this dish.
            </p>

            {formError && <div className="auth-error">{formError}</div>}
            
            <form onSubmit={handleSaveRecipe}>
              <div className="form-group" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>RECIPE YIELD PORTION(S):</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ width: '80px' }} 
                  value={recipeYield} 
                  onChange={(e) => setRecipeYield(e.target.value)} 
                  min="1" 
                  required 
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: '700', fontSize: '13px' }}>INGREDIENT LIST</label>
                  <button type="button" onClick={handleAddRecipeIngredient} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                    + Add Ingredient
                  </button>
                </div>

                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px' }}>
                  {recipeIngredients.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>No ingredients mapped yet.</p>
                  ) : (
                    recipeIngredients.map((ing, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                        <select 
                          className="form-input" 
                          style={{ flexGrow: 2 }}
                          value={ing.itemId} 
                          onChange={(e) => handleRecipeIngChange(idx, 'itemId', e.target.value)}
                          required
                        >
                          <option value="">-- Select Ingredient --</option>
                          {inventoryItems.map(item => (
                            <option key={item.itemId} value={item.itemId}>{item.name} ({item.unit})</option>
                          ))}
                        </select>

                        <input 
                          type="number" 
                          step="0.001" 
                          placeholder="Qty" 
                          className="form-input" 
                          style={{ width: '80px' }}
                          value={ing.quantity}
                          onChange={(e) => handleRecipeIngChange(idx, 'quantity', e.target.value)}
                          required
                        />

                        <span style={{ fontSize: '13px', minWidth: '40px', color: 'var(--color-text-muted)' }}>
                          {ing.unit || '-'}
                        </span>

                        <button type="button" onClick={() => handleRemoveRecipeIngredient(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="dialog-actions">
                <button type="button" onClick={() => setShowRecipeModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Save BOM Recipe</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Invoice Logging Modal */}
      {showPurchaseModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Log Supplier Purchase Invoice</h3>
              <button onClick={() => setShowPurchaseModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            {formError && <div className="auth-error">{formError}</div>}
            
            <form onSubmit={handleSavePurchase}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>SUPPLIER VENDOR</label>
                  <select className="form-input" value={purchaseVendorId} onChange={(e) => setPurchaseVendorId(e.target.value)}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.vendorId} value={v.vendorId}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>INVOICE NO / REF</label>
                  <input type="text" className="form-input" placeholder="e.g. INV-2026-981" value={purchaseInvoiceNo} onChange={(e) => setPurchaseInvoiceNo(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>PURCHASE DATE *</label>
                  <input type="date" className="form-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>PAYMENT STATUS</label>
                  <select className="form-input" value={purchasePaymentStatus} onChange={(e) => setPurchasePaymentStatus(e.target.value)}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Fully Paid</option>
                    <option value="partial">Partially Paid</option>
                  </select>
                </div>
              </div>

              {/* Purchase items list */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: '700', fontSize: '13px' }}>PURCHASED ITEMS</label>
                  <button type="button" onClick={handleAddPurchaseRow} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                    + Add Row
                  </button>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px' }}>
                  {purchaseItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <select 
                        className="form-input" 
                        style={{ flexGrow: 2 }}
                        value={item.itemId} 
                        onChange={(e) => handlePurchaseRowChange(idx, 'itemId', e.target.value)}
                        required
                      >
                        <option value="">-- Select Item --</option>
                        {inventoryItems.map(inv => (
                          <option key={inv.itemId} value={inv.itemId}>{inv.name} ({inv.unit})</option>
                        ))}
                      </select>

                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Qty" 
                        className="form-input" 
                        style={{ width: '80px' }}
                        value={item.quantity}
                        onChange={(e) => handlePurchaseRowChange(idx, 'quantity', e.target.value)}
                        required
                      />

                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Unit Price" 
                        className="form-input" 
                        style={{ width: '100px' }}
                        value={item.unitPrice}
                        onChange={(e) => handlePurchaseRowChange(idx, 'unitPrice', e.target.value)}
                        required
                      />

                      <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '60px', textAlign: 'right' }}>
                        ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                      </span>

                      <button type="button" onClick={() => handleRemovePurchaseRow(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>INVOICE TOTAL AMOUNT:</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', marginLeft: '10px', color: 'var(--color-primary)' }}>₹{calculatePurchaseTotal().toFixed(2)}</span>
                </div>
                <div className="dialog-actions">
                  <button type="button" onClick={() => setShowPurchaseModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>Log Invoice</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3 className="dialog-title">Delete {deleteContext?.type}</h3>
            <p className="dialog-description">
              Are you sure you want to delete {deleteContext?.type} <strong>{deleteContext?.name}</strong>? This action is permanent and cannot be undone.
            </p>
            <div className="dialog-actions">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteContext(null); }} className="btn btn-secondary" disabled={actionLoading}>Cancel</button>
              <button onClick={executeDelete} className="btn btn-danger" disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="toast-container">
        {notifications.map((n) => (
          <div key={n.id} className="toast" style={{ borderLeft: `4px solid ${n.type === 'success' ? 'var(--color-success)' : n.type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)'}` }}>
            <span style={{ fontWeight: '500' }}>{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
