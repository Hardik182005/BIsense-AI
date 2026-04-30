import json
import random

def generate_stress_test(registry_path, output_path, num_queries=250):
    with open(registry_path, "r", encoding="utf-8") as f:
        reg = json.load(f)
    
    if len(reg) < num_queries:
        num_queries = len(reg)
    
    selected = random.sample(reg, num_queries)
    test_set = []
    
    templates = [
        "What standard covers {title}?",
        "I need the BIS specification for {title}.",
        "Which Indian Standard governs {title}?",
        "Looking for {title} requirements.",
        "Tell me about {std_id} for {title}.",
        "How to comply with {title} standards?"
    ]
    
    for i, std in enumerate(selected):
        template = random.choice(templates)
        query = template.format(title=std["title"], std_id=std["standard_id"])
        test_set.append({
            "id": f"STRESS-{i:03d}",
            "query": query,
            "expected_standards": [std["standard_id"]]
        })
        
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(test_set, f, indent=2)
    
    print(f"Generated {len(test_set)} stress test queries in {output_path}")

if __name__ == "__main__":
    generate_stress_test("src/data/bis_registry.json", "data/stress_test_set.json", 250)
