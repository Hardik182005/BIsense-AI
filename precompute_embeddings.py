import json
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

def precompute():
    print("Loading registry...")
    registry_path = Path("src/data/bis_registry.json")
    if not registry_path.exists():
        registry_path = Path("data/bis_registry.json") # Fallback
        
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
        
    doc_texts = [
        f"{std['title']} {std['category']} {std['scope']} {' '.join(std['keywords'])}"
        for std in registry
    ]
    
    print("Loading model...")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    
    print("Computing embeddings...")
    embeddings = model.encode(doc_texts, show_progress_bar=True)
    
    output_path = Path("src/data/embeddings.npy")
    np.save(output_path, embeddings)
    print(f"Saved embeddings to {output_path}")

if __name__ == "__main__":
    precompute()
