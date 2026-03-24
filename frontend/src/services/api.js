import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: false,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Session expired
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Extract a user-friendly error message
    const data = err.response?.data;
    const message = data?.message || data?.error || 'Une erreur est survenue.';
    
    // Attach it to the error object for easier access
    err.friendlyMessage = message;
    
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authService = {
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  updateProfile: (data) => api.put('/profile', data),
};

// ── Demandes ──────────────────────────────────────────
export const demandeService = {
  list: (params) => api.get('/demandes', { params }),
  get: (id) => api.get(`/demandes/${id}`),
  create: (data) => api.post('/demandes', data),
  update: (id, data) => api.put(`/demandes/${id}`, data),
  cancel: (id) => api.delete(`/demandes/${id}`),
  traiter: (id, data) => api.put(`/demandes/${id}/traiter`, data),
  stats: () => api.get('/demandes/statistiques'),
  pdfUrl: (id) => `/api/demandes/${id}/pdf`,
  exportPdf: (id) => api.get(`/demandes/${id}/pdf`, { responseType: 'blob' }),
  archiver: () => api.post('/demandes/archiver'),
};

// ── Users (Admin) ─────────────────────────────────────
export const userService = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
  managers: () => api.get('/managers'),
};

// ── Notifications ─────────────────────────────────────
export const notifService = {
  list: (params) => api.get('/notifications', { params }),
  nonLues: () => api.get('/notifications/non-lues'),
  marquerLue: (id) => api.put(`/notifications/${id}/lue`),
  marquerToutesLues: () => api.put('/notifications/toutes-lues'),
};

export default api;
