from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import json

class Holding(BaseModel):
    ticker: str

class PortfolioSnapshot(BaseModel):
    date: date
    holdings_snapshot: List[dict]

try:
    h = Holding(ticker="AAPL")
    print(f"Created holding: {h}")
    
    # Try passing List[Holding] to List[dict]
    s = PortfolioSnapshot(date=date.today(), holdings_snapshot=[h])
    print(f"Created snapshot: {s}")
    
    print("Dumping snapshot...")
    print(s.dict())
    
except Exception as e:
    print(f"CAUGHT ERROR: {e}")
