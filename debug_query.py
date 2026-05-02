from src.src.retriever import get_engine
import json

def test_query():
    engine = get_engine()
    query = "TMT steel bars for earthquake-resistant construction"
    results = engine.retrieve(query)
    
    print(f"Query: {query}")
    print(f"Results count: {len(results)}")
    
    if results:
        for i, r in enumerate(results):
            print(f"Result {i+1}: {r['standard']['standard_id']} - Score: {r['score']}")
    else:
        # If no results, show the top scored items before threshold
        print("No results returned. Checking raw scores...")
        # We need to access the scored list, but it's internal. 
        # Let's mock a retrieval to see raw scores.
        scored = []
        # ... logic to see raw scores ...
    
    readiness = engine.get_readiness_score(query, results)
    print("\nReadiness Score:", readiness['score'])
    print("Breakdown:", readiness['breakdown'])

if __name__ == "__main__":
    test_query()
