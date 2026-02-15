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
