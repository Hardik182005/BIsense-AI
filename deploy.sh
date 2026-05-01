#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# BISense AI — Cloud Run Deployment Script
# Account: avinashgehi3@gmail.com
# Uses Vertex AI keys for chatbot (Gemini)
# ─────────────────────────────────────────────────────────────────────
set -e

PROJECT_ID="bisense-ai-2026"
REGION="us-central1"
SERVICE_NAME="bisense-ai-backend"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "========================================"
echo "  BISense AI — Cloud Run Deployment"
echo "  Account: avinashgehi3@gmail.com"
echo "========================================"

# 1. Login with the hackathon account
echo "[1/6] Authenticating as avinashgehi3@gmail.com..."
gcloud auth login avinashgehi3@gmail.com

# 2. Create/select project
echo "[2/6] Setting up GCP project: ${PROJECT_ID}"
gcloud projects create ${PROJECT_ID} --name="BISense AI Hackathon" 2>/dev/null || echo "Project exists"
gcloud config set project ${PROJECT_ID}

# 3. Link billing (required for Cloud Run)
echo "[2.5] Please ensure billing is enabled for project ${PROJECT_ID}"
echo "       Visit: https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_ID}"

# 4. Enable required APIs
echo "[3/6] Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  aiplatform.googleapis.com \
  artifactregistry.googleapis.com

# 5. Build & push Docker image
echo "[4/6] Building Docker image (frontend + backend)..."
gcloud builds submit --tag ${IMAGE} --timeout=1200s .

# 6. Deploy to Cloud Run with Vertex AI env vars
echo "[5/6] Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},VERTEX_LOCATION=${REGION},GEMINI_MODEL=gemini-2.0-flash-exp"

# 7. Get service URL
echo "[6/6] Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
echo ""
echo "========================================"
echo "  ✅ DEPLOYED SUCCESSFULLY!"
echo "  🌐 Live URL:    ${SERVICE_URL}"
echo "  📄 API Docs:    ${SERVICE_URL}/docs"
echo "  ❤️  Health:      ${SERVICE_URL}/health"
echo "  🤖 Chatbot:     Vertex AI (Gemini) enabled"
echo "  👤 Account:     avinashgehi3@gmail.com"
echo "========================================"
