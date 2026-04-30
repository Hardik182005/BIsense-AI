import json

reg = json.load(open("src/data/bis_registry.json", "r", encoding="utf-8"))
seen = set()
clean = []
for r in reg:
    if r["standard_id"] not in seen:
        seen.add(r["standard_id"])
        clean.append(r)
    else:
        print(f"Removing duplicate: {r['standard_id']}")

json.dump(clean, open("src/data/bis_registry.json", "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"Cleaned: {len(reg)} -> {len(clean)}")
