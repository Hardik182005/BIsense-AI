"""
BISense AI — Chat Router (Vertex AI / Gemini)
Conversational AI assistant for BIS compliance guidance.
Uses Vertex AI (Gemini) for intelligent responses.
"""
import os
import json
import sys
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

router = APIRouter()

# ── Vertex AI Config ──
VERTEX_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "bisense-ai")
VERTEX_LOCATION = os.getenv("VERTEX_LOCATION", "us-central1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

_model = None
_initialized = False


def _init_gemini():
    """Lazy-initialize Vertex AI Gemini model."""
    global _model, _initialized
    if _initialized:
        return _model is not None

    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel

        vertexai.init(project=VERTEX_PROJECT, location=VERTEX_LOCATION)
        _model = GenerativeModel(
            GEMINI_MODEL,
            system_instruction="""You are BISense AI Assistant, an expert on Bureau of Indian Standards (BIS) for building materials.

Your knowledge covers:
- BIS standards for Cement (IS 269, IS 8112, IS 12269, IS 455, IS 1489)
- BIS standards for Steel (IS 1786, IS 2062, IS 432, IS 808)
- BIS standards for Concrete (IS 456, IS 10262)
- BIS standards for Aggregates (IS 383, IS 2116)
- Compliance processes, certification, and testing requirements

Rules:
1. ONLY reference real BIS standards from the official dataset
2. NEVER fabricate standard numbers or details
3. If unsure, say so and recommend using the compliance search
4. Keep responses concise and actionable
5. Support queries in Hindi, Marathi, Gujarati, Tamil (respond in English)
6. Always mention that standards come from the official BIS Building Materials dataset"""
        )
        _initialized = True
        print(f"[BISense Chat] Vertex AI initialized: {GEMINI_MODEL}")
        return True
    except Exception as e:
        print(f"[BISense Chat] Vertex AI unavailable: {e}. Using fallback.")
        _initialized = True
        return False


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    response: str
    source: str


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Handle chat messages with Vertex AI Gemini."""
    if _init_gemini() and _model is not None:
        try:
            # Build conversation context
            context_parts = []
            for msg in (req.history or [])[-6:]:
                role = "user" if msg.role == "user" else "model"
                context_parts.append(f"{role}: {msg.text}")

            context_parts.append(f"user: {req.message}")
            full_prompt = "\n".join(context_parts)

            response = _model.generate_content(full_prompt)
            return ChatResponse(
                response=response.text.strip(),
                source="vertex-ai-gemini"
            )
        except Exception as e:
            print(f"[BISense Chat] Gemini error: {e}")
            return ChatResponse(
                response=_get_fallback_response(req.message),
                source="fallback"
            )
    else:
        return ChatResponse(
            response=_get_fallback_response(req.message),
            source="fallback"
        )


def _get_fallback_response(query: str) -> str:
    """Keyword-based fallback when Vertex AI is unavailable."""
    q = query.lower()

    if any(w in q for w in ['cement', 'opc', 'portland', 'slag']):
        return ("For cement products, key BIS standards include:\n"
                "• IS 269:1989 — OPC 33 Grade\n"
                "• IS 8112:1989 — OPC 43 Grade\n"
                "• IS 12269:1987 — OPC 53 Grade\n"
                "• IS 455:1989 — Portland Slag Cement\n\n"
                "Use the Compliance Check feature for a detailed analysis.")

    if any(w in q for w in ['steel', 'tmt', 'rebar', 'bar']):
        return ("For steel/TMT products:\n"
                "• IS 1786:1985 — High Strength Deformed Steel Bars\n"
                "• IS 2062:2011 — Hot Rolled Structural Steel\n"
                "• IS 432:1982 — Mild Steel Bars\n\n"
                "Describe your specific product for tailored recommendations!")

    if any(w in q for w in ['aggregate', 'sand', 'gravel']):
        return ("For aggregates:\n"
                "• IS 383:1970 — Coarse & Fine Aggregates\n"
                "• IS 2116:1980 — Sand for Masonry\n\n"
                "Tell me about your construction application for better results.")

    return ("I can help you find the right BIS standards. Try:\n"
            "• Describing your product (e.g., 'TMT steel bars for construction')\n"
            "• Asking about specific standards (e.g., 'What is IS 1786?')\n"
            "• Compliance guidance (e.g., 'How to get BIS certification?')\n\n"
            "Or use the Compliance Check for AI-powered analysis.")
