// lib/api.ts - FIXED VERSION
import axios from 'axios';
import type { StrategyRequest, AnalysisResponse } from './types';

// Use relative path for Vercel deployment
const API_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

export const apiClient = {
  analyzeStrategy: async (request: StrategyRequest): Promise<AnalysisResponse> => {
    try {
      const response = await api.post('/api/strategy/analyze', request);
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error);
      if (error.response) {
        // Server responded with error
        throw new Error(error.response.data?.detail || 'Server error');
      } else if (error.request) {
        // No response received
        throw new Error('No response from server. Check if API is running.');
      } else {
        // Request setup error
        throw new Error(error.message || 'Request failed');
      }
    }
  },

  listStrategies: async (): Promise<Record<string, string[]>> => {
    try {
      const response = await api.get('/api/strategy/list');
      return response.data;
    } catch (error) {
      console.error('Error loading strategies:', error);
      // Return fallback data
      return {
        basic: ['Covered Call', 'Protective Put', 'Covered Put', 'Protective Call'],
        spreads: ['Bull Call Spread', 'Bear Put Spread', 'Bull Put Spread', 'Bear Call Spread'],
        volatility: ['Long Straddle', 'Short Straddle', 'Long Strangle', 'Short Strangle'],
        butterflies: ['Long Call Butterfly', 'Long Put Butterfly', 'Iron Butterfly'],
        condors: ['Iron Condor', 'Long Call Condor', 'Long Put Condor'],
        advanced: ['Jade Lizard', "Poor Man's Covered Call", 'Wheel Strategy (Put)', 'Collar'],
      };
    }
  },

  getStocks: async (): Promise<Record<string, Record<string, string>>> => {
    try {
      const response = await api.get('/api/market/stocks');
      return response.data;
    } catch (error) {
      console.error('Error loading stocks:', error);
      return {};
    }
  },
};

export default api;
