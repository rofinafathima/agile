import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  // If headers already has Authorization, keep it
  if (!config.headers.Authorization) {
    // If request is for pharmacy portal, prefer pharmacy_token
    if (config.url?.includes('/pharmacies/portal')) {
      const pharmacyToken = localStorage.getItem('pharmacy_token');
      if (pharmacyToken) {
        config.headers.Authorization = `Bearer ${pharmacyToken}`;
      }
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith('/pharmacy')) {
        if (!path.includes('/login')) {
          localStorage.removeItem('pharmacy_token');
          localStorage.removeItem('pharmacy_user');
          window.location.href = '/pharmacy/login';
        }
      } else {
        // Customer / Admin flow
        if (!path.includes('/login') && !path.includes('/signup')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Medicines
export const medicinesAPI = {
  getAll: (params) => api.get('/medicines', { params }),
  getById: (id) => api.get(`/medicines/${id}`),
  search: (q) => api.get('/medicines/search', { params: { q } }),
  getBrands: () => api.get('/medicines/brands'),
  getManufacturers: () => api.get('/medicines/manufacturers'),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
};

// Cart
export const cartAPI = {
  get: () => api.get('/cart'),
  getCount: () => api.get('/cart/count'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (id, data) => api.put(`/cart/items/${id}`, data),
  removeItem: (id) => api.delete(`/cart/items/${id}`),
  clear: () => api.delete('/cart/clear'),
};

// Addresses
export const addressesAPI = {
  getAll: () => api.get('/addresses'),
  add: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
};

// Prescriptions
export const prescriptionsAPI = {
  upload: (formData) => api.post('/prescriptions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: () => api.get('/prescriptions'),
  getById: (id) => api.get(`/prescriptions/${id}`),
};

// Orders
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id, data) => api.put(`/orders/${id}/cancel`, data),
  reorder: (id) => api.post(`/orders/${id}/reorder`),
};

// Payments
export const paymentsAPI = {
  create: (data) => api.post('/payments/create', data),
  verify: (data) => api.post('/payments/verify', data),
  simulate: (data) => api.post('/payments/simulate', data),
};

// Notifications
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),

  // Medicines
  addMedicine: (data) => api.post('/admin/medicines', data),
  updateMedicine: (id, data) => api.put(`/admin/medicines/${id}`, data),
  deleteMedicine: (id) => api.delete(`/admin/medicines/${id}`),

  // Inventory
  getInventory: (params) => api.get('/admin/inventory', { params }),
  updateStock: (data) => api.put('/admin/inventory/update', data),
  getStockHistory: (id) => api.get(`/admin/inventory/${id}/history`),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),

  // Prescriptions
  getPrescriptions: (params) => api.get('/admin/prescriptions', { params }),
  updatePrescription: (id, data) => api.put(`/admin/prescriptions/${id}`, data),

  // Users
  getUsers: () => api.get('/admin/users'),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),

  // Payments
  getPayments: () => api.get('/admin/payments'),

  // Categories
  addCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
};

// Pharmacies (public listing)
export const pharmaciesAPI = {
  getAll: (params) => api.get('/pharmacies', { params }),
};

// Pharmacy Portal (pharmacy staff login)
export const pharmacyPortalAPI = {
  getMe: () => api.get('/pharmacies/portal/me'),
  getDashboard: () => api.get('/pharmacies/portal/dashboard'),
  getOrders: (params) => api.get('/pharmacies/portal/orders', { params }),
  getOrderById: (id) => api.get(`/pharmacies/portal/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/pharmacies/portal/orders/${id}/status`, data),
  assignPharmacy: (data) => api.post('/pharmacies/assign', data),
  autoAssign: (data) => api.post('/pharmacies/auto-assign', data),
};

export default api;
