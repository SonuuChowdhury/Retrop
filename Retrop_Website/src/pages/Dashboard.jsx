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
  FileSpreadsheet,
  BookOpen,
  Star
} from 'lucide-react';

export default function Dashboard() {
  const { owner, restaurant, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'overview' | 'managers' | 'settings' | 'inventory' | 'vendors' | 'recipes' | 'purchases'
  // Tab State: 'overview' | 'staff' | 'settings' | 'inventory' | 'vendors' | 'recipes' | 'purchases' | 'expenses' | 'day-close' | 'gst'
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [summary, setSummary] = useState(null);
  const [staff, setStaff] = useState({ managers: [], waiters: [], chefs: [], others: [] });
  const [vendors, setVendors] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  
  // Owner Menu Management States
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuStats, setMenuStats] = useState(null);
  const [selectedMenuDish, setSelectedMenuDish] = useState(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('');
  const [dishForm, setDishForm] = useState({
    dishName: '',
    price: '',
    category: '',
    isVegetarian: true,
    isAvailable: true,
    spicyLevel: 1,
    preparationTime: 15,
    description: '',
    image: null,
    imagePreview: ''
  });

  // Owner Restaurant Settings States
  const [restaurantInfo, setRestaurantInfo] = useState({
    restaurantName: '',
    address: '',
    mobile: '',
    isGST: false,
    GSTIN: '',
    taxes: [],
    taxType: 'exclusive',
    discounts: [],
    googleReviewLink: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Taxes Analytics States
  const [taxAnalytics, setTaxAnalytics] = useState(null);
  const [taxAnalyticsLoading, setTaxAnalyticsLoading] = useState(false);

  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dayCloseInfo, setDayCloseInfo] = useState(null);

  // Owner Order Management & Reviews States
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersOffset, setOrdersOffset] = useState(0);
  const [ordersLimit] = useState(20);
  const [ordersFilters, setOrdersFilters] = useState({
    status: '',
    search: '',
    from: '',
    to: '',
    tableNo: '',
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const [reviewsLimit] = useState(20);

  // Loading States
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingDayClose, setLoadingDayClose] = useState(false);

  // Modals & Action Overlays
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteContext, setDeleteContext] = useState(null);

  // CRUD Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showHsnModal, setShowHsnModal] = useState(false);

  // Form states
  const [selectedStaff, setSelectedStaff] = useState(null); // { type, id, name }
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);

  // Unified Staff Forms
  const [staffType, setStaffType] = useState('manager');
  const [staffName, setStaffName] = useState('');
  const [staffMobile, setStaffMobile] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffCustomRole, setStaffCustomRole] = useState('');
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

  // Expense Forms
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Ingredients');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePaymentMode, setExpensePaymentMode] = useState('Cash');
  const [expenseFilterDate, setExpenseFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // Day Close Forms
  const [dayCloseOpening, setDayCloseOpening] = useState('0');
  const [dayCloseActual, setDayCloseActual] = useState('0');
  const [dayCloseNotes, setDayCloseNotes] = useState('');
  const [dayCloseFilterDate, setDayCloseFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // GST Compliance Forms
  const [gstReportMonth, setGstReportMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [gstReportYear, setGstReportYear] = useState(String(new Date().getFullYear()));
  const [menuItemHsn, setMenuItemHsn] = useState('');

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

  // Fetch Staff
  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await api.getStaff();
      if (res.success) {
        setStaff(res.data);
      }
    } catch (e) {
      notify(e.message || 'Error fetching staff', 'error');
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch Expenses
  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const res = await api.getExpenses(expenseFilterDate);
      if (res.success) {
        setExpenses(res.data);
      }
    } catch (e) {
      notify(e.message || 'Error fetching expenses', 'error');
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Fetch Day Close Register status
  const fetchDayClose = async () => {
    setLoadingDayClose(true);
    try {
      const res = await api.getDayClose(dayCloseFilterDate);
      if (res.success) {
        setDayCloseInfo(res.data);
        if (res.data.closeRecord) {
          setDayCloseOpening(String(res.data.closeRecord.openingCash));
          setDayCloseActual(String(res.data.closeRecord.actualCash));
          setDayCloseNotes(res.data.closeRecord.notes || '');
        } else {
          setDayCloseOpening('0');
          setDayCloseActual('0');
          setDayCloseNotes('');
        }
      }
    } catch (e) {
      notify(e.message || 'Error fetching day-close data', 'error');
    } finally {
      setLoadingDayClose(false);
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

  const [loadingMenu, setLoadingMenu] = useState(false);
  const fetchMenuManagement = async () => {
    setLoadingMenu(true);
    try {
      const [menuRes, categoriesRes] = await Promise.all([
        api.getMenuManagement(),
        api.getMenuCategories()
      ]);
      if (menuRes.success) setMenuItems(menuRes.data);
      if (categoriesRes.success) setMenuCategories(categoriesRes.data || []);
    } catch (e) {
      notify(e.message || 'Error fetching menu items', 'error');
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchRestaurantInfo = async () => {
    setSettingsLoading(true);
    try {
      const res = await api.getRestaurantInfo();
      if (res.success && res.data) {
        setRestaurantInfo(res.data);
      }
    } catch (e) {
      notify(e.message || 'Error fetching restaurant settings', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchOwnerOrders = async (offset = 0) => {
    setLoadingOrders(true);
    try {
      const res = await api.getOrders({
        ...ordersFilters,
        limit: ordersLimit,
        offset,
      });
      if (res.success) {
        if (offset === 0) {
          setOrders(res.data || []);
        } else {
          setOrders(prev => [...prev, ...(res.data || [])]);
        }
        setOrdersTotal(res.meta?.total || 0);
        setOrdersOffset(offset);
      }
    } catch (e) {
      notify(e.message || 'Error fetching orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchOwnerReviews = async (offset = 0) => {
    setLoadingReviews(true);
    try {
      const res = await api.getReviews(reviewsLimit, offset);
      if (res.success) {
        if (offset === 0) {
          setReviews(res.data || []);
        } else {
          setReviews(prev => [...prev, ...(res.data || [])]);
        }
        setReviewsTotal(res.meta?.total || 0);
        setReviewsOffset(offset);
      }
    } catch (e) {
      notify(e.message || 'Error fetching reviews', 'error');
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchTaxAnalytics = async () => {
    setTaxAnalyticsLoading(true);
    try {
      const res = await api.getOwnerAnalytics('taxes');
      if (res.success && res.data) {
        setTaxAnalytics(res.data.taxes);
      }
    } catch (e) {
      notify(e.message || 'Error fetching tax analytics', 'error');
    } finally {
      setTaxAnalyticsLoading(false);
    }
  };

  // Effect to load initial tab data
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSummary();
    } else if (activeTab === 'staff') {
      fetchStaff();
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
    } else if (activeTab === 'expenses') {
      fetchExpenses();
    } else if (activeTab === 'day-close') {
      fetchDayClose();
    } else if (activeTab === 'gst') {
      fetchRecipesAndMenu();
      fetchTaxAnalytics();
    } else if (activeTab === 'menu') {
      fetchMenuManagement();
    } else if (activeTab === 'restaurant-settings') {
      fetchRestaurantInfo();
    } else if (activeTab === 'orders') {
      fetchOwnerOrders(0);
    } else if (activeTab === 'reviews') {
      fetchOwnerReviews(0);
    }
  }, [
    activeTab, 
    expenseFilterDate, 
    dayCloseFilterDate, 
    ordersFilters.status, 
    ordersFilters.from, 
    ordersFilters.to, 
    ordersFilters.tableNo
  ]);

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

  // Add Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!staffName || !staffMobile || !staffPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (staffType === 'other' && !staffCustomRole) {
      setFormError('Please specify the custom role name.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.createStaff({
        type: staffType,
        name: staffName,
        mobile: staffMobile,
        email: staffType === 'manager' ? staffEmail : undefined,
        password: staffPassword,
        role: staffType === 'other' ? staffCustomRole : undefined
      });

      if (res.success) {
        notify('Staff member added successfully', 'success');
        setShowAddStaffModal(false);
        setStaffName('');
        setStaffMobile('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffCustomRole('');
        setStaffType('manager');
        fetchStaff();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create staff account');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Password for Staff
  const handleResetStaffPassword = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!resetPasswordVal) {
      setFormError('Please enter a new password.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.updateStaffPassword(selectedStaff.type, selectedStaff.id, resetPasswordVal);
      if (res.success) {
        notify('Password updated successfully', 'success');
        setShowResetPasswordModal(false);
        setResetPasswordVal('');
        setSelectedStaff(null);
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
      if (['manager', 'waiter', 'chef', 'other'].includes(type)) {
        res = await api.deleteStaff(type, id);
        if (res.success) fetchStaff();
      } else if (type === 'vendor') {
        res = await api.deleteVendor(id);
        if (res.success) fetchVendors();
      } else if (type === 'item') {
        res = await api.deleteInventoryItem(id);
        if (res.success) fetchInventoryItems();
      } else if (type === 'recipe') {
        res = await api.deleteRecipe(id);
        if (res.success) fetchRecipesAndMenu();
      } else if (type === 'expense') {
        res = await api.deleteExpense(id);
        if (res.success) fetchExpenses();
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

  // Expense logging save handler
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!expenseAmount || !expenseCategory) return;

    setActionLoading(true);
    try {
      const res = await api.createExpense({
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        description: expenseDescription,
        paymentMode: expensePaymentMode,
        expenseDate: expenseFilterDate,
      });

      if (res.success) {
        notify('Expense logged successfully', 'success');
        setShowExpenseModal(false);
        setExpenseAmount('');
        setExpenseDescription('');
        setExpenseCategory('Ingredients');
        setExpensePaymentMode('Cash');
        fetchExpenses();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setActionLoading(false);
    }
  };

  // Day Register Close handler
  const handleCloseDay = async (e) => {
    e.preventDefault();
    setFormError('');

    setActionLoading(true);
    try {
      const res = await api.closeDayRegister({
        openingCash: parseFloat(dayCloseOpening),
        actualCash: parseFloat(dayCloseActual),
        notes: dayCloseNotes,
        date: dayCloseFilterDate,
      });

      if (res.success) {
        notify(res.message || 'Day register closed successfully', 'success');
        fetchDayClose();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to close day register');
    } finally {
      setActionLoading(false);
    }
  };

  // GST HSN Code Save handler
  const handleSaveHsnCode = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!selectedDish) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('retrop_owner_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_BASE_URL}/api/owner/menu/${selectedDish.dishId}/hsn`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ hsnCode: menuItemHsn })
      });
      
      if (!response.ok) throw new Error('Failed to update HSN code');
      
      notify('HSN updated successfully', 'success');
      setShowHsnModal(false);
      fetchRecipesAndMenu();
    } catch (err) {
      setFormError(err.message || 'Failed to save HSN code');
    } finally {
      setActionLoading(false);
    }
  };

  // Download GSTR-1 JSON report
  const handleDownloadGstr1 = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.getGstr1(gstReportMonth, gstReportYear);
      if (res.success) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSTR1_${gstReportYear}_${gstReportMonth}_${restaurant?.businessName?.replace(/\s+/g, '_') || 'restaurant'}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        notify('GSTR-1 report downloaded successfully', 'success');
      }
    } catch (err) {
      notify(err.message || 'Failed to generate GSTR-1', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Download GSTR-3B JSON report
  const handleDownloadGstr3b = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.getGstr3b(gstReportMonth, gstReportYear);
      if (res.success) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSTR3B_${gstReportYear}_${gstReportMonth}_${restaurant?.businessName?.replace(/\s+/g, '_') || 'restaurant'}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        notify('GSTR-3B report downloaded successfully', 'success');
      }
    } catch (err) {
      notify(err.message || 'Failed to generate GSTR-3B', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Logo upload select file handler
  const handleLogoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notify('Logo size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      setActionLoading(true);
      try {
        const res = await api.uploadLogo({
          image: base64,
          mimeType: file.type,
          fileName: file.name
        });
        if (res.success) {
          notify('Logo uploaded successfully', 'success');
          // Reload settings info
          window.location.reload();
        }
      } catch (err) {
        notify(err.message || 'Logo upload failed', 'error');
      } finally {
        setActionLoading(false);
      }
    };
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

  const handleOpenMenuModal = (dish = null) => {
    if (dish) {
      setSelectedMenuDish(dish);
      setDishForm({
        dishName: dish.dishName || '',
        price: String(dish.price || ''),
        category: dish.category || '',
        isVegetarian: dish.isVegetarian !== false,
        isAvailable: dish.isAvailable !== false,
        spicyLevel: dish.spicyLevel || 1,
        preparationTime: dish.preparationTime || 15,
        description: dish.description || '',
        image: null,
        imagePreview: dish.imageUrl || ''
      });
    } else {
      setSelectedMenuDish(null);
      setDishForm({
        dishName: '',
        price: '',
        category: '',
        isVegetarian: true,
        isAvailable: true,
        spicyLevel: 1,
        preparationTime: 15,
        description: '',
        image: null,
        imagePreview: ''
      });
    }
    setFormError('');
    setShowMenuModal(true);
  };

  const handleDishFormChange = (field, value) => {
    setDishForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDishImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notify('Dish photo must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setDishForm(prev => ({
        ...prev,
        image: {
          base64: reader.result,
          mimeType: file.type,
          fileName: file.name
        },
        imagePreview: reader.result
      }));
    };
  };

  const handleSaveMenuDish = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!dishForm.dishName.trim()) { setFormError('Dish name is required'); return; }
    if (!dishForm.price || isNaN(parseFloat(dishForm.price))) { setFormError('Please enter a valid price'); return; }
    if (!dishForm.category.trim()) { setFormError('Category is required'); return; }

    setActionLoading(true);
    try {
      const payload = {
        dishName: dishForm.dishName.trim(),
        price: parseFloat(dishForm.price),
        category: dishForm.category.trim(),
        isVegetarian: Boolean(dishForm.isVegetarian),
        isAvailable: Boolean(dishForm.isAvailable),
        spicyLevel: parseInt(dishForm.spicyLevel || 1),
        preparationTime: parseInt(dishForm.preparationTime || 15),
        description: dishForm.description.trim()
      };

      let res;
      if (selectedMenuDish) {
        res = await api.updateMenuItem(selectedMenuDish.dishId, payload);
      } else {
        res = await api.createMenuItem(payload);
      }

      if (res.success) {
        const savedDish = res.data;
        const targetId = selectedMenuDish ? selectedMenuDish.dishId : savedDish.dishId;

        // If a new image was selected, upload it
        if (dishForm.image && targetId) {
          await api.uploadDishImage(targetId, {
            image: dishForm.image.base64,
            mimeType: dishForm.image.mimeType,
            fileName: dishForm.image.fileName
          });
        }

        notify(`Dish ${selectedMenuDish ? 'updated' : 'created'} successfully`, 'success');
        setShowMenuModal(false);
        fetchMenuManagement();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save dish');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMenuDishAvailability = async (dish) => {
    try {
      const res = await api.toggleMenuItemAvailability(dish.dishId, !dish.isAvailable);
      if (res.success) {
        notify(`Dish status updated`, 'success');
        fetchMenuManagement();
      }
    } catch (err) {
      notify(err.message || 'Failed to update availability', 'error');
    }
  };

  const handleDeleteMenuDish = async (dish) => {
    if (!window.confirm(`Are you sure you want to delete "${dish.dishName}"?`)) return;
    try {
      const res = await api.deleteMenuItem(dish.dishId);
      if (res.success) {
        notify(`Dish deleted successfully`, 'success');
        fetchMenuManagement();
      }
    } catch (err) {
      notify(err.message || 'Failed to delete dish', 'error');
    }
  };


  // ==========================================================================
  // RESTAURANT SETTINGS HANDLERS
  // ==========================================================================

  const handleRestaurantInfoChange = (field, value) => {
    setRestaurantInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSettingTax = () => {
    setRestaurantInfo(prev => ({
      ...prev,
      taxes: [...(prev.taxes || []), { name: '', percent: 0 }]
    }));
  };

  const handleDeleteSettingTax = (idx) => {
    setRestaurantInfo(prev => ({
      ...prev,
      taxes: prev.taxes.filter((_, i) => i !== idx)
    }));
  };

  const handleSettingTaxChange = (idx, field, value) => {
    setRestaurantInfo(prev => {
      const updated = [...prev.taxes];
      updated[idx] = {
        ...updated[idx],
        [field]: field === 'percent' ? parseFloat(value) || 0 : value
      };
      return { ...prev, taxes: updated };
    });
  };

  const handleAddSettingDiscount = () => {
    setRestaurantInfo(prev => ({
      ...prev,
      discounts: [...(prev.discounts || []), { name: '', percent: 0, isActive: true }]
    }));
  };

  const handleDeleteSettingDiscount = (idx) => {
    setRestaurantInfo(prev => ({
      ...prev,
      discounts: prev.discounts.filter((_, i) => i !== idx)
    }));
  };

  const handleSettingDiscountChange = (idx, field, value) => {
    setRestaurantInfo(prev => {
      const updated = [...prev.discounts];
      updated[idx] = {
        ...updated[idx],
        [field]: field === 'percent' ? parseFloat(value) || 0 : field === 'isActive' ? Boolean(value) : value
      };
      return { ...prev, discounts: updated };
    });
  };

  const handleSaveRestaurantSettings = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!restaurantInfo.restaurantName?.trim()) { setFormError('Restaurant name is required'); return; }
    if (restaurantInfo.isGST && !restaurantInfo.GSTIN?.trim()) { setFormError('GSTIN is required when GST is enabled'); return; }

    setActionLoading(true);
    try {
      const payload = {
        restaurantName: restaurantInfo.restaurantName.trim(),
        address: restaurantInfo.address?.trim() || '',
        mobile: restaurantInfo.mobile?.trim() || '',
        isGST: Boolean(restaurantInfo.isGST),
        GSTIN: restaurantInfo.isGST ? restaurantInfo.GSTIN.trim() : null,
        taxes: restaurantInfo.taxes || [],
        taxType: restaurantInfo.taxType || 'exclusive',
        discounts: restaurantInfo.discounts || [],
        googleReviewLink: restaurantInfo.googleReviewLink?.trim() || ''
      };

      const res = await api.updateRestaurantInfo(payload);
      if (res.success) {
        notify('Restaurant settings updated successfully', 'success');
        fetchRestaurantInfo();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save settings');
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

            <li className={`sidebar-item ${activeTab === 'expenses' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('expenses')}>
                <DollarSign size={18} />
                Expenses
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'day-close' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('day-close')}>
                <CheckCircle size={18} />
                Day Close
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'gst' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('gst')}>
                <FileSpreadsheet size={18} />
                GST Compliance
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'staff' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('staff')}>
                <Users size={18} />
                Staff Registry
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'menu' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('menu')}>
                <BookOpen size={18} />
                Menu List
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('orders')}>
                <ShoppingBag size={18} />
                Orders
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'reviews' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('reviews')}>
                <Star size={18} fill={activeTab === 'reviews' ? 'currentColor' : 'none'} />
                Reviews
              </button>
            </li>

            <li className={`sidebar-item ${activeTab === 'restaurant-settings' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('restaurant-settings')}>
                <Store size={18} />
                Restaurant Settings
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
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="card stat-card">
                      <div className="skeleton" style={{ width: '50%', marginBottom: '12px' }}></div>
                      <div className="skeleton" style={{ width: '80%', height: '32px' }}></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
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
                  <div className="card stat-card" style={{ borderLeft: '4px solid #7209b7' }}>
                    <div className="stat-label">TODAY'S COGS (COST)</div>
                    <div className="stat-value">₹{summary?.stats?.totalCOGS || 0}</div>
                  </div>
                  <div className="card stat-card" style={{ borderLeft: '4px solid #4361ee' }}>
                    <div className="stat-label">TODAY'S NET PROFIT</div>
                    <div className="stat-value">
                      ₹{summary?.stats?.totalProfit || 0}
                      <span style={{ fontSize: '11px', color: summary?.stats?.profitMargin < 25 ? 'var(--color-danger)' : 'var(--color-success)', marginLeft: '6px', fontWeight: '800' }}>
                        ({summary?.stats?.profitMargin || 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="card stat-card" style={{ borderLeft: '4px solid #f72585' }}>
                    <div className="stat-label">LOYALTY CUSTOMERS</div>
                    <div className="stat-value">
                      {summary?.stats?.loyaltyCustomersCount || 0}
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px', fontWeight: '600' }}>
                        ({summary?.stats?.totalLoyaltyPoints || 0} pts)
                      </span>
                    </div>
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

          {/* STAFF REGISTRY TAB */}
          {activeTab === 'staff' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Staff Registry</h2>
                <button onClick={() => { setSelectedStaff(null); setShowAddStaffModal(true); }} className="btn btn-primary">
                  <Plus size={16} />
                  Add Staff Member
                </button>
              </div>

              {loadingStaff ? (
                <div className="card" style={{ padding: '24px' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton" style={{ width: '100%', height: '28px', marginBottom: '12px' }}></div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Managers section */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Restaurant Managers</h3>
                    {staff.managers.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No managers registered.</p>
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
                            {staff.managers.map((m) => (
                              <tr key={m.adminId}>
                                <td style={{ fontWeight: '600' }}>{m.name}</td>
                                <td>{m.mobile}</td>
                                <td>{m.email || '-'}</td>
                                <td><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{m.role}</span></td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={() => { setSelectedStaff({ type: 'manager', id: m.adminId, name: m.name }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ padding: '6px 10px' }}><Key size={14} /></button>
                                    {m.role !== 'owner' && (
                                      <button onClick={() => triggerDeleteConfirm('manager', m.adminId, m.name)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Waiters section */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Waiters</h3>
                    {staff.waiters.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No waiters registered.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>NAME</th>
                              <th>MOBILE NUMBER</th>
                              <th>STATUS</th>
                              <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staff.waiters.map((w) => (
                              <tr key={w.waiterId}>
                                <td style={{ fontWeight: '600' }}>{w.waiterName}</td>
                                <td>{w.mobile}</td>
                                <td>
                                  <span style={{ 
                                    padding: '2px 6px', 
                                    borderRadius: '4px', 
                                    fontSize: '10px', 
                                    fontWeight: '700',
                                    backgroundColor: w.isActive ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                    color: w.isActive ? 'var(--color-success)' : 'var(--color-danger)'
                                  }}>{w.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={() => { setSelectedStaff({ type: 'waiter', id: w.waiterId, name: w.waiterName }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ padding: '6px 10px' }}><Key size={14} /></button>
                                    <button onClick={() => triggerDeleteConfirm('waiter', w.waiterId, w.waiterName)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Chefs section */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Kitchen Chefs</h3>
                    {staff.chefs.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No chefs registered.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>KITCHEN / CHEF NAME</th>
                              <th>MOBILE NUMBER</th>
                              <th>STATUS</th>
                              <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staff.chefs.map((c) => (
                              <tr key={c.kitchenId}>
                                <td style={{ fontWeight: '600' }}>{c.kitchenName}</td>
                                <td>{c.mobile}</td>
                                <td>
                                  <span style={{ 
                                    padding: '2px 6px', 
                                    borderRadius: '4px', 
                                    fontSize: '10px', 
                                    fontWeight: '700',
                                    backgroundColor: c.isActive ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                    color: c.isActive ? 'var(--color-success)' : 'var(--color-danger)'
                                  }}>{c.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={() => { setSelectedStaff({ type: 'chef', id: c.kitchenId, name: c.kitchenName }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ padding: '6px 10px' }}><Key size={14} /></button>
                                    <button onClick={() => triggerDeleteConfirm('chef', c.kitchenId, c.kitchenName)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Other Staff roles section */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Other Custom Roles</h3>
                    {staff.others.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No custom role staff registered.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>NAME</th>
                              <th>MOBILE NUMBER</th>
                              <th>ROLE</th>
                              <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staff.others.map((o) => (
                              <tr key={o.staffId}>
                                <td style={{ fontWeight: '600' }}>{o.name}</td>
                                <td>{o.mobile}</td>
                                <td><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', backgroundColor: '#e2e8f0', color: '#475569' }}>{o.role}</span></td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={() => { setSelectedStaff({ type: 'other', id: o.staffId, name: o.name }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ padding: '6px 10px' }}><Key size={14} /></button>
                                    <button onClick={() => triggerDeleteConfirm('other', o.staffId, o.name)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
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
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Expense Ledger</h2>
                  <input type="date" className="form-input" style={{ width: '160px', padding: '6px 12px' }} value={expenseFilterDate} onChange={(e) => setExpenseFilterDate(e.target.value)} />
                </div>
                <button onClick={() => { setShowExpenseModal(true); }} className="btn btn-primary">
                  <Plus size={16} />
                  Log Expense
                </button>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingExpenses ? (
                  <div style={{ padding: '24px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '28px', marginBottom: '12px' }}></div>
                    ))}
                  </div>
                ) : expenses.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>No expense records found for this date.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>CATEGORY</th>
                          <th>DESCRIPTION</th>
                          <th>PAYMENT MODE</th>
                          <th>LOGGED BY</th>
                          <th>AMOUNT</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.expenseId}>
                            <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{e.category}</td>
                            <td>{e.description || '-'}</td>
                            <td>{e.paymentMode}</td>
                            <td>{e.admin?.name || 'System'}</td>
                            <td style={{ fontWeight: '700' }}>₹{e.amount}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button onClick={() => triggerDeleteConfirm('expense', e.expenseId, `${e.category} (₹${e.amount})`)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}>
                                <Trash2 size={14} />
                              </button>
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

          {/* DAY CLOSE REGISTER TAB */}
          {activeTab === 'day-close' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>End of Day Cash Close</h2>
                  <input type="date" className="form-input" style={{ width: '160px', padding: '6px 12px' }} value={dayCloseFilterDate} onChange={(e) => setDayCloseFilterDate(e.target.value)} />
                </div>
              </div>

              {loadingDayClose ? (
                <div className="card" style={{ padding: '24px' }}>
                  <div className="skeleton" style={{ width: '50%', marginBottom: '12px' }}></div>
                  <div className="skeleton" style={{ width: '80%', height: '32px' }}></div>
                </div>
              ) : dayCloseInfo?.isClosed ? (
                <div className="card" style={{ maxWidth: '600px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Day Closed for {dayCloseFilterDate}</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>OPENING CASH</p>
                      <p style={{ fontSize: '15px', fontWeight: '700' }}>₹{dayCloseInfo.closeRecord.openingCash}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>COMPUTED CASH SALES</p>
                      <p style={{ fontSize: '15px', fontWeight: '700' }}>₹{dayCloseInfo.closeRecord.cashSales}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>COMPUTED CASH EXPENSES</p>
                      <p style={{ fontSize: '15px', fontWeight: '700' }}>₹{dayCloseInfo.closeRecord.cashExpenses}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>EXPECTED CASH IN HAND</p>
                      <p style={{ fontSize: '15px', fontWeight: '700' }}>₹{dayCloseInfo.closeRecord.expectedCash}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>ACTUAL COUNTED CASH</p>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-primary)' }}>₹{dayCloseInfo.closeRecord.actualCash}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>VARIANCE</p>
                      <p style={{ fontSize: '15px', fontWeight: '800', color: parseFloat(dayCloseInfo.closeRecord.variance) !== 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        ₹{dayCloseInfo.closeRecord.variance}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>CLOSED BY</p>
                    <p style={{ fontSize: '14px', fontWeight: '600' }}>{dayCloseInfo.closeRecord.admin?.name || 'System'}</p>
                  </div>

                  {dayCloseInfo.closeRecord.notes && (
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>REMARKS / NOTES</p>
                      <p style={{ fontSize: '13px', background: 'var(--color-bg-muted)', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        {dayCloseInfo.closeRecord.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card" style={{ maxWidth: '600px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Log Register Closing</h3>
                  {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}
                  
                  <form onSubmit={handleCloseDay}>
                    <div className="form-group">
                      <label>OPENING CASH * (₹)</label>
                      <input type="number" step="0.01" className="form-input" value={dayCloseOpening} onChange={(e) => setDayCloseOpening(e.target.value)} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--color-bg-muted)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>CASH SALES TODAY</span>
                        <p style={{ fontSize: '16px', fontWeight: '700', margin: '4px 0 0 0' }}>₹{dayCloseInfo?.computed?.cashSales || 0}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>CASH EXPENSES TODAY</span>
                        <p style={{ fontSize: '16px', fontWeight: '700', margin: '4px 0 0 0' }}>₹{dayCloseInfo?.computed?.cashExpenses || 0}</p>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>ACTUAL COUNTED CASH * (₹)</label>
                      <input type="number" step="0.01" className="form-input" value={dayCloseActual} onChange={(e) => setDayCloseActual(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label>NOTES / REASON FOR VARIANCE</label>
                      <textarea className="form-input" rows="3" value={dayCloseNotes} onChange={(e) => setDayCloseNotes(e.target.value)} placeholder="Explain any cash discrepancy if variance occurs..." />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={actionLoading}>
                      Submit EOD Closing
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* GST COMPLIANCE TAB */}
          {activeTab === 'gst' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>GST Compliance Engine</h2>
              </div>

              {/* Taxes Analytics Display */}
              {taxAnalyticsLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '8px' }}></div>
                  ))}
                </div>
              ) : taxAnalytics ? (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Gross Revenue (7D)</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-primary)' }}>₹{taxAnalytics.totalRevenue?.toFixed(2)}</span>
                    </div>
                    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Taxes Collected (7D)</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-success)' }}>₹{taxAnalytics.totalTaxes?.toFixed(2)}</span>
                    </div>
                    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Discounts Given (7D)</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-warning)' }}>₹{taxAnalytics.totalDiscounts?.toFixed(2)}</span>
                    </div>
                    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Subtotal (7D)</span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-text)' }}>₹{taxAnalytics.totalSubtotal?.toFixed(2)}</span>
                    </div>
                  </div>

                  {taxAnalytics.taxBreakdown && taxAnalytics.taxBreakdown.length > 0 && (
                    <div className="card" style={{ padding: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', color: 'var(--color-text)' }}>Tax Breakdown</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                        {taxAnalytics.taxBreakdown.map((t, idx) => (
                          <div key={idx} style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--color-bg-muted)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ fontWeight: '700', fontSize: '13px', margin: 0, color: 'var(--color-text)' }}>{t.name}</p>
                              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>{t.percent}% {t.inclusive ? 'Incl.' : 'Excl.'}</p>
                            </div>
                            <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-primary)' }}>₹{t.amount?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* GSTR-1 Generator */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>Generate GSTR-1</h3>
                    <form onSubmit={handleDownloadGstr1}>
                      <div className="form-group">
                        <label>MONTH</label>
                        <select className="form-input" value={gstReportMonth} onChange={(e) => setGstReportMonth(e.target.value)}>
                          <option value="01">January</option>
                          <option value="02">February</option>
                          <option value="03">March</option>
                          <option value="04">April</option>
                          <option value="05">May</option>
                          <option value="06">June</option>
                          <option value="07">July</option>
                          <option value="08">August</option>
                          <option value="09">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>YEAR</label>
                        <input type="number" className="form-input" value={gstReportYear} onChange={(e) => setGstReportYear(e.target.value)} required />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px' }} disabled={actionLoading}>
                        <FileSpreadsheet size={16} />
                        Export GSTR-1 JSON
                      </button>
                    </form>
                  </div>

                  {/* GSTR-3B Generator */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>Generate GSTR-3B</h3>
                    <form onSubmit={handleDownloadGstr3b}>
                      <div className="form-group">
                        <label>MONTH</label>
                        <select className="form-input" value={gstReportMonth} onChange={(e) => setGstReportMonth(e.target.value)}>
                          <option value="01">January</option>
                          <option value="02">February</option>
                          <option value="03">March</option>
                          <option value="04">April</option>
                          <option value="05">May</option>
                          <option value="06">June</option>
                          <option value="07">July</option>
                          <option value="08">August</option>
                          <option value="09">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>YEAR</label>
                        <input type="number" className="form-input" value={gstReportYear} onChange={(e) => setGstReportYear(e.target.value)} required />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', background: '#3B82F6' }} disabled={actionLoading}>
                        <FileSpreadsheet size={16} />
                        Export GSTR-3B JSON
                      </button>
                    </form>
                  </div>
                </div>

                {/* HSN/SAC Configurer */}
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>HSN/SAC Mapping</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>DISH NAME</th>
                          <th>CATEGORY</th>
                          <th>HSN/SAC CODE</th>
                          <th style={{ textAlign: 'right' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems.map((dish) => (
                          <tr key={dish.dishId}>
                            <td style={{ fontWeight: '600' }}>{dish.dishName}</td>
                            <td>{dish.category}</td>
                            <td><code style={{ fontSize: '13px', fontWeight: 'bold' }}>{dish.hsnCode || 'N/A'}</code></td>
                            <td style={{ textAlign: 'right' }}>
                              <button onClick={() => { setSelectedDish(dish); setMenuItemHsn(dish.hsnCode || ''); setShowHsnModal(true); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                Edit HSN
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MENU MANAGEMENT TAB */}
          {activeTab === 'menu' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>Menu Management</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>Manage restaurant dishes, pricing, details, and photos.</p>
                </div>
                <button onClick={() => handleOpenMenuModal()} className="btn btn-primary" style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
                  <Plus size={16} />
                  Add New Dish
                </button>
              </div>

              {/* Filters & Search */}
              <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search dishes by name or category..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <select
                    className="form-input"
                    value={menuCategoryFilter}
                    onChange={(e) => setMenuCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {menuCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dishes Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingMenu ? (
                  <div style={{ padding: '24px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '32px', marginBottom: '12px' }}></div>
                    ))}
                  </div>
                ) : menuItems.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>No menu items found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>PHOTO</th>
                          <th>DISH NAME</th>
                          <th>CATEGORY</th>
                          <th>PRICE</th>
                          <th>TYPE</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems
                          .filter(item => {
                            const matchSearch = item.dishName?.toLowerCase().includes(menuSearch.toLowerCase()) || item.category?.toLowerCase().includes(menuSearch.toLowerCase());
                            const matchCat = !menuCategoryFilter || item.category === menuCategoryFilter;
                            return matchSearch && matchCat;
                          })
                          .map((item) => (
                            <tr key={item.dishId} style={{ opacity: item.isAvailable ? 1 : 0.6 }}>
                              <td>
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.dishName} style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                                ) : (
                                  <div style={{ width: '42px', height: '42px', borderRadius: '6px', backgroundColor: 'var(--color-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}><BookOpen size={16} /></div>
                                )}
                              </td>
                              <td style={{ fontWeight: '600' }}>{item.dishName}</td>
                              <td><span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{item.category}</span></td>
                              <td style={{ fontWeight: '700' }}>₹{item.price?.toFixed(2)}</td>
                              <td>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  backgroundColor: item.isVegetarian ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                  color: item.isVegetarian ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>{item.isVegetarian ? 'VEG' : 'NON-VEG'}</span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="checkbox"
                                    checked={item.isAvailable}
                                    onChange={() => handleToggleMenuDishAvailability(item)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontSize: '12px', fontWeight: '600', color: item.isAvailable ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {item.isAvailable ? 'Available' : 'Disabled'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button onClick={() => handleOpenMenuModal(item)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Edit</button>
                                  <button onClick={() => handleDeleteMenuDish(item)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
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

          {/* RESTAURANT SETTINGS TAB */}
          {activeTab === 'restaurant-settings' && (
            <div>
              <h2 className="section-title">Restaurant Settings</h2>
              
              {settingsLoading ? (
                <div className="card" style={{ padding: '24px' }}>
                  <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
                  <div className="skeleton" style={{ width: '80%', height: '40px' }}></div>
                </div>
              ) : (
                <form onSubmit={handleSaveRestaurantSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
                  {formError && <div className="auth-error">{formError}</div>}
                  
                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>Basic Information</h3>
                    
                    <div className="form-group">
                      <label>RESTAURANT NAME *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={restaurantInfo.restaurantName || ''}
                        onChange={(e) => handleRestaurantInfoChange('restaurantName', e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>MOBILE NUMBER</label>
                        <input
                          type="text"
                          className="form-input"
                          value={restaurantInfo.mobile || ''}
                          onChange={(e) => handleRestaurantInfoChange('mobile', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>TAX CALCULATION TYPE</label>
                        <select
                          className="form-input"
                          value={restaurantInfo.taxType || 'exclusive'}
                          onChange={(e) => handleRestaurantInfoChange('taxType', e.target.value)}
                        >
                          <option value="exclusive">Exclusive (Add taxes on top of dish price)</option>
                          <option value="inclusive">Inclusive (Taxes are built into dish price)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>ADDRESS</label>
                      <textarea
                        className="form-input"
                        rows="2"
                        value={restaurantInfo.address || ''}
                        onChange={(e) => handleRestaurantInfoChange('address', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>Google Review Settings</h3>
                    <div className="form-group">
                      <label>GOOGLE PAGE REVIEW LINK</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="e.g. https://g.page/r/your-id/review"
                        value={restaurantInfo.googleReviewLink || ''}
                        onChange={(e) => handleRestaurantInfoChange('googleReviewLink', e.target.value)}
                      />
                      <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                        If provided, customers submitting a rating of 3 stars or higher on the checkout bill page will see a button to redirect to your Google Business profile.
                      </p>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>GST Setup</h3>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={restaurantInfo.isGST || false}
                          onChange={(e) => handleRestaurantInfoChange('isGST', e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        ENABLE GST COMPLIANCE
                      </label>
                    </div>

                    {restaurantInfo.isGST && (
                      <div className="form-group">
                        <label>GSTIN *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={restaurantInfo.GSTIN || ''}
                          onChange={(e) => handleRestaurantInfoChange('GSTIN', e.target.value)}
                          placeholder="e.g. 22AAAAA0000A1Z5"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Taxes setup */}
                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>Taxes Config</h3>
                      <button type="button" onClick={handleAddSettingTax} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={14} /> Add Tax
                      </button>
                    </div>

                    {(!restaurantInfo.taxes || restaurantInfo.taxes.length === 0) ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>No taxes configured.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {restaurantInfo.taxes.map((tax, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ flex: 2 }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Tax Name (e.g. CGST)"
                                value={tax.name}
                                onChange={(e) => handleSettingTaxChange(idx, 'name', e.target.value)}
                                required
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                placeholder="Percent (e.g. 2.5)"
                                value={tax.percent || ''}
                                onChange={(e) => handleSettingTaxChange(idx, 'percent', e.target.value)}
                                required
                              />
                            </div>
                            <button type="button" onClick={() => handleDeleteSettingTax(idx)} className="btn btn-secondary" style={{ padding: '8px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Discounts setup */}
                  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>Discounts Config</h3>
                      <button type="button" onClick={handleAddSettingDiscount} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={14} /> Add Discount
                      </button>
                    </div>

                    {(!restaurantInfo.discounts || restaurantInfo.discounts.length === 0) ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>No discounts configured.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {restaurantInfo.discounts.map((disc, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ flex: 2 }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Discount Name (e.g. Festive Offer)"
                                value={disc.name}
                                onChange={(e) => handleSettingDiscountChange(idx, 'name', e.target.value)}
                                required
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                placeholder="Percent (e.g. 10)"
                                value={disc.percent || ''}
                                onChange={(e) => handleSettingDiscountChange(idx, 'percent', e.target.value)}
                                required
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="checkbox"
                                checked={disc.isActive !== false}
                                onChange={(e) => handleSettingDiscountChange(idx, 'isActive', e.target.checked)}
                                style={{ width: '16px', height: '16px' }}
                              />
                              <span style={{ fontSize: '11px', fontWeight: '700' }}>ACTIVE</span>
                            </div>
                            <button type="button" onClick={() => handleDeleteSettingDiscount(idx)} className="btn btn-secondary" style={{ padding: '8px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', alignSelf: 'flex-start' }} disabled={actionLoading}>
                    {actionLoading ? 'Saving Settings...' : 'Save Restaurant Settings'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="section-title">Order Management</h2>

              {/* Filters */}
              <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>SEARCH BY INVOICE NO</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search invoice..."
                    value={ordersFilters.search}
                    onChange={(e) => setOrdersFilters(prev => ({ ...prev, search: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchOwnerOrders(0);
                    }}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>

                <div className="form-group" style={{ width: '120px', margin: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>TABLE NO</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="All"
                    value={ordersFilters.tableNo}
                    onChange={(e) => setOrdersFilters(prev => ({ ...prev, tableNo: e.target.value }))}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>

                <div className="form-group" style={{ width: '150px', margin: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>ORDER STATUS</label>
                  <select
                    className="form-input"
                    value={ordersFilters.status}
                    onChange={(e) => setOrdersFilters(prev => ({ ...prev, status: e.target.value }))}
                    style={{ padding: '8px 12px', fontSize: '13px', height: '36px' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group" style={{ width: '140px', margin: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>FROM DATE</label>
                  <input
                    type="date"
                    className="form-input"
                    value={ordersFilters.from}
                    onChange={(e) => setOrdersFilters(prev => ({ ...prev, from: e.target.value }))}
                    style={{ padding: '6px 12px', fontSize: '13px', height: '36px' }}
                  />
                </div>

                <div className="form-group" style={{ width: '140px', margin: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>TO DATE</label>
                  <input
                    type="date"
                    className="form-input"
                    value={ordersFilters.to}
                    onChange={(e) => setOrdersFilters(prev => ({ ...prev, to: e.target.value }))}
                    style={{ padding: '6px 12px', fontSize: '13px', height: '36px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => fetchOwnerOrders(0)} className="btn btn-primary" style={{ height: '36px', paddingInline: '16px', fontSize: '13px' }}>
                    Filter
                  </button>
                  <button
                    onClick={() => {
                      setOrdersFilters({ status: '', search: '', from: '', to: '', tableNo: '' });
                      setTimeout(() => fetchOwnerOrders(0), 0);
                    }}
                    className="btn btn-secondary"
                    style={{ height: '36px', paddingInline: '12px', fontSize: '13px' }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr>
                        <th>Date/Time</th>
                        <th>Invoice No</th>
                        <th>Table</th>
                        <th>Customer</th>
                        <th>Waiter</th>
                        <th>Order Status</th>
                        <th>Payment</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingOrders && orders.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                            Loading orders...
                          </td>
                        </tr>
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                            No orders found.
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.ordersId}>
                            <td>{new Date(o.createdAt).toLocaleString()}</td>
                            <td style={{ fontWeight: '600' }}>{o.invoiceNo || 'N/A'}</td>
                            <td>T-{o.tableNo}</td>
                            <td>
                              <div style={{ fontSize: '13px', fontWeight: '600' }}>{o.customer?.name || 'Walk-in'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{o.customer?.mobile || ''}</div>
                            </td>
                            <td>{o.waiter?.waiterName || 'Self-Order'}</td>
                            <td>
                              <span className={`badge badge-${
                                o.orderStatus === 'completed' ? 'success' :
                                o.orderStatus === 'cancelled' ? 'danger' :
                                o.orderStatus === 'ready' ? 'warning' : 'primary'
                              }`}>
                                {o.orderStatus.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${o.isPaymentCompleted ? 'success' : 'danger'}`}>
                                {o.isPaymentCompleted ? 'PAID' : 'PENDING'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700' }}>
                              ₹{(o.finalAmount || o.totalAmount || 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setShowOrderModal(true);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {orders.length < ordersTotal && (
                  <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => fetchOwnerOrders(ordersOffset + ordersLimit)}
                      className="btn btn-secondary"
                      disabled={loadingOrders}
                      style={{ fontSize: '13px', padding: '6px 16px' }}
                    >
                      {loadingOrders ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div>
              <h2 className="section-title">Customer Feedback & Reviews</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {loadingReviews && reviews.length === 0 ? (
                  <div className="card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Loading reviews...
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No reviews received yet.
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.feedbackId} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1.5px solid var(--color-border)', borderRadius: '12px' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                fill={star <= r.rating ? '#FFD700' : 'none'}
                                color={star <= r.rating ? '#FFD700' : '#CCCCCC'}
                              />
                            ))}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {new Date(r.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span className={`badge badge-${r.rating >= 4 ? 'success' : r.rating >= 3 ? 'warning' : 'danger'}`} style={{ fontSize: '10px' }}>
                          {r.rating} / 5
                        </span>
                      </div>

                      {/* Comment */}
                      <div style={{ fontSize: '13.5px', color: 'var(--color-text)', fontStyle: r.comment ? 'normal' : 'italic', lineBreak: 'anywhere' }}>
                        {r.comment ? `"${r.comment}"` : 'No comment provided.'}
                      </div>

                      <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '12px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Customer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Customer Mobile</span>
                          <span style={{ fontWeight: '600' }}>{r.mobile}</span>
                        </div>

                        {/* Linked Order */}
                        {r.orders ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Order #{r.orders.dailyOrderNo} (T-{r.orders.tableNo})</span>
                            <button
                              onClick={() => {
                                setSelectedOrder(r.orders);
                                setShowOrderModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                              View Bill
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Order details unavailable</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {reviews.length < reviewsTotal && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button
                    onClick={() => fetchOwnerReviews(reviewsOffset + reviewsLimit)}
                    className="btn btn-secondary"
                    disabled={loadingReviews}
                    style={{ fontSize: '13px', padding: '6px 16px' }}
                  >
                    {loadingReviews ? 'Loading...' : 'Load More Reviews'}
                  </button>
                </div>
              )}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '32px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <Store size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Restaurant Logo</h3>
                </div>

                <div className="settings-option" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {restaurant?.logoUrl && (
                    <img src={restaurant.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                  )}
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '14px' }}>Upload Logo Icon</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '8px' }}>Select an image file (Max 2MB)</p>
                    <input type="file" accept="image/*" onChange={handleLogoSelect} style={{ fontSize: '12px' }} disabled={actionLoading} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================================
         MODALS & DIALOG BOXES
         ====================================================================== */}

      {/* Menu Dish Modal */}
      {showMenuModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>{selectedMenuDish ? 'Edit Dish Details' : 'Add New Dish'}</h3>
              <button onClick={() => { setShowMenuModal(false); setFormError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            
            <form onSubmit={handleSaveMenuDish}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>DISH NAME *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={dishForm.dishName}
                    onChange={(e) => handleDishFormChange('dishName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>PRICE (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={dishForm.price}
                    onChange={(e) => handleDishFormChange('price', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>CATEGORY *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={dishForm.category}
                    onChange={(e) => handleDishFormChange('category', e.target.value)}
                    placeholder="e.g. Starter, Main Course"
                    list="categories-list"
                    required
                  />
                  <datalist id="categories-list">
                    {menuCategories.map((c, i) => <option key={i} value={c} />)}
                  </datalist>
                </div>
                
                <div className="form-group">
                  <label>SPICY LEVEL (1-4)</label>
                  <select
                    className="form-input"
                    value={dishForm.spicyLevel}
                    onChange={(e) => handleDishFormChange('spicyLevel', e.target.value)}
                  >
                    <option value={1}>Mild (1)</option>
                    <option value={2}>Medium (2)</option>
                    <option value={3}>Hot (3)</option>
                    <option value={4}>Very Hot (4)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>PREPARATION TIME (MINS)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={dishForm.preparationTime}
                    onChange={(e) => handleDishFormChange('preparationTime', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '100%', paddingTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                    <input
                      type="checkbox"
                      checked={dishForm.isVegetarian}
                      onChange={(e) => handleDishFormChange('isVegetarian', e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    VEGETARIAN
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                    <input
                      type="checkbox"
                      checked={dishForm.isAvailable}
                      onChange={(e) => handleDishFormChange('isAvailable', e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    AVAILABLE
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>DESCRIPTION</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={dishForm.description}
                  onChange={(e) => handleDishFormChange('description', e.target.value)}
                  placeholder="Describe the dish flavors, size, ingredients..."
                />
              </div>

              <div className="form-group">
                <label>DISH PHOTO</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                  {dishForm.imagePreview && (
                    <img src={dishForm.imagePreview} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                  )}
                  <div>
                    <input type="file" accept="image/*" onChange={handleDishImageSelect} style={{ fontSize: '12px' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '4px' }}>Max file size 2MB</p>
                  </div>
                </div>
              </div>

              <div className="dialog-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => { setShowMenuModal(false); setFormError(''); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Add Staff Member</h3>
              <button onClick={() => { setShowAddStaffModal(false); setFormError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label>STAFF ACCOUNT TYPE *</label>
                <select className="form-input" value={staffType} onChange={(e) => setStaffType(e.target.value)}>
                  <option value="manager">Manager</option>
                  <option value="waiter">Waiter</option>
                  <option value="chef">Kitchen Chef</option>
                  <option value="other">Other Role</option>
                </select>
              </div>
              <div className="form-group">
                <label>FULL NAME *</label>
                <input type="text" className="form-input" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>MOBILE NUMBER *</label>
                <input type="text" className="form-input" value={staffMobile} onChange={(e) => setStaffMobile(e.target.value)} required />
              </div>
              {staffType === 'manager' && (
                <div className="form-group">
                  <label>EMAIL ADDRESS</label>
                  <input type="email" className="form-input" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
                </div>
              )}
              {staffType === 'other' && (
                <div className="form-group">
                  <label>CUSTOM ROLE TITLE * (e.g. Cashier, Storekeeper)</label>
                  <input type="text" className="form-input" value={staffCustomRole} onChange={(e) => setStaffCustomRole(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label>PASSWORD *</label>
                <input type="password" className="form-input" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
              </div>
              <div className="dialog-actions">
                <button type="button" onClick={() => setShowAddStaffModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Save Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Staff Password Modal */}
      {showResetPasswordModal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Change Password: {selectedStaff?.name}</h3>
              <button onClick={() => { setShowResetPasswordModal(false); setFormError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleResetStaffPassword}>
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

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Log New Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleSaveExpense}>
              <div className="form-group">
                <label>AMOUNT * (₹)</label>
                <input type="number" step="0.01" className="form-input" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>CATEGORY *</label>
                <select className="form-input" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                  <option value="Ingredients">Ingredients & Supplies</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities (Water, Power, Net)</option>
                  <option value="Salaries">Salaries & Wages</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>
              <div className="form-group">
                <label>PAYMENT MODE</label>
                <select className="form-input" value={expensePaymentMode} onChange={(e) => setExpensePaymentMode(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label>DESCRIPTION / REMARKS</label>
                <textarea className="form-input" rows="2" value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} placeholder="Enter details..." />
              </div>
              <div className="dialog-actions">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HSN Modal */}
      {showHsnModal && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Configure HSN Code: {selectedDish?.dishName}</h3>
              <button onClick={() => setShowHsnModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleSaveHsnCode}>
              <div className="form-group">
                <label>HSN / SAC CODE *</label>
                <input type="text" className="form-input" value={menuItemHsn} onChange={(e) => setMenuItemHsn(e.target.value)} placeholder="e.g. 996311" required />
              </div>
              <div className="dialog-actions">
                <button type="button" onClick={() => setShowHsnModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Update HSN</button>
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

      {/* Order Details Modal Overlay */}
      {showOrderModal && selectedOrder && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '600px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Invoice Details — #{selectedOrder.invoiceNo || 'N/A'}</h3>
              <button onClick={() => { setShowOrderModal(false); setSelectedOrder(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Meta information grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--color-surface-2)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>DATE & TIME</span>
                  <span style={{ fontWeight: '600' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>TABLE NO</span>
                  <span style={{ fontWeight: '600' }}>Table {selectedOrder.tableNo}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>DAILY ORDER NO</span>
                  <span style={{ fontWeight: '600' }}>#{selectedOrder.dailyOrderNo}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>WAITER</span>
                  <span style={{ fontWeight: '600' }}>{selectedOrder.waiter?.waiterName || 'Self-Order'}</span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>CUSTOMER</span>
                  <span style={{ fontWeight: '600' }}>{selectedOrder.customer?.name || 'Walk-in'} {selectedOrder.customer?.mobile ? `(${selectedOrder.customer.mobile})` : ''}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 style={{ fontWeight: '800', marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>ORDERED DISHES</h4>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '60px' }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '100px' }}>Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '100px' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const items = Array.isArray(selectedOrder.ordersInfo) 
                          ? selectedOrder.ordersInfo 
                          : typeof selectedOrder.ordersInfo === 'string'
                            ? JSON.parse(selectedOrder.ordersInfo)
                            : [];
                        return items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: '600' }}>{item.dishName}</div>
                              {item.remarks && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>* {item.remarks}</div>}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{parseFloat(item.price || 0).toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>₹{(item.quantity * parseFloat(item.price || 0)).toFixed(2)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginLeft: 'auto', width: '100%', maxWidth: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Subtotal:</span>
                  <span style={{ fontWeight: '600' }}>₹{parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
                {parseFloat(selectedOrder.discountAmount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ color: 'var(--color-danger)' }}>Discount:</span>
                    <span style={{ color: 'var(--color-danger)', fontWeight: '600' }}>-₹{parseFloat(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(selectedOrder.gstAmount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>GST/Taxes:</span>
                    <span style={{ fontWeight: '600' }}>₹{parseFloat(selectedOrder.gstAmount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderTop: '1px solid var(--color-border)', paddingTop: '6px', marginTop: '4px', fontSize: '15px', fontWeight: '800' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>₹{(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="dialog-actions" style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <button onClick={() => { setShowOrderModal(false); setSelectedOrder(null); }} className="btn btn-secondary" style={{ width: '100%' }}>
                Close Details
              </button>
            </div>
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
