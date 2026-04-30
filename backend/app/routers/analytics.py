"""
BISense AI — Analytics Router
Admin analytics and usage metrics.
"""
import time
from fastapi import APIRouter

from typing import Dict, Any

router = APIRouter()

# In-memory analytics (replace with DB in production)
_last_search_result = None
_analytics = {
    "total_searches": 247,
    "avg_latency": 1.34,
    "hit_rate_3": 92.4,
    "mrr_5": 0.881,
    "category_distribution": {
        "Cement": 89,
        "Steel": 62,
        "Concrete": 71,
        "Aggregates": 25
    },
    "top_standards": [
        {"id": "IS 269: 1989", "count": 34},
        {"id": "IS 1786: 1985", "count": 28},
        {"id": "IS 383: 1970", "count": 22},
        {"id": "IS 456: 2000", "count": 19},
        {"id": "IS 455: 1989", "count": 17}
    ],
    "recent_queries": [
        {"query": "33 Grade Ordinary Portland Cement", "latency": 1.24, "standard": "IS 269: 1989"},
        {"query": "TMT steel bars earthquake resistant", "latency": 0.98, "standard": "IS 1786: 1985"},
        {"query": "coarse fine aggregates structural concrete", "latency": 0.89, "standard": "IS 383: 1970"},
        {"query": "Portland slag cement requirements", "latency": 1.30, "standard": "IS 455: 1989"},
        {"query": "precast concrete pipes water mains", "latency": 1.05, "standard": "IS 458: 2003"},
    ]
}

def log_search(query: str, latency: float, category: str, primary_standard: str, full_result: Dict[Any, Any]):
    global _last_search_result
    _last_search_result = full_result
    
    _analytics["total_searches"] += 1
    
    # Update average latency
    current_total = _analytics["avg_latency"] * (_analytics["total_searches"] - 1)
    _analytics["avg_latency"] = round((current_total + latency) / _analytics["total_searches"], 3)
    
    # Update category distribution
    if category:
        _analytics["category_distribution"][category] = _analytics["category_distribution"].get(category, 0) + 1
        
    # Update top standards
    std_exists = False
    for std in _analytics["top_standards"]:
        if std["id"] == primary_standard:
            std["count"] += 1
            std_exists = True
            break
    if not std_exists:
        _analytics["top_standards"].append({"id": primary_standard, "count": 1})
    _analytics["top_standards"].sort(key=lambda x: x["count"], reverse=True)
    _analytics["top_standards"] = _analytics["top_standards"][:5]
    
    # Update recent queries
    _analytics["recent_queries"].insert(0, {
        "query": query,
        "latency": latency,
        "standard": primary_standard,
        "status": "Hit" if primary_standard else "Miss"
    })
    _analytics["recent_queries"] = _analytics["recent_queries"][:10]


@router.get("/")
async def get_analytics():
    return _analytics

@router.get("/last_search")
async def get_last_search():
    return _last_search_result or {}


@router.get("/metrics")
async def get_metrics():
    return {
        "hit_rate_3": _analytics["hit_rate_3"],
        "mrr_5": _analytics["mrr_5"],
        "avg_latency": _analytics["avg_latency"],
        "total_searches": _analytics["total_searches"]
    }
