FROM python:3.10-slim

WORKDIR /app

# Copy root requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI app code
COPY market_service/ /app/

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
