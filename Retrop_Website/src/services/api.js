// ============================================================================
// API CLIENT SERVICE
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  const token = localStorage.getItem('retrop_portal_token') || localStorage.getItem('retrop_owner_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const selectedRest = sessionStorage.getItem('retrop_selected_restaurant');
  if (selectedRest) {
    headers['X-Restaurant-Id'] = selectedRest;
    headers['X-Product-Key'] = selectedRest;
  }
  return headers;
};




const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  if (data && data.status === 'success' && data.success === undefined) {
    data.success = true;
  }
  return data;
};

export const api = {
  // Auth
  login: async (loginIdentifier, password) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ loginIdentifier, password }),
    });
    return handleResponse(response);
  },

  resetPassword: async (ownerId, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ownerId, newPassword }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    }).catch(() => ({ ok: true })); // Safe fallback if server is down
    localStorage.removeItem('retrop_owner_token');
    return response.ok ? { success: true } : handleResponse(response);
  },

  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Dashboard
  getDashboardSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/dashboard/summary`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Managers CRUD
  getManagers: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/managers`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createManager: async (managerData) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/managers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(managerData),
    });
    return handleResponse(response);
  },

  deleteManager: async (adminId) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/managers/${adminId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateManagerPassword: async (adminId, password) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/managers/${adminId}/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  // Inventory: Menu
  getOwnerMenu: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Inventory: Vendors
  getVendors: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/vendors`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createVendor: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/vendors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateVendor: async (vendorId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/vendors/${vendorId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteVendor: async (vendorId) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/vendors/${vendorId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Inventory: Stock Items
  getInventoryItems: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/items`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createInventoryItem: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateInventoryItem: async (itemId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/items/${itemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteInventoryItem: async (itemId) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Inventory: Recipes (BOM)
  getRecipes: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/recipes`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  saveRecipe: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/recipes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteRecipe: async (dishId) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/recipes/${dishId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Inventory: Purchases
  getPurchases: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/purchases`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createPurchase: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/inventory/purchases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Logo Upload
  uploadLogo: async (imageData) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/restaurant/logo`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(imageData),
    });
    return handleResponse(response);
  },

  // GST Compliance (GSTR-1 JSON)
  getGstr1: async (month, year) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/gst/gstr1?month=${month}&year=${year}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // GST Compliance (GSTR-3B JSON)
  getGstr3b: async (month, year) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/gst/gstr3b?month=${month}&year=${year}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Unified Staff CRUD
  getStaff: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/staff`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createStaff: async (staffData) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/staff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(staffData),
    });
    return handleResponse(response);
  },

  deleteStaff: async (type, id) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/staff/${type}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateStaffPassword: async (type, id, password) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/staff/${type}/${id}/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  // Expenses CRUD
  getExpenses: async (date = '') => {
    const response = await fetch(`${API_BASE_URL}/api/owner/expenses${date ? `?date=${date}` : ''}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createExpense: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteExpense: async (expenseId) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Day Close Registers
  getDayClose: async (date = '') => {
    const response = await fetch(`${API_BASE_URL}/api/owner/day-close${date ? `?date=${date}` : ''}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  closeDayRegister: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/day-close`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Owner Menu Management (Menu management CRUD)
  getMenuManagement: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getMenuCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getMenuItem: async (dishId) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management/${dishId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createMenuItem: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateMenuItem: async (dishId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management/${dishId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteMenuItem: async (dishId) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management/${dishId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  toggleMenuItemAvailability: async (dishId, isAvailable) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management/${dishId}/availability`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isAvailable }),
    });
    return handleResponse(response);
  },

  toggleCategoryAvailability: async (category, isAvailable) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management/category/${encodeURIComponent(category)}/availability`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isAvailable }),
    });
    return handleResponse(response);
  },

  uploadDishImage: async (dishId, imageInfo) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management/${dishId}/image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(imageInfo),
    });
    return handleResponse(response);
  },

  deleteDishImage: async (dishId) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/menu-management/${dishId}/image`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Owner Restaurant Settings & Info
  getRestaurantInfo: async () => {
    const response = await fetch(`${API_BASE_URL}/api/owner/restaurant-info`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateRestaurantInfo: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/restaurant-info`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Owner Analytics
  getOwnerAnalytics: async (metrics = '') => {
    const response = await fetch(`${API_BASE_URL}/api/owner/analytics${metrics ? `?metrics=${metrics}` : ''}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Owner Order Management & Reviews
  getOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/owner/orders${queryString}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getReviews: async (limit = 20, offset = 0) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/reviews?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ── Portal Auth (new user system) ─────────────────────────────────────────

  portalRequestSignupOtp: async (name, email) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/signup/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ name, email }),
    });
    return handleResponse(response);
  },

  portalVerifySignupOtp: async (name, email, otp) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/signup/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ name, email, otp }),
    });
    return handleResponse(response);
  },

  portalSetSignupPassword: async (userId, password) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/signup/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ userId, password }),
    });
    return handleResponse(response);
  },

  portalLogin: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  portalGoogleAuth: async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ idToken }),
    });
    return handleResponse(response);
  },

  portalRequestForgotOtp: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/forgot-password/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  portalVerifyForgotOtp: async (email, otp) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/forgot-password/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse(response);
  },

  portalResetPassword: async (resetToken, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ resetToken, newPassword }),
    });
    return handleResponse(response);
  },

  portalLogout: async () => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    }).catch(() => ({ ok: true }));
    return response.ok ? { success: true } : handleResponse(response);
  },

  portalGetMe: async () => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  portalUpdateProfile: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  portalChangePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/portal/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },
};

