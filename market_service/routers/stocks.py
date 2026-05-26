from fastapi import APIRouter, HTTPException
import yfinance as yf
import time
import threading

router = APIRouter()

# Thread-safe in-memory cache for stock price and technical sentiments
price_cache = {}
sentiment_cache = {}
cache_lock = threading.Lock()
CACHE_TTL = 300  # Time-to-live: 5 minutes (300 seconds)

@router.get("/price/{symbol}")
def get_stock_price(symbol: str):
    """
    Fetch live stock data for Indian (NS/BO) or US stocks.
    Uses thread-safe caching to avoid yfinance rate limits.
    """
    sym = symbol.strip().upper()
    current_time = time.time()
    
    # 1. Check thread-safe Cache Hit
    with cache_lock:
        if sym in price_cache:
            cache_data = price_cache[sym]
            if current_time - cache_data['timestamp'] < CACHE_TTL:
                # Return cached data immediately
                return cache_data['data']

    # 2. Cache Miss - Fetch from yfinance
    try:
        stock = yf.Ticker(sym)
        price = stock.fast_info['last_price']
        prev_close = stock.fast_info['previous_close']
        
        change = price - prev_close
        change_percent = (change / prev_close) * 100

        result = {
            "symbol": sym,
            "current_price": round(price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "currency": stock.fast_info['currency']
        }
        
        # 3. Update Cache
        with cache_lock:
            price_cache[sym] = {
                "data": result,
                "timestamp": current_time
            }
            
        return result

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found or API error: {str(e)}")


@router.get("/sentiment/{symbol}")
def get_stock_sentiment(symbol: str):
    """
    Perform technical moving average analysis (SMA-50 vs SMA-200 crossover)
    to calculate dynamic technical sentiment. Uses 5-minute thread-safe caching.
    """
    sym = symbol.strip().upper()
    current_time = time.time()
    
    # 1. Check thread-safe Cache Hit
    with cache_lock:
        if sym in sentiment_cache:
            cache_data = sentiment_cache[sym]
            if current_time - cache_data['timestamp'] < CACHE_TTL:
                return cache_data['data']

    # 2. Cache Miss - Fetch 1y daily history
    try:
        stock = yf.Ticker(sym)
        history = stock.history(period="1y")
        if history.empty or len(history) < 50:
            raise HTTPException(status_code=400, detail=f"Insufficient history data for '{symbol}' to calculate moving averages.")
        
        current_price = float(history['Close'].iloc[-1])
        
        # 3. Calculate Simple Moving Averages
        sma_50 = float(history['Close'].rolling(window=min(50, len(history))).mean().iloc[-1])
        
        if len(history) >= 200:
            sma_200 = float(history['Close'].rolling(window=200).mean().iloc[-1])
        else:
            sma_200 = float(history['Close'].rolling(window=len(history)).mean().iloc[-1])
            
        # 4. Resolve technical crossover rules
        if current_price > sma_50 and sma_50 > sma_200:
            sentiment = "BULLISH"
            emoji = "📈"
            summary = f"{sym} is showing strong bullish momentum. The current price ({round(current_price, 2)}) is trading above its 50-day SMA ({round(sma_50, 2)}), which is positioned above the long-term 200-day SMA ({round(sma_200, 2)}), signaling sustained upward trend."
        elif current_price < sma_50 and sma_50 < sma_200:
            sentiment = "BEARISH"
            emoji = "📉"
            summary = f"{sym} is experiencing high selling pressure. The current price ({round(current_price, 2)}) is trading below its 50-day SMA ({round(sma_50, 2)}), which has slipped below the 200-day SMA ({round(sma_200, 2)}), indicating standard bearish configurations."
        else:
            sentiment = "NEUTRAL"
            emoji = "⚖️"
            summary = f"{sym} is currently consolidative. The current price ({round(current_price, 2)}) is trading in proximity to its technical averages (50-day SMA: {round(sma_50, 2)}, 200-day SMA: {round(sma_200, 2)}), with no active crossovers registered."
            
        result = {
            "symbol": sym,
            "current_price": round(current_price, 2),
            "sma_50": round(sma_50, 2),
            "sma_200": round(sma_200, 2),
            "sentiment": sentiment,
            "emoji": emoji,
            "summary": summary
        }
        
        # 5. Update Cache
        with cache_lock:
            sentiment_cache[sym] = {
                "data": result,
                "timestamp": current_time
            }
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock sentiment analysis failed for symbol '{symbol}': {str(e)}")