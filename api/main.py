"""
FastAPI Backend for Options Trading Platform
Main API with all endpoints
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
from datetime import datetime

# Import our strategies
from strategies import (
    OptionsStrategy, MarketParams, OptionLeg, StockLeg,
    ALL_STRATEGIES
)

# Create FastAPI app
app = FastAPI(
    title="Options Trading API",
    description="Professional options trading analysis",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELS
# ============================================================================

class StrategyRequest(BaseModel):
    strategy_name: str
    stock_price: float
    option_legs: List[Dict[str, Any]] = []
    stock_legs: List[Dict[str, Any]] = []
    market_params: Dict[str, Any]


class AnalysisResponse(BaseModel):
    current_pnl: float
    max_profit: float
    max_loss: float
    break_evens: List[float]
    greeks: Dict[str, float]
    risk_reward_ratio: Optional[float]
    payoff_data: Dict[str, List[float]]


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {
        "name": "Options Trading API",
        "version": "1.0.0",
        "status": "operational",
        "strategies": len(ALL_STRATEGIES)
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/strategy/analyze", response_model=AnalysisResponse)
async def analyze_strategy(request: StrategyRequest):
    """Analyze an options strategy"""
    try:
        # Create strategy object
        market_params = MarketParams(**request.market_params)
        strategy = OptionsStrategy(request.strategy_name, market_params)
        
        # Add legs
        for leg in request.option_legs:
            strategy.add_option_leg(
                leg['option_type'],
                leg['position'],
                leg['strike'],
                leg['premium']
            )
        
        for leg in request.stock_legs:
            strategy.add_stock_leg(
                leg['position'],
                leg['price'],
                leg.get('quantity', 100)
            )
        
        # Analyze
        analysis = strategy.analyze(request.stock_price)
        
        # Generate payoff data
        S_range = np.linspace(request.stock_price * 0.5, request.stock_price * 1.5, 300)
        payoff_exp = strategy.payoff_at_expiration(S_range)
        payoff_current = strategy.current_pnl_array(S_range)
        
        # Calculate risk/reward
        rr_ratio = None
        if analysis['max_loss_at_expiration'] < 0 and analysis['max_profit_at_expiration'] > 0:
            rr_ratio = analysis['max_profit_at_expiration'] / abs(analysis['max_loss_at_expiration'])
        
        return AnalysisResponse(
            current_pnl=analysis['current_pnl'],
            max_profit=analysis['max_profit_at_expiration'],
            max_loss=analysis['max_loss_at_expiration'],
            break_evens=analysis['break_even_at_expiration'],
            greeks=analysis['greeks'],
            risk_reward_ratio=rr_ratio,
            payoff_data={
                'stock_prices': S_range.tolist(),
                'payoff_expiration': payoff_exp.tolist(),
                'payoff_current': payoff_current.tolist()
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy/list")
async def list_strategies():
    """Get all available strategies"""
    strategies = {
        "basic": [
            "Covered Call", "Covered Put", "Protective Put", "Protective Call"
        ],
        "spreads": [
            "Bull Call Spread", "Bear Put Spread", "Bull Put Spread", "Bear Call Spread",
            "Call Calendar Spread", "Put Calendar Spread", "Diagonal Call Spread", "Diagonal Put Spread"
        ],
        "volatility": [
            "Long Straddle", "Short Straddle", "Long Strangle", "Short Strangle",
            "Long Strip", "Short Strip", "Long Strap", "Short Strap"
        ],
        "butterflies": [
            "Long Call Butterfly", "Long Put Butterfly", "Short Call Butterfly", "Iron Butterfly"
        ],
        "condors": [
            "Iron Condor", "Long Call Condor", "Long Put Condor"
        ],
        "advanced": [
            "Jade Lizard", "Seagull", "Box Spread", "Conversion", "Reversal",
            "Poor Man's Covered Call", "Wheel Strategy (Put)", "Wheel Strategy (Call)",
            "ZEBRA Spread", "Call Ladder", "Put Ladder", "Call Ratio Spread",
            "Put Ratio Spread", "Call Ratio Backspread", "Collar", "Reverse Collar",
            "Synthetic Long Stock", "Synthetic Short Stock"
        ]
    }
    return strategies


@app.get("/api/market/stocks")
async def get_stocks():
    """Get list of Argentine stocks"""
    return {
        "Bancos": {
            "GGAL": "Grupo Galicia",
            "BMA": "Banco Macro",
            "SUPV": "Supervielle",
            "BBAR": "BBVA Argentina"
        },
        "Energía": {
            "YPFD": "YPF",
            "PAMP": "Pampa Energía",
            "TGSU2": "TGS",
            "TRAN": "Transener"
        },
        "Telecom": {
            "TECO2": "Telecom Argentina",
            "LEDE": "Ledesma"
        },
        "Industria": {
            "ALUA": "Aluar",
            "TXAR": "Ternium",
            "COME": "Cresud"
        },
        "Utilities": {
            "EDN": "Edenor",
            "CECO2": "Central Costanera",
            "CEPU": "Central Puerto"
        }
    }


# Vercel serverless handler
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
