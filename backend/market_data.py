import requests

# Cache to avoid hitting API too frequently
_PRICE_CACHE = {}
_FX_CACHE = {}

class MarketData:
    def __init__(self):
        pass

    def get_ticker_symbol_tencent(self, ticker, market):
        """
        Convert user ticker to Tencent Finance format.
        Format: sh600519, sz000001, hk00700, usAAPL (US must be uppercase!)
        """
        if market == "US":
            return f"us{ticker.upper()}"
        elif market == "HK":
            # HK stocks need 5-digit code: 0700 -> hk00700
            return f"hk{ticker.zfill(5)}"
        elif market == "CN":
            # 6开头: 上海 (sh), 0或3开头: 深圳 (sz)
            if ticker.startswith("6"):
                return f"sh{ticker}"
            elif ticker.startswith("0") or ticker.startswith("3"):
                return f"sz{ticker}"
            else:
                return f"sh{ticker}"  # 默认上海
        return ticker

    def get_current_price(self, ticker, market):
        """
        Fetch current price from Tencent Finance API
        Returns CSV format: v_sh600519="1~name~code~price~..."
        """
        symbol = self.get_ticker_symbol_tencent(ticker, market)
        
        try:
            url = f"http://qt.gtimg.cn/q={symbol}"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                content = resp.text.strip()
                if '="' in content:
                    data_str = content.split('="')[1].rstrip('";')
                    parts = data_str.split('~')
                    
                    if len(parts) > 3:
                        price_str = parts[3].strip()
                        if price_str and price_str != "" and price_str != "0":
                            try:
                                price = float(price_str)
                                if price > 0:
                                    return price
                            except ValueError:
                                pass
        except Exception as e:
            print(f"Tencent API error for {symbol}: {e}")
        
        return 0.0

    def get_sector(self, ticker, market):
        """
        Sector classification - returns "Unknown" by default
        User should select from dropdown in UI
        """
        return "Unknown"

    def get_company_name(self, ticker, market):
        """
        Get company name from Tencent API
        - US stocks: parts[46] contains English name (e.g., "Apple Inc.")
        - CN/HK stocks: parts[1] contains Chinese name
        """
        symbol = self.get_ticker_symbol_tencent(ticker, market)
        
        try:
            url = f"http://qt.gtimg.cn/q={symbol}"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                content = resp.text.strip()
                if '="' in content:
                    data_str = content.split('="')[1].rstrip('";')
                    parts = data_str.split('~')
                    
                    if market == "US" and len(parts) > 46:
                        # parts[46] is English company name for US stocks
                        english_name = parts[46].strip()
                        if english_name and english_name != "":
                            return english_name
                    
                    if len(parts) > 1:
                        # parts[1] is company name (CN for CN/HK)
                        return parts[1]
        except Exception as e:
            print(f"Error fetching company name for {symbol}: {e}")
        
        return ticker

    def get_fx_rate(self, from_curr, to_curr="HKD"):
        """
        Get forex rate from Tencent API or fallback to hardcoded rates
        """
        if from_curr == to_curr:
            return 1.0
        
        pair_key = f"{from_curr}{to_curr}"
        
        if pair_key in _FX_CACHE:
            return _FX_CACHE[pair_key]
        
        try:
            # Tencent FX format: fx_susdcny
            symbol = f"fx_s{from_curr.lower()}{to_curr.lower()}"
            url = f"http://qt.gtimg.cn/q={symbol}"
            resp = requests.get(url, timeout=5)
            
            if resp.status_code == 200:
                content = resp.text.strip()
                if '="' in content:
                    data_str = content.split('="')[1].rstrip('";')
                    parts = data_str.split('~')
                    
                    if len(parts) > 1:
                        rate = float(parts[1])
                        if rate > 0:
                            _FX_CACHE[pair_key] = rate
                            return rate
        except Exception as e:
            print(f"Error fetching FX rate {from_curr} to {to_curr}: {e}")
        
        # Fallback to hardcoded approximate rates
        fallback_rates = {
            "USDHKD": 7.8,
            "USDCNY": 7.2,
            "CNYHKD": 1.08,
            "HKDUSD": 0.128,
            "HKDCNY": 0.92,
            "CNYUSD": 0.139
        }
        
        return fallback_rates.get(pair_key, 1.0)

    def get_option_price(self, ticker, strike, expiry, option_type, market):
        """
        Option pricing - not supported by free APIs
        Return intrinsic value as estimation
        """
        underlying_price = self.get_current_price(ticker, market)
        if not underlying_price:
            return 0.0
        
        if option_type == "Call":
            return max(0, underlying_price - strike)
        else:
            return max(0, strike - underlying_price)
