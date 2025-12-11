import axios from 'axios';

// Connects to FastAPI (Live Market)
const MARKET_URL = 'http://127.0.0.1:8001';

const marketApi = axios.create({
    baseURL: MARKET_URL,
});

export const marketService = {
    getStockPrice: (symbol) => marketApi.get(`/stocks/price/${symbol}`),
    getMFNav: (schemeCode) => marketApi.get(`/funds/nav/${schemeCode}`),
};