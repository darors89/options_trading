import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [showUpdates, setShowUpdates] = useState(false);

  const updates = [
    {
      date: '2024-02-15',
      version: 'v0.3.0',
      title: 'Offline Mode & Minimalist Design',
      changes: [
        'Client-side Black-Scholes implementation',
        'Dual mode: Online/Offline toggle',
        'Deep blue minimalist theme',
        'Improved error handling',
      ]
    },
    {
      date: '2024-02-14',
      version: 'v0.2.0',
      title: 'Dynamic Strategy Configuration',
      changes: [
        'Sidebar configuration panel',
        'Strategy-specific leg labels',
        'Adaptive UI (1-4 legs)',
        'Separated common vs leg parameters',
      ]
    },
    {
      date: '2024-02-13',
      version: 'v0.1.0',
      title: 'Initial Release',
      changes: [
        '50+ options strategies',
        'FastAPI backend',
        'Next.js frontend',
        'Vercel deployment',
      ]
    },
  ];

  const features = [
    {
      icon: '🎯',
      title: '50+ Strategies',
      description: 'From basic covered calls to advanced iron condors',
      status: 'Live'
    },
    {
      icon: '📊',
      title: 'Real-time Analysis',
      description: 'P&L, Greeks, break-evens calculated instantly',
      status: 'Live'
    },
    {
      icon: '🔒',
      title: 'Offline Mode',
      description: 'Run calculations in your browser, no backend needed',
      status: 'Live'
    },
    {
      icon: '🌐',
      title: 'Online Mode',
      description: 'Connect to market data via broker APIs',
      status: 'Beta'
    },
    {
      icon: '📈',
      title: 'Live Market Data',
      description: 'PyRofex & PyHomebroker integration',
      status: 'In Progress'
    },
    {
      icon: '🔐',
      title: 'Authentication',
      description: 'Secure broker connections',
      status: 'Planned'
    },
  ];

  const roadmap = [
    { phase: 'Phase 1', status: 'complete', items: ['MVP Offline Mode', 'Black-Scholes Engine', 'Basic UI'] },
    { phase: 'Phase 2', status: 'current', items: ['Backend Fix', 'Error Diagnostics', 'Broker Integration'] },
    { phase: 'Phase 3', status: 'next', items: ['Authentication', 'Real Market Data', 'Option Chains'] },
    { phase: 'Phase 4', status: 'future', items: ['Volatility Forecasting', 'Portfolio Tracking', 'Backtesting'] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0d1135] to-[#0a0e27] text-gray-100">
      <Head>
        <title>Options Trading Platform</title>
        <meta name="description" content="Professional options trading analysis platform" />
      </Head>

      {/* Header */}
      <header className="border-b border-blue-900/30 bg-[#0d1135]/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-light text-blue-100">Options Platform</h1>
          <Link href="/strategies" className="btn-primary px-6 py-2">
            Launch App →
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-light mb-6 text-blue-50">
            Professional Options
            <br />
            <span className="text-blue-400">Strategy Builder</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Analyze 50+ options strategies with real-time calculations.
            Works offline with instant results.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/strategies" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Start Analyzing
            </Link>
            <button
              onClick={() => setShowUpdates(!showUpdates)}
              className="bg-[#0d1135] hover:bg-[#1a1f47] text-gray-300 px-8 py-3 rounded-lg font-medium border border-blue-900/30 transition-colors"
            >
              Latest Updates
            </button>
          </div>
        </div>

        {/* Latest Updates Dropdown */}
        {showUpdates && (
          <div className="mb-16 animate-fade-in">
            <div className="bg-[#0d1135]/60 border border-blue-900/30 rounded-lg p-6 max-w-3xl mx-auto">
              <h3 className="text-2xl font-light text-blue-300 mb-6">Release Notes</h3>
              {updates.map((update, idx) => (
                <div key={idx} className={`${idx > 0 ? 'pt-6 mt-6 border-t border-blue-900/20' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-500">{update.date}</span>
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded">
                      {update.version}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium text-blue-200 mb-2">{update.title}</h4>
                  <ul className="space-y-1">
                    {update.changes.map((change, i) => (
                      <li key={i} className="text-sm text-gray-400">• {change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="mb-20">
          <h3 className="text-3xl font-light text-center mb-12 text-blue-100">Features & Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-[#0d1135]/40 border border-blue-900/30 rounded-lg p-6 hover:border-blue-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{feature.icon}</div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      feature.status === 'Live'
                        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/30'
                        : feature.status === 'Beta'
                        ? 'bg-blue-900/30 text-blue-300 border border-blue-900/30'
                        : feature.status === 'In Progress'
                        ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/30'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                  >
                    {feature.status}
                  </span>
                </div>
                <h4 className="text-lg font-medium text-blue-200 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Project Status */}
        <div className="mb-20">
          <h3 className="text-3xl font-light text-center mb-12 text-blue-100">Project Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#0d1135]/40 border border-blue-900/30 rounded-lg p-6">
              <h4 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Core Engine</h4>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-light text-emerald-400">100%</span>
                <span className="text-gray-500">Complete</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>✓ Black-Scholes implementation</li>
                <li>✓ Greeks calculation</li>
                <li>✓ 50+ strategies</li>
                <li>✓ Offline mode</li>
              </ul>
            </div>

            <div className="bg-[#0d1135]/40 border border-blue-900/30 rounded-lg p-6">
              <h4 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">UI/UX</h4>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-light text-blue-400">85%</span>
                <span className="text-gray-500">In Progress</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>✓ Minimalist design</li>
                <li>✓ Dynamic configuration</li>
                <li>⏳ Charts & visualizations</li>
                <li>⏳ Mobile optimization</li>
              </ul>
            </div>

            <div className="bg-[#0d1135]/40 border border-blue-900/30 rounded-lg p-6">
              <h4 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Backend</h4>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-light text-yellow-400">60%</span>
                <span className="text-gray-500">Debugging</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>✓ FastAPI structure</li>
                <li>⏳ Server error resolution</li>
                <li>⏳ Broker integration</li>
                <li>⏳ Real-time data</li>
              </ul>
            </div>

            <div className="bg-[#0d1135]/40 border border-blue-900/30 rounded-lg p-6">
              <h4 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Data Integration</h4>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-light text-gray-500">20%</span>
                <span className="text-gray-500">Planned</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>⏳ PyRofex connection</li>
                <li>⏳ PyHomebroker connection</li>
                <li>⏳ Option chains</li>
                <li>⏳ Historical data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-20">
          <h3 className="text-3xl font-light text-center mb-12 text-blue-100">Roadmap</h3>
          <div className="max-w-3xl mx-auto">
            {roadmap.map((phase, idx) => (
              <div
                key={idx}
                className={`flex gap-4 mb-6 ${
                  phase.status === 'complete' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      phase.status === 'complete'
                        ? 'bg-emerald-900/30 border-emerald-600 text-emerald-400'
                        : phase.status === 'current'
                        ? 'bg-blue-900/30 border-blue-500 text-blue-300'
                        : 'bg-gray-800 border-gray-600 text-gray-500'
                    }`}
                  >
                    {phase.status === 'complete' ? '✓' : idx + 1}
                  </div>
                  {idx < roadmap.length - 1 && (
                    <div className="w-0.5 h-16 bg-blue-900/30 my-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-blue-200">{phase.phase}</h4>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        phase.status === 'complete'
                          ? 'bg-emerald-900/30 text-emerald-400'
                          : phase.status === 'current'
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {phase.items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-400">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <h3 className="text-3xl font-light mb-8 text-blue-100">Built With</h3>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-400">
            <span className="px-3 py-1 bg-[#0d1135] border border-blue-900/30 rounded">Next.js 14</span>
            <span className="px-3 py-1 bg-[#0d1135] border border-blue-900/30 rounded">TypeScript</span>
            <span className="px-3 py-1 bg-[#0d1135] border border-blue-900/30 rounded">FastAPI</span>
            <span className="px-3 py-1 bg-[#0d1135] border border-blue-900/30 rounded">Python</span>
            <span className="px-3 py-1 bg-[#0d1135] border border-blue-900/30 rounded">Tailwind CSS</span>
            <span className="px-3 py-1 bg-[#0d1135] border border-blue-900/30 rounded">Vercel</span>
            <span className="px-3 py-1 bg-[#0d1135] border border-blue-900/30 rounded">NumPy</span>
            <span className="px-3 py-1 bg-[#0d1135] border border-blue-900/30 rounded">SciPy</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-blue-900/30 py-8 text-center text-gray-500 text-sm">
        <p>Options Trading Platform © 2024 | Built for professional traders</p>
      </footer>
    </div>
  );
}
