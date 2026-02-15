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
