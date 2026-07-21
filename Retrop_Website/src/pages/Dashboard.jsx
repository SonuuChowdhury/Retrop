// ============================================================================
// OWNER DASHBOARD & INVENTORY MANAGEMENT (/dashboard)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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
  Clock,
  CheckCircle,
  FileSpreadsheet,
  BookOpen,
  Star,
  Menu as MenuToggleIcon,
  UploadCloud,
  Eye,
  EyeOff,
  Search,
  RotateCcw,
  Filter,
  LayoutGrid,
  List,
  FileText,
  Printer,
  Download,
  ChevronRight
} from 'lucide-react';




const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

function validateImageFile(file, maxSizeMB = 2) {
  if (!file) return { valid: false, error: 'No file selected' };

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format (.${ext}). Allowed: PNG, JPG, WEBP, GIF, SVG.`
    };
  }

  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type (${file.type}). Security policy allows image files only.`
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum limit of ${maxSizeMB}MB.`
    };
  }

  return { valid: true };
}

function CustomFileUpload({ onFileSelect, previewUrl, accept = "image/jpeg,image/jpg,image/png,image/webp,image/svg+xml", maxSizeMB = 2, disabled = false, label = "Upload Image" }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = React.useRef(null);

  const handleFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    const validation = validateImageFile(file, maxSizeMB);
    if (!validation.valid) {
      setErrorMsg(validation.error);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setSelectedFileName(file.name);
    onFileSelect(file);
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '16px',
          padding: '18px 16px',
          textAlign: 'center',
          background: dragActive ? 'rgba(255, 107, 53, 0.05)' : 'var(--color-bg-subtle)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {previewUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left', width: '100%' }}>
            <img src={previewUrl} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedFileName || 'Selected Image'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--color-primary)', margin: 0, fontWeight: '700' }}>
                Click or drag to replace image
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255, 107, 53, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0', color: 'var(--color-text)' }}>
                {selectedFileName ? selectedFileName : label}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
                Click to browse or drag & drop (Max {maxSizeMB}MB · PNG, JPG, WEBP, SVG)
              </p>
            </div>
          </>
        )}
      </div>

      {errorMsg && (
        <p style={{ fontSize: '11.5px', color: 'var(--color-danger)', marginTop: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>⚠️</span> {errorMsg}
        </p>
      )}
    </div>
  );
}


import '../styles/dashboard.css';

const DASHBOARD_NAV_GROUPS = [
  {
    label: 'Snapshot',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Customer Flow',
    items: [
      { id: 'menu', label: 'Menu List', icon: BookOpen },
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'staff', label: 'Staff Registry', icon: Users },
      { id: 'inventory', label: 'Stock Items', icon: Box },
      { id: 'vendors', label: 'Vendors', icon: Truck },
      { id: 'recipes', label: 'Recipes / BOM', icon: ChefHat },
      { id: 'purchases', label: 'Purchases', icon: ClipboardList },
      { id: 'expenses', label: 'Expenses', icon: DollarSign },
    ],
  },
  {
    label: 'Compliance & Settings',
    items: [
      { id: 'day-close', label: 'Day Close', icon: CheckCircle },
      { id: 'gst', label: 'GST Compliance', icon: FileSpreadsheet },
      { id: 'restaurant-settings', label: 'Restaurant Settings', icon: Store },
      { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];


function SectionHeader({ title, description, action }) {
  return (
    <div className="dashboard-section-header">
      <div>
        <h2 className="section-title">{title}</h2>
        {description && <p className="dashboard-section-description">{description}</p>}
      </div>
      {action && <div className="dashboard-section-action">{action}</div>}
    </div>
  );
}


function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="dashboard-empty-state" role="status">
      {Icon && (
        <div className="dashboard-empty-icon">
          <Icon size={28} />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="dashboard-empty-action">{action}</div>}
    </div>
  );
}

function LoadingRows({ rows = 3, height = 28 }) {
  return (
    <div className="dashboard-loading-stack" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="skeleton" style={{ width: '100%', height, marginBottom: idx < rows - 1 ? '12px' : 0 }} />
      ))}
    </div>
  );
}


export default function Dashboard() {
  const { owner, restaurant, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'overview' | 'managers' | 'settings' | 'inventory' | 'vendors' | 'recipes' | 'purchases'
  // Tab State: 'overview' | 'staff' | 'settings' | 'inventory' | 'vendors' | 'recipes' | 'purchases' | 'expenses' | 'day-close' | 'gst'
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);


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
  const statusPillsRef = useRef(null);
  const reviewFilterRef = useRef(null);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const [reviewsLimit] = useState(20);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewRatingFilter, setReviewRatingFilter] = useState('');

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
  const [showStaffPwd, setShowStaffPwd] = useState(false);
  const [showResetStaffPwd, setShowResetStaffPwd] = useState(false);


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
  const [isCustomCategory, setIsCustomCategory] = useState(false);



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
  const [togglingDishId, setTogglingDishId] = useState(null);
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

  const [loadingPdf, setLoadingPdf] = useState(false);
  const handleViewOrderPdf = async (orderId, invoiceNo) => {
    if (!orderId) return;
    setLoadingPdf(true);
    try {
      const token = localStorage.getItem('retrop_owner_token') || localStorage.getItem('retrop_portal_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const selectedRestId = sessionStorage.getItem('retrop_selected_restaurant') || '';
      
      const response = await fetch(`${API_BASE_URL}/api/owner/orders/${orderId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restaurant-Id': selectedRestId,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF bill');

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      window.open(fileUrl, '_blank');
    } catch (err) {
      notify(err.message || 'Error opening PDF bill', 'error');
    } finally {
      setLoadingPdf(false);
    }
  };


  const fetchOwnerReviews = async (offset = 0, filterRating = reviewRatingFilter) => {
    setLoadingReviews(true);
    try {
      const res = await api.getReviews(reviewsLimit, offset, filterRating);
      if (res.success) {
        if (offset === 0) {
          setReviews(res.data || []);
        } else {
          setReviews(prev => [...prev, ...(res.data || [])]);
        }
        if (res.summary) {
          setReviewSummary(res.summary);
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

  const [exportingFormat, setExportingFormat] = useState(null);

  const handleExportSales = async (format = 'csv') => {
    setExportingFormat(format);
    try {
      const token = localStorage.getItem('retrop_owner_token') || localStorage.getItem('retrop_portal_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const selectedRestId = sessionStorage.getItem('retrop_selected_restaurant') || '';
      const response = await fetch(`${API_BASE_URL}/api/owner/dashboard/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restaurant-Id': selectedRestId,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export sales report (${format.toUpperCase()})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      notify(`Sales report (${format.toUpperCase()}) exported successfully`, 'success');
    } catch (err) {
      notify(err.message || 'Export failed', 'error');
    } finally {
      setExportingFormat(null);
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
      } else if (type === 'dish' || type === 'menu') {
        res = await api.deleteMenuItem(id);
        if (res.success) fetchMenuManagement();
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

  const DEFAULT_DISH_CATEGORIES = ['Starters', 'Main Course', 'Beverages', 'Desserts', 'Breads & Rice', 'Snacks', 'Combo Meals', 'Soups & Salads'];

  const handleOpenMenuModal = (dish = null) => {
    if (dish) {
      setSelectedMenuDish(dish);
      const isKnown = DEFAULT_DISH_CATEGORIES.includes(dish.category) || menuCategories.includes(dish.category);
      setIsCustomCategory(!isKnown && Boolean(dish.category));
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
      setIsCustomCategory(false);
      setDishForm({
        dishName: '',
        price: '',
        category: 'Main Course',
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
    setTogglingDishId(dish.dishId);
    try {
      const res = await api.toggleMenuItemAvailability(dish.dishId, !dish.isAvailable);
      if (res.success) {
        notify(`Dish status updated`, 'success');
        await fetchMenuManagement();
      }
    } catch (err) {
      notify(err.message || 'Failed to update availability', 'error');
    } finally {
      setTogglingDishId(null);
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
    <div className="dashboard-layout dashboard-shell" data-dashboard-shell="true">
      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)', zIndex: 85
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-scroll">
          <div className="sidebar-logo" style={{ padding: '14px 12px 14px', borderBottom: '1px solid var(--color-border)' }}>
            {/* Top Retrop Logo with click-to-home */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }} title="Go to Home">
                <img src="/logo-corner-rounded.png" alt="Retrop" style={{ height: '28px', width: '28px', borderRadius: '8px', objectFit: 'cover' }} />
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.4px' }}>Retrop</span>
              </Link>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="mobile-only-close"
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Shifted Workspace Info */}
            <div style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '10px 11px' }}>
              <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--color-primary)', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Retrop RMS · Owner workspace
              </span>
              <h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Store size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {restaurant ? restaurant.businessName : 'Retrop Restaurant'}
                </span>
              </h3>
              <p style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', margin: '0 0 8px 0', lineHeight: 1.35 }}>
                Manage inventory, staff, orders, reviews, and compliance from one place.
              </p>

              <button
                onClick={() => { navigate('/dashboard'); setMobileNavOpen(false); }}
                className="sidebar-dashboard-btn mobile-only-btn"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
                  fontSize: '11.5px', fontWeight: '700', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'
                }}
                title="Return to Business Selector Dashboard"
              >
                <LayoutGrid size={13} style={{ color: 'var(--color-primary)' }} />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
          
          <nav className="sidebar-menu" aria-label="Dashboard sections">
            {DASHBOARD_NAV_GROUPS.map((group) => (
              <div key={group.label} className="sidebar-group">
                <div className="sidebar-group-label">{group.label}</div>
                <ul className="sidebar-group-list" role="list">
                  {group.items.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <li key={item.id} className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}>
                        <button
                          type="button"
                          className="sidebar-link"
                          onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                        >
                          <span className="sidebar-icon-chip" aria-hidden="true">
                            <IconComp size={18} fill={item.id === 'reviews' && activeTab === 'reviews' ? 'currentColor' : 'none'} />
                          </span>
                          <span className="sidebar-link-text">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
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
        <header className="panel-header dashboard-panel-header">
          <div className="dashboard-header-left">
            <button
              onClick={() => setMobileNavOpen(v => !v)}
              className="mobile-nav-toggle dashboard-sidebar-toggler"
              aria-label="Toggle navigation"
              title="Open Navigation Menu"
            >
              <MenuToggleIcon size={18} />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="dashboard-back-btn desktop-only-btn"
              title="Return to Business Selector Dashboard"
            >
              <LayoutGrid size={14} className="dashboard-back-icon" />
              <span>Return to Dashboard</span>
            </button>
          </div>

          <div className="user-badge dashboard-header-actions">
            <div className="dashboard-user-meta">
              <span className="dashboard-user-name">{owner?.name || 'Owner'}</span>
              <span className="dashboard-user-role">OWNER</span>
            </div>
          </div>
        </header>


        <div className="panel-content">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              <SectionHeader
                title="Today's Summary"
                description="Revenue, fulfilment, basket size, and top items at a glance."
                action={(
                  <div className="export-buttons-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', flexWrap: 'nowrap' }}>
                    <button
                      onClick={() => handleExportSales('csv')}
                      disabled={exportingFormat === 'csv'}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {exportingFormat === 'csv' ? (
                        <><span className="spinner animate-spin" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: 'var(--color-primary)' }} /> Exporting...</>
                      ) : (
                        <><FileSpreadsheet size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> Export CSV</>
                      )}
                    </button>
                    <button
                      onClick={() => handleExportSales('xls')}
                      disabled={exportingFormat === 'xls'}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {exportingFormat === 'xls' ? (
                        <><span className="spinner animate-spin" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: 'var(--color-success)' }} /> Exporting...</>
                      ) : (
                        <><FileSpreadsheet size={15} style={{ color: '#16a34a', flexShrink: 0 }} /> Export XLS</>
                      )}
                    </button>
                  </div>
                )}
              />

              {loadingSummary ? (
                <div className="stats-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="card stat-card">
                      <LoadingRows rows={2} height={24} />
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
                    <LoadingRows rows={3} height={24} />
                  ) : summary?.recentOrders?.length === 0 ? (
                    <EmptyState
                      icon={ShoppingBag}
                      title="No bills settled yet"
                      description="Completed bills for today will appear here once service starts."
                    />
                  ) : (
                    <div style={{ width: '100%', overflow: 'hidden' }}>
                      <table className="custom-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '30%', padding: '8px 6px' }}>TABLE</th>
                            <th style={{ width: '35%', padding: '8px 6px' }}>AMOUNT</th>
                            <th style={{ width: '35%', padding: '8px 6px', textAlign: 'right' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary?.recentOrders?.map((order) => (
                            <tr key={order.ordersId}>
                              <td style={{ padding: '10px 6px', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Table {order.tableNo}</td>
                              <td style={{ padding: '10px 6px', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>₹{order.finalAmount || order.totalAmount}</td>
                              <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                                <span style={{ 
                                  padding: '3px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '11px', 
                                  fontWeight: '700',
                                  backgroundColor: order.isPaymentCompleted ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                  color: order.isPaymentCompleted ? 'var(--color-success)' : 'var(--color-danger)',
                                  display: 'inline-block'
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
                    <LoadingRows rows={3} height={24} />
                  ) : summary?.topDishes?.length === 0 ? (
                    <EmptyState
                      icon={ChefHat}
                      title="No sales data yet"
                      description="Top items will populate after orders are closed and sold through the POS flow."
                    />
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
              <SectionHeader
                title="Inventory Stock Items"
                description="Track stock, reorder thresholds, and unit costs for every ingredient."
                action={(
                  <button onClick={() => { setSelectedItem(null); setShowItemModal(true); }} className="btn btn-primary">
                    <Plus size={16} />
                    Add Stock Item
                  </button>
                )}
              />

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingItems ? (
                  <div style={{ padding: '24px' }}><LoadingRows rows={3} height={28} /></div>
                ) : inventoryItems.length === 0 ? (
                  <EmptyState
                    icon={Box}
                    title="No inventory yet"
                    description="Add your first stock item to begin tracking costs and low-stock alerts."
                    action={<button onClick={() => { setSelectedItem(null); setShowItemModal(true); }} className="btn btn-primary">Add stock item</button>}
                  />
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="stock-desktop-view" style={{ overflowX: 'auto' }}>
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
                                <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{item.category}</span></td>
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
                                      style={{ padding: '6px 12px', fontSize: '12px' }}
                                      title="Edit Item"
                                    >
                                      Edit Item
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

                    {/* Mobile Cards View */}
                    <div className="stock-mobile-view" style={{ padding: '16px' }}>
                      {inventoryItems.map((item) => {
                        const isLowStock = parseFloat(item.currentStock) <= parseFloat(item.reorderLevel);
                        return (
                          <div key={item.itemId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '800', fontSize: '14.5px', color: 'var(--color-text)' }}>{item.name}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{item.category}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px 12px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                              <div>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '700' }}>CURRENT STOCK</span>
                                <span style={{ fontWeight: '800', color: isLowStock ? 'var(--color-danger)' : 'var(--color-text)' }}>
                                  {item.currentStock} {item.unit}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '700' }}>UNIT PRICE</span>
                                <span style={{ fontWeight: '800' }}>₹{item.costPerUnit || 0}</span>
                              </div>
                            </div>

                            {isLowStock && (
                              <div style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700', backgroundColor: 'rgba(230, 57, 70, 0.12)', padding: '6px 10px', borderRadius: '8px' }}>
                                <AlertTriangle size={14} />
                                Low Stock Alert (Threshold: {item.reorderLevel} {item.unit})
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
                                style={{ flex: 1, padding: '8px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                Edit Item
                              </button>
                              <button
                                onClick={() => triggerDeleteConfirm('item', item.itemId, item.name)}
                                className="btn btn-secondary"
                                style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

          {/* VENDORS TAB */}
          {activeTab === 'vendors' && (
            <div>
              <SectionHeader
                title="Supplier Registry"
                description="Keep your vendors, contacts, GSTINs, and payment terms organized."
                action={(
                  <button onClick={() => { setSelectedVendor(null); setShowVendorModal(true); }} className="btn btn-primary">
                    <Plus size={16} />
                    Add Supplier
                  </button>
                )}
              />

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingVendors ? (
                  <div style={{ padding: '24px' }}><LoadingRows rows={3} height={28} /></div>
                ) : vendors.length === 0 ? (
                  <EmptyState
                    icon={Truck}
                    title="No suppliers registered"
                    description="Create vendor records so purchase orders and bills can reference them later."
                    action={<button onClick={() => { setSelectedVendor(null); setShowVendorModal(true); }} className="btn btn-primary">Add supplier</button>}
                  />
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="tab-desktop-view" style={{ overflowX: 'auto' }}>
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
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    Edit Supplier
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

                    {/* Mobile Cards View */}
                    <div className="tab-mobile-view" style={{ padding: '16px' }}>
                      {vendors.map((v) => (
                        <div key={v.vendorId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '800', fontSize: '14.5px', color: 'var(--color-text)' }}>{v.name}</span>
                            {v.gstin && (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>GST: {v.gstin}</span>
                            )}
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>📞 Mobile: {v.mobile || 'N/A'}</span>
                            {v.email && <span>✉️ Email: {v.email}</span>}
                            {v.paymentTerms && <span>💳 Payment Terms: {v.paymentTerms}</span>}
                            {v.address && <span>📍 Address: {v.address}</span>}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
                              style={{ flex: 1, padding: '8px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              Edit Supplier
                            </button>
                            <button
                              onClick={() => triggerDeleteConfirm('vendor', v.vendorId, v.name)}
                              className="btn btn-secondary"
                              style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

          {/* RECIPES / BOM TAB */}
          {activeTab === 'recipes' && (
            <div>
              <SectionHeader
                title="Recipes & Bill of Materials"
                description="Link menu items to ingredients to calculate plate costs and BOM coverage."
              />

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingRecipes ? (
                  <div style={{ padding: '24px' }}><LoadingRows rows={3} height={28} /></div>
                ) : menuItems.length === 0 ? (
                  <EmptyState
                    icon={ChefHat}
                    title="No dishes available for BOM"
                    description="Menu items need to exist before recipe mappings can be configured."
                  />
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="tab-desktop-view" style={{ overflowX: 'auto' }}>
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
                                <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{dish.category}</span></td>
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

                    {/* Mobile Cards View */}
                    <div className="tab-mobile-view" style={{ padding: '16px' }}>
                      {menuItems.map((dish) => {
                        const recipe = recipes.find(r => r.dishId === dish.dishId);
                        return (
                          <div key={dish.dishId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '800', fontSize: '14.5px', color: 'var(--color-text)' }}>{dish.dishName}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{dish.category}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px 12px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                              <div>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '700' }}>MENU PRICE</span>
                                <span style={{ fontWeight: '800' }}>₹{dish.price}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '700' }}>BOM MAPPING</span>
                                {recipe ? (
                                  <span style={{ color: 'var(--color-success)', fontWeight: '800', fontSize: '12px' }}>
                                    ✓ {recipe.ingredients.length} Items
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Not Configured</span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button
                                onClick={() => openRecipeEditor(dish)}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '8px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                {recipe ? 'Edit Recipe' : 'Configure BOM'}
                              </button>
                              {recipe && (
                                <button
                                  onClick={() => triggerDeleteConfirm('recipe', dish.dishId, dish.dishName)}
                                  className="btn btn-secondary"
                                  style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

          {/* PURCHASES TAB */}
          {activeTab === 'purchases' && (
            <div>
              <SectionHeader
                title="Stock Purchase Invoices"
                description="Log supplier invoices and let stock updates flow from the recorded quantities."
                action={(
                  <button onClick={() => { setShowPurchaseModal(true); }} className="btn btn-primary">
                    <Plus size={16} />
                    Log Purchase Order
                  </button>
                )}
              />

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingPurchases ? (
                  <div style={{ padding: '24px' }}><LoadingRows rows={3} height={28} /></div>
                ) : purchases.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="No purchases logged"
                    description="Record the first invoice to start building purchase history and stock traceability."
                    action={<button onClick={() => { setShowPurchaseModal(true); }} className="btn btn-primary">Log purchase order</button>}
                  />
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="tab-desktop-view" style={{ overflowX: 'auto' }}>
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
                                  padding: '2px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px', 
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

                    {/* Mobile Cards View */}
                    <div className="tab-mobile-view" style={{ padding: '16px' }}>
                      {purchases.map((p) => (
                        <div key={p.purchaseId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-primary)' }}>Invoice: {p.invoiceNo || 'N/A'}</span>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              fontSize: '10.5px', 
                              fontWeight: '800',
                              backgroundColor: p.paymentStatus === 'paid' ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                              color: p.paymentStatus === 'paid' ? 'var(--color-success)' : 'var(--color-danger)',
                              textTransform: 'uppercase'
                            }}>{p.paymentStatus}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px 12px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '700' }}>SUPPLIER</span>
                              <span style={{ fontWeight: '700', color: 'var(--color-text)' }}>{p.vendor?.name || 'Walk-in Vendor'}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '700' }}>TOTAL AMOUNT</span>
                              <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '15px' }}>₹{p.totalAmount}</span>
                            </div>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Purchase Date: {p.purchaseDate}</span>
                            <span>Logged: {new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

          {/* STAFF REGISTRY TAB */}
          {activeTab === 'staff' && (
            <div>
              <SectionHeader
                title="Staff Registry"
                description="Create and manage manager, waiter, chef, and custom-role accounts."
                action={(
                  <button onClick={() => { setSelectedStaff(null); setShowAddStaffModal(true); }} className="btn btn-primary">
                    <Plus size={16} />
                    Add Staff Member
                  </button>
                )}
              />

              {loadingStaff ? (
                <div className="card" style={{ padding: '24px' }}><LoadingRows rows={3} height={28} /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Managers section */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Restaurant Managers</h3>
                    {staff.managers.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No managers registered.</p>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="staff-desktop-view" style={{ overflowX: 'auto' }}>
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
                                  <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>{m.role}</span></td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                      <button onClick={() => { setSelectedStaff({ type: 'manager', id: m.adminId, name: m.name }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Change Password"><Key size={14} /> Password</button>
                                      {m.role !== 'owner' && (
                                        <button onClick={() => triggerDeleteConfirm('manager', m.adminId, m.name)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="staff-mobile-view">
                          {staff.managers.map((m) => (
                            <div key={m.adminId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-text)' }}>{m.name}</span>
                                <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{m.role}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>Mobile: {m.mobile}</span>
                                {m.email && <span>Email: {m.email}</span>}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button onClick={() => { setSelectedStaff({ type: 'manager', id: m.adminId, name: m.name }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px' }}>
                                  <Key size={14} /> Password
                                </button>
                                {m.role !== 'owner' && (
                                  <button onClick={() => triggerDeleteConfirm('manager', m.adminId, m.name)} className="btn btn-secondary" style={{ padding: '8px 12px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Waiters section */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Waiters</h3>
                    {staff.waiters.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No waiters registered.</p>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="staff-desktop-view" style={{ overflowX: 'auto' }}>
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
                                      padding: '2px 8px', 
                                      borderRadius: '6px', 
                                      fontSize: '11px', 
                                      fontWeight: '700',
                                      backgroundColor: w.isActive ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                      color: w.isActive ? 'var(--color-success)' : 'var(--color-danger)'
                                    }}>{w.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                      <button onClick={() => { setSelectedStaff({ type: 'waiter', id: w.waiterId, name: w.waiterName }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Change Password"><Key size={14} /> Password</button>
                                      <button onClick={() => triggerDeleteConfirm('waiter', w.waiterId, w.waiterName)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="staff-mobile-view">
                          {staff.waiters.map((w) => (
                            <div key={w.waiterId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-text)' }}>{w.waiterName}</span>
                                <span style={{ 
                                  padding: '2px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '10px', 
                                  fontWeight: '800',
                                  backgroundColor: w.isActive ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                  color: w.isActive ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>{w.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                Mobile: {w.mobile}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button onClick={() => { setSelectedStaff({ type: 'waiter', id: w.waiterId, name: w.waiterName }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px' }}>
                                  <Key size={14} /> Password
                                </button>
                                <button onClick={() => triggerDeleteConfirm('waiter', w.waiterId, w.waiterName)} className="btn btn-secondary" style={{ padding: '8px 12px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chefs section */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Kitchen Chefs</h3>
                    {staff.chefs.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No chefs registered.</p>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="staff-desktop-view" style={{ overflowX: 'auto' }}>
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
                                      padding: '2px 8px', 
                                      borderRadius: '6px', 
                                      fontSize: '11px', 
                                      fontWeight: '700',
                                      backgroundColor: c.isActive ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                      color: c.isActive ? 'var(--color-success)' : 'var(--color-danger)'
                                    }}>{c.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                      <button onClick={() => { setSelectedStaff({ type: 'chef', id: c.kitchenId, name: c.kitchenName }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Change Password"><Key size={14} /> Password</button>
                                      <button onClick={() => triggerDeleteConfirm('chef', c.kitchenId, c.kitchenName)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="staff-mobile-view">
                          {staff.chefs.map((c) => (
                            <div key={c.kitchenId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-text)' }}>{c.kitchenName}</span>
                                <span style={{ 
                                  padding: '2px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '10px', 
                                  fontWeight: '800',
                                  backgroundColor: c.isActive ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                  color: c.isActive ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>{c.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                Mobile: {c.mobile}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button onClick={() => { setSelectedStaff({ type: 'chef', id: c.kitchenId, name: c.kitchenName }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px' }}>
                                  <Key size={14} /> Password
                                </button>
                                <button onClick={() => triggerDeleteConfirm('chef', c.kitchenId, c.kitchenName)} className="btn btn-secondary" style={{ padding: '8px 12px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Other Staff roles section */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Other Custom Roles</h3>
                    {staff.others.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No custom role staff registered.</p>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="staff-desktop-view" style={{ overflowX: 'auto' }}>
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
                                  <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{o.role}</span></td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                      <button onClick={() => { setSelectedStaff({ type: 'other', id: o.staffId, name: o.name }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Change Password"><Key size={14} /> Password</button>
                                      <button onClick={() => triggerDeleteConfirm('other', o.staffId, o.name)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="staff-mobile-view">
                          {staff.others.map((o) => (
                            <div key={o.staffId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-text)' }}>{o.name}</span>
                                <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{o.role}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                Mobile: {o.mobile}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button onClick={() => { setSelectedStaff({ type: 'other', id: o.staffId, name: o.name }); setShowResetPasswordModal(true); }} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px' }}>
                                  <Key size={14} /> Password
                                </button>
                                <button onClick={() => triggerDeleteConfirm('other', o.staffId, o.name)} className="btn btn-secondary" style={{ padding: '8px 12px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div>
              <SectionHeader
                title="Expense Ledger"
                description="Record operating expenses by date and category."
                action={(
                  <button onClick={() => { setShowExpenseModal(true); }} className="btn btn-primary">
                    <Plus size={16} />
                    Log Expense
                  </button>
                )}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
                <input type="date" className="form-input" style={{ width: '180px', padding: '6px 12px' }} value={expenseFilterDate} onChange={(e) => setExpenseFilterDate(e.target.value)} />
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingExpenses ? (
                  <div style={{ padding: '24px' }}><LoadingRows rows={3} height={28} /></div>
                ) : expenses.length === 0 ? (
                  <EmptyState
                    icon={DollarSign}
                    title="No expenses on this date"
                    description="Try another date range or add the first expense entry for the selected day."
                    action={<button onClick={() => { setShowExpenseModal(true); }} className="btn btn-primary">Log expense</button>}
                  />
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="tab-desktop-view" style={{ overflowX: 'auto' }}>
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
                              <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{e.paymentMode}</span></td>
                              <td>{e.admin?.name || 'System'}</td>
                              <td style={{ fontWeight: '700', color: 'var(--color-text)' }}>₹{e.amount}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button onClick={() => triggerDeleteConfirm('expense', e.expenseId, `${e.category} (₹${e.amount})`)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }} title="Delete expense">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="tab-mobile-view" style={{ padding: '16px' }}>
                      {expenses.map((e) => (
                        <div key={e.expenseId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-primary)' }}>{e.category}</span>
                            <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--color-text)' }}>₹{e.amount}</span>
                          </div>

                          {e.description && (
                            <p style={{ fontSize: '12.5px', color: 'var(--color-text)', margin: 0, background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                              {e.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            <span>Mode: {e.paymentMode}</span>
                            <span>By: {e.admin?.name || 'System'}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button
                              onClick={() => triggerDeleteConfirm('expense', e.expenseId, `${e.category} (₹${e.amount})`)}
                              className="btn btn-secondary"
                              style={{ width: '100%', padding: '8px', fontSize: '12.5px', borderRadius: '10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              <Trash2 size={14} />
                              Delete Expense
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

          {/* DAY CLOSE REGISTER TAB */}
          {activeTab === 'day-close' && (
            <div>
              <SectionHeader
                title="End of Day Cash Close"
                description="Compare expected cash against actual counted cash for a selected date."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
                <input type="date" className="form-input" style={{ width: '180px', padding: '6px 12px' }} value={dayCloseFilterDate} onChange={(e) => setDayCloseFilterDate(e.target.value)} />
              </div>

              {loadingDayClose ? (
                <div className="card" style={{ padding: '24px' }}>
                  <LoadingRows rows={2} height={32} />
                </div>
              ) : dayCloseInfo?.isClosed ? (
                <div className="card" style={{ maxWidth: '600px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Day Closed for {dayCloseFilterDate}</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--color-bg-muted)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
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

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px' }} disabled={actionLoading}>
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
              <SectionHeader
                title="GST Compliance Engine"
                description="Generate statutory JSON exports and map HSN/SAC codes for your dishes."
              />

              {/* Taxes Analytics Display */}
              {taxAnalyticsLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card" style={{ height: '80px', padding: '16px' }}><LoadingRows rows={2} height={18} /></div>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
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
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', borderRadius: '12px', padding: '10px' }} disabled={actionLoading}>
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
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', background: '#3B82F6', borderRadius: '12px', padding: '10px' }} disabled={actionLoading}>
                        <FileSpreadsheet size={16} />
                        Export GSTR-3B JSON
                      </button>
                    </form>
                  </div>
                </div>

                {/* HSN/SAC Configurer */}
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>HSN/SAC Mapping</h3>
                  
                  {/* Desktop Table View */}
                  <div className="tab-desktop-view" style={{ overflowX: 'auto' }}>
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
                            <td><span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{dish.category}</span></td>
                            <td><code style={{ fontSize: '12px', fontWeight: 'bold' }}>{dish.hsnCode || 'N/A'}</code></td>
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

                  {/* Mobile Cards View */}
                  <div className="tab-mobile-view">
                    {menuItems.map((dish) => (
                      <div key={dish.dishId} style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-text)' }}>{dish.dishName}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800', backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}>{dish.category}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px 12px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '700' }}>HSN / SAC CODE</span>
                          <code style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{dish.hsnCode || 'N/A'}</code>
                        </div>

                        <button
                          onClick={() => { setSelectedDish(dish); setMenuItemHsn(dish.hsnCode || ''); setShowHsnModal(true); }}
                          className="btn btn-secondary"
                          style={{ width: '100%', padding: '8px', fontSize: '12.5px', borderRadius: '10px', textAlign: 'center' }}
                        >
                          Edit HSN Code
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* MENU MANAGEMENT TAB */}
          {activeTab === 'menu' && (
            <div>
              <SectionHeader
                title="Menu Management"
                description="Manage dishes, pricing, images, availability, and HSN mapping."
                action={(
                  <button onClick={() => handleOpenMenuModal()} className="btn btn-primary" style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
                    <Plus size={16} />
                    Add New Dish
                  </button>
                )}
              />

              {/* Filters & Search */}
              <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px', width: '100%' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search dishes by name or category..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>
                <div style={{ flex: '1 1 180px', width: '100%' }}>
                  <select
                    className="form-input"
                    value={menuCategoryFilter}
                    onChange={(e) => setMenuCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories ({menuCategories.length})</option>
                    {menuCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>


              {/* Dishes Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loadingMenu ? (
                  <div style={{ padding: '24px' }}><LoadingRows rows={3} height={32} /></div>
                ) : menuItems.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No menu items yet"
                    description="Add your first dish to start building the portal menu and recipe mappings."
                    action={<button onClick={() => handleOpenMenuModal()} className="btn btn-primary">Add new dish</button>}
                  />
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="tab-desktop-view" style={{ overflowX: 'auto' }}>
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
                                    {togglingDishId === item.dishId ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'var(--color-primary)', display: 'inline-block' }} />
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Updating...</span>
                                      </div>
                                    ) : (
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                        <input
                                          type="checkbox"
                                          checked={item.isAvailable}
                                          onChange={() => handleToggleMenuDishAvailability(item)}
                                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: item.isAvailable ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                          {item.isAvailable ? 'Available' : 'Disabled'}
                                        </span>
                                      </label>
                                    )}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={() => handleOpenMenuModal(item)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Edit</button>
                                    <button onClick={() => triggerDeleteConfirm('dish', item.dishId, item.dishName)} className="btn btn-secondary" style={{ padding: '6px 10px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile & Tablet Cards View */}
                    <div className="tab-mobile-view" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {menuItems
                        .filter(item => {
                          const matchSearch = item.dishName?.toLowerCase().includes(menuSearch.toLowerCase()) || item.category?.toLowerCase().includes(menuSearch.toLowerCase());
                          const matchCat = !menuCategoryFilter || item.category === menuCategoryFilter;
                          return matchSearch && matchCat;
                        })
                        .map((item) => (
                          <div
                            key={item.dishId}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '14px',
                              background: 'var(--color-bg-subtle)',
                              border: '1px solid var(--color-border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              opacity: item.isAvailable ? 1 : 0.65
                            }}
                          >
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.dishName} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', flexShrink: 0 }}><BookOpen size={18} /></div>
                              )}

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--color-text)' }}>{item.dishName}</span>
                                  <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '9.5px',
                                    fontWeight: '800',
                                    backgroundColor: item.isVegetarian ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                    color: item.isVegetarian ? 'var(--color-success)' : 'var(--color-danger)'
                                  }}>
                                    {item.isVegetarian ? 'VEG' : 'NON-VEG'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10.5px', fontWeight: '700', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                                    {item.category}
                                  </span>
                                  <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-primary)' }}>
                                    ₹{item.price?.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                              {togglingDishId === item.dishId ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="spinner animate-spin" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'var(--color-primary)', display: 'inline-block' }} />
                                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Updating status...</span>
                                </div>
                              ) : (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                  <input
                                    type="checkbox"
                                    checked={item.isAvailable}
                                    onChange={() => handleToggleMenuDishAvailability(item)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontSize: '12.5px', fontWeight: '700', color: item.isAvailable ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {item.isAvailable ? 'Available' : 'Disabled'}
                                  </span>
                                </label>
                              )}

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleOpenMenuModal(item)}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => triggerDeleteConfirm('dish', item.dishId, item.dishName)}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', borderColor: 'rgba(230, 57, 70, 0.3)', color: 'var(--color-danger)' }}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
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
              <SectionHeader
                title="Order Management Hub"
                description="Live status tracking, order search, invoice lookup, and audit trail."
              />

              {/* Summary Stats Strip */}
              <div className="orders-summary-strip">
                <div className="card orders-summary-card">
                  <span className="orders-summary-label">Total Filtered Orders</span>
                  <span className="orders-summary-val">{ordersTotal}</span>
                </div>
                <div className="card orders-summary-card">
                  <span className="orders-summary-label">Total Revenue (Paid)</span>
                  <span className="orders-summary-val" style={{ color: 'var(--color-success)' }}>
                    ₹{orders.filter(o => o.isPaymentCompleted).reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="card orders-summary-card">
                  <span className="orders-summary-label">Active Kitchen Orders</span>
                  <span className="orders-summary-val" style={{ color: 'var(--color-primary)' }}>
                    {orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.orderStatus?.toLowerCase())).length}
                  </span>
                </div>
                <div className="card orders-summary-card">
                  <span className="orders-summary-label">Completed Orders</span>
                  <span className="orders-summary-val" style={{ color: 'var(--color-text-muted)' }}>
                    {orders.filter(o => o.orderStatus?.toLowerCase() === 'completed').length}
                  </span>
                </div>
              </div>

              {/* Modern Filters Card */}

              <div className="card orders-filter-container">
                {/* Status Pills Bar with Scroll Arrow Indicator */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div ref={statusPillsRef} className="orders-status-pills">
                    {[
                      { id: '', label: 'All Orders' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'accepted', label: 'Accepted' },
                      { id: 'preparing', label: 'Preparing' },
                      { id: 'ready', label: 'Ready' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'cancelled', label: 'Cancelled' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setOrdersFilters(prev => ({ ...prev, status: st.id }));
                          setTimeout(() => fetchOwnerOrders(0), 0);
                        }}
                        className={`orders-status-pill ${ordersFilters.status === st.id ? 'active' : ''}`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (statusPillsRef.current) {
                        statusPillsRef.current.scrollBy({ left: 160, behavior: 'smooth' });
                      }
                    }}
                    className="status-pills-scroll-btn"
                    title="More status filters"
                    aria-label="Scroll status filters right"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Inputs & Actions Row */}
                <div className="orders-inputs-row">
                  <div className="orders-search-input" style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search invoice or customer..."
                      value={ordersFilters.search}
                      onChange={(e) => setOrdersFilters(prev => ({ ...prev, search: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') fetchOwnerOrders(0);
                      }}
                      style={{ paddingLeft: '36px', paddingRight: ordersFilters.search ? '32px' : '12px', height: '40px', fontSize: '13px' }}
                    />
                    {ordersFilters.search && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrdersFilters(prev => ({ ...prev, search: '' }));
                          setTimeout(() => fetchOwnerOrders(0), 0);
                        }}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="orders-table-input">
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Table No"
                      value={ordersFilters.tableNo}
                      onChange={(e) => setOrdersFilters(prev => ({ ...prev, tableNo: e.target.value }))}
                      style={{ height: '40px', fontSize: '13px' }}
                    />
                  </div>

                  <div className="orders-date-wrapper">
                    <span className="orders-date-label">FROM:</span>
                    <input
                      type="date"
                      value={ordersFilters.from}
                      onChange={(e) => setOrdersFilters(prev => ({ ...prev, from: e.target.value }))}
                      title="From Date"
                    />
                  </div>

                  <div className="orders-date-wrapper">
                    <span className="orders-date-label">TO:</span>
                    <input
                      type="date"
                      value={ordersFilters.to}
                      onChange={(e) => setOrdersFilters(prev => ({ ...prev, to: e.target.value }))}
                      title="To Date"
                    />
                  </div>

                  <div className="orders-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'nowrap' }}>
                    <button onClick={() => fetchOwnerOrders(0)} className="btn btn-primary" style={{ height: '40px', paddingInline: '16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                      <Filter size={14} />
                      Filter
                    </button>
                    <button
                      onClick={() => {
                        setOrdersFilters({ status: '', search: '', from: '', to: '', tableNo: '' });
                        setTimeout(() => fetchOwnerOrders(0), 0);
                      }}
                      className="btn btn-secondary"
                      style={{ height: '40px', paddingInline: '14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px', whiteSpace: 'nowrap' }}
                      title="Reset Filters"
                    >
                      <RotateCcw size={14} />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

                           {/* DESKTOP CARDS VIEW */}
              <div className="orders-desktop-view">
                {loadingOrders && orders.length === 0 ? (
                  <div className="card" style={{ padding: '24px' }}>
                    <LoadingRows rows={3} height={36} />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="card" style={{ padding: '36px' }}>
                    <EmptyState
                      icon={ShoppingBag}
                      title="No orders found"
                      description="Try adjusting your date range, invoice search, or status filter."
                    />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                      {orders.map((o) => {
                        const dateObj = new Date(o.createdAt);
                        const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                        const status = (o.orderStatus || 'pending').toLowerCase();
                        let badgeClass = 'order-status-pending';
                        let labelStr = 'PENDING';

                        if (status === 'completed') {
                          badgeClass = 'order-status-completed';
                          labelStr = 'COMPLETED';
                        } else if (status === 'preparing') {
                          badgeClass = 'order-status-preparing';
                          labelStr = 'PREPARING';
                        } else if (status === 'ready') {
                          badgeClass = 'order-status-ready';
                          labelStr = 'READY';
                        } else if (status === 'accepted') {
                          badgeClass = 'order-status-preparing';
                          labelStr = 'ACCEPTED';
                        } else if (status === 'cancelled') {
                          badgeClass = 'order-status-cancelled';
                          labelStr = 'CANCELLED';
                        }

                        const itemsPreview = Array.isArray(o.ordersInfo) ? o.ordersInfo : [];
                        const displayItems = itemsPreview.slice(0, 3);
                        const remainingCount = itemsPreview.length - displayItems.length;

                        return (
                          <div
                            key={o.ordersId}
                            className="card pc-order-card"
                            style={{
                              padding: '20px',
                              borderRadius: '20px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                              position: 'relative',
                              transition: 'all 0.25s ease',
                              border: '1px solid var(--color-border)',
                              background: 'var(--color-surface)',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
                            }}
                          >
                            {/* Header Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-primary)' }}>
                                  #{o.invoiceNo || `ORD-${o.dailyOrderNo || 'N/A'}`}
                                </span>
                                <span style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>
                                  Table {o.tableNo}
                                </span>
                              </div>
                              <span className={`order-badge-status ${badgeClass}`}>
                                {labelStr}
                              </span>
                            </div>

                            {/* Date, Time & Customer Info */}
                            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--color-bg-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-text)' }}>
                                  <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
                                  <span>{formattedDate}</span>
                                  <span style={{ color: 'var(--color-text-muted)', marginInline: '2px' }}>·</span>
                                  <Clock size={13} style={{ color: 'var(--color-primary)' }} />
                                  <span>{formattedTime}</span>
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{o.waiter?.waiterName ? `Waiter: ${o.waiter.waiterName}` : 'Self-Order'}</span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', paddingTop: '2px' }}>
                                <span style={{ fontWeight: '700', color: 'var(--color-text)' }}>
                                  {o.customer?.name || 'Walk-in Customer'}
                                </span>
                                {o.customer?.mobile && (
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                                    {o.customer.mobile}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Dishes Preview */}
                            {displayItems.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>ORDERED ITEMS ({itemsPreview.length})</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                                  {displayItems.map((item, i) => (
                                    <span key={i} style={{ padding: '3px 8px', borderRadius: '6px', background: 'var(--color-bg-muted)', fontSize: '11.5px', fontWeight: '600', color: 'var(--color-text)' }}>
                                      {item.quantity || 1}x {item.dishName || item.name || 'Dish'}
                                    </span>
                                  ))}
                                  {remainingCount > 0 && (
                                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 107, 53, 0.1)', fontSize: '11.5px', fontWeight: '700', color: 'var(--color-primary)' }}>
                                      +{remainingCount} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Footer Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                              <div>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10.5px',
                                  fontWeight: '800',
                                  background: o.isPaymentCompleted ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                                  color: o.isPaymentCompleted ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>
                                  {o.isPaymentCompleted ? `PAID (${o.paymentMethod || 'Online'})` : 'UNPAID'}
                                </span>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-text)', marginTop: '4px' }}>
                                  ₹{(o.finalAmount || o.totalAmount || 0).toFixed(2)}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setShowOrderModal(true);
                                }}
                                className="btn btn-primary"
                                style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Eye size={14} />
                                Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {orders.length < ordersTotal && (
                      <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <button
                          onClick={() => fetchOwnerOrders(ordersOffset + ordersLimit)}
                          className="btn btn-secondary"
                          disabled={loadingOrders}
                          style={{ padding: '10px 24px', fontSize: '13px', borderRadius: '12px' }}
                        >
                          {loadingOrders ? 'Loading Orders...' : `Load More Orders (${orders.length} of ${ordersTotal})`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="orders-mobile-view">
                {loadingOrders && orders.length === 0 ? (
                  <div className="card" style={{ padding: '24px' }}><LoadingRows rows={3} height={36} /></div>
                ) : orders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="No orders found"
                    description="Try adjusting your search or filters."
                  />
                ) : (
                  orders.map((o) => {
                    const dateObj = new Date(o.createdAt);
                    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                    const status = (o.orderStatus || 'pending').toLowerCase();
                    let badgeClass = 'order-status-pending';
                    let labelStr = 'PENDING';

                    if (status === 'completed') {
                      badgeClass = 'order-status-completed';
                      labelStr = 'COMPLETED';
                    } else if (status === 'preparing') {
                      badgeClass = 'order-status-preparing';
                      labelStr = 'PREPARING';
                    } else if (status === 'ready') {
                      badgeClass = 'order-status-ready';
                      labelStr = 'READY';
                    } else if (status === 'accepted') {
                      badgeClass = 'order-status-preparing';
                      labelStr = 'ACCEPTED';
                    } else if (status === 'cancelled') {
                      badgeClass = 'order-status-cancelled';
                      labelStr = 'CANCELLED';
                    }

                    return (
                      <div key={o.ordersId} className="card order-card-item" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>
                            Table {o.tableNo}
                          </span>
                          <span className={`order-badge-status ${badgeClass}`}>
                            {labelStr}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-primary)' }}>
                              #{o.invoiceNo || `ORD-${o.dailyOrderNo || 'N/A'}`}
                            </span>
                            <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                              {formattedTime} ({formattedDate}) · {o.customer?.name || 'Walk-in Customer'}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text)' }}>
                              ₹{(o.finalAmount || o.totalAmount || 0).toFixed(2)}
                            </span>
                            <div style={{ marginTop: '2px' }}>
                              <span style={{ fontSize: '10px', fontWeight: '800', color: o.isPaymentCompleted ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                {o.isPaymentCompleted ? 'PAID' : 'UNPAID'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setShowOrderModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ width: '100%', padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '12px' }}
                        >
                          <Eye size={15} />
                          View Full Bill & Order Details
                        </button>
                      </div>
                    );
                  })
                )}

                {orders.length < ordersTotal && (
                  <button
                    onClick={() => fetchOwnerOrders(ordersOffset + ordersLimit)}
                    className="btn btn-secondary"
                    disabled={loadingOrders}
                    style={{ width: '100%', padding: '12px', fontSize: '13px', borderRadius: '14px', marginTop: '8px' }}
                  >
                    {loadingOrders ? 'Loading Orders...' : `Load More (${orders.length} of ${ordersTotal})`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}

          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <SectionHeader
                title="Customer Feedback & Reviews"
                description="Read customer ratings, comments, and linked bills."
              />

              {/* REVIEW SUMMARY BANNER */}
              <div className="card" style={{ padding: '24px', borderRadius: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                {/* Left: Big Rating Score */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingRight: '12px' }}>
                  <span style={{ fontSize: '48px', fontWeight: '900', color: 'var(--color-text)', lineHeight: '1' }}>
                    {reviewSummary?.avgRating ? reviewSummary.avgRating.toFixed(1) : '0.0'}
                  </span>
                  <div style={{ display: 'flex', gap: '3px', margin: '8px 0 4px 0' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={star <= Math.round(reviewSummary?.avgRating || 0) ? '#FFD700' : 'none'}
                        color={star <= Math.round(reviewSummary?.avgRating || 0) ? '#FFD700' : '#CCCCCC'}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                    Based on {reviewSummary?.total || 0} customer ratings
                  </span>
                </div>

                {/* Right: 5-Star Distribution Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewSummary?.counts?.[star] || 0;
                    const total = reviewSummary?.total || 1;
                    const percent = Math.round((count / (total || 1)) * 100);

                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                        <span style={{ fontWeight: '700', width: '45px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-text)' }}>
                          {star} <Star size={12} fill="#FFD700" color="#FFD700" />
                        </span>
                        <div style={{ flex: 1, height: '8px', background: 'var(--color-bg-subtle)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: star >= 4 ? '#2EC4B6' : star === 3 ? '#FF9F1C' : '#E63946', borderRadius: '6px', transition: 'width 0.4s ease' }} />
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--color-text-muted)', width: '60px', textAlign: 'right' }}>
                          {count} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RATING FILTERS BAR */}
              <div className="card" style={{ padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>
                  FILTER RATING:
                </span>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div ref={reviewFilterRef} className="orders-status-pills">
                    {[
                      { id: '', label: 'All Reviews' },
                      { id: '5', label: '5 Stars ★' },
                      { id: '4_below', label: '4 Stars & Below' },
                      { id: '3_below', label: '3 Stars & Below' },
                      { id: '2_below', label: '2 Stars & Below' },
                      { id: '1', label: '1 Star ★' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setReviewRatingFilter(f.id);
                          fetchOwnerReviews(0, f.id);
                        }}
                        className={`orders-status-pill ${reviewRatingFilter === f.id ? 'active' : ''}`}
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '10px' }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (reviewFilterRef.current) {
                        reviewFilterRef.current.scrollBy({ left: 140, behavior: 'smooth' });
                      }
                    }}
                    className="status-pills-scroll-btn"
                    title="More rating filters"
                    aria-label="Scroll rating filters right"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                {loadingReviews && reviews.length === 0 ? (
                  <div className="card" style={{ gridColumn: '1 / -1', padding: '40px' }}><LoadingRows rows={3} height={24} /></div>
                ) : reviews.length === 0 ? (
                  <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <EmptyState
                      icon={Star}
                      title="No reviews yet"
                      description="Customer ratings will appear here after feedback is submitted from the checkout flow."
                    />
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.feedbackId} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--color-border)', borderRadius: '16px', boxSizing: 'border-box', maxWidth: '100%', overflowX: 'hidden' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
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
                      <div style={{ fontSize: '13.5px', color: 'var(--color-text)', fontStyle: r.comment ? 'normal' : 'italic', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        {r.comment ? `"${r.comment}"` : 'No comment provided.'}
                      </div>

                      <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '12px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Customer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Customer Mobile</span>
                          <span style={{ fontWeight: '600' }}>{r.mobile || 'N/A'}</span>
                        </div>

                        {/* Linked Order */}
                        {r.orders ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap', gap: '6px', paddingTop: '2px' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>
                              Order #{r.orders.invoiceNo || `ORD-${r.orders.dailyOrderNo || 'N/A'}`} (T-{r.orders.tableNo})
                            </span>
                            <button
                              onClick={() => {
                                setSelectedOrder(r.orders);
                                setShowOrderModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={13} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <SectionHeader
                title="System Settings"
                description="Review account details, theme controls, and restaurant logo settings."
              />
              
              <div className="card" style={{ maxWidth: '680px', width: '100%', padding: '24px', borderRadius: '20px', boxSizing: 'border-box', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
                  <Info size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Account Information</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="settings-option">
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '13.5px', margin: 0 }}>Owner Name</p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '12.5px', margin: '2px 0 0 0' }}>{owner?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="settings-option">
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '13.5px', margin: 0 }}>Registered Email</p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '12.5px', margin: '2px 0 0 0', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{owner?.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="settings-option">
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '13.5px', margin: 0 }}>Mobile Number</p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '12.5px', margin: '2px 0 0 0' }}>{owner?.mobile || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '28px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
                  <SettingsIcon size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Theme Preference</h3>
                </div>

                <div className="settings-option" style={{ padding: '14px' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <p style={{ fontWeight: '700', fontSize: '13.5px', margin: 0 }}>Interface Theme</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '2px 0 0 0' }}>Toggle between Light and Dark interface colors.</p>
                  </div>
                  <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    Theme: {theme.toUpperCase()}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '28px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
                  <Store size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Restaurant Logo</h3>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <CustomFileUpload
                    label="Upload Restaurant Logo"
                    previewUrl={restaurant?.logoUrl}
                    maxSizeMB={2}
                    disabled={actionLoading}
                    onFileSelect={(file) => {
                      const syntheticEvent = { target: { files: [file] } };
                      handleLogoSelect(syntheticEvent);
                    }}
                  />
                </div>

              </div>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================================
         MODALS & DIA      {/* Menu Dish Modal */}
      {showMenuModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '560px', width: 'min(560px, calc(100vw - 24px))', maxHeight: '82vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 className="dialog-title" style={{ margin: 0, fontSize: '18px' }}>{selectedMenuDish ? 'Edit Dish Details' : 'Add New Dish'}</h3>
              <button onClick={() => { setShowMenuModal(false); setFormError(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>
            {formError && <div className="auth-error" style={{ marginBottom: '12px' }}>{formError}</div>}
            
            <form onSubmit={handleSaveMenuDish} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>DISH NAME *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={dishForm.dishName}
                    onChange={(e) => handleDishFormChange('dishName', e.target.value)}
                    placeholder="e.g. Paneer Butter Masala"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>PRICE (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={dishForm.price}
                    onChange={(e) => handleDishFormChange('price', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>CATEGORY *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <select
                      className="form-input"
                      value={isCustomCategory ? '__CUSTOM__' : dishForm.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setIsCustomCategory(true);
                          handleDishFormChange('category', '');
                        } else {
                          setIsCustomCategory(false);
                          handleDishFormChange('category', val);
                        }
                      }}
                      required={!isCustomCategory}
                    >
                      <option value="" disabled>-- Select Category --</option>
                      {Array.from(new Set([...DEFAULT_DISH_CATEGORIES, ...menuCategories, ...(dishForm.category && !isCustomCategory ? [dishForm.category] : [])])).filter(Boolean).map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                      <option value="__CUSTOM__">+ Add Custom Category...</option>
                    </select>

                    {isCustomCategory && (
                      <input
                        type="text"
                        className="form-input"
                        value={dishForm.category}
                        onChange={(e) => handleDishFormChange('category', e.target.value)}
                        placeholder="Type new category name..."
                        autoFocus
                        required
                      />
                    )}
                  </div>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>PREPARATION TIME (MINS)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={dishForm.preparationTime}
                    onChange={(e) => handleDishFormChange('preparationTime', e.target.value)}
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>STATUS & DIETARY</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', fontWeight: '700', color: 'var(--color-text)', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '8px', border: '1px solid var(--color-border)', flex: '1 1 120px', minWidth: 0, boxSizing: 'border-box' }}>
                    <input
                      type="checkbox"
                      checked={dishForm.isVegetarian}
                      onChange={(e) => handleDishFormChange('isVegetarian', e.target.checked)}
                      style={{ width: '15px', height: '15px', accentColor: 'var(--color-success)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>VEGETARIAN</span>
                  </label>
                  
                  <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', fontWeight: '700', color: 'var(--color-text)', padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '8px', border: '1px solid var(--color-border)', flex: '1 1 120px', minWidth: 0, boxSizing: 'border-box' }}>
                    <input
                      type="checkbox"
                      checked={dishForm.isAvailable}
                      onChange={(e) => handleDishFormChange('isAvailable', e.target.checked)}
                      style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AVAILABLE</span>
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
                <div style={{ marginTop: '6px' }}>
                  <CustomFileUpload
                    label="Upload Dish Photo"
                    previewUrl={dishForm.imagePreview}
                    maxSizeMB={2}
                    disabled={actionLoading}
                    onFileSelect={(file) => {
                      const syntheticEvent = { target: { files: [file] } };
                      handleDishImageSelect(syntheticEvent);
                    }}
                  />
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
                <div style={{ position: 'relative' }}>
                  <input type={showStaffPwd ? 'text' : 'password'} className="form-input" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required style={{ paddingRight: '40px' }} />
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowStaffPwd(v => !v); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}>
                    {showStaffPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                <div style={{ position: 'relative' }}>
                  <input type={showResetStaffPwd ? 'text' : 'password'} className="form-input" value={resetPasswordVal} onChange={(e) => setResetPasswordVal(e.target.value)} required style={{ paddingRight: '40px' }} />
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowResetStaffPwd(v => !v); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}>
                    {showResetStaffPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
          <div className="dialog" style={{ maxWidth: '500px', width: '92vw', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Log New Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>AMOUNT * (₹)</label>
                <input type="number" step="0.01" className="form-input" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
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

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>PAYMENT MODE</label>
                  <select className="form-input" value={expensePaymentMode} onChange={(e) => setExpensePaymentMode(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>DESCRIPTION / REMARKS</label>
                <textarea className="form-input" rows="2" value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} placeholder="Enter details or notes..." />
              </div>

              <div className="dialog-actions" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary" style={{ borderRadius: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px' }} disabled={actionLoading}>Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HSN Modal */}
      {showHsnModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '480px', width: '92vw', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Configure HSN: {selectedDish?.dishName}</h3>
              <button onClick={() => setShowHsnModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleSaveHsnCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>HSN / SAC CODE *</label>
                <input type="text" className="form-input" value={menuItemHsn} onChange={(e) => setMenuItemHsn(e.target.value)} placeholder="e.g. 996311" required />
              </div>

              <div className="dialog-actions" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setShowHsnModal(false)} className="btn btn-secondary" style={{ borderRadius: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px' }} disabled={actionLoading}>Update HSN</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Vendor Add/Edit Modal */}
      {showVendorModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '560px', width: '92vw', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>{selectedVendor ? 'Edit Supplier' : 'Add Supplier Vendor'}</h3>
              <button onClick={() => setShowVendorModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleSaveVendor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>SUPPLIER NAME *</label>
                <input type="text" className="form-input" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Fresh Foods Wholesalers" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>MOBILE NUMBER</label>
                  <input type="text" className="form-input" value={vendorMobile} onChange={(e) => setVendorMobile(e.target.value)} placeholder="e.g. 9876543210" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>EMAIL ADDRESS</label>
                  <input type="email" className="form-input" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} placeholder="e.g. vendor@supplier.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>GSTIN</label>
                  <input type="text" className="form-input" placeholder="e.g. 07AAAAA1111A1Z1" value={vendorGstin} onChange={(e) => setVendorGstin(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>PAYMENT TERMS</label>
                  <input type="text" className="form-input" placeholder="e.g. Net 30, COD" value={vendorPaymentTerms} onChange={(e) => setVendorPaymentTerms(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>STREET ADDRESS</label>
                <textarea className="form-input" rows="2" value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} placeholder="Enter business address..." />
              </div>

              <div className="dialog-actions" style={{ marginTop: '12px' }}>
                <button type="button" onClick={() => setShowVendorModal(false)} className="btn btn-secondary" style={{ borderRadius: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px' }} disabled={actionLoading}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>

      )}

      {/* Stock Item Add/Edit Modal */}
      {showItemModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '540px', width: '92vw', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>{selectedItem ? 'Edit Stock Item' : 'Add Stock Item'}</h3>
              <button onClick={() => setShowItemModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>STOCK ITEM NAME *</label>
                <input type="text" className="form-input" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Milk, Raw Chicken, Basmati Rice" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>MEASUREMENT UNIT *</label>
                  <select className="form-input" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)}>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="litre">litre (Litre)</option>
                    <option value="piece">piece (Piece)</option>
                    <option value="packet">packet (Packet)</option>
                    <option value="dozen">dozen (Dozen)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
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
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>REORDER ALERT LEVEL *</label>
                <input type="number" step="0.01" className="form-input" value={itemReorderLevel} onChange={(e) => setItemReorderLevel(e.target.value)} placeholder="Threshold quantity to trigger warning" required />
              </div>
              
              {!selectedItem && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>INITIAL STOCK *</label>
                    <input type="number" step="0.01" className="form-input" value={itemCurrentStock} onChange={(e) => setItemCurrentStock(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>COST PER UNIT * (₹)</label>
                    <input type="number" step="0.01" className="form-input" value={itemCostPerUnit} onChange={(e) => setItemCostPerUnit(e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="dialog-actions" style={{ marginTop: '12px' }}>
                <button type="button" onClick={() => setShowItemModal(false)} className="btn btn-secondary" style={{ borderRadius: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px' }} disabled={actionLoading}>Save Stock Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe / BOM mapping Editor Modal */}
      {showRecipeModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '580px', width: '92vw', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Recipe BOM: {selectedDish?.dishName}</h3>
              <button onClick={() => setShowRecipeModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Map the ingredients and standard consumption portions for 1 yield portion of this dish.
            </p>

            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}
            
            <form onSubmit={handleSaveRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: 0 }}>
                <label style={{ margin: 0 }}>RECIPE YIELD PORTION(S):</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ width: '90px' }} 
                  value={recipeYield} 
                  onChange={(e) => setRecipeYield(e.target.value)} 
                  min="1" 
                  required 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: '700', fontSize: '13px' }}>INGREDIENT LIST</label>
                  <button type="button" onClick={handleAddRecipeIngredient} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}>
                    + Add Ingredient
                  </button>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--color-bg-subtle)' }}>
                  {recipeIngredients.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px', margin: 0 }}>No ingredients mapped yet.</p>
                  ) : (
                    recipeIngredients.map((ing, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', padding: '8px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                        <select 
                          className="form-input" 
                          style={{ flex: '1 1 180px', minWidth: '150px' }}
                          value={ing.itemId} 
                          onChange={(e) => handleRecipeIngChange(idx, 'itemId', e.target.value)}
                          required
                        >
                          <option value="">-- Select Ingredient --</option>
                          {inventoryItems.map(item => (
                            <option key={item.itemId} value={item.itemId}>{item.name} ({item.unit})</option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
                          <input 
                            type="number" 
                            step="0.001" 
                            placeholder="Qty" 
                            className="form-input" 
                            style={{ width: '85px' }}
                            value={ing.quantity}
                            onChange={(e) => handleRecipeIngChange(idx, 'quantity', e.target.value)}
                            required
                          />

                          <span style={{ fontSize: '12.5px', minWidth: '40px', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                            {ing.unit || '-'}
                          </span>

                          <button type="button" onClick={() => handleRemoveRecipeIngredient(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '6px' }} title="Remove ingredient">
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="dialog-actions" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setShowRecipeModal(false)} className="btn btn-secondary" style={{ borderRadius: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px' }} disabled={actionLoading}>Save Recipe BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Invoice Logging Modal */}
      {showPurchaseModal && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '680px', width: '92vw', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="dialog-title" style={{ margin: 0 }}>Log Supplier Purchase Invoice</h3>
              <button onClick={() => setShowPurchaseModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            
            {formError && <div className="auth-error" style={{ marginBottom: '16px' }}>{formError}</div>}
            
            <form onSubmit={handleSavePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>SUPPLIER VENDOR</label>
                  <select className="form-input" value={purchaseVendorId} onChange={(e) => setPurchaseVendorId(e.target.value)}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.vendorId} value={v.vendorId}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>INVOICE NO / REF</label>
                  <input type="text" className="form-input" placeholder="e.g. INV-2026-981" value={purchaseInvoiceNo} onChange={(e) => setPurchaseInvoiceNo(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>PURCHASE DATE *</label>
                  <input type="date" className="form-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>PAYMENT STATUS</label>
                  <select className="form-input" value={purchasePaymentStatus} onChange={(e) => setPurchasePaymentStatus(e.target.value)}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Fully Paid</option>
                    <option value="partial">Partially Paid</option>
                  </select>
                </div>
              </div>

              {/* Purchase items list */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: '700', fontSize: '13px' }}>PURCHASED ITEMS</label>
                  <button type="button" onClick={handleAddPurchaseRow} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}>
                    + Add Row
                  </button>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--color-bg-subtle)' }}>
                  {purchaseItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', padding: '8px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                      <select 
                        className="form-input" 
                        style={{ flex: '1 1 180px', minWidth: '140px' }}
                        value={item.itemId} 
                        onChange={(e) => handlePurchaseRowChange(idx, 'itemId', e.target.value)}
                        required
                      >
                        <option value="">-- Select Item --</option>
                        {inventoryItems.map(inv => (
                          <option key={inv.itemId} value={inv.itemId}>{inv.name} ({inv.unit})</option>
                        ))}
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="Qty" 
                          className="form-input" 
                          style={{ width: '75px' }}
                          value={item.quantity}
                          onChange={(e) => handlePurchaseRowChange(idx, 'quantity', e.target.value)}
                          required
                        />

                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="Price (₹)" 
                          className="form-input" 
                          style={{ width: '90px' }}
                          value={item.unitPrice}
                          onChange={(e) => handlePurchaseRowChange(idx, 'unitPrice', e.target.value)}
                          required
                        />

                        <span style={{ fontSize: '12.5px', fontWeight: '700', minWidth: '60px', textAlign: 'right' }}>
                          ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                        </span>

                        <button type="button" onClick={() => handleRemovePurchaseRow(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '6px' }} title="Remove item">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>INVOICE TOTAL:</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', marginLeft: '8px', color: 'var(--color-primary)' }}>₹{calculatePurchaseTotal().toFixed(2)}</span>
                </div>
                <div className="dialog-actions">
                  <button type="button" onClick={() => setShowPurchaseModal(false)} className="btn btn-secondary" style={{ borderRadius: '12px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px' }} disabled={actionLoading}>Save Purchase Order</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal Overlay */}
      {showOrderModal && selectedOrder && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ maxWidth: '680px', width: '92vw', padding: '0', overflow: 'hidden', borderRadius: '20px' }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              background: 'var(--color-bg-subtle)'
            }}>
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 className="dialog-title" style={{ margin: 0, fontSize: '18px', wordBreak: 'break-word' }}>
                    #{selectedOrder.invoiceNo || `ORD-${selectedOrder.dailyOrderNo || 'N/A'}`}
                  </h3>
                  <span className={`order-badge-status order-status-${(selectedOrder.orderStatus || 'pending').toLowerCase()}`}>
                    {(selectedOrder.orderStatus || 'PENDING').toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>

              <button
                onClick={() => { setShowOrderModal(false); setSelectedOrder(null); }}
                style={{
                  flexShrink: 0,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>


            {/* Modal Body */}
            <div style={{ padding: '24px', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Cancellation Reason Alert Box */}
              {(selectedOrder.orderStatus?.toLowerCase() === 'cancelled' || selectedOrder.cancellationReason || selectedOrder.cancelReason || selectedOrder.cancellation_reason) && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(230, 57, 70, 0.08)',
                  border: '1px solid rgba(230, 57, 70, 0.3)',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️</span> CANCELLATION REASON (STAFF NOTE)
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-text)', lineHeight: '1.4' }}>
                    {selectedOrder.cancellationReason || selectedOrder.cancelReason || selectedOrder.cancellation_reason || selectedOrder.remarks || 'No specific cancellation reason recorded.'}
                  </span>
                </div>
              )}

              {/* Responsive Details Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <div style={{ padding: '12px 16px', background: 'var(--color-bg-subtle)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>TABLE & ORDER NO</span>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>Table {selectedOrder.tableNo || 'N/A'} · Token #{selectedOrder.dailyOrderNo || 'N/A'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--color-bg-subtle)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>CUSTOMER INFO</span>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>{selectedOrder.customer?.name || 'Walk-in Customer'}</span>
                  {selectedOrder.customer?.mobile && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>{selectedOrder.customer.mobile}</span>
                  )}
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--color-bg-subtle)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>SERVER / WAITER</span>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>{selectedOrder.waiter?.waiterName || 'Self-Order / Digital Menu'}</span>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--color-bg-subtle)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>PAYMENT STATUS</span>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    background: selectedOrder.isPaymentCompleted ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.15)',
                    color: selectedOrder.isPaymentCompleted ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {selectedOrder.isPaymentCompleted ? `PAID (${selectedOrder.paymentMethod || 'Online'})` : 'UNPAID'}
                  </span>
                </div>
              </div>

              {/* Ordered Dishes Section */}
              <div>
                <h4 style={{ fontWeight: '800', marginBottom: '10px', fontSize: '12px', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>ORDERED DISHES</h4>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Item</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', width: '60px' }}>Qty</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', width: '90px' }}>Price</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', width: '90px' }}>Total</th>
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
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: '700', color: 'var(--color-text)' }}>{item.dishName || item.name || 'Dish'}</div>
                              {item.remarks && <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '2px' }}>* {item.remarks}</div>}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700' }}>{item.quantity}</td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--color-text-muted)' }}>₹{parseFloat(item.price || 0).toFixed(2)}</td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: 'var(--color-text)' }}>₹{(item.quantity * parseFloat(item.price || 0)).toFixed(2)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div style={{
                background: 'var(--color-bg-subtle)',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginLeft: 'auto',
                width: '100%',
                maxWidth: '340px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Subtotal:</span>
                  <span style={{ fontWeight: '600' }}>₹{parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
                {(() => {
                  const discountVal = parseFloat(selectedOrder.discountAmount || selectedOrder.discount || selectedOrder.discount_amount || 0) || 
                    ((parseFloat(selectedOrder.totalAmount || 0) > 0 && parseFloat(selectedOrder.finalAmount || 0) > 0 && (parseFloat(selectedOrder.totalAmount || 0) + parseFloat(selectedOrder.gstAmount || 0) - parseFloat(selectedOrder.finalAmount || 0)) > 0.01)
                      ? (parseFloat(selectedOrder.totalAmount || 0) + parseFloat(selectedOrder.gstAmount || 0) - parseFloat(selectedOrder.finalAmount || 0))
                      : 0);
                  
                  if (discountVal <= 0) return null;

                  const coupon = selectedOrder.couponCode || selectedOrder.coupon_code;
                  const percent = selectedOrder.discountPercent || selectedOrder.discount_percent;
                  const discountLabel = coupon 
                    ? `Discount (${coupon})`
                    : percent
                      ? `Discount (${percent}%)`
                      : 'Discount';

                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '2px 0' }}>
                      <span style={{ color: 'var(--color-danger)', fontWeight: '600' }}>{discountLabel}:</span>
                      <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>-₹{discountVal.toFixed(2)}</span>
                    </div>
                  );
                })()}
                {parseFloat(selectedOrder.gstAmount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>GST & Taxes:</span>
                    <span style={{ fontWeight: '600' }}>₹{parseFloat(selectedOrder.gstAmount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '8px',
                  marginTop: '4px',
                  fontSize: '16px',
                  fontWeight: '800'
                }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>₹{(selectedOrder.finalAmount || selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-subtle)',
              display: 'flex',
              gap: '12px',
              justify: 'flex-end',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => handleViewOrderPdf(selectedOrder.ordersId, selectedOrder.invoiceNo)}
                className="btn btn-primary"
                disabled={loadingPdf}
                style={{
                  padding: '11px 22px',
                  fontSize: '13px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '8px',
                  flex: '1 1 auto',
                  maxWidth: '220px'
                }}
              >
                <FileText size={16} />
                {loadingPdf ? 'Generating PDF...' : 'View Invoice PDF'}
              </button>

              <button
                type="button"
                onClick={() => { setShowOrderModal(false); setSelectedOrder(null); }}
                className="btn btn-secondary"
                style={{
                  padding: '11px 22px',
                  fontSize: '13px',
                  borderRadius: '12px',
                  flex: '1 1 auto',
                  maxWidth: '140px',
                  textAlign: 'center'
                }}
              >
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
