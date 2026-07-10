// ============================================================================
// API CLIENT SERVICE
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  const token = localStorage.getItem('retrop_owner_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
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
};
