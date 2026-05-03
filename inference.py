"""
BISense AI — Hackathon Inference Script
Mandatory entry point for judges.

Usage:
    python inference.py --input data/public_test_set.json --output data/results.json
"""
import json
import time
import argparse
import sys
from pathlib import Path

# Add src to path for application logic
sys.path.insert(0, str(Path(__file__).parent / "src" / "src"))
try:
    from retriever import BISRetrievalEngine
    from translator import translate_to_english, detect_language
except ImportError:
    # Fallback for local dev
    sys.path.insert(0, str(Path(__file__).parent / "src"))
    from src.retriever import BISRetrievalEngine
    from src.translator import translate_to_english, detect_language


def run_inference(input_path: str, output_path: str):
    print(f"[BISense AI] Loading BIS registry and indexes...")
    # Updated path for new repo structure
    registry_path = Path(__file__).parent / "src" / "data" / "bis_registry.json"
    engine = BISRetrievalEngine(registry_path=str(registry_path))
    print(f"[BISense AI] Loaded {len(engine.registry)} BIS standards.")

    with open(input_path, "r", encoding="utf-8") as f:
        queries = json.load(f)

    results = []
    for item in queries:
        qid = item["id"]
        query = item["query"]
        start = time.time()

        # Language detection and translation
        lang = detect_language(query)
        normalized = translate_to_english(query) if lang != "en" else query

        # Hybrid retrieval
        retrieved = engine.retrieve(normalized, top_k=5)
        standard_ids = [r["standard"]["standard_id"] for r in retrieved]

        latency = round(time.time() - start, 3)
        # Normalize standard IDs for output (remove extra spaces around colons)
        normalized_ids = [sid.replace(" : ", ": ").replace(" :", ":").strip() for sid in standard_ids]

        print(f"  [{qid}] -> {normalized_ids[:3]} ({latency}s)")

        results.append({
            "id": qid,
            "retrieved_standards": normalized_ids,
            "latency_seconds": latency
        })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    if results:
        avg_latency = sum(r["latency_seconds"] for r in results) / len(results)
        print(f"\n[BISense AI] Done. {len(results)} queries processed.")
        print(f"[BISense AI] Average latency: {avg_latency:.3f}s")
    else:
        print("\n[BISense AI] No queries were processed.")
    print(f"[BISense AI] Results written to: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BISense AI Inference Script")
    parser.add_argument("--input", required=True, help="Path to input JSON file")
    parser.add_argument("--output", required=True, help="Path to output JSON file")
    args = parser.parse_args()
    run_inference(args.input, args.output)
