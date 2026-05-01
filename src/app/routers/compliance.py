"""
BISense AI — Compliance Router
Main compliance search, dashboard, graph, and checklist endpoints.
"""
import re
import time
import sys
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import io
from fastapi import APIRouter, Response
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))
from retriever import get_engine
from translator import translate_to_english, detect_language
from .analytics import log_search


def detect_fake_standards(query: str, engine) -> List[str]:
    """
    Extract any IS/BIS standard IDs mentioned in the user query and validate
    them against the real BIS registry. Returns list of fake standard IDs.
    """
    # Match patterns like IS 99999, IS 1786, IS 1786:1985, IS 2185 (Part 2): 1983
    pattern = r'(?:IS|BIS)\s*(\d{1,6})(?:\s*\(.*?\))?(?:\s*:\s*\d{4})?'
    mentioned = re.findall(pattern, query, re.IGNORECASE)
    if not mentioned:
        return []

    # Get all valid standard numbers from registry
    valid_numbers = set()
    for std in engine.registry:
        # Extract base number from standard_id like "IS 269: 1989"
        m = re.search(r'(?:IS|BIS)\s*(\d+)', std["standard_id"], re.IGNORECASE)
        if m:
            valid_numbers.add(m.group(1))

    fake = []
    for num in mentioned:
        if num not in valid_numbers:
            fake.append(f"IS {num}")
    return fake

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
    hallucinated_standards: List[str]
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

    # Detect fake/hallucinated standard IDs in the query
    fake_standards = detect_fake_standards(req.query, engine)
    if fake_standards:
        missing = [f"Standard {fake_standards[0]} is NOT found in the official BIS registry."]

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

    # Override risk if fake standards detected
    final_risk = readiness["risk_level"]
    final_score = readiness["score"]
    final_breakdown = list(readiness["breakdown"])
    if fake_standards:
        final_risk = "CRITICAL"
        final_score = min(final_score, 15)
        for fs in fake_standards:
            missing.insert(0, f"⚠️ HALLUCINATION DETECTED: '{fs}' does NOT exist in the official BIS registry")
            final_breakdown.insert(0, f"❌ Fake standard '{fs}' flagged — not in BIS SP 21 dataset")

    response = ComplianceResponse(
        original_query=req.query,
        normalized_query=normalized,
        detected_language=lang_map.get(lang, "English"),
        detected_category=category,
        query_understanding=understanding,
        primary_results=primary_results,
        supporting_results=supporting_results,
        readiness_score=final_score,
        risk_level=final_risk,
        readiness_breakdown=final_breakdown,
        readiness_factors=readiness["factors"],
        missing_info=missing,
        hallucinated_standards=fake_standards,
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


@router.post("/generate-pdf")
async def generate_compliance_pdf(result: dict):
    """
    Generates a professional PDF compliance report from search results.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#8b5cf6"),
        alignment=1, # Center
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#4b5563"),
        spaceBefore=12,
        spaceAfter=12,
        fontName='Helvetica-Bold',
        borderPadding=5,
        borderWidth=0,
        leftIndent=0
    )

    body_style = styles['BodyText']
    body_style.fontSize = 10
    body_style.leading = 14

    elements = []

    # Title
    elements.append(Paragraph("BISense AI Compliance Report", title_style))
    elements.append(Paragraph(f"Generated on {time.strftime('%Y-%m-%d %H:%M:%S')}", styles['Italic']))
    elements.append(Spacer(1, 0.2 * inch))

    # Query Section
    elements.append(Paragraph("Query Details", header_style))
    query_text = result.get('original_query', 'N/A')
    elements.append(Paragraph(f"<b>Query:</b> {query_text}", body_style))
    elements.append(Paragraph(f"<b>Detected Category:</b> {result.get('detected_category', 'General')}", body_style))
    elements.append(Paragraph(f"<b>Risk Level:</b> <font color='{get_risk_color(result.get('risk_level'))}'>{result.get('risk_level', 'Unknown')}</font>", body_style))
    elements.append(Paragraph(f"<b>Readiness Score:</b> {result.get('readiness_score', 0)}/100", body_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Results Section
    elements.append(Paragraph("Matched BIS Standards", header_style))
    
    # Table data
    data = [['#', 'Standard ID', 'Title', 'Confidence', 'Category']]
    all_results = result.get('primary_results', []) + result.get('supporting_results', [])
    
    for i, res in enumerate(all_results):
        data.append([
            str(i + 1),
            res.get('standard_id', 'N/A'),
            Paragraph(res.get('title', 'N/A'), body_style),
            f"{res.get('confidence_pct', 0)}%",
            res.get('category', 'N/A')
        ])

    table = Table(data, colWidths=[0.4*inch, 1.2*inch, 3.0*inch, 0.9*inch, 1.0*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#374151")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.3 * inch))

    # Reasoning / Scope Detail (for primary result)
    if result.get('primary_results'):
        primary = result['primary_results'][0]
        elements.append(Paragraph(f"Primary Standard Detail: {primary.get('standard_id')}", header_style))
        elements.append(Paragraph(f"<b>Scope:</b> {primary.get('scope', 'N/A')}", body_style))
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(Paragraph("<b>Reasoning:</b>", body_style))
        for reason in primary.get('reasoning', []):
            elements.append(Paragraph(f"• {reason}", body_style))
        elements.append(Spacer(1, 0.2 * inch))

    # Checklist
    if result.get('checklist'):
        elements.append(Paragraph("Mandatory Compliance Checklist", header_style))
        for item in result['checklist']:
            elements.append(Paragraph(f"☐ {item}", body_style))
        elements.append(Spacer(1, 0.2 * inch))

    # Hallucination Guard
    if result.get('hallucinated_standards'):
        elements.append(Paragraph("Hallucination Detection Warnings", ParagraphStyle('Warn', parent=header_style, textColor=colors.red)))
        for hs in result['hallucinated_standards']:
            elements.append(Paragraph(f"⚠️ {hs} was NOT found in the official BIS registry.", body_style))
        elements.append(Spacer(1, 0.2 * inch))

    # Footer
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph("BISense AI — Official BIS Standards Recommendation Engine", ParagraphStyle('Footer', parent=styles['Italic'], alignment=1)))
    elements.append(Paragraph("Verified against BIS SP 21 Dataset", ParagraphStyle('FooterSmall', parent=styles['Italic'], alignment=1, fontSize=8)))

    doc.build(elements)
    
    pdf_out = buffer.getvalue()
    buffer.close()
    
    return Response(
        content=pdf_out,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=BISense_Report_{int(time.time())}.pdf"}
    )


def get_risk_color(risk):
    if risk == "LOW": return "#22c55e"
    if risk == "MEDIUM": return "#f59e0b"
    if risk == "HIGH": return "#ef4444"
    if risk == "CRITICAL": return "#dc2626"
    return "#374151"
