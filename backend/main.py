from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import date, datetime
from .models import Holding, PortfolioSnapshot, PortfolioSummary
from .data_manager import DataManager
from .market_data import MarketData

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_manager = DataManager()
market_data = MarketData()

@app.get("/holdings", response_model=List[Holding])
def get_holdings():
    return data_manager.get_holdings()

@app.post("/holdings")
def add_holding(holding: Holding):
    data_manager.add_holding(holding)
    return {"status": "success"}

@app.put("/holdings/{holding_id}")
def update_holding(holding_id: str, holding: Holding):
    holding.id = holding_id
    data_manager.update_holding(holding)
    return {"status": "success"}

@app.delete("/holdings/{holding_id}")
def delete_holding(holding_id: str):
    data_manager.delete_holding(holding_id)
    return {"status": "success"}

@app.get("/portfolio/summary", response_model=PortfolioSummary)
def get_portfolio_summary():
    holdings = data_manager.get_holdings()
    total_net_worth_hkd = 0.0
    
    summary_holdings = []
    market_dist = {"US": 0, "HK": 0, "CN": 0, "Cash": 0}
    sector_dist = {}
    ticker_dist = {}

    for h in holdings:
        # 1. Get Current Price & FX
        if h.asset_type == "Cash":
            price = 1.0
            # FX
            currency = "HKD"
            if h.market == "US": currency = "USD"
            elif h.market == "CN": currency = "CNY"
            fx = market_data.get_fx_rate(currency)
            market_val_hkd = h.quantity * fx
            
            # Distribution
            market_dist["Cash"] += market_val_hkd
            
            # Cost value in HKD
            cost_value_hkd = h.cost_basis * h.quantity * fx
            
            summary_holdings.append({
                **h.dict(),
                "current_price": 1.0,
                "market_value_hkd": market_val_hkd,
                "cost_value_hkd": cost_value_hkd,
                "sector": "Cash"
            })
            
        elif h.asset_type == "Stock":
            price = market_data.get_current_price(h.ticker, h.market)
            currency = "HKD"
            if h.market == "US": currency = "USD"
            elif h.market == "CN": currency = "CNY"
            fx = market_data.get_fx_rate(currency)
            
            # Handle None values from yfinance
            if price is None:
                price = 0.0
                print(f"Warning: Could not fetch price for {h.ticker} ({h.market})")
            if fx is None:
                fx = 1.0
                print(f"Warning: Could not fetch FX rate for {currency}")
            
            market_val_hkd = h.quantity * price * fx
            total_net_worth_hkd += market_val_hkd
            
            # Auto-fetch company name if not provided
            if not h.company_name:
                company_name = market_data.get_company_name(h.ticker, h.market)
            else:
                company_name = h.company_name
            
            # Sector - use custom_sector if provided, otherwise fetch
            if h.custom_sector:
                sector = h.custom_sector
            else:
                sector = market_data.get_sector(h.ticker, h.market)
            
            # Distributions
            market_dist[h.market] = market_dist.get(h.market, 0) + market_val_hkd
            sector_dist[sector] = sector_dist.get(sector, 0) + market_val_hkd
            ticker_dist[h.ticker] = ticker_dist.get(h.ticker, 0) + market_val_hkd
            
            # Calculate cost value in HKD for accurate P/L calculation
            cost_value_hkd = h.cost_basis * h.quantity * fx
            
            summary_holdings.append({
                **h.dict(),
                "current_price": price,
                "market_value_hkd": market_val_hkd,
                "cost_value_hkd": cost_value_hkd,
                "sector": sector,
                "company_name": company_name
            })

        elif h.asset_type == "Option":
            # Option Logic
            # Price (Premium)
            price = market_data.get_option_price(h.ticker, h.strike_price, h.expiry_date, h.option_type, h.market)
            
            currency = "HKD"
            if h.market == "US": currency = "USD"
            elif h.market == "CN": currency = "CNY"
            fx = market_data.get_fx_rate(currency)
            
            # Handle None values
            if price is None:
                price = 0.0
                print(f"Warning: Could not fetch option price for {h.ticker}")
            if fx is None:
                fx = 1.0
                print(f"Warning: Could not fetch FX rate for {currency}")
            
            # Market Value of the option position itself (Premium * 100 * Contracts)
            # If Short (Sell), value is negative debt, but for Net Worth it's usually (Cash received - Current Cost to Close)
            # But simpler: Current Market Value = Price * 100 * Quantity.
            # If I sold, I have -1 quantity. So Value is negative.
            # Wait, user said "Sell Put", usually we track quantity as negative for short?
            # Let's assume quantity is signed. -1 for Short.
            
            market_val_hkd = h.quantity * price * 100 * fx
            total_net_worth_hkd += market_val_hkd
            
            # Margin / Exposure Calculation for Sell Put
            # User Requirement: "Sell Put ... extra calculate Potential Exercise Value/Margin (Strike * 100 * Contracts)"
            # And "add this to that company's proportion in summary"
            
            exposure_val_hkd = 0
            if h.option_type == "Put" and h.quantity < 0:
                # Sell Put
                exposure_val_hkd = abs(h.quantity) * h.strike_price * 100 * fx
            
            # For distribution, user wants to see this exposure in Ticker Pie Chart?
            # "In summary also count this to that company's proportion"
            # So for Ticker Dist, we add exposure? Or just market value?
            # "Pie Chart 3 (By Ticker): ... (Stock and sell put margin both count as position, but different transparency)"
            # So yes, add exposure to ticker_dist.
            
            ticker_dist[h.ticker] = ticker_dist.get(h.ticker, 0) + exposure_val_hkd
            
            # What about Market Dist? Usually options count towards their market.
            # Should we count exposure or market value? Usually market value for Net Worth.
            # But for "Allocation", maybe exposure? 
            # Let's stick to Market Value for Net Worth, but Exposure for "Allocation" charts if that's what user implies.
            # User said "Pie Chart 1 ... Cash/HK/US/A".
            # Let's add Market Value to Market Dist (because that's real money).
            market_dist[h.market] = market_dist.get(h.market, 0) + market_val_hkd
            
            # Cost value in HKD for options
            cost_value_hkd = h.cost_basis * abs(h.quantity) * 100 * fx
            
            summary_holdings.append({
                **h.dict(),
                "current_price": price,
                "market_value_hkd": market_val_hkd,
                "cost_value_hkd": cost_value_hkd,
                "exposure_value_hkd": exposure_val_hkd,
                "sector": "Option" # Or underlying sector?
            })
            
            # If we want sector distribution to reflect exposure too?
            # "Pie Chart 2 (By Sector)"
            # Let's fetch underlying sector
            sector = market_data.get_sector(h.ticker, h.market)
            # Add exposure to sector dist? Or market value?
            # Given the "Sell Put" emphasis, likely wants to see exposure.
            # But mixing Market Value (Stocks) and Exposure (Options) in one pie chart is mathematically weird (sum > 100% net worth).
            # But user asked for it.
            sector_dist[sector] = sector_dist.get(sector, 0) + exposure_val_hkd

    # Normalize distributions? Or just return values?
    # Frontend can handle % calculation.
    
    return PortfolioSummary(
        total_net_worth_hkd=total_net_worth_hkd,
        holdings=summary_holdings,
        market_distribution=market_dist,
        sector_distribution=sector_dist,
        ticker_distribution=ticker_dist
    )

@app.post("/snapshot")
def create_snapshot():
    summary = get_portfolio_summary()
    snapshot = PortfolioSnapshot(
        date=date.today(),
        total_net_worth_hkd=summary.total_net_worth_hkd,
        holdings_snapshot=summary.holdings
    )
    data_manager.save_snapshot(snapshot)
    return {"status": "success", "snapshot": snapshot}

@app.get("/history")
def get_history():
    return data_manager.get_history()

@app.delete("/history/{snapshot_id}")
def delete_history_snapshot(snapshot_id: str):
    data_manager.delete_snapshot(snapshot_id)
    return {"status": "success"}

@app.post("/snapshot/{snapshot_id}/restore")
def restore_snapshot(snapshot_id: str):
    """
    Restore a historical snapshot's holdings to current holdings.
    Does NOT create a new snapshot - user must manually click 'Add Snapshot' after.
    """
    # Find the snapshot
    history = data_manager.get_history()
    snapshot = next((s for s in history if s.get('id') == snapshot_id), None)
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    # Replace current holdings with snapshot's holdings
    data_manager.data["holdings"] = snapshot["holdings_snapshot"]
    data_manager._save_data()
    
    return {"status": "success", "message": "Holdings restored from snapshot"}

@app.get("/export")
def export_data():
    """Export all portfolio data as JSON"""
    return data_manager.data

@app.post("/import")
def import_data(data: dict, strategy: str = "current"):
    """
    Import portfolio data with strategy:
    - 'current': Replace current holdings with imported data. Does NOT create snapshot or modify history.
    - 'full': Completely replace all data (current holdings + history snapshots) with imported data.
    """
    import traceback
    try:
        if strategy == "full":
            # Full Overwrite: Replace everything
            data_manager.data = data
            data_manager._save_data()
            return {"status": "success", "message": "Full import completed. All data replaced."}
        
        else: # strategy == 'current' (Default)
            # Update Current Holdings Only: Do NOT touch snapshots
            if "holdings" in data:
                new_holdings = []
                for h in data["holdings"]:
                    try:
                        new_holdings.append(Holding(**h))
                    except Exception as e:
                        print(f"Skipping invalid holding: {e}")
                data_manager.data["holdings"] = [h.dict() for h in new_holdings]
                print(f"Imported {len(new_holdings)} holdings as current")
            
            # Do NOT create backup snapshot, do NOT modify existing snapshots
            data_manager._save_data()
            return {"status": "success", "message": "Current holdings updated. Use 'Update Snapshot' button to save to history."}
    except Exception as e:
        print(f"CRITICAL IMPORT ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
