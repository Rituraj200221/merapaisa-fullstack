import axios from 'axios';

// Connects to Django (Database)
const API_URL = 'https://merapaisa-backend.onrender.com/api';

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