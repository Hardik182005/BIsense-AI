<p align="center">
  <img src="https://img.shields.io/badge/BISense_AI-v1.0-orange?style=for-the-badge&logo=google-cloud&logoColor=white" alt="BISense AI" />
  <img src="https://img.shields.io/badge/Hackathon-BIS_Standards_2026-blue?style=for-the-badge" alt="BIS Hackathon" />
  <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge" alt="Live" />
</p>

<h1 align="center">🏗️ BISense AI</h1>
<h3 align="center">AI-Powered BIS Standards Recommendation Engine for Indian MSMEs</h3>

<p align="center">
  <strong>
    <a href="https://bisense-ai-2026.web.app">🌐 Live Demo</a> · 
    <a href="https://bisense-ai-backend-614621506326.us-central1.run.app/health">⚡ Backend API</a> · 
    <a href="https://bisense-ai-backend-614621506326.us-central1.run.app/docs">📖 API Docs</a>
  </strong>
</p>

> [!TIP]
> **No Local Setup Required**: For the easiest evaluation, simply run the **[Live Demo at bisense-ai-2026.web.app](https://bisense-ai-2026.web.app)**. You do NOT need to download any models or install dependencies to experience the full BISense AI platform.

> [!IMPORTANT]
> **Performance Note for Judges**: 
> BISense AI uses a sophisticated local embedding model (`all-MiniLM-L6-v2`) and a vector engine (`FAISS`) for high-precision retrieval. 
> - **First Query Warm-up**: The very first query after a cold-start deployment may take ~2-4 seconds as the model is loaded into the Cloud Run container's RAM. 
> - **Subsequent Queries**: All following queries will be blazing fast (**<0.5s**) once the engine is pre-warmed. 
> - **Automatic Pre-warming**: We have implemented an `on_event("startup")` handler to pre-warm the engine during server boot to minimize this effect.

---

## 🎯 Problem Statement

Indian MSMEs in the building materials sector face significant challenges navigating the complex landscape of **Bureau of Indian Standards (BIS)** compliance. With **496 verified standards** across all 27 sections of the building materials code, manufacturers struggle to:

- Identify the **correct standard** for their specific product
- Understand **compliance requirements** and certification pathways
- Navigate standards in **regional languages** (Hindi, Marathi, Gujarati, Tamil)
- Maintain **zero-hallucination** accuracy in standard recommendations

**BISense AI** solves this with a production-grade, AI-powered compliance intelligence platform. We have automatically extracted and indexed the **entire 929-page BIS SP 21 dataset** (496 unique standards) to ensure 100% dataset coverage and zero hallucinations.

---

## 🏆 Evaluation Results

```
========================================
   BIS HACKATHON EVALUATION RESULTS
========================================
Total Queries Evaluated : 10
Hit Rate @3             : 100.00%     (Target: >80%)    ✅ EXCEEDS
MRR @5                  : 1.0000      (Target: >0.7)    ✅ PERFECT
Avg Latency             : 0.06 sec    (Target: <5 sec)  ✅ 80x FASTER
========================================
```

| Metric | Target | Achieved | Status |
|:---|:---|:---|:---:|
| **Hit Rate @3** | > 80% | **100.00%** | ✅ |
| **MRR @5** | > 0.70 | **1.0000** | ✅ |
| **Avg Latency** | < 5.0s | **0.06s** | ✅ |
| **No Hallucinations** | 100% clean | **100%** | ✅ |
| **Relevance Score** | High (1-5) | **5/5** | ✅ |

---

## 🚀 Live Deployment

| Component | URL | Technology |
|:---|:---|:---|
| **Frontend** | [bisense-ai-2026.web.app](https://bisense-ai-2026.web.app) | Firebase Hosting (CDN) |
| **Backend API** | [Cloud Run Endpoint](https://bisense-ai-backend-614621506326.us-central1.run.app) | Google Cloud Run |
| **API Documentation** | [Swagger UI](https://bisense-ai-backend-614621506326.us-central1.run.app/docs) | FastAPI Auto-Docs |

---

## ✨ Key Features

### 🔍 Intelligent Standard Retrieval
- **Hybrid Vector RAG (FAISS) + BM25** — Combines AI-powered vector similarity (all-MiniLM-L6-v2) with full BM25 (with IDF) scoring.
- **Full Dataset Coverage (496 Standards)** — Automatically indexed from the entire 929-page building materials manual.
- **Hallucination Guard** — Every result is validated against the official 496-entry registry. Zero fabricated standards.

### 🤖 AI-Powered Chatbot (Vertex AI / Gemini 2.0 Flash)
- **Natural Language Understanding** — Ask questions in plain English or regional languages
- **Voice Input (STT)** — Speak your query using the browser's Web Speech API
- **Voice Output (TTS)** — Bot responses are spoken aloud via browser SpeechSynthesis
- **Contextual Conversations** — Multi-turn dialogue with conversation memory

### 🌐 Regional Language Support
- **Hindi (हिन्दी)** — सीमेंट, स्टील, सरिया
- **Marathi (मराठी)** — बांधकाम, पोलाद, सिमेंट
- **Gujarati (ગુજરાતી)** — બાંધકામ, સ્ટીલ, સિમેન્ટ
- **Tamil (தமிழ்)** — Auto-detected via Unicode range analysis

### 📊 Analytics & Rule Book Dashboard
- **Real-time Per-Query Metrics** — Hit@3, MRR, Latency tracked per search
- **Radar Chart** — Visual alignment with hackathon evaluation criteria
- **Latency Performance Graph** — Historical query latency visualization
- **Category Distribution** — Usage breakdown across material categories

### 🕸️ Compliance Graph Engine
- **Interactive Knowledge Graph** — Visualize relationships between primary, supporting, and related standards
- **Certification Pathway** — Product → Standard → Testing → BIS ISI Mark

### ✅ BIS Readiness Scoring
- **0-100 Score** — Based on query clarity, technical depth, and standard confidence
- **Risk Assessment** — Low / Medium / High risk classification
- **Actionable Insights** — Missing information detection with specific recommendations

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    FIREBASE HOSTING (CDN)                     │
│                  bisense-ai-2026.web.app                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              React + Vite Frontend                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ Landing  │ │Compliance│ │Analytics │ │Standards │ │  │
│  │  │  Page    │ │  Check   │ │Rule Book │ │ Browser  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │Dashboard │ │Compliance│ │ History  │ │ Chatbot  │ │  │
│  │  │  View    │ │  Graph   │ │  Page    │ │(Voice AI)│ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                            │ /api/**                         │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              GOOGLE CLOUD RUN (Backend)                │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │              FastAPI Application                 │  │  │
│  │  │  /api/compliance/search  → Hybrid RAG Pipeline   │  │  │
│  │  │  /api/chat               → Vertex AI Gemini      │  │  │
│  │  │  /api/voice/tts          → Google Cloud TTS      │  │  │
│  │  │  /api/analytics          → Metrics Engine        │  │  │
│  │  │  /api/standards          → Registry Browser      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                         │                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ BIS Registry │  │  Translator  │  │  Gemini AI  │ │  │
│  │  │ (496 Standards)│  │ (4 langs)    │  │ (2.0 Flash) │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
BISense-AI/
├── README.md                    # This file
├── inference.py                 # 🔴 MANDATORY: Hackathon inference script
├── eval_script.py               # 🔴 MANDATORY: Evaluation script
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Multi-stage Cloud Run build
├── firebase.json                # Firebase Hosting configuration
├── cloudbuild.yaml              # CI/CD pipeline
├── dataset.pdf                  # Official BIS SP 21 dataset
│
├── data/                        # 📊 Evaluation Results
│   ├── public_test_set.json     # Public test queries
│   ├── results.json             # Inference output (100% Hit Rate)
│   └── sample_output.json       # Expected output format
│
├── src/                         # 🧠 Main Application Logic
│   ├── app/                     # FastAPI Backend
│   │   ├── main.py              # Application entry point
│   │   └── routers/
│   │       ├── compliance.py    # Compliance search endpoint
│   │       ├── chat.py          # Vertex AI chatbot
│   │       ├── voice.py         # TTS/STT endpoint
│   │       ├── analytics.py     # Metrics & telemetry
│   │       └── standards.py     # Standards browser API
│   │
│   ├── src/                     # Core Engine
│   │   ├── retriever.py         # Hybrid BM25 + Semantic retrieval
│   │   ├── translator.py        # Regional language translator
│   │   └── gemini_engine.py     # Vertex AI integration
│   │
│   ├── data/
│   │   └── bis_registry.json    # Curated BIS standards database
│   │
│   └── frontend/                # React + Vite Frontend
│       ├── src/
│       │   ├── App.jsx          # Router & layout
│       │   ├── index.css        # Design system (Midnight Slate theme)
│       │   ├── components/
│       │   │   ├── Chatbot.jsx  # AI chatbot with voice
│       │   │   └── Navbar.jsx   # Navigation bar
│       │   └── pages/
│       │       ├── LandingPage.jsx      # Hero & features
│       │       ├── CompliancePage.jsx   # Main search engine
│       │       ├── AnalyticsPage.jsx    # Rule Book metrics
│       │       ├── DashboardPage.jsx    # Analysis dashboard
│       │       ├── GraphPage.jsx        # Compliance graph
│       │       ├── StandardsPage.jsx    # Standards browser
│       │       ├── HistoryPage.jsx      # Search history
│       │       └── ChecklistPage.jsx    # Compliance checklist
│       ├── package.json
│       └── vite.config.js
│
└── deploy.sh                    # One-click deployment script
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 18 + Vite | Blazing-fast SPA with HMR |
| **Styling** | Custom CSS (Midnight Slate) | Premium dark theme, glassmorphism |
| **Charts** | Recharts | Analytics visualization |
| **Backend** | FastAPI (Python 3.11) | High-performance async API |
| **AI Engine** | Vertex AI (Gemini 2.0 Flash) | Conversational AI & query understanding |
| **Voice** | Web Speech API + SpeechSynthesis | STT input + TTS output |
| **Retrieval** | Hybrid Vector RAG (FAISS) + BM25 | 496-standard full coverage matching |
| **Hosting** | Firebase Hosting | Global CDN for frontend |
| **Backend Hosting** | Google Cloud Run | Serverless, auto-scaling backend |
| **CI/CD** | Cloud Build | Automated deployment pipeline |

---

## ⚡ Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Cloud SDK (authenticated)

### 1. Clone & Install

```bash
git clone https://github.com/Hardik182005/BIsense-AI.git
cd BIsense-AI

# Backend
pip install -r requirements.txt

# Frontend
cd src/frontend && npm install && cd ../..
```

### 2. Run Inference (Hackathon Evaluation)

```bash
python inference.py --input data/public_test_set.json --output data/results.json
python eval_script.py --results data/results.json --input data/public_test_set.json
```

### 3. Start Development Server

```bash
# Terminal 1: Backend
cd src && uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd src/frontend && npm run dev
```

### 4. Deploy to Cloud

```bash
# Frontend → Firebase
cd src/frontend && npm run build && cd ../..
firebase deploy --only hosting

# Backend → Cloud Run
gcloud run deploy bisense-ai-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## ⚙️ Detailed Configuration

### 1. Environment Variables
The application requires a `.env` file in the root directory for Vertex AI (Gemini) integration. Create a file named `.env`:
```env
PROJECT_ID=bisense-ai-2026
LOCATION=us-central1
# Google Cloud credentials path
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

### 2. Local Model Setup (Offline Use)
BISense AI uses `all-MiniLM-L6-v2` for dense retrieval. By default, it downloads on first run. To pre-download for air-gapped/offline environments:
```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
model.save('./models/all-MiniLM-L6-v2')
```
Then update `src/src/retriever.py` to point to the local `./models/` path.

### 3. Modifying the Input Dataset
The "Ground Truth" for all recommendations is stored in:
`src/data/bis_registry.json`

**To add a new standard:**
Add a new JSON object to the array following this schema:
```json
{
  "standard_id": "IS 1234: 2026",
  "title": "Example Standard Title",
  "category": "Cement",
  "scope": "Detailed scope of the standard...",
  "keywords": ["cement", "strength", "testing"],
  "related_standards": ["IS 269", "IS 455"]
}
```
The retrieval engine automatically re-indexes this file on server startup.

### 4. Adjusting Retrieval Logic
You can tune the hybrid retrieval weights in `src/src/retriever.py`:
- `vector_weight` (Default: 0.7) - Importance of semantic meaning.
- `bm25_weight` (Default: 0.3) - Importance of exact keyword matching.
- `confidence_threshold` (Default: 0.15) - Filters out irrelevant results.

---

---

## 🔬 Retrieval Pipeline

```
User Query (any language)
       │
       ▼
┌─────────────────┐
│ Language Detect  │  Unicode range analysis (Hindi/Marathi/Gujarati/Tamil)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Translate      │  Regional vocab → English normalization
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Category Detect  │  Cement / Steel / Concrete / Aggregates
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│    Hybrid Scoring            │
│ 0.3 × BM25 + 0.7 × Vector Sem│
│  × Category Boost (1.3x)    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│ Hallucination    │  Validate all IDs against official registry
│ Guard            │  (zero fabricated standards)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Ranked Results   │  Top-K with confidence scores & reasoning
└─────────────────┘
```

---

## 🎨 UI Screenshots

| Landing Page | Compliance Check | Analytics Dashboard |
|:---:|:---:|:---:|
| Premium hero with live search | Multi-step AI analysis pipeline | Rule Book metrics + radar chart |

| AI Chatbot | Compliance Graph | Standards Browser |
|:---:|:---:|:---:|
| Voice-enabled Gemini chatbot | Interactive knowledge graph | Filter by category & search |

---

## 🔒 Security & Compliance

- **Zero Hallucinations** — Every standard ID validated against the official BIS registry
- **No fabricated data** — Retrieval-only architecture (no generative standard creation)
- **Verified badge** — All results carry a `✓ Verified BIS` marker
- **Evidence source** — Every recommendation traceable to the official BIS SP 21 dataset

---

## 👥 Team

Built with ❤️ for the **BIS Standards Recommendation Engine Hackathon 2026**

---

## 📄 License

This project was built for the BIS Hackathon 2026. All BIS standard data is sourced from the official BIS SP 21 (Summaries of Indian Standards for Building Materials) dataset provided by the organizers.

---

<p align="center">
  <strong>🏗️ BISense AI — Making BIS compliance intelligent, accessible, and instant.</strong>
</p>
