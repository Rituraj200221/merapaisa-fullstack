from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()

@router.get("/price/{symbol}")
def get_stock_price(symbol: str):
    """
    Fetch live stock data for Indian (NS/BO) or US stocks.
    Example: RELIANCE.NS, TCS.BO, AAPL
    """
    try:
        # 1. Initialize Ticker
        stock = yf.Ticker(symbol)
        
        # 2. Get Fast Info (Faster than .info dictionary)
        price = stock.fast_info['last_price']
        prev_close = stock.fast_info['previous_close']
        
        # 3. Calculate Change
        change = price - prev_close
        change_percent = (change / prev_close) * 100

        return {
            "symbol": symbol,
            "current_price": round(price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "currency": stock.fast_info['currency']
        }

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found or API error.")