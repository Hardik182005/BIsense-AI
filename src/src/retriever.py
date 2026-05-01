import json
import time
import re
import math
from pathlib import Path
from typing import List, Dict, Any

import numpy as np
try:
    from sentence_transformers import SentenceTransformer
    import faiss
    HAS_SEMANTIC = True
except ImportError:
    HAS_SEMANTIC = False

# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY KEYWORDS
# ─────────────────────────────────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "Cement": [
        "cement", "opc", "ppc", "portland", "slag cement", "pozzolana", "masonry cement",
        "white cement", "rapid hardening", "sulphate resisting", "hydrophobic", "supersulphated",
        "high alumina", "clinker", "setting time", "compressive strength cement"
    ],
    "Steel": [
        "steel", "tmt", "hsd", "rebar", "reinforcement bar", "structural steel",
        "mild steel", "deformed bar", "gi sheet", "galvanised", "hot rolled", "beam", "column"
    ],
    "Concrete": [
        "concrete", "rcc", "reinforced concrete", "plain concrete", "precast", "concrete pipe",
        "concrete block", "masonry block", "paving block", "aerated", "asbestos cement",
        "corrugated sheet", "roofing sheet", "manhole", "kerb", "drainage pipe"
    ],
    "Aggregates": [
        "aggregate", "coarse aggregate", "fine aggregate", "sand", "gravel", "crushed stone",
        "lightweight aggregate", "artificial aggregate", "masonry mortar"
    ]
}

COMPLIANCE_GRAPH = {
    "IS 456: 2000": ["IS 383: 1970", "IS 10262: 2009", "IS 1786: 1985"],
    "IS 1786: 1985": ["IS 432 (Part 1): 1982", "IS 456: 2000", "IS 2062: 2011"],
    "IS 269: 1989": ["IS 8112: 1989", "IS 12269: 1987", "IS 455: 1989"],
    "IS 383: 1970": ["IS 2116: 1980", "IS 9142: 1979", "IS 456: 2000"],
    "IS 458: 2003": ["IS 1592: 2003", "IS 4996: 1984", "IS 12592: 2002"],
    "IS 455: 1989": ["IS 269: 1989", "IS 1489 (Part 1): 1991", "IS 6909: 1990"],
    "IS 1489 (Part 2): 1991": ["IS 1489 (Part 1): 1991", "IS 3466: 1988", "IS 455: 1989"],
    "IS 2185 (Part 2): 1983": ["IS 2185 (Part 1): 1979", "IS 2185 (Part 3): 1984", "IS 9142: 1979"],
    "IS 459: 1992": ["IS 10388: 1982", "IS 1592: 2003", "IS 6073: 1971"],
    "IS 3466: 1988": ["IS 2116: 1980", "IS 12440: 1988", "IS 269: 1989"],
    "IS 6909: 1990": ["IS 12330: 1988", "IS 455: 1989", "IS 6452: 1989"],
    "IS 8042: 1989": ["IS 8043: 1991", "IS 269: 1989", "IS 3466: 1988"],
}

CHECKLIST_TEMPLATES = {
    "Cement": [
        "Verify chemical composition meets IS limits (SiO2, Al2O3, Fe2O3)",
        "Test compressive strength at 3, 7, and 28 days",
        "Check fineness (Blaine's or sieve test)",
        "Perform setting time test (initial and final)",
        "Test soundness using Le Chatelier apparatus",
        "Maintain batch test certificates from BIS approved lab",
        "Ensure BIS certification mark (ISI mark) on packaging",
        "Prepare process control documents for BIS audit"
    ],
    "Steel": [
        "Verify chemical composition (Carbon, Manganese, Sulphur, Phosphorus)",
        "Test tensile strength and yield strength",
        "Check elongation requirements per grade",
        "Verify rib geometry and dimensions for deformed bars",
        "Perform bend and rebend tests",
        "Maintain mill test certificates for each heat",
        "Check BIS ISI mark on each bundle/coil",
        "Prepare dimensional inspection records"
    ],
    "Concrete": [
        "Verify mix design as per IS 10262",
        "Test compressive strength of concrete cubes at 7 and 28 days",
        "Check workability (slump test or VB test)",
        "Verify water-cement ratio",
        "Test aggregate quality as per IS 383",
        "Maintain pour cards and curing records",
        "Ensure cover requirements for reinforcement",
        "Perform non-destructive tests (rebound hammer, UPV)"
    ],
    "Aggregates": [
        "Test grading and particle size distribution",
        "Check specific gravity and water absorption",
        "Test crushing value and impact value",
        "Check for deleterious materials (clay, silt, organic matter)",
        "Verify flakiness and elongation index",
        "Test alkali-silica reactivity",
        "Maintain source and quarry certificates",
        "Check compliance with zone classification (fine aggregate)"
    ]
}


class BISRetrievalEngine:
    """Hybrid BM25 + Semantic retrieval engine with hallucination guard."""

    def __init__(self, registry_path: str = None):
        if registry_path is None:
            registry_path = Path(__file__).parent.parent / "data" / "bis_registry.json"
        with open(registry_path, "r", encoding="utf-8") as f:
            self.registry: List[Dict] = json.load(f)
        self._valid_ids = {s["standard_id"] for s in self.registry}
        self._index = self._build_index()
        self._calculate_idf()
        
        # ──────────────────────────────────────────────────────────────────────
        # TRUE SEMANTIC SEARCH (Sentence Transformers + FAISS)
        # ──────────────────────────────────────────────────────────────────────
        if HAS_SEMANTIC:
            try:
                print(f"[BISense] Initializing Semantic Engine for {len(self.registry)} standards...")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                
                # Load precomputed embeddings
                emb_path = Path(__file__).parent.parent / "data" / "embeddings.npy"
                if emb_path.exists():
                    embeddings = np.load(emb_path)
                else:
                    # Fallback only if missing
                    doc_texts = [f"{s['title']} {s['scope']} {' '.join(s['keywords'])}" for s in self.registry]
                    embeddings = self.model.encode(doc_texts, show_progress_bar=False)
                
                self.embedding_dim = embeddings.shape[1]
                self.faiss_index = faiss.IndexFlatIP(self.embedding_dim)
                
                # Normalize for cosine similarity
                faiss.normalize_L2(embeddings)
                self.faiss_index.add(np.ascontiguousarray(embeddings.astype('float32')))
                self.has_embeddings = True
            except Exception as e:
                print(f"[BISense] Semantic search initialization failed: {e}")
                self.has_embeddings = False
        else:
            self.has_embeddings = False

    def _build_index(self) -> List[Dict]:
        """Build a searchable index from the registry."""
        index = []
        for std in self.registry:
            text = " ".join([
                std["title"],
                std["scope"],
                std.get("scope_detail", ""),
                " ".join(std["keywords"]),
                std["category"]
            ]).lower()
            index.append({"standard": std, "text": text})
        return index

    def _detect_category(self, query: str) -> str | None:
        """Detect product category from query keywords."""
        query_lower = query.lower()
        scores = {}
        for cat, kws in CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in kws if kw in query_lower)
            if score > 0:
                scores[cat] = score
        if scores:
            return max(scores, key=scores.get)
        return None

    def _calculate_idf(self):
        """Calculate Inverse Document Frequency (IDF) for all tokens in the registry."""
        token_doc_counts = {}
        N = len(self._index)
        for item in self._index:
            tokens = set(re.findall(r'\b\w+\b', item["text"]))
            for token in tokens:
                token_doc_counts[token] = token_doc_counts.get(token, 0) + 1
        
        self.idf = {}
        for token, count in token_doc_counts.items():
            # BM25 standard IDF with smoothing
            self.idf[token] = math.log(1 + (N - count + 0.5) / (count + 0.5))

    def _bm25_score(self, query_tokens: List[str], doc_text: str) -> float:
        """Full BM25 scoring with pre-calculated IDF."""
        k1, b = 1.5, 0.75
        doc_tokens = doc_text.split()
        dl = len(doc_tokens)
        avgdl = 200.0  # approximate average document length
        score = 0.0
        for token in query_tokens:
            tf = doc_tokens.count(token)
            if tf == 0:
                continue
            idf = self.idf.get(token, 1.0)
            score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avgdl))
        return score

    def _semantic_overlap_score(self, query_lower: str, doc_text: str) -> float:
        """Contextual Keyword-Overlap similarity (Lightweight Semantic Retrieval)."""
        q_words = set(re.findall(r'\b\w+\b', query_lower))
        d_words = set(re.findall(r'\b\w+\b', doc_text))
        if not q_words:
            return 0.0
        overlap = q_words & d_words
        # Boost for critical technical terms
        boost_terms = {
            "tmt", "reinforcement", "cement", "concrete", "aggregate", "slag",
            "pozzolana", "precast", "masonry", "structural", "fly ash", "calcined"
        }
        boosted = sum(2.0 for t in overlap if t in boost_terms)
        return (len(overlap) + boosted) / (len(q_words) + 1)

    def get_query_understanding(self, query: str) -> Dict[str, str]:
        """Deep query understanding for metadata extraction."""
        query_lower = query.lower()
        
        # Detect Material
        material = "General Construction"
        for cat in CATEGORY_KEYWORDS:
            if any(kw in query_lower for kw in CATEGORY_KEYWORDS[cat]):
                material = cat
                break
        
        # Detect Use Case
        use_case = "Industrial/Commercial"
        if any(kw in query_lower for kw in ["home", "house", "residential", "villa", "apartment"]):
            use_case = "Residential Construction"
        elif any(kw in query_lower for kw in ["bridge", "dam", "highway", "infrastructure"]):
            use_case = "Infrastructure"
        
        # Detect Risk
        risk = "Structural"
        if any(kw in query_lower for kw in ["load", "earthquake", "seismic", "heavy", "bearing"]):
            risk = "High Structural Risk"
        elif any(kw in query_lower for kw in ["finish", "decorative", "tile", "paint"]):
            risk = "Aesthetic/Non-Structural"

        # Detect Product Type
        product = "General Building Material"
        product_map = {
            "tmt": "TMT Reinforcement Bars",
            "opc": "Ordinary Portland Cement",
            "ppc": "Portland Pozzolana Cement",
            "rcc": "Reinforced Concrete",
            "aggregate": "Coarse/Fine Aggregates"
        }
        for kw, val in product_map.items():
            if kw in query_lower:
                product = val
                break

        return {
            "material": material,
            "use_case": use_case,
            "risk_type": risk,
            "product_type": product
        }

    def get_missing_info(self, query: str) -> List[str]:
        """Identify missing technical parameters for high-fidelity compliance."""
        query_lower = query.lower()
        missing = []
        
        if "steel" in query_lower or "tmt" in query_lower:
            if not any(re.search(rf"\b{g}\b", query_lower) for g in ["fe415", "fe500", "fe550", "grade"]):
                missing.append("Specific Grade (e.g., Fe500, Fe550D)")
            if not any(re.search(rf"\b\d+mm\b", query_lower) for _ in [1]):
                missing.append("Diameter/Size (e.g., 8mm, 12mm)")
            if "manufacturing" not in query_lower and "process" not in query_lower:
                missing.append("Manufacturing Process (e.g., Hot Rolled, Cold Twisted)")
        
        elif "cement" in query_lower:
            if not any(re.search(rf"\b{g}\b", query_lower) for g in ["33", "43", "53", "grade"]):
                missing.append("Strength Grade (e.g., 43 Grade, 53 Grade)")
            if "fly ash" not in query_lower and "slag" not in query_lower:
                missing.append("Additive content (Fly ash % or Slag %)")

        if not missing:
            missing.append("Environmental exposure conditions")
            
        return missing[:3]

    def get_reasoning(self, std: Dict, query: str) -> List[str]:
        """Generate 'Why this standard?' explainability points."""
        query_lower = query.lower()
        reasons = []
        
        # Exact match
        for kw in std["keywords"]:
            if kw in query_lower:
                reasons.append(f"Exact match: {kw.upper()}")
                break
        
        # Material match
        if std["category"].lower() in query_lower:
            reasons.append(f"Material match: {std['category']}")
        
        # Scope alignment
        if any(kw in std["scope"].lower() for kw in query_lower.split()):
            reasons.append("Use-case alignment: High")
            
        # Category boost
        reasons.append(f"Structural category alignment: {std['category']}")
        
        return reasons[:4]

    def get_confidence_breakdown(self, score: float, category_match: bool) -> Dict[str, int]:
        """Break down the confidence score into components for transparency."""
        # Baseline breakdown
        keyword = min(40, int(score * 45))
        semantic = min(35, int(score * 40))
        category = 25 if category_match else 10
        
        # Adjust to ensure it doesn't exceed 100
        total = keyword + semantic + category
        if total > 99:
            diff = total - 99
            keyword -= diff // 2
            semantic -= diff // 2
            
        return {
            "keyword_match": keyword,
            "semantic_match": semantic,
            "category_match": category
        }

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """Hybrid retrieval: 0.6 * BM25 + 0.4 * Vector Semantic, with ID, Phrase, and Category Boosting."""
        # Fuzzy normalization: handle common compound words
        query_norm = query.lower().replace("supersulphated", "super sulphated").replace("pozzolana", "pozzolana")
        query_lower = query_norm
        category = self._detect_category(query_lower)
        query_tokens = re.findall(r'\b\w+\b', query_lower)
        
        # Extract potential standard numbers from query (e.g., "383" from "IS 383")
        mentioned_ids = re.findall(r'\b\d{3,5}\b', query_lower)

        # 1. Get Vector Semantic Scores
        vector_scores = np.zeros(len(self.registry))
        if self.has_embeddings:
            query_emb = self.model.encode([query_norm], show_progress_bar=False)
            faiss.normalize_L2(query_emb)
            D, I = self.faiss_index.search(np.ascontiguousarray(query_emb.astype('float32')), len(self.registry))
            for score, idx in zip(D[0], I[0]):
                vector_scores[idx] = score

        scored = []
        for i, item in enumerate(self._index):
            std = item["standard"]
            doc_text = item["text"]
            title_lower = std["title"].lower()

            # Category boost
            cat_match = (category and std["category"] == category)
            cat_boost = 1.2 if cat_match else 1.0
            
            # Standard ID boost (CRITICAL for high MRR)
            id_boost = 1.0
            for mid in mentioned_ids:
                if mid in std["standard_id"]:
                    id_boost = 3.0
                    break

            # Phrase Match Boost (Dynamic & Robust)
            phrase_boost = 1.0
            # 1. Check if full title (cleaned) is in query
            title_clean = re.sub(r'[^a-z0-9]', '', title_lower)
            query_clean = re.sub(r'[^a-z0-9]', '', query_lower)
            if title_clean and title_clean in query_clean:
                phrase_boost = 5.0 # Very strong boost for title inclusion
            else:
                # 2. Check for common technical phrases
                for phrase in ["masonry cement", "portland cement", "precast concrete", "asbestos cement", "tee sections"]:
                    if phrase.replace(" ", "") in query_clean and phrase.replace(" ", "") in title_clean:
                        phrase_boost = 2.0

            bm25 = self._bm25_score(query_tokens, doc_text)
            
            if self.has_embeddings:
                semantic = vector_scores[i]
            else:
                semantic = self._semantic_overlap_score(query_lower, doc_text)
                
            # Hybrid combination with high BM25 and strong boosts
            final_score = (0.7 * bm25 + 0.3 * semantic) * cat_boost * id_boost * phrase_boost

            scored.append({
                "standard": std, 
                "score": float(final_score), 
                "bm25": bm25,
                "semantic": semantic,
                "category": std["category"],
                "cat_match": cat_match
            })

        # Remove very low scores but keep potential matches
        scored = [s for s in scored if s["score"] > 0.001]
        scored.sort(key=lambda x: x["score"], reverse=True)
        
        # Minimum confidence threshold: reject garbage/nonsense queries
        # If the BEST result has a very low score, return nothing
        MIN_CONFIDENCE = 0.5
        if scored and scored[0]["score"] < MIN_CONFIDENCE:
            return []
            
        results = scored[:top_k]

        # Hallucination guard: only return standards present in registry
        validated = [r for r in results if r["standard"]["standard_id"] in self._valid_ids]
        return validated

    def get_compliance_graph(self, standard_id: str) -> Dict:
        """Return compliance graph for a given primary standard."""
        related = []
        for std in self.registry:
            if std["standard_id"] == standard_id:
                related = std.get("related_standards", [])
                break
                
        if not related:
            related = COMPLIANCE_GRAPH.get(standard_id, [])
            
        return {
            "primary": standard_id,
            "supporting": related[:2] if len(related) >= 2 else related,
            "related": related[2:] if len(related) > 2 else []
        }

    def get_readiness_score(self, query: str, results: List[Dict]) -> Dict:
        """Generate BIS readiness score (0-100) based on query quality and results."""
        score = 0
        breakdown = []

        # Product clarity (0-25)
        word_count = len(query.split())
        if word_count >= 10:
            score += 25
            breakdown.append("High query detail provided")
        elif word_count >= 5:
            score += 15
            breakdown.append("Moderate query detail")
        else:
            score += 5
            breakdown.append("Low query detail")

        # Category confidence (0-25)
        category = self._detect_category(query.lower())
        if category:
            score += 25
            breakdown.append(f"Material identified as {category}")
        else:
            score += 10
            breakdown.append("Ambiguous material category")

        # Standard confidence (0-30)
        if results:
            top_score = results[0]["score"]
            confidence_boost = min(30, int(top_score * 40))
            score += confidence_boost
            breakdown.append("Strong standard matching found")
        else:
            breakdown.append("No direct standards identified")

        # Completeness (0-20)
        completeness_keywords = ["grade", "strength", "application", "use", "construction", "manufacture"]
        matched = sum(1 for kw in completeness_keywords if kw in query.lower())
        completeness = min(20, matched * 4)
        score += completeness
        if matched >= 3:
            breakdown.append("Technical parameters detected")
        else:
            breakdown.append("Missing technical parameters")

        risk = "Low" if score >= 75 else ("Medium" if score >= 50 else "High")
        return {
            "score": min(100, score), 
            "risk_level": risk, 
            "breakdown": breakdown,
            "factors": {
                "completeness": min(100, (word_count/12)*100),
                "clarity": 100 if category else 50,
                "technical_depth": (matched/6)*100
            }
        }

    def get_checklist(self, category: str) -> List[str]:
        return CHECKLIST_TEMPLATES.get(category, CHECKLIST_TEMPLATES["Concrete"])


# Singleton engine (preloaded)
_engine: BISRetrievalEngine | None = None


def get_engine() -> BISRetrievalEngine:
    global _engine
    if _engine is None:
        _engine = BISRetrievalEngine()
    return _engine
