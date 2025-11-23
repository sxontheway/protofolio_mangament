import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

import requests

# Cache to avoid hitting API too frequently
_PRICE_CACHE = {}
_FX_CACHE = {}
_SECTOR_CACHE = {}

class MarketData:
    def __init__(self):
        pass

    def get_ticker_symbol(self, ticker, market):
        """
        Convert user ticker to Sina/yfinance format.
        Sina Format:
        US: gb_aapl (lowercase)
        HK: hk00700
        CN: sh600519, sz000001
        """
        ticker = ticker.lower()
        if market == "US":
            return f"gb_{ticker}"
        elif market == "HK":
            # Sina expects hk00700
            return f"hk{ticker}"
        elif market == "CN":
            # Sina expects sh600519 or sz000001
            if ticker.startswith("6"):
                return f"sh{ticker}"
            else:
                return f"sz{ticker}"
        return ticker

    def get_yfinance_symbol(self, ticker, market):
        """Legacy yfinance symbol format"""
        if market == "HK":
            return f"{ticker}.HK".upper()
        elif market == "CN":
            if ticker.startswith("6"):
                return f"{ticker}.SS".upper()
            else:
                return f"{ticker}.SZ".upper()
        return ticker.upper()

    def get_current_price(self, ticker, market):
        # Try Sina First (No VPN needed, fast)
        sina_symbol = self.get_ticker_symbol(ticker, market)
        price = self.get_price_sina(sina_symbol)
        if price > 0:
            return price
            
        # Fallback to yfinance
        print(f"Sina failed for {ticker}, falling back to yfinance...")
        yf_symbol = self.get_yfinance_symbol(ticker, market)
        
        try:
            t = yf.Ticker(yf_symbol)
            price = t.fast_info.last_price
            if price is None:
                 hist = t.history(period="1d")
                 if not hist.empty:
                     price = hist["Close"].iloc[-1]
            return price if price else 0.0
        except Exception as e:
            print(f"Error fetching price for {yf_symbol}: {e}")
            return 0.0

    def get_price_sina(self, symbol):
        try:
            url = f"http://hq.sinajs.cn/list={symbol}"
            headers = {"Referer": "http://finance.sina.com.cn"}
            resp = requests.get(url, headers=headers, timeout=3)
            if resp.status_code == 200:
                # Format: var hq_str_gb_aapl="Apple Inc,230.00,..."
                content = resp.text
                if '="' in content:
                    data = content.split('="')[1].strip('";\n')
                    if not data: return 0.0
                    parts = data.split(',')
                    
                    # Parsing logic depends on market
                    if symbol.startswith("gb_"): # US
                        # parts[1] is current price
                        return float(parts[1])
                    elif symbol.startswith("hk"): # HK
                        # parts[6] is last close price
                        return float(parts[6])
                    elif symbol.startswith("sh") or symbol.startswith("sz"): # CN
                        # parts[3] is current price
                        return float(parts[3])
        except Exception as e:
            print(f"Sina API error for {symbol}: {e}")
        return 0.0

    def get_sector(self, ticker, market):
        # Sector still relies on yfinance as Sina doesn't provide structured metadata easily
        symbol = self.get_yfinance_symbol(ticker, market)
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
        symbol = self.get_yfinance_symbol(ticker, market)
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
