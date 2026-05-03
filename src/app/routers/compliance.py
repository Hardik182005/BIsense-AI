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
        fontSize=26,
        textColor=colors.HexColor("#0f172a"),
        alignment=0, # Left
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        alignment=0,
        spaceAfter=30,
        fontName='Helvetica'
    )

    section_header = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=20,
        spaceAfter=12,
        fontName='Helvetica-Bold',
        borderPadding=0,
        leftIndent=0
    )

    body_style = styles['BodyText']
    body_style.fontSize = 10
    body_style.leading = 14
    body_style.textColor = colors.HexColor("#334155")

    metric_label_style = ParagraphStyle(
        'MetricLabel',
        fontSize=8,
        textColor=colors.HexColor("#94a3b8"),
        textTransform='uppercase',
        fontName='Helvetica-Bold',
        alignment=1
    )

    metric_value_style = ParagraphStyle(
        'MetricValue',
        fontSize=18,
        textColor=colors.HexColor("#0f172a"),
        fontName='Helvetica-Bold',
        alignment=1
    )

    elements = []

    # Header Row (Logo + Title)
    elements.append(Paragraph("BISense AI Compliance Report", title_style))
    elements.append(Paragraph(f"Official Standard Mapping Analysis • Generated on {time.strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))

    # Metric Cards Row
    score = result.get('readiness_score', 0)
    risk = result.get('risk_level', 'Unknown')
    risk_color = colors.HexColor(get_risk_color(risk))
    
    # Create metric table
    metric_data = [
        [
            Paragraph("Readiness Score", metric_label_style),
            Paragraph("Risk Level", metric_label_style),
            Paragraph("Analysis Time", metric_label_style)
        ],
        [
            Paragraph(f"<font color='{get_risk_color(risk)}'>{score}%</font>", metric_value_style),
            Paragraph(f"<font color='{get_risk_color(risk)}'>{risk}</font>", metric_value_style),
            Paragraph(f"{result.get('latency_seconds', '0.05')}s", metric_value_style)
        ]
    ]
    
    metric_table = Table(metric_data, colWidths=[2.0*inch, 2.0*inch, 2.0*inch])
    metric_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
    ]))
    elements.append(metric_table)
    elements.append(Spacer(1, 0.4 * inch))

    # Query Info Box
    elements.append(Paragraph("Analysis Context", section_header))
    context_data = [
        ["Query Text:", Paragraph(result.get('original_query', 'N/A'), body_style)],
        ["Material Category:", result.get('detected_category', 'General')],
        ["Verification Engine:", "Hybrid BM25 + Semantic (Vertex AI)"]
    ]
    context_table = Table(context_data, colWidths=[1.5*inch, 4.5*inch])
    context_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor("#64748b")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(context_table)
    elements.append(Spacer(1, 0.2 * inch))

    # Matched Standards
    elements.append(Paragraph("Matched BIS Standards", section_header))
    
    data = [['#', 'Standard ID', 'Title', 'Confidence', 'Category']]
    all_results = result.get('primary_results', []) + result.get('supporting_results', [])
    
    for i, res in enumerate(all_results):
        data.append([
            str(i + 1),
            Paragraph(f"<b>{res.get('standard_id', 'N/A')}</b>", body_style),
            Paragraph(res.get('title', 'N/A'), body_style),
            f"{res.get('confidence_pct', 0)}%",
            res.get('category', 'N/A')
        ])

    table = Table(data, colWidths=[0.4*inch, 1.3*inch, 3.0*inch, 0.9*inch, 1.0*inch], repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('GRID', (0, 0), (-1, -1), 0.1, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.4 * inch))

    # Primary Detail Section
    if result.get('primary_results'):
        primary = result['primary_results'][0]
        elements.append(Paragraph(f"Detailed Intelligence: {primary.get('standard_id')}", section_header))
        
        detail_box_data = [
            [Paragraph(f"<b>Scope & Application:</b> {primary.get('scope', 'N/A')}", body_style)],
            [Paragraph("<b>Intelligence Reasoning:</b>", body_style)]
        ]
        
        for reason in primary.get('reasoning', []):
            detail_box_data.append([Paragraph(f"• {reason}", body_style)])
            
        detail_table = Table(detail_box_data, colWidths=[6.0*inch])
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0f9ff")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#bae6fd")),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ]))
        elements.append(detail_table)
        elements.append(Spacer(1, 0.4 * inch))

    # Checklist
    if result.get('checklist'):
        elements.append(Paragraph("Compliance Verification Checklist", section_header))
        for item in result['checklist']:
            elements.append(Paragraph(f"☐ <font color='#475569'>{item}</font>", body_style))
        elements.append(Spacer(1, 0.4 * inch))

    # Hallucinations
    if result.get('hallucinated_standards'):
        elements.append(Paragraph("Safety & Hallucination Guard", ParagraphStyle('Warn', parent=section_header, textColor=colors.red)))
        for hs in result['hallucinated_standards']:
            elements.append(Paragraph(f"⚠️ <b>{hs}</b> was NOT found in official BIS SP 21 registry. Flagged as hallucination.", body_style))
        elements.append(Spacer(1, 0.2 * inch))

    # Final Footer
    elements.append(Spacer(1, 0.6 * inch))
    footer_text = "BISense AI — Official BIS Standards Recommendation Engine | bisense-ai-2026.web.app"
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Italic'], alignment=1, fontSize=8, textColor=colors.grey)))
    elements.append(Paragraph("Confidential Compliance Document • Verified against official BIS SP 21 Registry", ParagraphStyle('FooterSmall', parent=styles['Italic'], alignment=1, fontSize=7, textColor=colors.grey)))

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
