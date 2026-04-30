import fitz
import re
import json

def extract_all_stds_robust(pdf_path):
    doc = fitz.open(pdf_path)
    all_stds = []
    
    current_std_id = None
    current_title = None
    
    # Iterate through all pages
    for i in range(len(doc)):
        text = doc[i].get_text()
        lines = text.split('\n')
        
        j = 0
        while j < len(lines):
            line = lines[j].strip()
            
            # Pattern 1: "IS 2185" followed by "Concrete masonry units:" then "(Part 1): 1979"
            if re.match(r'^IS\s+\d+$', line):
                base_id = line
                j += 1
                if j < len(lines):
                    potential_title = lines[j].strip()
                    j += 1
                    # Look for parts
                    while j < len(lines) and re.search(r'\(Part \d+\)', lines[j]):
                        part_info = lines[j].strip()
                        full_id = f"{base_id} {part_info}"
                        # Title is usually the potential_title or the text after part_info
                        title = potential_title
                        all_stds.append({
                            "standard_id": full_id,
                            "title": title,
                            "category": "Building Materials",
                            "scope": title,
                            "keywords": [base_id, part_info] + title.lower().split(),
                            "related_standards": [],
                            "scope_detail": f"Standard for {title}"
                        })
                        j += 1
                    # If no parts found, the potential_title was the title
                    if not any(re.search(r'\(Part \d+\)', l) for l in lines[j-1:j+1]):
                        all_stds.append({
                            "standard_id": base_id,
                            "title": potential_title,
                            "category": "Building Materials",
                            "scope": potential_title,
                            "keywords": [base_id] + potential_title.lower().split(),
                            "related_standards": [],
                            "scope_detail": f"Standard for {potential_title}"
                        })
                continue
            
            # Pattern 2: "IS 383 : 1970"
            match = re.match(r'^(IS\s+\d+.*?:\s*\d{4})$', line)
            if match:
                std_id = match.group(1)
                j += 1
                if j < len(lines):
                    title = lines[j].strip()
                    if len(title) > 5:
                        all_stds.append({
                            "standard_id": std_id,
                            "title": title,
                            "category": "Building Materials",
                            "scope": title,
                            "keywords": [std_id] + title.lower().split(),
                            "related_standards": [],
                            "scope_detail": f"Standard for {title}"
                        })
            
            j += 1
            
    # Deduplicate and clean
    unique_stds = {}
    for s in all_stds:
        key = s["standard_id"].replace(" ", "").lower()
        if key not in unique_stds or len(s["title"]) > len(unique_stds[key]["title"]):
            unique_stds[key] = s
            
    return list(unique_stds.values())

if __name__ == "__main__":
    stds = extract_all_stds_robust("dataset.pdf")
    print(f"Extracted {len(stds)} unique standards.")
    with open("src/data/bis_registry.json", "w") as f:
        json.dump(stds, f, indent=2)
