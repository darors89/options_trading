import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { analyzeStrategyOffline, type OfflineLeg } from '@/lib/blackscholes';
import PayoffChart from '@/components/PayoffChart';
import VolatilitySurface from '@/components/VolatilitySurface';
import toast from 'react-hot-toast';
import type { OptionLeg, StrategyRequest } from '@/lib/types';

// Strategy configurations
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
    legs: [{ type: 'put', position: 'long', label: 'Long Put', strikeLabel: 'Put Strike' }],
  },
  'Bull Call Spread': {
    legs: [
      { type: 'call', position: 'long', label: 'Long Call (Lower)', strikeLabel: 'Lower Strike' },
      { type: 'call', position: 'short', label: 'Short Call (Upper)', strikeLabel: 'Upper Strike' },
    ],
  },
  'Bear Put Spread': {
    legs: [
      { type: 'put', position: 'long', label: 'Long Put (Upper)', strikeLabel: 'Upper Strike' },
      { type: 'put', position: 'short', label: 'Short Put (Lower)', strikeLabel: 'Lower Strike' },
    ],
  },
  'Long Straddle': {
    legs: [
      { type: 'call', position: 'long', label: 'Long Call', strikeLabel: 'Strike' },
      { type: 'put', position: 'long', label: 'Long Put', strikeLabel: 'Strike' },
    ],
  },
  'Iron Condor': {
    legs: [
      { type: 'put', position: 'long', label: 'Long Put (Lowest)', strikeLabel: 'Lowest' },
      { type: 'put', position: 'short', label: 'Short Put', strikeLabel: 'Lower' },
      { type: 'call', position: 'short', label: 'Short Call', strikeLabel: 'Upper' },
      { type: 'call', position: 'long', label: 'Long Call (Highest)', strikeLabel: 'Highest' },
    ],
  },
  'Long Call Butterfly': {
    legs: [
      { type: 'call', position: 'long', label: 'Long Call (Lower)', strikeLabel: 'Lower' },
      { type: 'call', position: 'short', label: 'Short Call 1 (Mid)', strikeLabel: 'Middle' },
      { type: 'call', position: 'short', label: 'Short Call 2 (Mid)', strikeLabel: 'Middle' },
      { type: 'call', position: 'long', label: 'Long Call (Upper)', strikeLabel: 'Upper' },
    ],
  },
};

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
    analysisResult,
    setAnalysisResult,
    isAnalyzing,
    setIsAnalyzing,
  } = useStore();

  const [activeTab, setActiveTab] = useState('basic');
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const strategies = {
    basic: ['Covered Call', 'Protective Put', 'Covered Put', 'Protective Call'],
    spreads: ['Bull Call Spread', 'Bear Put Spread', 'Bull Put Spread', 'Bear Call Spread'],
    volatility: ['Long Straddle', 'Short Straddle', 'Long Strangle', 'Short Strangle'],
    butterflies: ['Long Call Butterfly', 'Long Put Butterfly', 'Iron Butterfly'],
    condors: ['Iron Condor', 'Long Call Condor', 'Long Put Condor'],
    advanced: ['Jade Lizard', "Poor Man's Covered Call", 'Wheel Strategy (Put)', 'Collar'],
  };

  const [commonParams, setCommonParams] = useState({
    stockPrice: 100,
    daysToExpiration: 30,
    volatility: 25,
    riskFreeRate: 5,
  });

  const [legParams, setLegParams] = useState<Array<{ strike: number; premium: number }>>([
    { strike: 95, premium: 5 },
    { strike: 105, premium: 3 },
  ]);

  const currentConfig = selectedStrategy 
    ? (STRATEGY_CONFIGS[selectedStrategy] || getDefaultConfig())
    : getDefaultConfig();

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
    setServerError(null);

    try {
      const config = STRATEGY_CONFIGS[selectedStrategy] || getDefaultConfig();

      if (isOnlineMode) {
        // ONLINE MODE - Call backend API
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
        toast.success('✓ Analysis completed (Online)');
      } else {
        // OFFLINE MODE - Calculate in browser
        const offlineLegs: OfflineLeg[] = config.legs.map((leg, idx) => ({
          type: leg.type,
          position: leg.position,
          strike: legParams[idx]?.strike || 100,
          premium: legParams[idx]?.premium || 5,
        }));

        const result = analyzeStrategyOffline(
          commonParams.stockPrice,
          offlineLegs,
          {
            daysToExpiration: commonParams.daysToExpiration,
            volatility: commonParams.volatility,
            riskFreeRate: commonParams.riskFreeRate,
          }
        );

        setAnalysisResult(result);
        toast.success('✓ Analysis completed (Offline)');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      const errorMsg = error.message || 'Analysis failed';
      setServerError(errorMsg);
      toast.error(errorMsg);
      
      if (isOnlineMode) {
        toast('💡 Try Offline Mode for instant analysis', { duration: 5000 });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { key: 'basic', label: 'Basic' },
    { key: 'spreads', label: 'Spreads' },
    { key: 'volatility', label: 'Volatility' },
    { key: 'butterflies', label: 'Butterflies' },
    { key: 'condors', label: 'Condors' },
    { key: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-gray-100">
      <Head>
        <title>Options Strategy Builder</title>
      </Head>

      {/* Header */}
      <header className="border-b border-blue-900/30 bg-[#0d1135]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-light text-blue-100">
              Options Strategy Builder
            </h1>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-300">
              Home
            </Link>
            <Link href="/settings" className="text-sm text-gray-400 hover:text-gray-300">
              ⚙️ Settings
            </Link>
          </div>

          {/* Online/Offline Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {isOnlineMode ? 'Online' : 'Offline'}
            </span>
            <button
              onClick={() => setIsOnlineMode(!isOnlineMode)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isOnlineMode ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  isOnlineMode ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            {serverError && (
              <span className="text-xs text-red-400">⚠️ {serverError}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 pb-3">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors rounded ${
                  activeTab === tab.key
                    ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* Strategy Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {strategies[activeTab as keyof typeof strategies]?.map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => {
                    setSelectedStrategy(strategy);
                    toast.success(strategy, { duration: 1500 });
                  }}
                  className={`p-3 text-sm text-left transition-all rounded border ${
                    selectedStrategy === strategy
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-[#0d1135]/40 border-blue-900/30 hover:border-blue-700/50 text-gray-300'
                  }`}
                >
                  {strategy}
                </button>
              ))}
            </div>

            {/* Results with Charts */}
            {analysisResult && (
              <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="bg-[#0d1135]/40 border border-blue-900/30 rounded p-6">
                  <h3 className="text-lg font-light text-blue-200 mb-4">Results</h3>

                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-[#0a0e27] p-3 rounded border border-blue-900/20">
                      <div className="text-xs text-gray-500 mb-1">P&L</div>
                      <div className={`text-xl font-light ${analysisResult.current_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${analysisResult.current_pnl.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-[#0a0e27] p-3 rounded border border-emerald-900/20">
                      <div className="text-xs text-gray-500 mb-1">Max Profit</div>
                      <div className="text-xl font-light text-emerald-400">
                        ${analysisResult.max_profit.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-[#0a0e27] p-3 rounded border border-red-900/20">
                      <div className="text-xs text-gray-500 mb-1">Max Loss</div>
                      <div className="text-xl font-light text-red-400">
                        ${Math.abs(analysisResult.max_loss).toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-[#0a0e27] p-3 rounded border border-blue-900/20">
                      <div className="text-xs text-gray-500 mb-1">R/R</div>
                      <div className="text-xl font-light text-blue-300">
                        {analysisResult.risk_reward_ratio?.toFixed(2) || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Greeks */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-2">Greeks</div>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(analysisResult.greeks).map(([key, value]) => (
                        <div key={key} className="bg-[#0a0e27] p-2 rounded border border-blue-900/20 text-center">
                          <div className="text-xs text-gray-500 uppercase">{key}</div>
                          <div className="text-sm font-light text-blue-200">{(value as number).toFixed(3)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Break-evens */}
                  {analysisResult.break_evens && analysisResult.break_evens.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Break-even</div>
                      <div className="flex gap-2">
                        {analysisResult.break_evens.map((be, idx) => (
                          <div key={idx} className="bg-[#0a0e27] px-3 py-1 rounded border border-blue-900/20">
                            <span className="text-xs text-gray-500">BE {idx + 1}: </span>
                            <span className="text-sm font-light text-blue-200">${be.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payoff Chart */}
                <PayoffChart
                  analysis={analysisResult}
                  stockPrice={commonParams.stockPrice}
                  strategyName={selectedStrategy || 'Strategy'}
                  legs={currentConfig.legs.map((leg, idx) => ({
                    type: leg.type,
                    position: leg.position,
                    strike: legParams[idx]?.strike || 100,
                    premium: legParams[idx]?.premium || 5,
                  }))}
                />

                {/* Volatility Surface */}
                <VolatilitySurface
                  legs={legParams.map(p => ({ strike: p.strike, premium: p.premium }))}
                  stockPrice={commonParams.stockPrice}
                  currentDTE={commonParams.daysToExpiration}
                />
              </div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-80 bg-[#0d1135]/60 border-l border-blue-900/30 p-6 overflow-y-auto">
          {!selectedStrategy ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-sm">Select strategy</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-light text-blue-200 mb-1">{selectedStrategy}</h2>
              <p className="text-xs text-gray-500 mb-6">Configure parameters</p>

              {/* Market Params */}
              <div className="mb-6">
                <h3 className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Market</h3>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Stock Price</label>
                    <input
                      type="number"
                      value={commonParams.stockPrice}
                      onChange={(e) => setCommonParams({ ...commonParams, stockPrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#0a0e27] border border-blue-900/30 rounded text-sm text-white focus:border-blue-600 focus:outline-none"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">DTE</label>
                    <input
                      type="number"
                      value={commonParams.daysToExpiration}
                      onChange={(e) => setCommonParams({ ...commonParams, daysToExpiration: parseInt(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#0a0e27] border border-blue-900/30 rounded text-sm text-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Vol (%)</label>
                    <input
                      type="number"
                      value={commonParams.volatility}
                      onChange={(e) => setCommonParams({ ...commonParams, volatility: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#0a0e27] border border-blue-900/30 rounded text-sm text-white focus:border-blue-600 focus:outline-none"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rate (%)</label>
                    <input
                      type="number"
                      value={commonParams.riskFreeRate}
                      onChange={(e) => setCommonParams({ ...commonParams, riskFreeRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#0a0e27] border border-blue-900/30 rounded text-sm text-white focus:border-blue-600 focus:outline-none"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Legs */}
              <div className="mb-6">
                <h3 className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Legs</h3>

                {currentConfig.legs.map((leg, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-[#0a0e27]/50 border border-blue-900/20 rounded">
                    <h4 className="text-xs text-blue-300 mb-2">{leg.label}</h4>
                    
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{leg.strikeLabel}</label>
                        <input
                          type="number"
                          value={legParams[idx]?.strike || 100}
                          onChange={(e) => {
                            const newParams = [...legParams];
                            newParams[idx] = { ...newParams[idx], strike: parseFloat(e.target.value) };
                            setLegParams(newParams);
                          }}
                          className="w-full px-2 py-1 bg-[#0a0e27] border border-blue-900/30 rounded text-sm text-white focus:border-blue-600 focus:outline-none"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Premium</label>
                        <input
                          type="number"
                          value={legParams[idx]?.premium || 5}
                          onChange={(e) => {
                            const newParams = [...legParams];
                            newParams[idx] = { ...newParams[idx], premium: parseFloat(e.target.value) };
                            setLegParams(newParams);
                          }}
                          className="w-full px-2 py-1 bg-[#0a0e27] border border-blue-900/30 rounded text-sm text-white focus:border-blue-600 focus:outline-none"
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
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>

              {/* Mode Info */}
              <div className="mt-4 p-3 bg-blue-900/10 border border-blue-900/30 rounded">
                <p className="text-xs text-gray-400">
                  {isOnlineMode ? (
                    <>⚡ Online mode: Using backend API</>
                  ) : (
                    <>🔒 Offline mode: Calculations in browser</>
                  )}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
