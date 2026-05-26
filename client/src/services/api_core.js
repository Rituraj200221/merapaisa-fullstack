import axios from 'axios';

// Connects to Django (Database)
const API_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'https://merapaisa-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
});

// Request Interceptor: Inject JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Token Expiration / Unauthorized
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If 401 and we haven't retried yet
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refresh = localStorage.getItem('refreshToken');
            
            if (refresh) {
                try {
                    const response = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
                    const newAccess = response.data.access;
                    localStorage.setItem('accessToken', newAccess);
                    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh token is expired too, clean up and redirect
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                // Avoid infinite redirect loop if already on login page
                if (!window.location.pathname.includes('/login') && 
                    !window.location.pathname.includes('/register') && 
                    !window.location.pathname.includes('/verify-email') &&
                    !window.location.pathname.includes('/forgot-password') &&
                    !window.location.pathname.includes('/reset-password')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const coreService = {
    // Auth Endpoints
    register: (data) => api.post('/auth/register/', data),
    login: (data) => api.post('/auth/login/', data),
    verifyEmail: (data) => api.post('/auth/verify-email/', data),
    forgotPassword: (data) => api.post('/auth/forgot-password/', data),
    resetPassword: (data) => api.post('/auth/reset-password/', data),
    
    // Financial Data Endpoints
    getLoans: () => api.get('/loans/'),
    createLoan: (data) => api.post('/loans/', data),
    deleteLoan: (id) => api.delete(`/loans/${id}/`),
    
    getDebts: () => api.get('/debts/'),
    createDebt: (data) => api.post('/debts/', data),
    deleteDebt: (id) => api.delete(`/debts/${id}/`),
    
    getAssets: () => api.get('/assets/'),
    createAsset: (data) => api.post('/assets/', data),
    deleteAsset: (id) => api.delete(`/assets/${id}/`),
    
    getTransactions: () => api.get('/transactions/'),
    createTransaction: (data) => api.post('/transactions/', data),
    deleteTransaction: (id) => api.delete(`/transactions/${id}/`),
    
    getEMIPayments: () => api.get('/emi-payments/'),
    createEMIPayment: (data) => api.post('/emi-payments/', data),
    deleteEMIPayment: (id) => api.delete(`/emi-payments/${id}/`),

    getCategories: () => api.get('/categories/'),
    createCategory: (data) => api.post('/categories/', data),
    
    getBudgets: () => api.get('/budgets/'),
    createBudget: (data) => api.post('/budgets/', data),
    deleteBudget: (id) => api.delete(`/budgets/${id}/`),


    // Notifications
    getNotifications: () => api.get('/notifications/'),
    markNotificationRead: (id) => api.patch(`/notifications/${id}/`, { is_read: true }),
    clearNotification: (id) => api.delete(`/notifications/${id}/`),

    // Marketing Campaigns
    getActiveCampaigns: () => api.get('/marketing/active/'),

    // AI Financial Advisor Audit
    getAIAudit: (prompt = '') => api.post('/ai/audit/', { prompt }),

    // Recycle Bin
    getRecycleBin: () => api.get('/recycle-bin/'),
    restoreItem: (id, type) => api.post(`/recycle-bin/${id}/restore/`, { type }),
    purgeItem: (id, type) => api.post(`/recycle-bin/${id}/purge/`, { type }), // Using post for consistency across django routers

    // Email dynamic scheduler statement trigger
    triggerEmailStatementDigest: () => api.post('/scheduler/trigger/'),
};

export default api;