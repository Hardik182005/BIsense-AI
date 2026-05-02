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
    "total_searches": 0,
    "avg_latency": 0,
    "hit_rate_3": 0,
    "mrr_5": 0,
    "category_distribution": {},
    "top_standards": [],
    "recent_queries": []
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
