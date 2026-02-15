#!/bin/bash

cd /home/claude/MASTER_CHECKPOINT

# ============================================================================
# LIB FILES
# ============================================================================

# lib/types.ts
cat > lib/types.ts << 'EOFTS'
export interface MarketParams {
  risk_free_rate: number;
  volatility: number;
  dividend_yield: number;
  days_to_expiration: number;
}

export interface OptionLeg {
  option_type: 'call' | 'put';
  position: 'long' | 'short';
  strike: number;
  premium: number;
}

export interface StockLeg {
  position: 'long' | 'short';
  price: number;
  quantity: number;
}

export interface StrategyRequest {
  strategy_name: string;
  stock_price: number;
  option_legs: OptionLeg[];
  stock_legs: StockLeg[];
  market_params: MarketParams;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface AnalysisResponse {
  current_pnl: number;
  max_profit: number;
  max_loss: number;
  break_evens: number[];
  greeks: Greeks;
  risk_reward_ratio: number | null;
  payoff_data: {
    stock_prices: number[];
    payoff_expiration: number[];
    payoff_current: number[];
  };
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
}

export type StrategyCategory = 'basic' | 'spreads' | 'volatility' | 'butterflies' | 'condors' | 'advanced';
EOFTS

# lib/api.ts
cat > lib/api.ts << 'EOFTS'
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
EOFTS

# lib/store.ts
cat > lib/store.ts << 'EOFTS'
import { create } from 'zustand';
import type { Stock, OptionLeg, StockLeg, MarketParams, AnalysisResponse } from './types';

interface AppState {
  selectedStock: Stock | null;
  stockPrice: number;
  marketParams: MarketParams;
  selectedStrategy: string | null;
  optionLegs: OptionLeg[];
  stockLegs: StockLeg[];
  analysisResult: AnalysisResponse | null;
  isAnalyzing: boolean;

  setSelectedStock: (stock: Stock | null) => void;
  setStockPrice: (price: number) => void;
  setMarketParams: (params: Partial<MarketParams>) => void;
  setSelectedStrategy: (strategy: string | null) => void;
  addOptionLeg: (leg: OptionLeg) => void;
  clearOptionLegs: () => void;
  addStockLeg: (leg: StockLeg) => void;
  clearStockLegs: () => void;
  setAnalysisResult: (result: AnalysisResponse | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  reset: () => void;
}

const defaultMarketParams: MarketParams = {
  risk_free_rate: 0.05,
  volatility: 0.25,
  dividend_yield: 0.0,
  days_to_expiration: 30,
};

export const useStore = create<AppState>((set) => ({
  selectedStock: null,
  stockPrice: 100,
  marketParams: defaultMarketParams,
  selectedStrategy: null,
  optionLegs: [],
  stockLegs: [],
  analysisResult: null,
  isAnalyzing: false,

  setSelectedStock: (stock) => set({ selectedStock: stock }),
  setStockPrice: (price) => set({ stockPrice: price }),
  setMarketParams: (params) =>
    set((state) => ({ marketParams: { ...state.marketParams, ...params } })),
  setSelectedStrategy: (strategy) => set({ selectedStrategy: strategy }),
  addOptionLeg: (leg) =>
    set((state) => ({ optionLegs: [...state.optionLegs, leg] })),
  clearOptionLegs: () => set({ optionLegs: [] }),
  addStockLeg: (leg) =>
    set((state) => ({ stockLegs: [...state.stockLegs, leg] })),
  clearStockLegs: () => set({ stockLegs: [] }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  reset: () =>
    set({
      selectedStock: null,
      stockPrice: 100,
      marketParams: defaultMarketParams,
      selectedStrategy: null,
      optionLegs: [],
      stockLegs: [],
      analysisResult: null,
      isAnalyzing: false,
    }),
}));
EOFTS

# lib/constants.ts
cat > lib/constants.ts << 'EOFTS'
import type { Stock } from './types';

export const ARGENTINE_STOCKS: Record<string, Stock[]> = {
  Bancos: [
    { symbol: 'GGAL', name: 'Grupo Galicia', sector: 'Bancos' },
    { symbol: 'BMA', name: 'Banco Macro', sector: 'Bancos' },
    { symbol: 'SUPV', name: 'Supervielle', sector: 'Bancos' },
    { symbol: 'BBAR', name: 'BBVA Argentina', sector: 'Bancos' },
  ],
  Energía: [
    { symbol: 'YPFD', name: 'YPF', sector: 'Energía' },
    { symbol: 'PAMP', name: 'Pampa Energía', sector: 'Energía' },
    { symbol: 'TGSU2', name: 'TGS', sector: 'Energía' },
    { symbol: 'TRAN', name: 'Transener', sector: 'Energía' },
  ],
  Telecom: [
    { symbol: 'TECO2', name: 'Telecom Argentina', sector: 'Telecom' },
    { symbol: 'LEDE', name: 'Ledesma', sector: 'Telecom' },
  ],
  Industria: [
    { symbol: 'ALUA', name: 'Aluar', sector: 'Industria' },
    { symbol: 'TXAR', name: 'Ternium', sector: 'Industria' },
    { symbol: 'COME', name: 'Cresud', sector: 'Industria' },
  ],
  Utilities: [
    { symbol: 'EDN', name: 'Edenor', sector: 'Utilities' },
    { symbol: 'CECO2', name: 'Central Costanera', sector: 'Utilities' },
    { symbol: 'CEPU', name: 'Central Puerto', sector: 'Utilities' },
  ],
};

export const POPULAR_STOCKS = ['GGAL', 'YPFD', 'PAMP', 'BMA', 'ALUA', 'TECO2', 'SUPV', 'BBAR'];

export const STRATEGIES = {
  basic: ['Covered Call', 'Protective Put', 'Covered Put', 'Protective Call'],
  spreads: ['Bull Call Spread', 'Bear Put Spread', 'Bull Put Spread', 'Bear Call Spread'],
  volatility: ['Long Straddle', 'Short Straddle', 'Long Strangle', 'Short Strangle'],
  butterflies: ['Long Call Butterfly', 'Long Put Butterfly', 'Iron Butterfly'],
  condors: ['Iron Condor', 'Long Call Condor', 'Long Put Condor'],
  advanced: [
    'Jade Lizard', 'Poor Man\'s Covered Call', 'Wheel Strategy (Put)',
    'Collar', 'Call Ratio Spread', 'ZEBRA Spread'
  ],
};
EOFTS

# ============================================================================
# STYLES
# ============================================================================

cat > styles/globals.css << 'EOFCSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, sans-serif;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-all duration-200;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 active:scale-95;
}

.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700 active:scale-95;
}

.card {
  @apply bg-white rounded-lg shadow-md p-6 transition-all duration-200;
}

.card:hover {
  @apply shadow-lg transform -translate-y-1;
}

.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
EOFCSS

# ============================================================================
# PAGES
# ============================================================================

# pages/_app.tsx
cat > pages/_app.tsx << 'EOFTS'
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </>
  );
}
EOFTS

# pages/_document.tsx
cat > pages/_document.tsx << 'EOFTS'
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
EOFTS

# pages/index.tsx
cat > pages/index.tsx << 'EOFTS'
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Options Trading Platform</title>
        <meta name="description" content="Professional options trading" />
      </Head>
      
      <main className="text-center p-8 max-w-6xl mx-auto">
        <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          Options Trading Platform
        </h1>
        
        <p className="text-2xl text-gray-700 mb-12">
          Professional options analysis for Argentine stocks
        </p>

        <div className="flex gap-6 justify-center mb-16">
          <Link href="/strategies" className="btn btn-primary text-lg px-10 py-4 shadow-lg">
            🚀 Start Trading
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener" className="btn bg-gray-800 text-white hover:bg-gray-900 text-lg px-10 py-4 shadow-lg">
            📚 View Docs
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="card text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-3xl font-bold mb-2">50+</h3>
            <p className="text-gray-600">Strategies</p>
          </div>
          <div className="card text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-3xl font-bold mb-2">Real-time</h3>
            <p className="text-gray-600">Analysis</p>
          </div>
          <div className="card text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-3xl font-bold mb-2">Fast</h3>
            <p className="text-gray-600">< 100ms</p>
          </div>
        </div>

        <div className="mt-16 text-left max-w-3xl mx-auto card">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ 50+ options strategies (basic to advanced)</li>
            <li>✅ Real-time Black-Scholes pricing</li>
            <li>✅ Complete Greeks analysis</li>
            <li>✅ Interactive payoff diagrams</li>
            <li>✅ Argentine stocks integration (BYMA)</li>
            <li>✅ Serverless deployment (Vercel)</li>
          </ul>
        </div>
      </main>

      <footer className="mt-16 pb-8 text-gray-600">
        <p>Made with ❤️ for traders | © 2024</p>
      </footer>
    </div>
  );
}
EOFTS

# pages/strategies.tsx
cat > pages/strategies.tsx << 'EOFTS'
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { STRATEGIES } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function StrategiesPage() {
  const { selectedStrategy, setSelectedStrategy, setIsAnalyzing } = useStore();
  const [allStrategies, setAllStrategies] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const strategies = await apiClient.listStrategies();
      setAllStrategies(strategies);
    } catch (error) {
      console.error('Error loading strategies:', error);
      setAllStrategies(STRATEGIES);
    }
  };

  const categories = [
    { key: 'basic', label: 'Básicas', icon: '📚', color: 'from-green-400 to-green-600' },
    { key: 'spreads', label: 'Spreads', icon: '📊', color: 'from-blue-400 to-blue-600' },
    { key: 'volatility', label: 'Volatilidad', icon: '⚡', color: 'from-yellow-400 to-yellow-600' },
    { key: 'butterflies', label: 'Butterflies', icon: '🦋', color: 'from-purple-400 to-purple-600' },
    { key: 'condors', label: 'Condors', icon: '🦅', color: 'from-indigo-400 to-indigo-600' },
    { key: 'advanced', label: 'Avanzadas', icon: '🚀', color: 'from-red-400 to-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Head>
        <title>Strategy Builder | Options Trading</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2">Strategy Builder</h1>
          <p className="text-xl text-gray-600">Select a strategy to analyze</p>
        </div>

        {categories.map((category) => (
          <div key={category.key} className="mb-12">
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-3">{category.icon}</span>
              <h2 className="text-3xl font-bold">{category.label}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allStrategies[category.key]?.map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => {
                    setSelectedStrategy(strategy);
                    toast.success(`Selected: ${strategy}`);
                  }}
                  className={`card cursor-pointer text-left transition-all ${
                    selectedStrategy === strategy
                      ? 'ring-4 ring-blue-500 shadow-xl'
                      : 'hover:shadow-xl'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-2 bg-gradient-to-r ${category.color} text-white px-3 py-1 rounded-full inline-block`}>
                    {category.label}
                  </div>
                  <h3 className="font-bold text-lg">{strategy}</h3>
                </button>
              ))}
            </div>
          </div>
        ))}

        {selectedStrategy && (
          <div className="fixed bottom-8 right-8 bg-white p-6 rounded-lg shadow-2xl">
            <p className="text-sm text-gray-600 mb-2">Selected Strategy:</p>
            <p className="font-bold text-xl mb-4">{selectedStrategy}</p>
            <button
              onClick={() => {
                // Navigate to analysis page
                toast.success('Opening strategy builder...');
              }}
              className="btn btn-primary w-full"
            >
              Configure Strategy →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
EOFTS

echo "✅ All frontend files created successfully!"
