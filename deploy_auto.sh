#!/bin/bash
set -e

PROJECT_ID="bisense-ai-2026"
REGION="us-central1"
SERVICE_NAME="bisense-ai-backend"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "========================================"
echo "  BISense AI — Cloud Run Deployment (Auto)"
echo "========================================"

# Skip login as we are already authenticated
gcloud config set project ${PROJECT_ID}

echo "[3/6] Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  aiplatform.googleapis.com \
  artifactregistry.googleapis.com

echo "[4/6] Building Docker image..."
gcloud builds submit --tag ${IMAGE} --timeout=1200s .

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

echo "[6/6] Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
echo ""
echo "========================================"
echo "  ✅ DEPLOYED SUCCESSFULLY!"
echo "  🌐 Live URL:    ${SERVICE_URL}"
echo "========================================"
