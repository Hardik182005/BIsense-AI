"""
BISense AI — Standards Router
Browse and filter the BIS standards registry.
"""
import sys
from pathlib import Path
from fastapi import APIRouter, Query
from typing import List, Optional

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))
from retriever import get_engine

router = APIRouter()


@router.get("/")
async def list_standards(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Keyword search")
):
    engine = get_engine()
    results = engine.registry

    if category:
        results = [s for s in results if s["category"].lower() == category.lower()]

    if search:
        search_lower = search.lower()
        results = [
            s for s in results
            if search_lower in s["title"].lower()
            or search_lower in s["scope"].lower()
            or any(search_lower in kw for kw in s["keywords"])
        ]

    return {
        "total": len(results),
        "standards": results
    }


@router.get("/categories")
async def get_categories():
    engine = get_engine()
    cats = {}
    for s in engine.registry:
        cat = s["category"]
        cats[cat] = cats.get(cat, 0) + 1
    return {"categories": [{"name": k, "count": v} for k, v in cats.items()]}


@router.get("/{standard_id:path}")
async def get_standard(standard_id: str):
    engine = get_engine()
    for s in engine.registry:
        if s["standard_id"] == standard_id:
            graph = engine.get_compliance_graph(standard_id)
            return {"standard": s, "compliance_graph": graph}
    return {"error": "Standard not found"}
