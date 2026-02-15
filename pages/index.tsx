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
            <p className="text-gray-600">&lt; 100ms</p>
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
