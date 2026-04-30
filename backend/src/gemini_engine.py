"""
BISense AI — Vertex AI (Gemini) Integration
Uses avinashgehi3@gmail.com Google Cloud project for:
  - Product attribute extraction
  - Query enhancement
  - Missing information detection

Setup:
  gcloud auth application-default login
  (or set GOOGLE_APPLICATION_CREDENTIALS)
"""
import os
import json
from typing import Dict, Optional

# ─────────────────────────────────────────────────────────────────────────────
# Vertex AI Config
# ─────────────────────────────────────────────────────────────────────────────
VERTEX_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "bisense-ai")
VERTEX_LOCATION = os.getenv("VERTEX_LOCATION", "us-central1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

_vertex_initialized = False
_generative_model = None


def _init_vertex():
    """Lazy-initialize Vertex AI SDK."""
    global _vertex_initialized, _generative_model
    if _vertex_initialized:
        return _generative_model is not None

    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel

        vertexai.init(project=VERTEX_PROJECT, location=VERTEX_LOCATION)
        _generative_model = GenerativeModel(GEMINI_MODEL)
        _vertex_initialized = True
        print(f"[BISense AI] Vertex AI initialized: {GEMINI_MODEL} on {VERTEX_PROJECT}")
        return True
    except Exception as e:
        print(f"[BISense AI] Vertex AI unavailable: {e}. Using fallback extraction.")
        _vertex_initialized = True
        return False


def extract_product_attributes(query: str) -> Dict:
    """
    Use Gemini to extract structured product attributes from the query.
    Falls back to keyword extraction if Vertex AI is unavailable.
    """
    if not _init_vertex() or _generative_model is None:
        return _fallback_extraction(query)

    try:
        prompt = f"""You are a BIS standards expert for Indian building materials.

Extract structured attributes from this product description.
Return ONLY a valid JSON object with these exact keys:
- product_type: main product name
- material: primary material (cement/steel/concrete/aggregate/unknown)
- category: one of [Cement, Steel, Concrete, Aggregates]
- application: intended use
- grade: product grade if mentioned
- risk_level: Low/Medium/High based on structural criticality
- missing_info: list of missing details that would improve standard matching

Product description: "{query}"

JSON response:"""

        response = _generative_model.generate_content(prompt)
        text = response.text.strip()

        # Extract JSON from response
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        return json.loads(text)
    except Exception as e:
        print(f"[Vertex AI] Extraction error: {e}")
        return _fallback_extraction(query)


def enhance_query(query: str) -> str:
    """
    Use Gemini to normalize and enhance the query for better BIS retrieval.
    """
    if not _init_vertex() or _generative_model is None:
        return query

    try:
        prompt = f"""You are a BIS standards expert.

Rewrite this product description as a clear, concise English query optimized for BIS standard retrieval.
- Translate any regional language to English
- Include material type, application, and key technical terms
- Keep it under 30 words
- Return ONLY the rewritten query, no explanation

Original: "{query}"

Rewritten query:"""

        response = _generative_model.generate_content(prompt)
        enhanced = response.text.strip().strip('"')
        return enhanced if enhanced else query
    except Exception as e:
        return query


def _fallback_extraction(query: str) -> Dict:
    """Keyword-based fallback when Vertex AI is unavailable."""
    q = query.lower()

    if any(w in q for w in ['cement', 'opc', 'ppc', 'portland', 'slag', 'pozzolana']):
        category = 'Cement'
        material = 'cement'
    elif any(w in q for w in ['steel', 'tmt', 'rebar', 'bar', 'structural']):
        category = 'Steel'
        material = 'steel'
    elif any(w in q for w in ['aggregate', 'sand', 'gravel', 'coarse', 'fine']):
        category = 'Aggregates'
        material = 'aggregate'
    else:
        category = 'Concrete'
        material = 'concrete'

    missing = []
    if 'grade' not in q:
        missing.append('Product grade (e.g., Fe415, 33 Grade, M25)')
    if not any(w in q for w in ['construction', 'building', 'structural', 'manufacture']):
        missing.append('Intended application or use case')

    return {
        'product_type': query[:50],
        'material': material,
        'category': category,
        'application': 'general construction',
        'grade': None,
        'risk_level': 'Medium',
        'missing_info': missing
    }
