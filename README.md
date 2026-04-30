# 🛡️ BISense AI — Enterprise-Grade BIS Compliance Intelligence Platform

[![Deploy on Google Cloud Run](https://img.shields.io/badge/Deployed_on-Google_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://bisense-ai-614621506326.us-central1.run.app)
[![Powered by Vertex AI](https://img.shields.io/badge/Powered_by-Vertex_AI_(Gemini)-blue?style=for-the-badge)](https://cloud.google.com/vertex-ai)
[![Evaluation Passed](https://img.shields.io/badge/Hit_Rate@3-100%25-brightgreen?style=for-the-badge)](https://github.com/Hardik182005/BIsense-AI)

> **Live Demo:** [BISense AI on Cloud Run](https://bisense-ai-614621506326.us-central1.run.app)

BISense AI is an **AI-powered compliance co-pilot** designed to empower Indian MSMEs, manufacturers, and civil engineers to effortlessly navigate the complex landscape of Bureau of Indian Standards (BIS). It automatically discovers correct standard mappings, generates readiness scores, and visualizes complex compliance roadmaps.

Built to solve the "needle in a haystack" problem of compliance navigation, BISense AI ensures **Zero Hallucinations** by strictly anchoring answers to official BIS registry datasets.

---

## ✨ Key Innovations & Features

- 🔍 **Hybrid Retrieval Engine:** Combines sparse (BM25) and dense (Semantic/Faiss) retrieval for industry-leading recall, mapping user queries (e.g., "TMT steel bars") to exact BIS standard codes (e.g., IS 1786).
- 🧠 **Cross-Encoder Re-ranking:** Re-evaluates top retrieved standards based on contextual relevance, resulting in an MRR @5 of >0.7.
- 🛡️ **Zero-Hallucination Architecture:** All recommendations strictly cite verified BIS documents. No generative guessing.
- 🌐 **Multilingual Native Intelligence:** Vertex AI integration detects and translates regional queries (Hindi, Marathi, Gujarati, Tamil) seamlessly.
- 🕸️ **Dynamic Compliance Graphs:** Visually maps relationships between Primary Product Standards, Testing Methods, and Supporting Material Standards.
- 📊 **Real-time Analytics Dashboard:** Tracks search latencies, category distributions, and top-searched materials for platform operators.
- ✅ **Readiness Scoring & Checklists:** AI extracts actionable checklists and scores the user's query clarity and technical depth.
- 💾 **Persistent Session Intelligence:** Local history and search results persist across navigation and page reloads.

---

## 📈 Evaluation Results (Public Test Set)

| Metric | Target | **BISense AI Result** | Status |
|--------|--------|----------------------|--------|
| **Hit Rate @3** | `> 80%` | **100.0%** | ✅ PASSED |
| **MRR @5** | `> 0.7` | **1.000** | ✅ PASSED |
| **Avg Latency** | `< 5s` | **0.004s** (local) / **1.2s** (GCP) | ✅ PASSED |

---

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, Recharts, React Flow.
*   **Backend:** FastAPI, Python 3.11.
*   **AI / ML:** Google Cloud Vertex AI (Gemini-2.0), `sentence-transformers`, `rank-bm25`, FAISS.
*   **Deployment:** Google Cloud Run (Managed, Serverless), Docker.

---

## 🚀 Quick Start (Local Development)

### 1. Build and Run
```bash
# Install dependencies
pip install -r src/requirements.txt
cd src/frontend && npm install && npm run build && cd ../..

# Start the unified server
python src/app/main.py
```

### 2. Run Inference & Evaluation
```bash
# Run the standardized evaluation script
python inference.py --input data/public_test_set.json --output data/results.json
python eval_script.py --results data/results.json
```

---

## 📂 Architecture & Repo Structure

```text
BIsense AI/
├── src/
│   ├── app/
│   │   ├── main.py                 # Entry point: Serves API & Frontend
│   │   └── routers/                # Endpoints (compliance, analytics, chat)
│   ├── src/
│   │   ├── retriever.py            # Hybrid BM25/Semantic Retrieval
│   │   ├── translator.py           # Multilingual Support
│   │   ├── validator.py            # Hallucination Defense
│   │   └── graph_engine.py         # Compliance Graph Generation
│   ├── data/
│   │   └── bis_registry.json       # Vector-ready standard database
│   ├── frontend/                   # React SPA
│   └── requirements.txt
├── data/
│   ├── public_test_set.json        # Hackathon test cases
│   └── results.json                # Latest evaluation output
├── Dockerfile                      # Production container spec
├── inference.py                    # Mandatory judge evaluation script
└── eval_script.py                  # Scoring script (Hit@3, MRR)
```

---

*Built with ❤️ for the BIS Standards Recommendation Engine Hackathon.*
