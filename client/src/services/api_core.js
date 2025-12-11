import axios from 'axios';

// Connects to Django (Database)
const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

export const coreService = {
    getLoans: () => api.get('/loans/'),
    getDebts: () => api.get('/debts/'),
    getAssets: () => api.get('/assets/'),
    getTransactions: () => api.get('/transactions/'),
};

export default api;