import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import type { OptionLeg, StrategyRequest } from '@/lib/types';

// Strategy configurations - defines legs for each strategy
const STRATEGY_CONFIGS: Record<string, {
  legs: Array<{
    type: 'call' | 'put';
    position: 'long' | 'short';
    label: string;
    strikeLabel: string;
  }>;
  hasStock?: boolean;
}> = {
  'Covered Call': {
    hasStock: true,
    legs: [{ type: 'call', position: 'short', label: 'Short Call', strikeLabel: 'Call Strike' }],
  },
  'Protective Put': {
    hasStock: true,
    legs: [{ type: 'put', position: 'long', label: 'Long Put (Protection)', strikeLabel: 'Put Strike' }],
  },
  'Bull Call Spread': {
    legs: [
      { type: 'call', position: 'long', label: 'Long Call (Lower Strike)', strikeLabel: 'Lower Strike' },
      { type: 'call', position: 'short', label: 'Short Call (Upper Strike)', strikeLabel: 'Upper Strike' },
    ],
  },
  'Bear Put Spread': {
    legs: [
      { type: 'put', position: 'long', label: 'Long Put (Upper Strike)', strikeLabel: 'Upper Strike' },
      { type: 'put', position: 'short', label: 'Short Put (Lower Strike)', strikeLabel: 'Lower Strike' },
    ],
  },
  'Long Straddle': {
    legs: [
      { type: 'call', position: 'long', label: 'Long Call (ATM)', strikeLabel: 'Strike (ATM)' },
      { type: 'put', position: 'long', label: 'Long Put (ATM)', strikeLabel: 'Strike (ATM)' },
    ],
  },
  'Iron Condor': {
    legs: [
      { type: 'put', position: 'long', label: 'Long Put (Lowest)', strikeLabel: 'Lowest Strike' },
      { type: 'put', position: 'short', label: 'Short Put (Lower)', strikeLabel: 'Lower Strike' },
      { type: 'call', position: 'short', label: 'Short Call (Upper)', strikeLabel: 'Upper Strike' },
      { type: 'call', position: 'long', label: 'Long Call (Highest)', strikeLabel: 'Highest Strike' },
    ],
  },
  'Long Call Butterfly': {
    legs: [
      { type: 'call', position: 'long', label: 'Long Call (Lower)', strikeLabel: 'Lower Strike' },
      { type: 'call', position: 'short', label: 'Short Call 1 (Middle)', strikeLabel: 'Middle Strike' },
      { type: 'call', position: 'short', label: 'Short Call 2 (Middle)', strikeLabel: 'Middle Strike' },
      { type: 'call', position: 'long', label: 'Long Call (Upper)', strikeLabel: 'Upper Strike' },
    ],
  },
};

// Fallback for strategies not in config
const getDefaultConfig = () => ({
  legs: [
    { type: 'call' as const, position: 'long' as const, label: 'Option 1', strikeLabel: 'Strike 1' },
    { type: 'call' as const, position: 'short' as const, label: 'Option 2', strikeLabel: 'Strike 2' },
  ],
});

export default function StrategiesPage() {
  const {
    selectedStrategy,
    setSelectedStrategy,
    marketParams,
    setMarketParams,
    analysisResult,
    setAnalysisResult,
    isAnalyzing,
    setIsAnalyzing,
  } = useStore();

  const [activeTab, setActiveTab] = useState('basic');
  
  const strategies = {
    basic: ['Covered Call', 'Protective Put', 'Covered Put', 'Protective Call'],
    spreads: ['Bull Call Spread', 'Bear Put Spread', 'Bull Put Spread', 'Bear Call Spread'],
    volatility: ['Long Straddle', 'Short Straddle', 'Long Strangle', 'Short Strangle'],
    butterflies: ['Long Call Butterfly', 'Long Put Butterfly', 'Iron Butterfly'],
    condors: ['Iron Condor', 'Long Call Condor', 'Long Put Condor'],
    advanced: ['Jade Lizard', "Poor Man's Covered Call", 'Wheel Strategy (Put)', 'Collar'],
  };

  // Common parameters
  const [commonParams, setCommonParams] = useState({
    stockPrice: 100,
    daysToExpiration: 30,
    volatility: 25,
    riskFreeRate: 5,
  });

  // Dynamic leg parameters
  const [legParams, setLegParams] = useState<Array<{ strike: number; premium: number }>>([
    { strike: 95, premium: 5 },
    { strike: 105, premium: 3 },
  ]);

  const currentConfig = selectedStrategy 
    ? (STRATEGY_CONFIGS[selectedStrategy] || getDefaultConfig())
    : getDefaultConfig();

  // Adjust leg params when strategy changes
  useEffect(() => {
    if (selectedStrategy) {
      const config = STRATEGY_CONFIGS[selectedStrategy] || getDefaultConfig();
      const newLegParams = config.legs.map((_, idx) => 
        legParams[idx] || { strike: 100 + idx * 5, premium: 5 - idx }
      );
      setLegParams(newLegParams);
    }
  }, [selectedStrategy]);

  const handleAnalyze = async () => {
    if (!selectedStrategy) {
      toast.error('Select a strategy first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const config = STRATEGY_CONFIGS[selectedStrategy] || getDefaultConfig();
      
      const optionLegs: OptionLeg[] = config.legs.map((leg, idx) => ({
        option_type: leg.type,
        position: leg.position,
        strike: legParams[idx]?.strike || 100,
        premium: legParams[idx]?.premium || 5,
      }));

      const request: StrategyRequest = {
        strategy_name: selectedStrategy,
        stock_price: commonParams.stockPrice,
        option_legs: optionLegs,
        stock_legs: config.hasStock ? [{
          position: 'long' as const,
          price: commonParams.stockPrice,
          quantity: 100,
        }] : [],
        market_params: {
          risk_free_rate: commonParams.riskFreeRate / 100,
          volatility: commonParams.volatility / 100,
          dividend_yield: 0,
          days_to_expiration: commonParams.daysToExpiration,
        },
      };

      const result = await apiClient.analyzeStrategy(request);
      setAnalysisResult(result);
      toast.success('✓ Analysis completed');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { key: 'basic', label: 'Basic', icon: '📚' },
    { key: 'spreads', label: 'Spreads', icon: '📊' },
    { key: 'volatility', label: 'Volatility', icon: '⚡' },
    { key: 'butterflies', label: 'Butterflies', icon: '🦋' },
    { key: 'condors', label: 'Condors', icon: '🦅' },
    { key: 'advanced', label: 'Advanced', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-100">
      <Head>
        <title>Strategy Builder | Options Trading</title>
      </Head>

      {/* Header with Tabs */}
      <header className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 mb-4">
            Options Strategy Builder
          </h1>
          
          {/* Strategy Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-slate-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content - Strategy Selection */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* Strategy Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {strategies[activeTab as keyof typeof strategies]?.map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => {
                    setSelectedStrategy(strategy);
                    toast.success(`Selected: ${strategy}`);
                  }}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedStrategy === strategy
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-900 shadow-xl shadow-amber-500/30 scale-105'
                      : 'bg-slate-800/40 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="font-semibold text-sm">{strategy}</div>
                </button>
              ))}
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-amber-400 mb-4">Analysis Results</h3>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 rounded-lg border border-slate-600">
                    <div className="text-xs text-gray-400 mb-1">Current P&L</div>
                    <div className={`text-2xl font-bold ${analysisResult.current_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${analysisResult.current_pnl.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 p-4 rounded-lg border border-emerald-700/50">
                    <div className="text-xs text-gray-400 mb-1">Max Profit</div>
                    <div className="text-2xl font-bold text-emerald-400">
                      ${analysisResult.max_profit.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 p-4 rounded-lg border border-red-700/50">
                    <div className="text-xs text-gray-400 mb-1">Max Loss</div>
                    <div className="text-2xl font-bold text-red-400">
                      ${Math.abs(analysisResult.max_loss).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 p-4 rounded-lg border border-amber-700/50">
                    <div className="text-xs text-gray-400 mb-1">R/R Ratio</div>
                    <div className="text-2xl font-bold text-amber-400">
                      {analysisResult.risk_reward_ratio?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Greeks */}
                <div className="mb-6">
                  <h4 className="font-semibold text-amber-400 mb-3">Greeks</h4>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(analysisResult.greeks).map(([key, value]) => (
                      <div key={key} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 text-center">
                        <div className="text-xs text-gray-400 uppercase">{key}</div>
                        <div className="text-lg font-bold text-cyan-400">{(value as number).toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Break-evens */}
                {analysisResult.break_evens && analysisResult.break_evens.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-amber-400 mb-3">Break-even Points</h4>
                    <div className="flex gap-3">
                      {analysisResult.break_evens.map((be, idx) => (
                        <div key={idx} className="bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-700/50">
                          <span className="text-sm text-gray-400">BE #{idx + 1}: </span>
                          <span className="font-bold text-amber-400">${be.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar - Configuration */}
        <aside className="w-96 bg-slate-800/60 backdrop-blur-sm border-l border-slate-700 p-6 overflow-y-auto">
          {!selectedStrategy ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-4xl mb-3">👈</div>
              <p>Select a strategy to configure</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-2">{selectedStrategy}</h2>
              <p className="text-sm text-gray-400 mb-6">Configure parameters</p>

              {/* Common Parameters */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wider">
                  Market Parameters
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Stock Price</label>
                    <input
                      type="number"
                      value={commonParams.stockPrice}
                      onChange={(e) => setCommonParams({ ...commonParams, stockPrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Days to Expiration</label>
                    <input
                      type="number"
                      value={commonParams.daysToExpiration}
                      onChange={(e) => setCommonParams({ ...commonParams, daysToExpiration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Volatility (%)</label>
                    <input
                      type="number"
                      value={commonParams.volatility}
                      onChange={(e) => setCommonParams({ ...commonParams, volatility: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Risk-Free Rate (%)</label>
                    <input
                      type="number"
                      value={commonParams.riskFreeRate}
                      onChange={(e) => setCommonParams({ ...commonParams, riskFreeRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Option Legs */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wider">
                  Option Legs
                </h3>

                {currentConfig.legs.map((leg, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">{leg.label}</h4>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">{leg.strikeLabel}</label>
                        <input
                          type="number"
                          value={legParams[idx]?.strike || 100}
                          onChange={(e) => {
                            const newParams = [...legParams];
                            newParams[idx] = { ...newParams[idx], strike: parseFloat(e.target.value) };
                            setLegParams(newParams);
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:border-cyan-500 focus:outline-none text-sm"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Premium</label>
                        <input
                          type="number"
                          value={legParams[idx]?.premium || 5}
                          onChange={(e) => {
                            const newParams = [...legParams];
                            newParams[idx] = { ...newParams[idx], premium: parseFloat(e.target.value) };
                            setLegParams(newParams);
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:border-cyan-500 focus:outline-none text-sm"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold rounded-lg shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAnalyzing ? '⏳ Analyzing...' : '📊 Analyze Strategy'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
