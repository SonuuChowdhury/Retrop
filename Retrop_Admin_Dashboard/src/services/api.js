// ============================================================================
// SUPERADMIN API SERVICE
// ============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function request(url, options = {}) {
  const token = localStorage.getItem('retrop_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (response.status === 401 && token && !url.includes('/auth/refresh') && !url.includes('/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/retrop/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: localStorage.getItem('retrop_admin_refresh_token'),
          }),
        });

        const refreshJson = await refreshRes.json();
        if (refreshRes.ok && refreshJson.data?.accessToken) {
          localStorage.setItem('retrop_admin_token', refreshJson.data.accessToken);
          if (refreshJson.data.refreshToken) {
            localStorage.setItem('retrop_admin_refresh_token', refreshJson.data.refreshToken);
          }
          isRefreshing = false;
          onRefreshed(refreshJson.data.accessToken);
        } else {
          // Refresh failed
          localStorage.removeItem('retrop_admin_token');
          localStorage.removeItem('retrop_admin_refresh_token');
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      } catch (err) {
        isRefreshing = false;
        localStorage.removeItem('retrop_admin_token');
        localStorage.removeItem('retrop_admin_refresh_token');
        window.location.href = '/login';
        throw err;
      }
    }

    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        };
        resolve(request(url, options));
      });
    });
  }

  if (!response.ok) {
    const error = new Error(json.message || 'API request failed');
    error.status = response.status;
    error.data = json;
    throw error;
  }

  if (json && json.success !== undefined && json.status === undefined) {
    json.status = json.success ? 'success' : 'error';
  }

  return json;
}

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await request('/api/retrop/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.accessToken) {
      localStorage.setItem('retrop_admin_token', res.data.accessToken);
      localStorage.setItem('retrop_admin_refresh_token', res.data.refreshToken);
    }
    return res;
  },

  logout: async () => {
    try {
      await request('/api/retrop/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('retrop_admin_token');
      localStorage.removeItem('retrop_admin_refresh_token');
    }
  },

  me: () => request('/api/retrop/auth/me'),

  // Dashboard Summary
  getDashboard: () => request('/api/retrop/dashboard'),

  // Restaurants CRUD
  createRestaurant: (data) => request('/api/retrop/restaurants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  listRestaurants: () => request('/api/retrop/restaurants'),

  getRestaurant: (restaurantId) => request(`/api/retrop/restaurants/${restaurantId}`),

  updateRestaurant: (restaurantId, data) => request(`/api/retrop/restaurants/${restaurantId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  toggleRestaurantStatus: (restaurantId) => request(`/api/retrop/restaurants/${restaurantId}/status`, {
    method: 'PATCH',
  }),

  deleteRestaurant: (restaurantId) => request(`/api/retrop/restaurants/${restaurantId}`, {
    method: 'DELETE',
  }),

  // Keys Management
  generateKey: (restaurantId) => request(`/api/retrop/keys/generate/${restaurantId}`, {
    method: 'POST',
  }),

  toggleKey: (keyId) => request(`/api/retrop/keys/${keyId}/toggle`, {
    method: 'PATCH',
  }),

  deleteKey: (keyId) => request(`/api/retrop/keys/${keyId}`, {
    method: 'DELETE',
  }),

  listAllKeys: () => request('/api/retrop/keys'),

  getRestaurantKeys: (restaurantId) => request(`/api/retrop/keys/${restaurantId}`),

  // Restaurant Admin Management
  getRestaurantAdmins: (restaurantId) => request(`/api/retrop/restaurants/${restaurantId}/admins`),
  addRestaurantAdmin: (restaurantId, data) => request(`/api/retrop/restaurants/${restaurantId}/admins`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateRestaurantAdmin: (restaurantId, adminId, data) => request(`/api/retrop/restaurants/${restaurantId}/admins/${adminId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteRestaurantAdmin: (restaurantId, adminId) => request(`/api/retrop/restaurants/${restaurantId}/admins/${adminId}`, {
    method: 'DELETE',
  }),
  mailRestaurantCredentials: (restaurantId) => request(`/api/retrop/restaurants/${restaurantId}/mail-credentials`, {
    method: 'POST',
  }),
  getSetupQrCode: (restaurantId) => request(`/api/retrop/restaurants/${restaurantId}/setup-qrcode`),

  // Retrop Own Business Config
  getBusinessConfig: () => request('/api/retrop/config'),
  updateBusinessConfig: (data) => request('/api/retrop/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Pricing Plans
  listPlans: () => request('/api/retrop/plans'),
  createPlan: (data) => request('/api/retrop/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePlan: (planId, data) => request(`/api/retrop/plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deletePlan: (planId) => request(`/api/retrop/plans/${planId}`, {
    method: 'DELETE',
  }),

  // Transactions & Subscriptions Ledger
  listTransactions: () => request('/api/retrop/transactions'),
  listSubscriptions: () => request('/api/retrop/subscriptions'),
  getInvoiceUrl: (transactionId) => {
    const token = localStorage.getItem('retrop_admin_token');
    return `${BASE_URL}/api/retrop/transactions/${transactionId}/invoice?token=${token}`;
  },
  updateSubscription: (subscriptionId, data) => request(`/api/retrop/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  confirmPayment: (data) => request('/api/retrop/transactions/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Support Tickets
  createSupportTicket: (data) => request('/api/retrop/support-tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Website & Traffic Analytics
  getWebsiteAnalytics: () => request('/api/analytics/summary'),

  // Registered Users & Login Analytics
  getUserAnalytics: () => request('/api/retrop/analytics/users'),
};
