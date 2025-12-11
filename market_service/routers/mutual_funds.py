from fastapi import APIRouter, HTTPException
from mftool import Mftool

router = APIRouter()
mf = Mftool()

@router.get("/nav/{scheme_code}")
def get_mutual_fund_nav(scheme_code: str):
    """
    Fetch live NAV for Indian Mutual Funds.
    """
    try:
        # 1. Get Quote
        quote = mf.get_scheme_quote(scheme_code)
        
        # DEBUG: This will print the actual data to your VS Code terminal
        print(f"DEBUG DATA FOR {scheme_code}: {quote}")

        if not quote:
             raise HTTPException(status_code=404, detail="Scheme code invalid")

        # 2. Smart Key Search (Fixes the error)
        # Try 'last_nav', if missing try 'nav', if missing try 'Net Asset Value'
        nav = quote.get('last_nav') or quote.get('nav') or quote.get('Net Asset Value')
        date = quote.get('date') or quote.get('Date')

        return {
            "scheme_code": quote.get('scheme_code'),
            "scheme_name": quote.get('scheme_name'),
            "nav": nav,
            "date": date
        }

    except Exception as e:
        # Print the full error to terminal for debugging
        print(f"ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))