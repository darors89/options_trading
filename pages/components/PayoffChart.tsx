// components/PayoffChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import type { AnalysisResponse } from '@/lib/types';

interface PayoffChartProps {
  analysis: AnalysisResponse;
  stockPrice: number;
  strategyName: string;
  legs?: Array<{
    type: 'call' | 'put';
    position: 'long' | 'short';
    strike: number;
    premium: number;
  }>;
}

export default function PayoffChart({ analysis, stockPrice, strategyName, legs }: PayoffChartProps) {
  // Prepare data for Recharts
  const chartData = analysis.payoff_data.stock_prices.map((price, idx) => {
    const dataPoint: any = {
      price: price,
      expiration: analysis.payoff_data.payoff_expiration[idx],
      current: analysis.payoff_data.payoff_current[idx],
    };

    // Add individual leg payoffs if available
    if (legs) {
      legs.forEach((leg, legIdx) => {
        const intrinsic = leg.type === 'call'
          ? Math.max(price - leg.strike, 0)
          : Math.max(leg.strike - price, 0);
        
        const multiplier = leg.position === 'long' ? 1 : -1;
        const payoff = multiplier * (intrinsic - leg.premium) * 100;
        
        dataPoint[`leg${legIdx}`] = payoff;
      });
    }

    return dataPoint;
  });

  // Find min/max for Y axis
  const allPayoffs = [
    ...analysis.payoff_data.payoff_expiration,
    ...analysis.payoff_data.payoff_current,
  ];
  const minPayoff = Math.min(...allPayoffs);
  const maxPayoff = Math.max(...allPayoffs);
  const yAxisPadding = Math.abs(maxPayoff - minPayoff) * 0.1;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const price = payload[0].payload.price;
      return (
        <div className="bg-[#0a0e27] border border-blue-900/30 rounded p-3 text-xs">
          <p className="text-blue-300 font-medium mb-2">
            Stock: ${price.toFixed(2)}
          </p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="mb-1">
              {entry.name}: ${entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0d1135]/40 border border-blue-900/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-light text-blue-200">Payoff Diagram</h3>
        <div className="text-xs text-gray-500">{strategyName}</div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a20" />
          
          <XAxis
            dataKey="price"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            label={{ value: 'Stock Price', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 11 }}
          />
          
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            domain={[minPayoff - yAxisPadding, maxPayoff + yAxisPadding]}
            label={{ value: 'P&L', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            iconType="line"
          />

          {/* Zero line */}
          <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
          
          {/* Current stock price */}
          <ReferenceLine
            x={stockPrice}
            stroke="#3b82f6"
            strokeDasharray="5 5"
            label={{
              value: 'Current',
              position: 'top',
              fill: '#3b82f6',
              fontSize: 10,
            }}
          />

          {/* Break-even points */}
          {analysis.break_evens.map((be, idx) => (
            <ReferenceLine
              key={idx}
              x={be}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{
                value: `BE ${idx + 1}`,
                position: 'top',
                fill: '#f59e0b',
                fontSize: 10,
              }}
            />
          ))}

          {/* Individual legs (transparent) */}
          {legs && legs.map((leg, idx) => (
            <Line
              key={`leg${idx}`}
              type="monotone"
              dataKey={`leg${idx}`}
              stroke={
                leg.type === 'call'
                  ? leg.position === 'long' ? '#10b98150' : '#ef444450'
                  : leg.position === 'long' ? '#3b82f650' : '#8b5cf650'
              }
              strokeWidth={1}
              dot={false}
              name={`${leg.position} ${leg.type} @${leg.strike}`}
              strokeDasharray="2 2"
            />
          ))}

          {/* Main strategy lines */}
          <Line
            type="monotone"
            dataKey="current"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Current P&L"
          />
          
          <Line
            type="monotone"
            dataKey="expiration"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            name="At Expiration"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend for regions */}
      <div className="mt-4 flex gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
          <span>Profit Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-red-600"></div>
          <span>Loss Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 border border-amber-500 rounded-full"></div>
          <span>Break-even</span>
        </div>
      </div>
    </div>
  );
}
