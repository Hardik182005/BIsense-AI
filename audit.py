"""Full audit of BISense AI project for hackathon compliance."""
import json
import sys
from pathlib import Path

print("=" * 60)
print("  BISENSE AI — FULL PROJECT AUDIT")
print("=" * 60)

# 1. Check registry completeness
print("\n[1] REGISTRY COMPLETENESS")
reg = json.load(open("src/data/bis_registry.json", encoding="utf-8"))
ids = [r["standard_id"] for r in reg]
print(f"  Total standards in registry: {len(ids)}")

# Check for duplicates
dupes = [x for x in ids if ids.count(x) > 1]
if dupes:
    print(f"  ⚠️ DUPLICATE STANDARDS: {set(dupes)}")
else:
    print("  ✅ No duplicate standards")

# Check all expected from public test set
expected = [
    "IS 269: 1989", "IS 383: 1970", "IS 458: 2003",
    "IS 2185 (Part 2): 1983", "IS 459: 1992", "IS 455: 1989",
    "IS 1489 (Part 2): 1991", "IS 3466: 1988", "IS 6909: 1990",
    "IS 8042: 1989"
]
missing = [e for e in expected if e not in ids]
if missing:
    print(f"  ❌ MISSING from registry: {missing}")
else:
    print("  ✅ All 10 expected standards found in registry")

# 2. Check public test set
print("\n[2] PUBLIC TEST SET")
test = json.load(open("data/public_test_set.json", encoding="utf-8"))
print(f"  Total queries: {len(test)}")
test_ids = [t["id"] for t in test]
print(f"  Query IDs: {test_ids}")
for t in test:
    if "id" not in t or "query" not in t or "expected_standards" not in t:
        print(f"  ❌ MISSING FIELDS in {t.get('id', '?')}")

# 3. Check inference.py exists and has correct args
print("\n[3] INFERENCE.PY")
inf_path = Path("inference.py")
if inf_path.exists():
    content = inf_path.read_text()
    checks = {
        "--input": "--input" in content,
        "--output": "--output" in content,
        "id": '"id"' in content,
        "retrieved_standards": '"retrieved_standards"' in content,
        "latency_seconds": '"latency_seconds"' in content,
    }
    for k, v in checks.items():
        print(f"  {'✅' if v else '❌'} {k}: {'Found' if v else 'MISSING'}")
else:
    print("  ❌ inference.py NOT FOUND at root!")

# 4. Check eval_script.py
print("\n[4] EVAL_SCRIPT.PY")
eval_path = Path("eval_script.py")
if eval_path.exists():
    content = eval_path.read_text()
    checks = {
        "--results": "--results" in content,
        "hit_rate": "hits_at_3" in content or "hit_rate" in content,
        "mrr": "mrr" in content,
        "latency": "latency" in content,
    }
    for k, v in checks.items():
        print(f"  {'✅' if v else '❌'} {k}: {'Found' if v else 'MISSING'}")
else:
    print("  ❌ eval_script.py NOT FOUND at root!")

# 5. Check requirements.txt
print("\n[5] REQUIREMENTS.TXT")
req_path = Path("requirements.txt")
if req_path.exists():
    reqs = req_path.read_text().strip().split("\n")
    print(f"  Total packages: {len(reqs)}")
    critical = ["fastapi", "sentence-transformers", "faiss-cpu", "rank-bm25"]
    for c in critical:
        found = any(c in r for r in reqs)
        print(f"  {'✅' if found else '❌'} {c}")
else:
    print("  ❌ requirements.txt NOT FOUND!")

# 6. Check project structure
print("\n[6] PROJECT STRUCTURE (5.1)")
structure = {
    "/src": Path("src").is_dir(),
    "/data": Path("data").is_dir(),
    "eval_script.py": Path("eval_script.py").exists(),
    "inference.py": Path("inference.py").exists(),
    "requirements.txt": Path("requirements.txt").exists(),
    "README.md": Path("README.md").exists(),
    "presentation.pdf": Path("presentation.pdf").exists(),
}
for k, v in structure.items():
    print(f"  {'✅' if v else '⚠️ MISSING'} {k}")

# 7. Run inference and eval
print("\n[7] RUNNING FULL PIPELINE TEST...")
sys.path.insert(0, str(Path("src/src")))
try:
    from retriever import BISRetrievalEngine
    from translator import translate_to_english, detect_language
    
    engine = BISRetrievalEngine(registry_path="src/data/bis_registry.json")
    print(f"  ✅ Engine loaded: {len(engine.registry)} standards")
    
    import time
    results = []
    all_pass = True
    for item in test:
        start = time.time()
        lang = detect_language(item["query"])
        normalized = translate_to_english(item["query"]) if lang != "en" else item["query"]
        retrieved = engine.retrieve(normalized, top_k=5)
        standard_ids = [r["standard"]["standard_id"] for r in retrieved]
        latency = round(time.time() - start, 3)
        
        exp = item["expected_standards"]
        exp_norm = set(s.replace(" ", "").lower() for s in exp)
        ret_norm = [s.replace(" ", "").lower() for s in standard_ids]
        
        hit = any(s in exp_norm for s in ret_norm[:3])
        mrr = 0.0
        for rank, s in enumerate(ret_norm[:5], 1):
            if s in exp_norm:
                mrr = 1.0 / rank
                break
        
        status = "✅" if hit else "❌"
        print(f"  {status} {item['id']}: Expected={exp[0]}, Got={standard_ids[:3]}, Hit@3={hit}, MRR={mrr:.2f}, Latency={latency}s")
        
        if not hit:
            all_pass = False
        
        results.append({
            "id": item["id"],
            "retrieved_standards": standard_ids,
            "latency_seconds": latency,
            "expected_standards": exp
        })
    
    # Calculate overall metrics
    total = len(results)
    hits = sum(1 for r in results for e in r["expected_standards"] 
               if e.replace(" ","").lower() in [s.replace(" ","").lower() for s in r["retrieved_standards"][:3]])
    hit_rate = (hits / total) * 100
    
    mrr_sum = 0
    for r in results:
        exp_norm = set(s.replace(" ","").lower() for s in r["expected_standards"])
        for rank, s in enumerate([s.replace(" ","").lower() for s in r["retrieved_standards"][:5]], 1):
            if s in exp_norm:
                mrr_sum += 1.0 / rank
                break
    mrr_avg = mrr_sum / total
    
    avg_lat = sum(r["latency_seconds"] for r in results) / total
    
    print(f"\n{'=' * 60}")
    print(f"  FINAL RESULTS")
    print(f"{'=' * 60}")
    print(f"  Queries:    {total}/10")
    print(f"  Hit@3:      {hit_rate:.1f}%  {'✅' if hit_rate > 80 else '❌'} (Target: >80%)")
    print(f"  MRR@5:      {mrr_avg:.4f}  {'✅' if mrr_avg > 0.7 else '❌'} (Target: >0.7)")
    print(f"  Latency:    {avg_lat:.3f}s {'✅' if avg_lat < 5 else '❌'} (Target: <5s)")
    print(f"  No Crash:   ✅")
    print(f"{'=' * 60}")
    
except Exception as e:
    print(f"  ❌ PIPELINE CRASHED: {e}")
    import traceback
    traceback.print_exc()
