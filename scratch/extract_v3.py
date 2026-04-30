import fitz
import re
import json

def extract_v3(pdf_path):
    doc = fitz.open(pdf_path)
    all_text = ""
    for page in doc:
        all_text += page.get_text() + "\n"
    
    # Split into blocks of text
    # Standard format often starts with IS on its own line or followed by space
    # Example:
    # IS
    # 269 : 1989
    # 33 grade ordinary Portland cement
    
    stds = []
    
    # Look for "IS" followed by a number
    # regex to handle multi-line IS blocks
    pattern = re.compile(r'IS\s*\n?\s*(\d+.*?)(?=\nIS|\nSECTION|\Z)', re.DOTALL)
    
    matches = pattern.finditer(all_text)
    for m in matches:
        content = m.group(1).strip()
        lines = [l.strip() for l in content.split('\n') if l.strip()]
        
        if not lines: continue
        
        # Line 0 is usually the number and year
        std_num = lines[0]
        # Lines after that are the title
        title = " ".join(lines[1:3]) # Take first two title lines
        
        # Check for Parts
        if "(Part" in content:
            part_matches = re.finditer(r'\(Part\s*\d+\).*?\n(.*?)(?=\n\(Part|\Z)', content, re.DOTALL)
            for pm in part_matches:
                part_info = pm.group(0).split('\n')[0].strip()
                part_title = pm.group(1).strip().replace('\n', ' ')
                stds.append({
                    "standard_id": f"IS {std_num} {part_info}",
                    "title": f"{title} - {part_title}",
                    "category": "Building Materials",
                    "scope": f"{title} - {part_title}",
                    "keywords": [std_num, part_info] + title.lower().split(),
                    "related_standards": [],
                    "scope_detail": f"Standard for {title} {part_info}"
                })
        else:
            stds.append({
                "standard_id": f"IS {std_num}",
                "title": title,
                "category": "Building Materials",
                "scope": title,
                "keywords": [std_num] + title.lower().split(),
                "related_standards": [],
                "scope_detail": f"Standard for {title}"
            })

    # Clean up results
    unique = {}
    for s in stds:
        sid = s["standard_id"].replace('\n', ' ').replace('  ', ' ')
        if len(sid) < 40 and len(s["title"]) > 10:
            unique[sid] = s
            
    return list(unique.values())

if __name__ == "__main__":
    stds = extract_v3("dataset.pdf")
    print(f"Extracted {len(stds)} unique standards.")
    with open("src/data/bis_registry.json", "w") as f:
        json.dump(stds, f, indent=2)
