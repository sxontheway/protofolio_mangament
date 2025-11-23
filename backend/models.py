from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class Holding(BaseModel):
    id: Optional[str] = None
    ticker: str
    market: str  # "US", "HK", "CN"
    asset_type: str  # "Stock", "Cash", "Option"
    quantity: float
    cost_basis: float
    company_name: Optional[str] = None  # Company name
    custom_sector: Optional[str] = None  # User can override sector
    # Option specific
    option_type: Optional[str] = None  # "Call", "Put"
    strike_price: Optional[float] = None
    expiry_date: Optional[date] = None
    side: Optional[str] = None # "Long", "Short" (User said Sell Put/Call, so mostly Short)

class PortfolioSnapshot(BaseModel):
    id: Optional[str] = None
    date: date
    total_net_worth_hkd: float
    holdings_snapshot: List[dict]

class PortfolioSummary(BaseModel):
    total_net_worth_hkd: float
    holdings: List[dict]
    market_distribution: dict
    sector_distribution: dict
    ticker_distribution: dict
