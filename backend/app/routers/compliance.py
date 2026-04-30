"""
BISense AI — Compliance Router
Main compliance search, dashboard, graph, and checklist endpoints.
"""
import time
import sys
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))
from retriever import get_engine
from translator import translate_to_english, detect_language
from .analytics import log_search

router = APIRouter()


class ComplianceRequest(BaseModel):
    query: str
    top_k: int = 5


class StandardResult(BaseModel):
    standard_id: str
    title: str
    category: str
    scope: str
    keywords: List[str]
    related_standards: List[str]
    confidence: float
    confidence_pct: int
    matched_terms: List[str]
    reasoning: List[str]
    confidence_breakdown: dict
    is_primary: bool = True
    verified: bool = True


class ComplianceResponse(BaseModel):
    original_query: str
    normalized_query: str
    detected_language: str
    detected_category: Optional[str]
    query_understanding: dict
    primary_results: List[StandardResult]
    supporting_results: List[StandardResult]
    readiness_score: int
    risk_level: str
    readiness_breakdown: List[str]
    readiness_factors: dict
    missing_info: List[str]
    compliance_graph: dict
    checklist: List[str]
    latency_seconds: float


@router.post("/search", response_model=ComplianceResponse)
async def compliance_search(req: ComplianceRequest):
    start = time.time()
    engine = get_engine()

    lang = detect_language(req.query)
    normalized = translate_to_english(req.query) if lang != "en" else req.query

    results_raw = engine.retrieve(normalized, top_k=req.top_k)
    readiness = engine.get_readiness_score(normalized, results_raw)
    understanding = engine.get_query_understanding(normalized)
    missing = engine.get_missing_info(normalized)

    primary_id = results_raw[0]["standard"]["standard_id"] if results_raw else None
    graph = engine.get_compliance_graph(primary_id) if primary_id else {}

    category = engine._detect_category(normalized.lower())
    checklist = engine.get_checklist(category) if category else engine.get_checklist("Concrete")

    def extract_matched(query_lower: str, keywords: List[str]) -> List[str]:
        return [kw for kw in keywords if kw in query_lower][:5]

    query_lower = normalized.lower()
    primary_results = []
    supporting_results = []

    for i, r in enumerate(results_raw):
        std = r["standard"]
        raw_score = r["score"]
        cat_match = r.get("cat_match", False)
        
        # Normalize to 0-1 confidence
        max_score = results_raw[0]["score"] if results_raw else 1.0
        confidence = min(0.99, raw_score / max(max_score, 0.01)) if i > 0 else min(0.99, raw_score * 1.2)
        if i == 0:
            confidence = min(0.99, confidence)

        matched = extract_matched(query_lower, std["keywords"])
        reasoning = engine.get_reasoning(std, normalized)
        breakdown = engine.get_confidence_breakdown(confidence, cat_match)

        is_primary = cat_match or (i == 0 and confidence > 0.8)

        res = StandardResult(
            standard_id=std["standard_id"],
            title=std["title"],
            category=std["category"],
            scope=std.get("scope_detail", std["scope"]),
            keywords=std["keywords"],
            related_standards=std["related_standards"],
            confidence=round(confidence, 3),
            confidence_pct=int(confidence * 100),
            matched_terms=matched,
            reasoning=reasoning,
            confidence_breakdown=breakdown,
            is_primary=is_primary,
            verified=True
        )

        if is_primary:
            primary_results.append(res)
        else:
            supporting_results.append(res)

    latency = round(time.time() - start, 3)
    lang_map = {"en": "English", "hi": "Hindi/Marathi", "gu": "Gujarati", "ta": "Tamil"}

    response = ComplianceResponse(
        original_query=req.query,
        normalized_query=normalized,
        detected_language=lang_map.get(lang, "English"),
        detected_category=category,
        query_understanding=understanding,
        primary_results=primary_results,
        supporting_results=supporting_results,
        readiness_score=readiness["score"],
        risk_level=readiness["risk_level"],
        readiness_breakdown=readiness["breakdown"],
        readiness_factors=readiness["factors"],
        missing_info=missing,
        compliance_graph=graph,
        checklist=checklist,
        latency_seconds=latency
    )
    
    # Log to analytics
    log_search(
        query=req.query,
        latency=latency,
        category=category,
        primary_standard=primary_id,
        full_result=response.dict()
    )
    
    return response
