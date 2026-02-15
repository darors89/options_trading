import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { STRATEGIES } from '@/lib/constants';

export default function StrategiesPage() {
  const {
    selectedStrategy,
    setSelectedStrategy,
    stockPrice,
    setStockPrice,
    optionLegs,
    addOptionLeg,
    clearOptionLegs,
    marketParams,
    setMarketParams,
    analysisResult,
    setAnalysisResult,
    isAnalyzing,
    setIsAnalyzing,
  } = useStore();

  const [allStrategies, setAllStrategies] = useState<Record<string, string[]>>(STRATEGIES);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['basic']);

  // Form state for simple strategies
  const [formData, setFormData] = useState({
    stockPrice: 100,
    strike1: 95,
    strike2: 105,
    premium1: 5,
    premium2: 3,
  });

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const strategies = await apiClient.listStrategies();
      setAllStrategies(strategies);
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleAnalyze = async () => {
    if (!selectedStrategy) {
      toast.error('Select a strategy first');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Example: Bull Call Spread
      const request = {
        strategy_name: selectedStrategy,
        stock_price: formData.stockPrice,
        option_legs: [
          {
            option_type: 'call',
            position: 'long',
            strike: formData.strike1,
            premium: formData.premium1,
          },
          {
            option_type: 'call',
            position: 'short',
            strike: formData.strike2,
            premium: formData.premium2,
          },
        ],
        stock_legs: [],
        market_params: {
          risk_free_rate: marketParams.risk_free_rate,
          volatility: marketParams.volatility,
          dividend_yield: marketParams.dividend_yield,
          days_to_expiration: marketParams.days_to_expiration,
        },
      };

      const result = await apiClient.analyzeStrategy(request);
      setAnalysisResult(result);
      toast.success('Analysis completed!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error('Error analyzing strategy: ' + (error.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const categories = [
    { key: 'basic', label: 'Básicas', icon: '📚', color: 'bg-green-500' },
    { key: 'spreads', label: 'Spreads', icon: '📊', color: 'bg-blue-500' },
    { key: 'volatility', label: 'Volatilidad', icon: '⚡', color: 'bg-yellow-500' },
    { key: 'butterflies', label: 'Butterflies', icon: '🦋', color: 'bg-purple-500' },
    { key: 'condors', label: 'Condors', icon: '🦅', color: 'bg-indigo-500' },
    { key: 'advanced', label: 'Avanzadas', icon: '🚀', color: 'bg-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head>
        <title>Strategy Builder | Options Trading</title>
      </Head>

      {/* SIDEBAR */}
      <aside className="w-80 bg-white shadow-lg overflow-y-auto border-r border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <h2 className="text-2xl font-bold text-white">Strategies</h2>
          <p className="text-blue-100 text-sm">Select to configure</p>
        </div>

        <div className="p-4">
          {categories.map((category) => (
            <div key={category.key} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.key)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-semibold text-gray-700">{category.label}</span>
                  <span className="text-xs text-gray-500">
                    ({allStrategies[category.key]?.length || 0})
                  </span>
                </div>
                <span className="text-gray-400">
                  {expandedCategories.includes(category.key) ? '▼' : '▶'}
                </span>
              </button>

              {/* Strategy List */}
              {expandedCategories.includes(category.key) && (
                <div className="ml-4 mt-2 space-y-1">
                  {allStrategies[category.key]?.map((strategy) => (
                    <button
                      key={strategy}
                      onClick={() => {
                        setSelectedStrategy(strategy);
                        toast.success(`Selected: ${strategy}`);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                        selectedStrategy === strategy
                          ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {strategy}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {!selectedStrategy ? (
            // Empty State
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👈</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Select a Strategy
              </h2>
              <p className="text-gray-500">
                Choose a strategy from the sidebar to start analyzing
              </p>
            </div>
          ) : (
            // Strategy Builder
            <div>
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">{selectedStrategy}</h1>
                <p className="text-gray-600">Configure parameters and analyze</p>
              </div>

              {/* Configuration Form */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Parameters</h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Stock Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Price
                    </label>
                    <input
                      type="number"
                      value={formData.stockPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, stockPrice: parseFloat(e.target.value) })
                      }
                      className="input"
                      step="0.01"
                    />
                  </div>

                  {/* Strike 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strike 1 (Lower)
                    </label>
                    <input
                      type="number"
                      value={formData.strike1}
                      onChange={(e) =>
                        setFormData({ ...formData, strike1: parseFloat(e.target.value) })
                      }
                      className="input"
                      step="0.01"
                    />
                  </div>

                  {/* Premium 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Premium 1
                    </label>
                    <input
                      type="number"
                      value={formData.premium1}
                      onChange={(e) =>
                        setFormData({ ...formData, premium1: parseFloat(e.target.value) })
                      }
                      className="input"
                      step="0.01"
                    />
                  </div>

                  {/* Strike 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strike 2 (Upper)
                    </label>
                    <input
                      type="number"
                      value={formData.strike2}
                      onChange={(e) =>
                        setFormData({ ...formData, strike2: parseFloat(e.target.value) })
                      }
                      className="input"
                      step="0.01"
                    />
                  </div>

                  {/* Premium 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Premium 2
                    </label>
                    <input
                      type="number"
                      value={formData.premium2}
                      onChange={(e) =>
                        setFormData({ ...formData, premium2: parseFloat(e.target.value) })
                      }
                      className="input"
                      step="0.01"
                    />
                  </div>

                  {/* Days to Expiration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days to Expiration
                    </label>
                    <input
                      type="number"
                      value={marketParams.days_to_expiration}
                      onChange={(e) =>
                        setMarketParams({ days_to_expiration: parseInt(e.target.value) })
                      }
                      className="input"
                    />
                  </div>

                  {/* Volatility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volatility (%)
                    </label>
                    <input
                      type="number"
                      value={marketParams.volatility * 100}
                      onChange={(e) =>
                        setMarketParams({ volatility: parseFloat(e.target.value) / 100 })
                      }
                      className="input"
                      step="1"
                    />
                  </div>

                  {/* Risk Free Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Free Rate (%)
                    </label>
                    <input
                      type="number"
                      value={marketParams.risk_free_rate * 100}
                      onChange={(e) =>
                        setMarketParams({ risk_free_rate: parseFloat(e.target.value) / 100 })
                      }
                      className="input"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Analyze Button */}
                <div className="mt-6">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="btn btn-primary w-full py-3 text-lg"
                  >
                    {isAnalyzing ? '⏳ Analyzing...' : '📊 Analyze Strategy'}
                  </button>
                </div>
              </div>

              {/* Results */}
              {analysisResult && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">Analysis Results</h3>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Current P&L</div>
                      <div
                        className={`text-2xl font-bold ${
                          analysisResult.current_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${analysisResult.current_pnl.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Max Profit</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${analysisResult.max_profit.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Max Loss</div>
                      <div className="text-2xl font-bold text-red-600">
                        ${Math.abs(analysisResult.max_loss).toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">R/R Ratio</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {analysisResult.risk_reward_ratio?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Greeks */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Greeks</h4>
                    <div className="grid grid-cols-5 gap-3">
                      {Object.entries(analysisResult.greeks).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-3 rounded text-center">
                          <div className="text-xs text-gray-600 uppercase">{key}</div>
                          <div className="text-lg font-bold">{(value as number).toFixed(3)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Break-evens */}
                  {analysisResult.break_evens && analysisResult.break_evens.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Break-even Points</h4>
                      <div className="flex gap-3">
                        {analysisResult.break_evens.map((be, idx) => (
                          <div key={idx} className="bg-yellow-50 px-4 py-2 rounded">
                            <span className="text-sm text-gray-600">BE #{idx + 1}: </span>
                            <span className="font-bold">${be.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Simple Payoff Visualization */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Payoff Diagram</h4>
                    <div className="bg-gray-100 p-4 rounded">
                      <p className="text-sm text-gray-600">
                        Payoff data received. Add Recharts component here for visualization.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Data points: {analysisResult.payoff_data.stock_prices.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
