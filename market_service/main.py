from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stocks, mutual_funds

app = FastAPI(title="MeraPaisa Market Service")

# 1. Allow React to talk to this API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Register the Routers
app.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
app.include_router(mutual_funds.router, prefix="/funds", tags=["Mutual Funds"])

@app.get("/")
def home():
    return {"message": "Market Data Service is Running 🚀"}