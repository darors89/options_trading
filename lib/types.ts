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
