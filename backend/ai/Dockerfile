# Use official lightweight Python image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# 1. Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy the rest of the application code
COPY . .

# (Optional) Documentation only - Render ignores this effectively
EXPOSE 8000

# 3. FIX: Use 'sh -c' to read the $PORT variable provided by Render
# We default to 8000 if $PORT is not set (useful for local testing)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]