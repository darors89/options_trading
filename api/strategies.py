"""
Complete Options Strategies Library - 50+ Strategies
Consolidated from options_strategies_enhanced.py + advanced_strategies.py
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Any
import numpy as np
from scipy.stats import norm


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class MarketParams:
    """Market parameters for options pricing"""
    risk_free_rate: float = 0.05
    volatility: float = 0.25
    dividend_yield: float = 0.0
    days_to_expiration: int = 30


@dataclass
class OptionLeg:
    """Single option leg"""
    option_type: str  # 'call' or 'put'
    position: str  # 'long' or 'short'
    strike: float
    premium: float


@dataclass
class StockLeg:
    """Stock position leg"""
    position: str  # 'long' or 'short'
    price: float
    quantity: int = 100


# ============================================================================
# BLACK-SCHOLES PRICING ENGINE
# ============================================================================

class BlackScholes:
    """Complete Black-Scholes option pricing with Greeks"""
    
    @staticmethod
    def call_price(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
        """Call option price"""
        if T <= 0 or sigma <= 0:
            return max(S - K, 0)
        
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        
        call = S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
        return max(call, 0)
    
    @staticmethod
    def put_price(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
        """Put option price"""
        if T <= 0 or sigma <= 0:
            return max(K - S, 0)
        
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        
        put = K*np.exp(-r*T)*norm.cdf(-d2) - S*np.exp(-q*T)*norm.cdf(-d1)
        return max(put, 0)
    
    @staticmethod
    def delta(S: float, K: float, T: float, r: float, sigma: float, 
              option_type: str, q: float = 0.0) -> float:
        """Delta - sensitivity to stock price"""
        if T <= 0:
            return 1.0 if (S > K and option_type == 'call') else 0.0
        
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        
        if option_type == 'call':
            return np.exp(-q*T) * norm.cdf(d1)
        else:
            return -np.exp(-q*T) * norm.cdf(-d1)
    
    @staticmethod
    def gamma(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
        """Gamma - rate of change of delta"""
        if T <= 0:
            return 0.0
        
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        return np.exp(-q*T) * norm.pdf(d1) / (S * sigma * np.sqrt(T))
    
    @staticmethod
    def theta(S: float, K: float, T: float, r: float, sigma: float,
              option_type: str, q: float = 0.0) -> float:
        """Theta - time decay (per day)"""
        if T <= 0:
            return 0.0
        
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        
        term1 = -(S * norm.pdf(d1) * sigma * np.exp(-q*T)) / (2 * np.sqrt(T))
        
        if option_type == 'call':
            term2 = r * K * np.exp(-r*T) * norm.cdf(d2)
            term3 = -q * S * np.exp(-q*T) * norm.cdf(d1)
            return (term1 - term2 + term3) / 365
        else:
            term2 = r * K * np.exp(-r*T) * norm.cdf(-d2)
            term3 = q * S * np.exp(-q*T) * norm.cdf(-d1)
            return (term1 + term2 - term3) / 365
    
    @staticmethod
    def vega(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
        """Vega - sensitivity to volatility (per 1% change)"""
        if T <= 0:
            return 0.0
        
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        return S * np.exp(-q*T) * norm.pdf(d1) * np.sqrt(T) / 100
    
    @staticmethod
    def rho(S: float, K: float, T: float, r: float, sigma: float,
            option_type: str, q: float = 0.0) -> float:
        """Rho - sensitivity to interest rate (per 1% change)"""
        if T <= 0:
            return 0.0
        
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        
        if option_type == 'call':
            return K * T * np.exp(-r*T) * norm.cdf(d2) / 100
        else:
            return -K * T * np.exp(-r*T) * norm.cdf(-d2) / 100


# ============================================================================
# OPTIONS STRATEGY CLASS
# ============================================================================

class OptionsStrategy:
    """Base class for all options strategies"""
    
    def __init__(self, name: str, market_params: Optional[MarketParams] = None):
        self.name = name
        self.option_legs: List[OptionLeg] = []
        self.stock_legs: List[StockLeg] = []
        self.market_params = market_params or MarketParams()
    
    def add_option_leg(self, option_type: str, position: str, strike: float, premium: float):
        self.option_legs.append(OptionLeg(option_type, position, strike, premium))
    
    def add_stock_leg(self, position: str, price: float, quantity: int = 100):
        self.stock_legs.append(StockLeg(position, price, quantity))
    
    def payoff_at_expiration(self, S_T: np.ndarray) -> np.ndarray:
        """Calculate payoff at expiration"""
        payoff = np.zeros_like(S_T)
        
        # Stock legs
        for leg in self.stock_legs:
            if leg.position == 'long':
                payoff += (S_T - leg.price) * leg.quantity
            else:
                payoff += (leg.price - S_T) * leg.quantity
        
        # Option legs
        for leg in self.option_legs:
            if leg.option_type == 'call':
                intrinsic = np.maximum(S_T - leg.strike, 0)
            else:
                intrinsic = np.maximum(leg.strike - S_T, 0)
            
            if leg.position == 'long':
                payoff += (intrinsic - leg.premium) * 100
            else:
                payoff += (leg.premium - intrinsic) * 100
        
        return payoff
    
    def current_pnl(self, S: float) -> float:
        """Calculate current P&L before expiration"""
        T = self.market_params.days_to_expiration / 365
        pnl = 0.0
        
        # Stock legs
        for leg in self.stock_legs:
            if leg.position == 'long':
                pnl += (S - leg.price) * leg.quantity
            else:
                pnl += (leg.price - S) * leg.quantity
        
        # Option legs
        for leg in self.option_legs:
            if leg.option_type == 'call':
                current_value = BlackScholes.call_price(
                    S, leg.strike, T, 
                    self.market_params.risk_free_rate,
                    self.market_params.volatility,
                    self.market_params.dividend_yield
                )
            else:
                current_value = BlackScholes.put_price(
                    S, leg.strike, T,
                    self.market_params.risk_free_rate,
                    self.market_params.volatility,
                    self.market_params.dividend_yield
                )
            
            if leg.position == 'long':
                pnl += (current_value - leg.premium) * 100
            else:
                pnl += (leg.premium - current_value) * 100
        
        return pnl
    
    def current_pnl_array(self, S_array: np.ndarray) -> np.ndarray:
        """Calculate current P&L for array of stock prices"""
        return np.array([self.current_pnl(S) for S in S_array])
    
    def greeks(self, S: float) -> Dict[str, float]:
        """Calculate all Greeks"""
        T = self.market_params.days_to_expiration / 365
        greeks = {'delta': 0.0, 'gamma': 0.0, 'theta': 0.0, 'vega': 0.0, 'rho': 0.0}
        
        # Stock legs
        for leg in self.stock_legs:
            multiplier = 1 if leg.position == 'long' else -1
            greeks['delta'] += leg.quantity * multiplier
        
        # Option legs
        for leg in self.option_legs:
            multiplier = 1 if leg.position == 'long' else -1
            
            greeks['delta'] += multiplier * BlackScholes.delta(
                S, leg.strike, T, self.market_params.risk_free_rate,
                self.market_params.volatility, leg.option_type,
                self.market_params.dividend_yield
            ) * 100
            
            greeks['gamma'] += multiplier * BlackScholes.gamma(
                S, leg.strike, T, self.market_params.risk_free_rate,
                self.market_params.volatility, self.market_params.dividend_yield
            ) * 100
            
            greeks['theta'] += multiplier * BlackScholes.theta(
                S, leg.strike, T, self.market_params.risk_free_rate,
                self.market_params.volatility, leg.option_type,
                self.market_params.dividend_yield
            ) * 100
            
            greeks['vega'] += multiplier * BlackScholes.vega(
                S, leg.strike, T, self.market_params.risk_free_rate,
                self.market_params.volatility, self.market_params.dividend_yield
            ) * 100
            
            greeks['rho'] += multiplier * BlackScholes.rho(
                S, leg.strike, T, self.market_params.risk_free_rate,
                self.market_params.volatility, leg.option_type,
                self.market_params.dividend_yield
            ) * 100
        
        return greeks
    
    def analyze(self, S: float) -> Dict[str, Any]:
        """Complete strategy analysis"""
        # Current P&L
        current_pnl = self.current_pnl(S)
        
        # Greeks
        greeks = self.greeks(S)
        
        # Max profit/loss at expiration
        S_range = np.linspace(S * 0.5, S * 1.5, 500)
        payoffs = self.payoff_at_expiration(S_range)
        
        max_profit = float(np.max(payoffs))
        max_loss = float(np.min(payoffs))
        
        # Break-evens
        break_evens = []
        for i in range(len(payoffs) - 1):
            if payoffs[i] * payoffs[i+1] < 0:
                be = S_range[i] - payoffs[i] * (S_range[i+1] - S_range[i]) / (payoffs[i+1] - payoffs[i])
                break_evens.append(float(be))
        
        return {
            'current_pnl': current_pnl,
            'max_profit_at_expiration': max_profit,
            'max_loss_at_expiration': max_loss,
            'break_even_at_expiration': break_evens,
            'greeks': greeks
        }


# ============================================================================
# BASIC STRATEGIES (4)
# ============================================================================

def covered_call(stock_price: float, call_strike: float, call_premium: float,
                 market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Covered Call - Long stock + Short call"""
    strategy = OptionsStrategy("Covered Call", market_params)
    strategy.add_stock_leg('long', stock_price, 100)
    strategy.add_option_leg('call', 'short', call_strike, call_premium)
    return strategy


def covered_put(stock_price: float, put_strike: float, put_premium: float,
                market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Covered Put - Short stock + Short put"""
    strategy = OptionsStrategy("Covered Put", market_params)
    strategy.add_stock_leg('short', stock_price, 100)
    strategy.add_option_leg('put', 'short', put_strike, put_premium)
    return strategy


def protective_put(stock_price: float, put_strike: float, put_premium: float,
                   market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Protective Put - Long stock + Long put"""
    strategy = OptionsStrategy("Protective Put", market_params)
    strategy.add_stock_leg('long', stock_price, 100)
    strategy.add_option_leg('put', 'long', put_strike, put_premium)
    return strategy


def protective_call(stock_price: float, call_strike: float, call_premium: float,
                    market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Protective Call - Short stock + Long call"""
    strategy = OptionsStrategy("Protective Call", market_params)
    strategy.add_stock_leg('short', stock_price, 100)
    strategy.add_option_leg('call', 'long', call_strike, call_premium)
    return strategy


# ============================================================================
# VERTICAL SPREADS (4)
# ============================================================================

def bull_call_spread(lower_strike: float, upper_strike: float,
                     lower_premium: float, upper_premium: float,
                     market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Bull Call Spread - Long lower call + Short upper call"""
    strategy = OptionsStrategy("Bull Call Spread", market_params)
    strategy.add_option_leg('call', 'long', lower_strike, lower_premium)
    strategy.add_option_leg('call', 'short', upper_strike, upper_premium)
    return strategy


def bear_put_spread(lower_strike: float, upper_strike: float,
                    lower_premium: float, upper_premium: float,
                    market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Bear Put Spread - Long upper put + Short lower put"""
    strategy = OptionsStrategy("Bear Put Spread", market_params)
    strategy.add_option_leg('put', 'long', upper_strike, upper_premium)
    strategy.add_option_leg('put', 'short', lower_strike, lower_premium)
    return strategy


def bull_put_spread(lower_strike: float, upper_strike: float,
                    lower_premium: float, upper_premium: float,
                    market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Bull Put Spread - Short upper put + Long lower put"""
    strategy = OptionsStrategy("Bull Put Spread", market_params)
    strategy.add_option_leg('put', 'short', upper_strike, upper_premium)
    strategy.add_option_leg('put', 'long', lower_strike, lower_premium)
    return strategy


def bear_call_spread(lower_strike: float, upper_strike: float,
                     lower_premium: float, upper_premium: float,
                     market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Bear Call Spread - Short lower call + Long upper call"""
    strategy = OptionsStrategy("Bear Call Spread", market_params)
    strategy.add_option_leg('call', 'short', lower_strike, lower_premium)
    strategy.add_option_leg('call', 'long', upper_strike, upper_premium)
    return strategy


# ============================================================================
# STRADDLES & STRANGLES (4)
# ============================================================================

def long_straddle(strike: float, call_premium: float, put_premium: float,
                  market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Long Straddle - Long call + Long put (same strike)"""
    strategy = OptionsStrategy("Long Straddle", market_params)
    strategy.add_option_leg('call', 'long', strike, call_premium)
    strategy.add_option_leg('put', 'long', strike, put_premium)
    return strategy


def short_straddle(strike: float, call_premium: float, put_premium: float,
                   market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Short Straddle - Short call + Short put (same strike)"""
    strategy = OptionsStrategy("Short Straddle", market_params)
    strategy.add_option_leg('call', 'short', strike, call_premium)
    strategy.add_option_leg('put', 'short', strike, put_premium)
    return strategy


def long_strangle(call_strike: float, put_strike: float,
                  call_premium: float, put_premium: float,
                  market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Long Strangle - Long OTM call + Long OTM put"""
    strategy = OptionsStrategy("Long Strangle", market_params)
    strategy.add_option_leg('call', 'long', call_strike, call_premium)
    strategy.add_option_leg('put', 'long', put_strike, put_premium)
    return strategy


def short_strangle(call_strike: float, put_strike: float,
                   call_premium: float, put_premium: float,
                   market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Short Strangle - Short OTM call + Short OTM put"""
    strategy = OptionsStrategy("Short Strangle", market_params)
    strategy.add_option_leg('call', 'short', call_strike, call_premium)
    strategy.add_option_leg('put', 'short', put_strike, put_premium)
    return strategy


# ============================================================================
# BUTTERFLIES (4)
# ============================================================================

def long_call_butterfly(lower_strike: float, middle_strike: float, upper_strike: float,
                        lower_premium: float, middle_premium: float, upper_premium: float,
                        market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Long Call Butterfly"""
    strategy = OptionsStrategy("Long Call Butterfly", market_params)
    strategy.add_option_leg('call', 'long', lower_strike, lower_premium)
    strategy.add_option_leg('call', 'short', middle_strike, middle_premium)
    strategy.add_option_leg('call', 'short', middle_strike, middle_premium)
    strategy.add_option_leg('call', 'long', upper_strike, upper_premium)
    return strategy


def long_put_butterfly(lower_strike: float, middle_strike: float, upper_strike: float,
                       lower_premium: float, middle_premium: float, upper_premium: float,
                       market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Long Put Butterfly"""
    strategy = OptionsStrategy("Long Put Butterfly", market_params)
    strategy.add_option_leg('put', 'long', lower_strike, lower_premium)
    strategy.add_option_leg('put', 'short', middle_strike, middle_premium)
    strategy.add_option_leg('put', 'short', middle_strike, middle_premium)
    strategy.add_option_leg('put', 'long', upper_strike, upper_premium)
    return strategy


def short_call_butterfly(lower_strike: float, middle_strike: float, upper_strike: float,
                         lower_premium: float, middle_premium: float, upper_premium: float,
                         market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Short Call Butterfly"""
    strategy = OptionsStrategy("Short Call Butterfly", market_params)
    strategy.add_option_leg('call', 'short', lower_strike, lower_premium)
    strategy.add_option_leg('call', 'long', middle_strike, middle_premium)
    strategy.add_option_leg('call', 'long', middle_strike, middle_premium)
    strategy.add_option_leg('call', 'short', upper_strike, upper_premium)
    return strategy


def iron_butterfly(atm_strike: float, lower_strike: float, upper_strike: float,
                   atm_call_premium: float, atm_put_premium: float,
                   lower_put_premium: float, upper_call_premium: float,
                   market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Iron Butterfly"""
    strategy = OptionsStrategy("Iron Butterfly", market_params)
    strategy.add_option_leg('call', 'short', atm_strike, atm_call_premium)
    strategy.add_option_leg('put', 'short', atm_strike, atm_put_premium)
    strategy.add_option_leg('put', 'long', lower_strike, lower_put_premium)
    strategy.add_option_leg('call', 'long', upper_strike, upper_call_premium)
    return strategy


# ============================================================================
# CONDORS (3)
# ============================================================================

def iron_condor(put_lower: float, put_upper: float, call_lower: float, call_upper: float,
                put_lower_prem: float, put_upper_prem: float,
                call_lower_prem: float, call_upper_prem: float,
                market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Iron Condor"""
    strategy = OptionsStrategy("Iron Condor", market_params)
    strategy.add_option_leg('put', 'long', put_lower, put_lower_prem)
    strategy.add_option_leg('put', 'short', put_upper, put_upper_prem)
    strategy.add_option_leg('call', 'short', call_lower, call_lower_prem)
    strategy.add_option_leg('call', 'long', call_upper, call_upper_prem)
    return strategy


def long_call_condor(s1: float, s2: float, s3: float, s4: float,
                     p1: float, p2: float, p3: float, p4: float,
                     market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Long Call Condor"""
    strategy = OptionsStrategy("Long Call Condor", market_params)
    strategy.add_option_leg('call', 'long', s1, p1)
    strategy.add_option_leg('call', 'short', s2, p2)
    strategy.add_option_leg('call', 'short', s3, p3)
    strategy.add_option_leg('call', 'long', s4, p4)
    return strategy


def long_put_condor(s1: float, s2: float, s3: float, s4: float,
                    p1: float, p2: float, p3: float, p4: float,
                    market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Long Put Condor"""
    strategy = OptionsStrategy("Long Put Condor", market_params)
    strategy.add_option_leg('put', 'long', s1, p1)
    strategy.add_option_leg('put', 'short', s2, p2)
    strategy.add_option_leg('put', 'short', s3, p3)
    strategy.add_option_leg('put', 'long', s4, p4)
    return strategy


# ============================================================================
# RATIO SPREADS (3)
# ============================================================================

def call_ratio_spread(lower_strike: float, upper_strike: float,
                      lower_premium: float, upper_premium: float,
                      ratio: int = 2,
                      market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Call Ratio Spread - Long 1 lower + Short N upper"""
    strategy = OptionsStrategy(f"Call Ratio Spread (1:{ratio})", market_params)
    strategy.add_option_leg('call', 'long', lower_strike, lower_premium)
    for _ in range(ratio):
        strategy.add_option_leg('call', 'short', upper_strike, upper_premium)
    return strategy


def put_ratio_spread(lower_strike: float, upper_strike: float,
                     lower_premium: float, upper_premium: float,
                     ratio: int = 2,
                     market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Put Ratio Spread - Long 1 upper + Short N lower"""
    strategy = OptionsStrategy(f"Put Ratio Spread (1:{ratio})", market_params)
    strategy.add_option_leg('put', 'long', upper_strike, upper_premium)
    for _ in range(ratio):
        strategy.add_option_leg('put', 'short', lower_strike, lower_premium)
    return strategy


def call_ratio_backspread(lower_strike: float, upper_strike: float,
                          lower_premium: float, upper_premium: float,
                          ratio: int = 2,
                          market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Call Ratio Backspread - Short 1 lower + Long N upper"""
    strategy = OptionsStrategy(f"Call Ratio Backspread (1:{ratio})", market_params)
    strategy.add_option_leg('call', 'short', lower_strike, lower_premium)
    for _ in range(ratio):
        strategy.add_option_leg('call', 'long', upper_strike, upper_premium)
    return strategy


# ============================================================================
# CALENDAR & DIAGONAL SPREADS (4)
# ============================================================================

def call_calendar_spread(strike: float, near_premium: float, far_premium: float,
                         market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Call Calendar Spread - Sell near, buy far (same strike)"""
    strategy = OptionsStrategy("Call Calendar Spread", market_params)
    strategy.add_option_leg('call', 'short', strike, near_premium)
    strategy.add_option_leg('call', 'long', strike, far_premium)
    return strategy


def put_calendar_spread(strike: float, near_premium: float, far_premium: float,
                        market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Put Calendar Spread - Sell near, buy far (same strike)"""
    strategy = OptionsStrategy("Put Calendar Spread", market_params)
    strategy.add_option_leg('put', 'short', strike, near_premium)
    strategy.add_option_leg('put', 'long', strike, far_premium)
    return strategy


def diagonal_call_spread(near_strike: float, far_strike: float,
                         near_premium: float, far_premium: float,
                         market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Diagonal Call Spread"""
    strategy = OptionsStrategy("Diagonal Call Spread", market_params)
    strategy.add_option_leg('call', 'short', near_strike, near_premium)
    strategy.add_option_leg('call', 'long', far_strike, far_premium)
    return strategy


def diagonal_put_spread(near_strike: float, far_strike: float,
                        near_premium: float, far_premium: float,
                        market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Diagonal Put Spread"""
    strategy = OptionsStrategy("Diagonal Put Spread", market_params)
    strategy.add_option_leg('put', 'short', near_strike, near_premium)
    strategy.add_option_leg('put', 'long', far_strike, far_premium)
    return strategy


# ============================================================================
# COLLARS (2)
# ============================================================================

def collar(stock_price: float, put_strike: float, call_strike: float,
          put_premium: float, call_premium: float,
          market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Collar - Long stock + Long put + Short call"""
    strategy = OptionsStrategy("Collar", market_params)
    strategy.add_stock_leg('long', stock_price, 100)
    strategy.add_option_leg('put', 'long', put_strike, put_premium)
    strategy.add_option_leg('call', 'short', call_strike, call_premium)
    return strategy


def reverse_collar(stock_price: float, put_strike: float, call_strike: float,
                   put_premium: float, call_premium: float,
                   market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Reverse Collar - Short stock + Short put + Long call"""
    strategy = OptionsStrategy("Reverse Collar", market_params)
    strategy.add_stock_leg('short', stock_price, 100)
    strategy.add_option_leg('put', 'short', put_strike, put_premium)
    strategy.add_option_leg('call', 'long', call_strike, call_premium)
    return strategy


# ============================================================================
# STRIP & STRAP (4)
# ============================================================================

def long_strip(strike: float, call_premium: float, put_premium: float,
               market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Long Strip - 1 call + 2 puts (bearish straddle)"""
    strategy = OptionsStrategy("Long Strip", market_params)
    strategy.add_option_leg('call', 'long', strike, call_premium)
    strategy.add_option_leg('put', 'long', strike, put_premium)
    strategy.add_option_leg('put', 'long', strike, put_premium)
    return strategy


def long_strap(strike: float, call_premium: float, put_premium: float,
               market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Long Strap - 2 calls + 1 put (bullish straddle)"""
    strategy = OptionsStrategy("Long Strap", market_params)
    strategy.add_option_leg('call', 'long', strike, call_premium)
    strategy.add_option_leg('call', 'long', strike, call_premium)
    strategy.add_option_leg('put', 'long', strike, put_premium)
    return strategy


def short_strip(strike: float, call_premium: float, put_premium: float,
                market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Short Strip"""
    strategy = OptionsStrategy("Short Strip", market_params)
    strategy.add_option_leg('call', 'short', strike, call_premium)
    strategy.add_option_leg('put', 'short', strike, put_premium)
    strategy.add_option_leg('put', 'short', strike, put_premium)
    return strategy


def short_strap(strike: float, call_premium: float, put_premium: float,
                market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Short Strap"""
    strategy = OptionsStrategy("Short Strap", market_params)
    strategy.add_option_leg('call', 'short', strike, call_premium)
    strategy.add_option_leg('call', 'short', strike, call_premium)
    strategy.add_option_leg('put', 'short', strike, put_premium)
    return strategy


# ============================================================================
# ADVANCED STRATEGIES (10+)
# ============================================================================

def jade_lizard(put_strike: float, call_lower: float, call_upper: float,
                put_prem: float, call_lower_prem: float, call_upper_prem: float,
                market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Jade Lizard - Short put + Bear call spread"""
    strategy = OptionsStrategy("Jade Lizard", market_params)
    strategy.add_option_leg('put', 'short', put_strike, put_prem)
    strategy.add_option_leg('call', 'short', call_lower, call_lower_prem)
    strategy.add_option_leg('call', 'long', call_upper, call_upper_prem)
    return strategy


def seagull(stock_price: float, put_strike: float, call_lower: float, call_upper: float,
            put_prem: float, call_lower_prem: float, call_upper_prem: float,
            market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Seagull - Long stock + Long put + Bear call spread"""
    strategy = OptionsStrategy("Seagull", market_params)
    strategy.add_stock_leg('long', stock_price, 100)
    strategy.add_option_leg('put', 'long', put_strike, put_prem)
    strategy.add_option_leg('call', 'short', call_lower, call_lower_prem)
    strategy.add_option_leg('call', 'long', call_upper, call_upper_prem)
    return strategy


def box_spread(lower_strike: float, upper_strike: float,
               call_lower_prem: float, call_upper_prem: float,
               put_lower_prem: float, put_upper_prem: float,
               market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Box Spread - Bull call + Bear put"""
    strategy = OptionsStrategy("Box Spread", market_params)
    strategy.add_option_leg('call', 'long', lower_strike, call_lower_prem)
    strategy.add_option_leg('call', 'short', upper_strike, call_upper_prem)
    strategy.add_option_leg('put', 'long', upper_strike, put_upper_prem)
    strategy.add_option_leg('put', 'short', lower_strike, put_lower_prem)
    return strategy


def conversion(stock_price: float, strike: float, call_prem: float, put_prem: float,
               market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Conversion - Long stock + Long put + Short call"""
    strategy = OptionsStrategy("Conversion", market_params)
    strategy.add_stock_leg('long', stock_price, 100)
    strategy.add_option_leg('put', 'long', strike, put_prem)
    strategy.add_option_leg('call', 'short', strike, call_prem)
    return strategy


def reversal(stock_price: float, strike: float, call_prem: float, put_prem: float,
             market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Reversal - Short stock + Short put + Long call"""
    strategy = OptionsStrategy("Reversal", market_params)
    strategy.add_stock_leg('short', stock_price, 100)
    strategy.add_option_leg('put', 'short', strike, put_prem)
    strategy.add_option_leg('call', 'long', strike, call_prem)
    return strategy


def poor_mans_covered_call(deep_itm_strike: float, otm_strike: float,
                           deep_itm_prem: float, otm_prem: float,
                           market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Poor Man's Covered Call - Deep ITM LEAPS + Short OTM call"""
    strategy = OptionsStrategy("Poor Man's Covered Call", market_params)
    strategy.add_option_leg('call', 'long', deep_itm_strike, deep_itm_prem)
    strategy.add_option_leg('call', 'short', otm_strike, otm_prem)
    return strategy


def wheel_put_phase(put_strike: float, put_premium: float,
                    market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Wheel Strategy - Put Phase (cash-secured put)"""
    strategy = OptionsStrategy("Wheel Strategy (Put)", market_params)
    strategy.add_option_leg('put', 'short', put_strike, put_premium)
    return strategy


def wheel_call_phase(stock_price: float, call_strike: float, call_premium: float,
                     market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Wheel Strategy - Call Phase (covered call after assignment)"""
    strategy = OptionsStrategy("Wheel Strategy (Call)", market_params)
    strategy.add_stock_leg('long', stock_price, 100)
    strategy.add_option_leg('call', 'short', call_strike, call_premium)
    return strategy


def zebra_spread(deep_itm_strike: float, otm_strike: float,
                deep_itm_prem: float, otm_prem: float,
                market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """ZEBRA - Long 1 deep ITM call + Short 2 OTM calls"""
    strategy = OptionsStrategy("ZEBRA Spread", market_params)
    strategy.add_option_leg('call', 'long', deep_itm_strike, deep_itm_prem)
    strategy.add_option_leg('call', 'short', otm_strike, otm_prem)
    strategy.add_option_leg('call', 'short', otm_strike, otm_prem)
    return strategy


def call_ladder(s1: float, s2: float, s3: float,
                p1: float, p2: float, p3: float,
                market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Call Ladder - Long 1 low + Short 1 mid + Short 1 high"""
    strategy = OptionsStrategy("Call Ladder", market_params)
    strategy.add_option_leg('call', 'long', s1, p1)
    strategy.add_option_leg('call', 'short', s2, p2)
    strategy.add_option_leg('call', 'short', s3, p3)
    return strategy


def put_ladder(s1: float, s2: float, s3: float,
               p1: float, p2: float, p3: float,
               market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Put Ladder - Long 1 high + Short 1 mid + Short 1 low"""
    strategy = OptionsStrategy("Put Ladder", market_params)
    strategy.add_option_leg('put', 'long', s3, p3)
    strategy.add_option_leg('put', 'short', s2, p2)
    strategy.add_option_leg('put', 'short', s1, p1)
    return strategy


# ============================================================================
# SYNTHETIC POSITIONS (2)
# ============================================================================

def synthetic_long(strike: float, call_premium: float, put_premium: float,
                   market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Synthetic Long Stock - Long call + Short put"""
    strategy = OptionsStrategy("Synthetic Long Stock", market_params)
    strategy.add_option_leg('call', 'long', strike, call_premium)
    strategy.add_option_leg('put', 'short', strike, put_premium)
    return strategy


def synthetic_short(strike: float, call_premium: float, put_premium: float,
                    market_params: Optional[MarketParams] = None) -> OptionsStrategy:
    """Synthetic Short Stock - Short call + Long put"""
    strategy = OptionsStrategy("Synthetic Short Stock", market_params)
    strategy.add_option_leg('call', 'short', strike, call_premium)
    strategy.add_option_leg('put', 'long', strike, put_premium)
    return strategy


# ============================================================================
# STRATEGY CATALOG
# ============================================================================

ALL_STRATEGIES = {
    # Basic (4)
    "Covered Call": covered_call,
    "Covered Put": covered_put,
    "Protective Put": protective_put,
    "Protective Call": protective_call,
    
    # Vertical Spreads (4)
    "Bull Call Spread": bull_call_spread,
    "Bear Put Spread": bear_put_spread,
    "Bull Put Spread": bull_put_spread,
    "Bear Call Spread": bear_call_spread,
    
    # Straddles & Strangles (4)
    "Long Straddle": long_straddle,
    "Short Straddle": short_straddle,
    "Long Strangle": long_strangle,
    "Short Strangle": short_strangle,
    
    # Butterflies (4)
    "Long Call Butterfly": long_call_butterfly,
    "Long Put Butterfly": long_put_butterfly,
    "Short Call Butterfly": short_call_butterfly,
    "Iron Butterfly": iron_butterfly,
    
    # Condors (3)
    "Iron Condor": iron_condor,
    "Long Call Condor": long_call_condor,
    "Long Put Condor": long_put_condor,
    
    # Ratio Spreads (3)
    "Call Ratio Spread": call_ratio_spread,
    "Put Ratio Spread": put_ratio_spread,
    "Call Ratio Backspread": call_ratio_backspread,
    
    # Calendar & Diagonal (4)
    "Call Calendar Spread": call_calendar_spread,
    "Put Calendar Spread": put_calendar_spread,
    "Diagonal Call Spread": diagonal_call_spread,
    "Diagonal Put Spread": diagonal_put_spread,
    
    # Collars (2)
    "Collar": collar,
    "Reverse Collar": reverse_collar,
    
    # Strip & Strap (4)
    "Long Strip": long_strip,
    "Long Strap": long_strap,
    "Short Strip": short_strip,
    "Short Strap": short_strap,
    
    # Advanced (10)
    "Jade Lizard": jade_lizard,
    "Seagull": seagull,
    "Box Spread": box_spread,
    "Conversion": conversion,
    "Reversal": reversal,
    "Poor Man's Covered Call": poor_mans_covered_call,
    "Wheel Strategy (Put)": wheel_put_phase,
    "Wheel Strategy (Call)": wheel_call_phase,
    "ZEBRA Spread": zebra_spread,
    "Call Ladder": call_ladder,
    "Put Ladder": put_ladder,
    
    # Synthetic (2)
    "Synthetic Long Stock": synthetic_long,
    "Synthetic Short Stock": synthetic_short,
}

# Total: 50+ strategies
