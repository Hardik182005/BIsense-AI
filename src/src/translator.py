"""
BISense AI — Language Translator
Handles Hindi, Marathi, Gujarati, Tamil → English normalization.
"""
import re

# Common Hindi/Marathi construction-related translations
REGIONAL_VOCAB = {
    # Hindi
    "निर्माण": "construction",
    "सीमेंट": "cement",
    "स्टील": "steel",
    "कंक्रीट": "concrete",
    "रेत": "sand",
    "बालू": "sand",
    "ईंट": "brick",
    "सरिया": "TMT bar reinforcement",
    "लोहा": "iron steel",
    "पाइप": "pipe",
    "ब्लॉक": "block",
    "छत": "roof",
    "इमारत": "building",
    "पुल": "bridge",
    "सड़क": "road",
    "मकान": "house",
    "भूकंप": "earthquake",
    "प्रतिरोधी": "resistant",
    # Marathi
    "बांधकाम": "construction",
    "सिमेंट": "cement",
    "पोलाद": "steel",
    "काँक्रीट": "concrete",
    "वाळू": "sand",
    "विटा": "brick",
    "पाईप": "pipe",
    # Gujarati
    "બાંધકામ": "construction",
    "સિમેન્ટ": "cement",
    "સ્ટીલ": "steel",
    "કોંક્રિટ": "concrete",
    # Generic
    "TMT": "TMT",
    "BIS": "BIS",
}


def translate_to_english(text: str) -> str:
    """
    Translate regional language input to English.
    Uses vocabulary mapping + falls back to extracting recognizable terms.
    """
    result = text
    for regional, english in REGIONAL_VOCAB.items():
        result = result.replace(regional, english)

    # If mostly ASCII after substitution, return cleaned result
    ascii_ratio = sum(1 for c in result if ord(c) < 128) / max(len(result), 1)
    if ascii_ratio < 0.5:
        # Extract any Latin-script words (like "TMT", "steel", "IS 1786")
        latin_words = re.findall(r'[A-Za-z0-9 :()]+', result)
        extracted = " ".join(latin_words).strip()
        return extracted if extracted else "construction material"

    return result.strip()


def detect_language(text: str) -> str:
    """Simple language detection based on Unicode ranges."""
    devanagari = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    gujarati = sum(1 for c in text if '\u0A80' <= c <= '\u0AFF')
    tamil = sum(1 for c in text if '\u0B80' <= c <= '\u0BFF')

    if devanagari > 2:
        return "hi"  # Hindi/Marathi
    elif gujarati > 2:
        return "gu"
    elif tamil > 2:
        return "ta"
    return "en"
