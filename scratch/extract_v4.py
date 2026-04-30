import fitz
import re
import json

def extract_v4(pdf_path):
    doc = fitz.open(pdf_path)
    all_text = ""
    for page in doc:
        all_text += page.get_text() + "\n"
    
    stds = []
    # Find all "IS" occurrences
    is_indices = [m.start() for m in re.finditer(r'IS\n', all_text)]
    
    for i in range(len(is_indices)):
        start = is_indices[i]
        end = is_indices[i+1] if i+1 < len(is_indices) else len(all_text)
        chunk = all_text[start:end]
        
        lines = [l.strip() for l in chunk.split('\n') if l.strip()]
        if len(lines) < 2: continue
        
        # IS is lines[0]
        # Number is usually lines[1]
        std_num = lines[1]
        
        # Check if lines[1] is actually a number
        if not re.search(r'\d+', std_num): 
            if len(lines) > 2:
                std_num = lines[2]
            else:
                continue

        # Find all parts in the chunk
        parts = re.findall(r'\(Part\s*\d+\)\s*[:\s]*\d{4}', chunk)
        if parts:
            for part in parts:
                # Find title after part
                part_start = chunk.find(part)
                after_part = chunk[part_start + len(part):].strip()
                part_title = after_part.split('\n')[0]
                stds.append({
                    "standard_id": f"IS {std_num} {part}",
                    "title": part_title,
                    "category": "Building Materials",
                    "scope": part_title,
                    "keywords": [std_num, part] + part_title.lower().split(),
                    "related_standards": [],
                    "scope_detail": f"Standard for {part_title}"
                })
        else:
            # Single standard
            title = " ".join(lines[2:4])
            stds.append({
                "standard_id": f"IS {std_num}",
                "title": title,
                "category": "Building Materials",
                "scope": title,
                "keywords": [std_num] + title.lower().split(),
                "related_standards": [],
                "scope_detail": f"Standard for {title}"
            })

    unique = {}
    for s in stds:
        sid = s["standard_id"].replace('\n', ' ').replace('  ', ' ')
        if len(sid) < 50 and len(s["title"]) > 5:
            unique[sid] = s
            
    return list(unique.values())

if __name__ == "__main__":
    stds = extract_v4("dataset.pdf")
    print(f"Extracted {len(stds)} unique standards.")
    with open("src/data/bis_registry.json", "w") as f:
        json.dump(stds, f, indent=2)
