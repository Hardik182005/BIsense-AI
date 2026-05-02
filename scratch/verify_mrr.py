import json
import re

def clean_std(std):
    # Remove spaces and standardize format for comparison
    return re.sub(r'\s+', '', std).replace(':', '').lower()

def calculate_mrr():
    with open('data/public_test_set.json', 'r') as f:
        test_set = json.load(f)
    
    with open('data/public_results.json', 'r') as f:
        results = json.load(f)
        
    mrr_sum = 0
    total = len(test_set)
    hits_at_3 = 0
    
    print(f"{'ID':<10} | {'Expected':<25} | {'Rank':<5} | {'Reciprocal Rank'}")
    print("-" * 60)
    
    for test in test_set:
        id = test['id']
        expected = [clean_std(s) for s in test['expected_standards']]
        
        # Find corresponding result
        result = next((r for r in results if r['id'] == id), None)
        if not result:
            print(f"{id:<10} | {'MISSING RESULT':<25} | {'N/A':<5} | 0")
            continue
            
        retrieved = [clean_std(s) for s in result['retrieved_standards']]
        
        rank = -1
        for i, r_std in enumerate(retrieved):
            if any(e in r_std for e in expected) or any(r_std in e for e in expected):
                rank = i + 1
                break
        
        rr = 1/rank if rank > 0 else 0
        mrr_sum += rr
        
        if 0 < rank <= 3:
            hits_at_3 += 1
            
        rank_str = str(rank) if rank > 0 else "MISS"
        print(f"{id:<10} | {test['expected_standards'][0]:<25} | {rank_str:<5} | {rr:.3f}")
        
    mrr = mrr_sum / total
    hit_rate_3 = (hits_at_3 / total) * 100
    
    print("-" * 60)
    print(f"FINAL MRR: {mrr:.4f}")
    print(f"HIT RATE @3: {hit_rate_3:.2f}%")

if __name__ == "__main__":
    calculate_mrr()
