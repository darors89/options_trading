// lib/blackscholes.ts - Client-side Black-Scholes for Offline Mode

interface BSParams {
  S: number;  // Stock price
  K: number;  // Strike price
  T: number;  // Time to expiration (years)
  r: number;  // Risk-free rate
  sigma: number;  // Volatility
  q?: number;  // Dividend yield (optional)
}

// Standard normal cumulative distribution function
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Standard normal probability density function
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export class BlackScholes {
  // Calculate d1 and d2
  private static calculateD(params: BSParams): { d1: number; d2: number } {
    const { S, K, T, r, sigma, q = 0 } = params;
    
    if (T <= 0 || sigma <= 0) {
      return { d1: 0, d2: 0 };
    }

    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    return { d1, d2 };
  }

  // Call option price
  static callPrice(params: BSParams): number {
    const { S, K, T, r, q = 0 } = params;
    
    if (T <= 0) {
      return Math.max(S - K, 0);
    }

    const { d1, d2 } = this.calculateD(params);
    const call = S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    
    return Math.max(call, 0);
  }

  // Put option price
  static putPrice(params: BSParams): number {
    const { S, K, T, r, q = 0 } = params;
    
    if (T <= 0) {
      return Math.max(K - S, 0);
    }

    const { d1, d2 } = this.calculateD(params);
    const put = K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1);
    
    return Math.max(put, 0);
  }

  // Delta
  static delta(params: BSParams, optionType: 'call' | 'put'): number {
    const { S, K, T, r, sigma, q = 0 } = params;
    
    if (T <= 0) {
      return optionType === 'call' && S > K ? 1 : 0;
    }

    const { d1 } = this.calculateD(params);
    
    if (optionType === 'call') {
      return Math.exp(-q * T) * normalCDF(d1);
    } else {
      return -Math.exp(-q * T) * normalCDF(-d1);
    }
  }

  // Gamma (same for calls and puts)
  static gamma(params: BSParams): number {
    const { S, T, sigma, q = 0 } = params;
    
    if (T <= 0) {
      return 0;
    }

    const { d1 } = this.calculateD(params);
    return Math.exp(-q * T) * normalPDF(d1) / (S * sigma * Math.sqrt(T));
  }

  // Theta (time decay per day)
  static theta(params: BSParams, optionType: 'call' | 'put'): number {
    const { S, K, T, r, sigma, q = 0 } = params;
    
    if (T <= 0) {
      return 0;
    }

    const { d1, d2 } = this.calculateD(params);
    const term1 = -(S * normalPDF(d1) * sigma * Math.exp(-q * T)) / (2 * Math.sqrt(T));
    
    if (optionType === 'call') {
      const term2 = r * K * Math.exp(-r * T) * normalCDF(d2);
      const term3 = -q * S * Math.exp(-q * T) * normalCDF(d1);
      return (term1 - term2 + term3) / 365;
    } else {
      const term2 = r * K * Math.exp(-r * T) * normalCDF(-d2);
      const term3 = q * S * Math.exp(-q * T) * normalCDF(-d1);
      return (term1 + term2 - term3) / 365;
    }
  }

  // Vega (per 1% change in volatility)
  static vega(params: BSParams): number {
    const { S, T, q = 0 } = params;
    
    if (T <= 0) {
      return 0;
    }

    const { d1 } = this.calculateD(params);
    return S * Math.exp(-q * T) * normalPDF(d1) * Math.sqrt(T) / 100;
  }

  // Rho (per 1% change in interest rate)
  static rho(params: BSParams, optionType: 'call' | 'put'): number {
    const { K, T, r } = params;
    
    if (T <= 0) {
      return 0;
    }

    const { d2 } = this.calculateD(params);
    
    if (optionType === 'call') {
      return K * T * Math.exp(-r * T) * normalCDF(d2) / 100;
    } else {
      return -K * T * Math.exp(-r * T) * normalCDF(-d2) / 100;
    }
  }
}

// Strategy analyzer for offline mode
export interface OfflineLeg {
  type: 'call' | 'put';
  position: 'long' | 'short';
  strike: number;
  premium: number;
}

export interface OfflineAnalysis {
  current_pnl: number;
  max_profit: number;
  max_loss: number;
  break_evens: number[];
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  risk_reward_ratio: number | null;
  payoff_data: {
    stock_prices: number[];
    payoff_expiration: number[];
    payoff_current: number[];
  };
}

export function analyzeStrategyOffline(
  stockPrice: number,
  legs: OfflineLeg[],
  marketParams: {
    daysToExpiration: number;
    volatility: number;
    riskFreeRate: number;
  }
): OfflineAnalysis {
  const T = marketParams.daysToExpiration / 365;
  const r = marketParams.riskFreeRate / 100;
  const sigma = marketParams.volatility / 100;

  // Current P&L and Greeks
  let currentPnL = 0;
  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;
  let totalRho = 0;

  legs.forEach(leg => {
    const bsParams: BSParams = {
      S: stockPrice,
      K: leg.strike,
      T,
      r,
      sigma,
    };

    const currentValue = leg.type === 'call' 
      ? BlackScholes.callPrice(bsParams)
      : BlackScholes.putPrice(bsParams);

    const multiplier = leg.position === 'long' ? 1 : -1;
    currentPnL += multiplier * (currentValue - leg.premium) * 100;

    // Greeks
    totalDelta += multiplier * BlackScholes.delta(bsParams, leg.type) * 100;
    totalGamma += multiplier * BlackScholes.gamma(bsParams) * 100;
    totalTheta += multiplier * BlackScholes.theta(bsParams, leg.type) * 100;
    totalVega += multiplier * BlackScholes.vega(bsParams) * 100;
    totalRho += multiplier * BlackScholes.rho(bsParams, leg.type) * 100;
  });

  // Payoff at expiration
  const priceRange = Array.from({ length: 300 }, (_, i) => 
    stockPrice * 0.5 + (i * stockPrice * 1.0) / 300
  );

  const payoffExpiration = priceRange.map(S_T => {
    let payoff = 0;
    legs.forEach(leg => {
      const intrinsic = leg.type === 'call'
        ? Math.max(S_T - leg.strike, 0)
        : Math.max(leg.strike - S_T, 0);
      
      const multiplier = leg.position === 'long' ? 1 : -1;
      payoff += multiplier * (intrinsic - leg.premium) * 100;
    });
    return payoff;
  });

  const payoffCurrent = priceRange.map(S_T => {
    let payoff = 0;
    legs.forEach(leg => {
      const bsParams: BSParams = { S: S_T, K: leg.strike, T, r, sigma };
      const currentValue = leg.type === 'call'
        ? BlackScholes.callPrice(bsParams)
        : BlackScholes.putPrice(bsParams);
      
      const multiplier = leg.position === 'long' ? 1 : -1;
      payoff += multiplier * (currentValue - leg.premium) * 100;
    });
    return payoff;
  });

  // Max profit/loss
  const maxProfit = Math.max(...payoffExpiration);
  const maxLoss = Math.min(...payoffExpiration);

  // Break-evens
  const breakEvens: number[] = [];
  for (let i = 0; i < payoffExpiration.length - 1; i++) {
    if (payoffExpiration[i] * payoffExpiration[i + 1] < 0) {
      const be = priceRange[i] - payoffExpiration[i] * 
        (priceRange[i + 1] - priceRange[i]) / 
        (payoffExpiration[i + 1] - payoffExpiration[i]);
      breakEvens.push(be);
    }
  }

  // Risk/reward
  const riskReward = maxLoss < 0 && maxProfit > 0 
    ? maxProfit / Math.abs(maxLoss) 
    : null;

  return {
    current_pnl: currentPnL,
    max_profit: maxProfit,
    max_loss: maxLoss,
    break_evens: breakEvens,
    greeks: {
      delta: totalDelta,
      gamma: totalGamma,
      theta: totalTheta,
      vega: totalVega,
      rho: totalRho,
    },
    risk_reward_ratio: riskReward,
    payoff_data: {
      stock_prices: priceRange,
      payoff_expiration: payoffExpiration,
      payoff_current: payoffCurrent,
    },
  };
}
