# BISense AI — Cloud Run Dockerfile (Backend + Frontend)
# Multi-stage build: Node.js for frontend, Python for backend

# ── Stage 1: Build Frontend ──
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# ── Stage 2: Python Backend + Serve Frontend ──
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/

# Copy built frontend into backend's serving directory
COPY --from=frontend-build /app/frontend/dist ./frontend_dist/

# Set working directory to backend
WORKDIR /app/backend

# Environment variables (set in Cloud Run)
ENV PORT=8080
ENV PYTHONPATH=/app/backend

EXPOSE 8080

CMD exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
