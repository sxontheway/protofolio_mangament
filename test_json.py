import json
from datetime import date
from pydantic import BaseModel
from typing import List, Optional

class Holding(BaseModel):
    ticker: str
    expiry_date: Optional[date] = None

class PortfolioSnapshot(BaseModel):
    date: date
    holdings: List[dict]

h = Holding(ticker="AAPL", expiry_date=date.today())
s = PortfolioSnapshot(date=date.today(), holdings=[h.dict()])

data = {"snapshots": [s.dict()]}

try:
    print("Dumping...")
    print(json.dumps(data, default=str))
    print("Success")
except Exception as e:
    print(f"Error: {e}")
