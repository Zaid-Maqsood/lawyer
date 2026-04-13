import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lexai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lexai_token');
      localStorage.removeItem('lexai_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  getAllUsers: () => api.get('/auth/users')
};

// Cases
export const casesAPI = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  delete: (id) => api.delete(`/cases/${id}`),
  addTimeline: (id, data) => api.post(`/cases/${id}/timeline`, data)
};

// Documents
export const documentsAPI = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' })
};

// Clients
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`)
};

// Billing
export const billingAPI = {
  getTimeLogs: (params) => api.get('/billing/timelogs', { params }),
  createTimeLog: (data) => api.post('/billing/timelogs', data),
  updateTimeLog: (id, data) => api.put(`/billing/timelogs/${id}`, data),
  deleteTimeLog: (id) => api.delete(`/billing/timelogs/${id}`),
  getInvoices: (params) => api.get('/billing/invoices', { params }),
  getInvoiceById: (id) => api.get(`/billing/invoices/${id}`),
  createInvoice: (data) => api.post('/billing/invoices', data),
  updateInvoiceStatus: (id, data) => api.put(`/billing/invoices/${id}/status`, data)
};

// AI
export const aiAPI = {
  summarize: (documentId) => api.post(`/ai/summarize/${documentId}`),
  extractClauses: (documentId) => api.post(`/ai/clauses/${documentId}`),
  askQuestion: (documentId, data) => api.post(`/ai/ask/${documentId}`, data),
  chat: (data) => api.post('/ai/chat', data),
  analyzeCase: (caseId) => api.post(`/ai/analyze-case/${caseId}`)
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCaseAnalytics: () => api.get('/analytics/cases'),
  getBillingAnalytics: () => api.get('/analytics/billing')
};

// Search
export const searchAPI = {
  global: (q) => api.get('/search', { params: { q } })
};

// Templates
export const templatesAPI = {
  getAll: (params) => api.get('/templates', { params }),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  fill: (id, data) => api.post(`/templates/${id}/fill`, data)
};

// Messages
export const messagesAPI = {
  getAll: (params) => api.get('/messages', { params }),
  send: (data) => api.post('/messages', data),
  getUnreadCount: () => api.get('/messages/unread')
};
