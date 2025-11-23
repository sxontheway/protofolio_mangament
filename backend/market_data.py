import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

# Cache to avoid hitting API too frequently
_PRICE_CACHE = {}
_FX_CACHE = {}
_SECTOR_CACHE = {}

class MarketData:
    def __init__(self):
        pass

    def get_ticker_symbol(self, ticker, market):
        """
        Convert user ticker to yfinance format.
        US: AAPL -> AAPL
        HK: 0700 -> 0700.HK
        CN: 600519 -> 600519.SS (Shanghai) or .SZ (Shenzhen). 
            This is tricky, might need user to specify or try both.
            For simplicity, let's assume user inputs full suffix for CN or we try to guess.
            Let's assume user inputs: 0700.HK, AAPL, 600519.SS
        """
        # If user already provided suffix, trust it.
        if "." in ticker:
            return ticker.upper()
        
        if market == "HK":
            return f"{ticker}.HK"
        elif market == "CN":
            # Default to SS if not specified? Or maybe try both?
            # Let's assume user inputs raw code for CN, we default to SS for 60xxxx, SZ for 00xxxx/30xxxx
            if ticker.startswith("6"):
                return f"{ticker}.SS"
            else:
                return f"{ticker}.SZ"
        return ticker.upper()

    def get_current_price(self, ticker, market):
        symbol = self.get_ticker_symbol(ticker, market)
        if symbol in _PRICE_CACHE:
            # Simple in-memory cache for now, valid for this session or short time
            # For a real app, check timestamp
            pass

        try:
            t = yf.Ticker(symbol)
            # fast_info is faster than history
            price = t.fast_info.last_price
            if price is None:
                 # Fallback
                 hist = t.history(period="1d")
                 if not hist.empty:
                     price = hist["Close"].iloc[-1]
            return price
        except Exception as e:
            print(f"Error fetching price for {symbol}: {e}")
            return 0.0

    def get_sector(self, ticker, market):
        symbol = self.get_ticker_symbol(ticker, market)
        if symbol in _SECTOR_CACHE:
            return _SECTOR_CACHE[symbol]
        
        try:
            t = yf.Ticker(symbol)
            sector = t.info.get("sector", "Unknown")
            _SECTOR_CACHE[symbol] = sector
            return sector
        except:
            return "Unknown"

    def get_company_name(self, ticker, market):
        symbol = self.get_ticker_symbol(ticker, market)
        try:
            t = yf.Ticker(symbol)
            # Try shortName first, then longName
            name = t.info.get("shortName") or t.info.get("longName") or ticker
            return name
        except:
            return ticker

    def get_fx_rate(self, from_curr, to_curr="HKD"):
        if from_curr == to_curr:
            return 1.0
        
        pair = f"{from_curr}{to_curr}=X"
        if pair in _FX_CACHE:
            return _FX_CACHE[pair]
        
        try:
            t = yf.Ticker(pair)
            rate = t.fast_info.last_price
            if rate:
                _FX_CACHE[pair] = rate
                return rate
        except:
            pass
        return 1.0

    def get_option_price(self, ticker, strike, expiry, option_type, market):
        """
        Best effort option price fetching.
        yfinance option support is spotty for non-US.
        For US, we can try to construct the symbol.
        Symbol format: Ticker + YYMMDD + C/P + Strike (00000.000)
        Example: AAPL231117C00150000
        """
        if market != "US":
            # Non-US options are hard to fetch via yfinance automatically without exact symbol
            # Return 0 or intrinsic value?
            # Let's return 0 for now, or maybe user needs to input price manually if it fails?
            # Requirement said "don't want to input".
            # Fallback: Intrinsic value
            underlying_price = self.get_current_price(ticker, market)
            if not underlying_price:
                return 0.0
            
            if option_type == "Call":
                return max(0, underlying_price - strike)
            else:
                return max(0, strike - underlying_price)

        # Try to construct US option symbol
        try:
            exp_str = expiry.strftime("%y%m%d")
            type_char = "C" if option_type == "Call" else "P"
            strike_str = f"{int(strike*1000):08d}"
            opt_symbol = f"{ticker}{exp_str}{type_char}{strike_str}"
            
            t = yf.Ticker(opt_symbol)
            price = t.fast_info.last_price
            if price:
                return price
        except:
            pass
        
        # Fallback to intrinsic
        underlying_price = self.get_current_price(ticker, market)
        if option_type == "Call":
            return max(0, underlying_price - strike)
        else:
            return max(0, strike - underlying_price)
