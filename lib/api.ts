import axios from 'axios';
import type { StrategyRequest, AnalysisResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const apiClient = {
  analyzeStrategy: async (request: StrategyRequest): Promise<AnalysisResponse> => {
    const response = await api.post('/api/strategy/analyze', request);
    return response.data;
  },

  listStrategies: async (): Promise<Record<string, string[]>> => {
    const response = await api.get('/api/strategy/list');
    return response.data;
  },

  getStocks: async (): Promise<Record<string, Record<string, string>>> => {
    const response = await api.get('/api/market/stocks');
    return response.data;
  },
};

export default api;
