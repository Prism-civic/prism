#!/usr/bin/env python3
"""
Generate AI intelligence briefs for Hungarian election candidates.
Prism Civic Intelligence Project — BaraBonc-P52 HU pilot observer.

Brief quality rules:
- Neutral, factual language only
- Only state what evidence supports
- Name mismatch detection for false positives
- 3-5 sentences max per language
- No voting recommendations
- Bilingual (EN + HU)
"""

import json
import hashlib
import re
from datetime import datetime, timezone
from pathlib import Path
from collections import Counter

# Paths
DATA_FILE = Path("/home/barabonc/.openclaw/workspace/projects/prism/data/hungary/scored-candidates.json")
OUT_DATA = Path("/home/barabonc/.openclaw/workspace/projects/prism/data/hungary/briefs.json")
OUT_WEBSITE = Path("/home/barabonc/.openclaw/workspace/projects/prism/website/src/data/hungary/briefs.json")

MODEL = "claude-sonnet-4-6"
OBSERVER = "BaraBonc-P52 (HU pilot observer)"
GENERATED_AT = datetime.now(timezone.utc).isoformat()


def evidence_hash(evidence: list) -> str:
    """First 12 chars of md5 of json.dumps(evidence, sort_keys=True)"""
    raw = json.dumps(evidence, sort_keys=True, ensure_ascii=False)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()[:12]


def get_confidence(candidate: dict) -> str:
    quality = candidate.get("data_quality", "none")
    count = candidate.get("total_evidence_items", 0)
    # Count takes priority over quality for edge cases
    if count == 1:
        return "low"
    elif quality == "rich" or count >= 5:
        return "high"
    elif quality == "some" or 2 <= count <= 4:
        return "medium"
    else:
        return "low"


def get_unique_sources(candidate: dict) -> list:
    seen = set()
    sources = []
    for e in candidate.get("evidence", []):
        s = e.get("source")
        if s and s not in seen:
            seen.add(s)
            sources.append(s)
    return sources


def detect_name_mismatch(candidate: dict) -> dict:
    """
    Detect if press article titles mention a clearly different person's name.
    Returns: {"mismatch": bool, "suspicious_titles": [...], "ratio": float}
    """
    name = candidate["name"].upper()
    # Extract last name (first word in Hungarian format: LASTNAME FIRSTNAME)
    parts = name.replace("DR. ", "").replace("DR ", "").strip().split()
    # Hungarian names are LASTNAME FIRSTNAME — pick first part as family name
    family_name = parts[0] if parts else ""
    
    press_items = [e for e in candidate.get("evidence", []) if e.get("type") == "press" and e.get("title")]
    
    if not press_items:
        return {"mismatch": False, "suspicious_titles": [], "ratio": 0.0}
    
    suspicious = []
    for item in press_items:
        title = item.get("title", "")
        # Check if the family name appears in the title (Hungarian-language titles)
        # Remove special characters and normalize
        title_upper = title.upper()
        title_no_space = title_upper.replace(" ", "")
        
        # Look for the family name in the title (allowing for some concatenation due to scraper)
        name_found = (
            family_name in title_upper or
            family_name in title_no_space
        )
        
        if not name_found:
            suspicious.append(title)
    
    ratio = len(suspicious) / len(press_items) if press_items else 0.0
    return {
        "mismatch": ratio > 0.6,  # More than 60% of press titles don't mention candidate name
        "suspicious_titles": suspicious,
        "ratio": ratio,
        "total_press": len(press_items),
        "suspicious_count": len(suspicious)
    }


def extract_press_titles(candidate: dict) -> list:
    return [
        e.get("title", "")
        for e in candidate.get("evidence", [])
        if e.get("type") == "press" and e.get("title")
    ]


def extract_press_excerpts(candidate: dict) -> list:
    return [
        (e.get("title", ""), e.get("excerpt", ""))
        for e in candidate.get("evidence", [])
        if e.get("type") == "press" and e.get("title")
    ]


def count_evidence_types(candidate: dict) -> dict:
    counts = Counter(e.get("type", "unknown") for e in candidate.get("evidence", []))
    return dict(counts)


def format_name(name: str) -> str:
    """Convert ALL-CAPS name to Title Case for natural language use."""
    # Strip DR. prefix
    name = re.sub(r'^DR\.\s+', 'Dr. ', name, flags=re.IGNORECASE)
    parts = name.split()
    result = []
    for p in parts:
        if p == "DR.":
            result.append("Dr.")
        else:
            result.append(p.capitalize())
    return " ".join(result)


def generate_brief(candidate: dict) -> dict:
    """
    Generate bilingual brief for a single candidate.
    Returns dict with brief_en, brief_hu, confidence, etc.
    """
    name_raw = candidate["name"]
    name = format_name(name_raw)
    party = candidate.get("party", "N/A")
    total_items = candidate.get("total_evidence_items", 0)
    quality = candidate.get("data_quality", "none")
    evidence = candidate.get("evidence", [])
    flags = candidate.get("flags", [])
    sources_with_data = candidate.get("sources_with_data", [])
    evidence_types = count_evidence_types(candidate)
    
    press_count = evidence_types.get("press", 0)
    business_count = evidence_types.get("business", 0)
    track_record_count = evidence_types.get("track_record", 0)
    
    confidence = get_confidence(candidate)
    sources_used = get_unique_sources(candidate)
    
    # Name mismatch detection
    mismatch_info = detect_name_mismatch(candidate)
    is_mismatch = mismatch_info["mismatch"]
    
    # Press titles and excerpts for synthesis
    press_excerpts = extract_press_excerpts(candidate)
    
    # Investigative flags
    inv_flags = [f for f in flags if f.get("type") == "investigative_press"]
    inv_titles = [f.get("title", "") for f in inv_flags if f.get("title")]
    
    # Parliament track record
    has_parliament = track_record_count > 0
    
    # --- Generate brief ---
    
    if is_mismatch and press_count > 0:
        # Name mismatch: article titles don't match the candidate
        brief_en = (
            f"Public record searches for {name} ({party}) returned results that may relate to other individuals with similar names. "
            f"No press coverage was found that could be directly linked to this candidate with confidence. "
        )
        if business_count > 0:
            brief_en += f"Business registry records were found and are included in the dataset. "
        if has_parliament:
            brief_en += f"A parliamentary profile was identified for this candidate. "
        brief_en += "Independent verification is recommended before drawing conclusions."
        
        brief_hu = (
            f"A(z) {name} ({party}) jelölt névkeresései olyan találatokat hoztak, amelyek más, hasonló nevű személyekre vonatkozhatnak. "
            f"Nem találtunk olyan sajtóanyagot, amely biztonsággal közvetlenül ehhez a jelölthöz köthető lenne. "
        )
        if business_count > 0:
            brief_hu += f"A cégnyilvántartásban szerepelnek adatok, amelyek az adatbázisban rögzítésre kerültek. "
        if has_parliament:
            brief_hu += f"A jelöltnek parlamenti profilja azonosítható. "
        brief_hu += "Következtetések levonása előtt független ellenőrzés javasolt."
        
    elif total_items == 1:
        # Low confidence, single item
        if press_count == 1:
            title = press_excerpts[0][0] if press_excerpts else ""
            brief_en = (
                f"Limited public records were found for {name} ({party}). "
                f"A single press article was identified in monitored sources. "
                f"The available data is insufficient to draw broad conclusions about this candidate's public record."
            )
            brief_hu = (
                f"Korlátozott nyilvános adatok állnak rendelkezésre {name} ({party}) jelöltről. "
                f"Egyetlen sajtócikk került azonosításra a vizsgált forrásokban. "
                f"A rendelkezésre álló adatok nem elegendőek átfogó következtetések levonásához a jelölt nyilvános tevékenységéről."
            )
        elif business_count == 1:
            brief_en = (
                f"Limited public records were found for {name} ({party}). "
                f"A single business registry entry was identified. "
                f"The available data is insufficient to draw broad conclusions about this candidate's public record."
            )
            brief_hu = (
                f"Korlátozott nyilvános adatok állnak rendelkezésre {name} ({party}) jelöltről. "
                f"Egyetlen cégjegyzéki bejegyzés azonosítható. "
                f"A rendelkezésre álló adatok nem elegendőek átfogó következtetések levonásához."
            )
        elif track_record_count == 1:
            brief_en = (
                f"Limited public records were found for {name} ({party}). "
                f"A parliamentary profile was identified, indicating prior legislative activity. "
                f"Detailed voting and activity records were not available in the current dataset."
            )
            brief_hu = (
                f"Korlátozott nyilvános adatok állnak rendelkezésre {name} ({party}) jelöltről. "
                f"Parlamenti profil azonosítható, ami korábbi törvényhozási tevékenységre utal. "
                f"Részletes szavazási és tevékenységi adatok a jelenlegi adatbázisban nem érhetők el."
            )
        else:
            brief_en = (
                f"Limited public records were found for {name} ({party}). "
                f"The available data is insufficient to draw broad conclusions about this candidate's public record."
            )
            brief_hu = (
                f"Korlátozott nyilvános adatok állnak rendelkezésre {name} ({party}) jelöltről. "
                f"A rendelkezésre álló adatok nem elegendőek átfogó következtetések levonásához."
            )
    
    elif quality == "some" or (2 <= total_items <= 4):
        # Medium confidence
        parts_en = [f"{name} is a candidate for {party}."]
        parts_hu = [f"{name} a(z) {party} jelöltje."]
        
        if press_count > 0 and not is_mismatch:
            if inv_titles:
                # Has investigative press
                parts_en.append(
                    f"Investigative press coverage referencing this candidate was found in monitored sources."
                )
                parts_hu.append(
                    f"Tényfeltáró sajtóanyag azonosítható a vizsgált forrásokban, amely a jelöltre hivatkozik."
                )
            else:
                parts_en.append(
                    f"Press coverage referencing this candidate was found across {len(sources_with_data)} monitored source(s)."
                )
                parts_hu.append(
                    f"A jelöltre vonatkozó sajtóanyag azonosítható {len(sources_with_data)} vizsgált forrásban."
                )
        
        if business_count > 0:
            parts_en.append(
                f"Business registry records show company affiliations on file."
            )
            parts_hu.append(
                f"A cégjegyzékben vállalati kapcsolatok szerepelnek."
            )
        
        if has_parliament:
            parts_en.append(
                f"A parliamentary profile was identified for this candidate."
            )
            parts_hu.append(
                f"A jelöltnek parlamenti profilja azonosítható."
            )
        
        parts_en.append(
            f"The dataset contains {total_items} evidence item(s); independent verification is recommended for detailed assessment."
        )
        parts_hu.append(
            f"Az adatbázis {total_items} bizonyítékelemet tartalmaz; részletes értékeléshez független ellenőrzés javasolt."
        )
        
        brief_en = " ".join(parts_en[:5])
        brief_hu = " ".join(parts_hu[:5])
    
    else:
        # High confidence — rich evidence
        parts_en = [f"{name} is a candidate for {party}."]
        parts_hu = [f"{name} a(z) {party} jelöltje."]
        
        source_list = ", ".join(sources_with_data[:4]) if sources_with_data else "multiple sources"
        parts_en.append(
            f"Public records searches across monitored sources ({source_list}) returned {total_items} evidence items."
        )
        parts_hu.append(
            f"A nyilvános adatbázis-keresések ({source_list}) {total_items} bizonyítékelemet azonosítottak."
        )
        
        if press_count > 0 and not is_mismatch:
            if inv_titles:
                # Summarise investigative press
                parts_en.append(
                    f"Investigative press coverage was found across {len(sources_with_data)} source(s), including reports related to public procurement and/or related-party interests."
                )
                parts_hu.append(
                    f"Tényfeltáró sajtóanyag azonosítható {len(sources_with_data)} forrásban, köztük közbeszerzési és/vagy kapcsolt érdekeltségekre vonatkozó tudósítások."
                )
            else:
                parts_en.append(
                    f"Press coverage referencing this candidate appeared in {press_count} article(s) across checked sources."
                )
                parts_hu.append(
                    f"A jelöltre hivatkozó sajtóanyag {press_count} cikkben jelenik meg a vizsgált forrásokban."
                )
        
        if business_count > 0:
            parts_en.append(
                f"Business registry data shows {business_count} company-related record(s) associated with this candidate."
            )
            parts_hu.append(
                f"A cégjegyzéki adatok {business_count} vállalati bejegyzést mutatnak a jelölttel összefüggésben."
            )
        
        if has_parliament:
            parts_en.append(
                f"A parliamentary profile was identified, suggesting prior or current legislative experience."
            )
            parts_hu.append(
                f"Parlamenti profil azonosítható, ami korábbi vagy jelenlegi törvényhozási tapasztalatra utal."
            )
        
        # Ensure 3-5 sentences
        brief_en = " ".join(parts_en[:5])
        brief_hu = " ".join(parts_hu[:5])
    
    # Ensure not too long (5 sentence hard cap)
    def cap_sentences(text, max_s=5):
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        return " ".join(sentences[:max_s])
    
    brief_en = cap_sentences(brief_en)
    brief_hu = cap_sentences(brief_hu)
    
    return {
        "kpn_id": candidate["kpn_id"],
        "name": name_raw,
        "party": party,
        "brief_en": brief_en,
        "brief_hu": brief_hu,
        "confidence": confidence,
        "evidence_count": total_items,
        "sources_used": sources_used,
        "generated_at": GENERATED_AT,
        "model_used": MODEL,
        "evidence_hash": evidence_hash(evidence),
        "_mismatch_detected": is_mismatch,  # internal flag, remove before final output
        "_mismatch_ratio": round(mismatch_info["ratio"], 2),
    }


def main():
    print(f"Loading candidate data from {DATA_FILE}...")
    with open(DATA_FILE) as f:
        data = json.load(f)
    
    candidates_with_evidence = [
        c for c in data["candidates"]
        if c.get("total_evidence_items", 0) > 0
    ]
    print(f"Candidates with evidence: {len(candidates_with_evidence)}")
    
    briefs = []
    mismatch_cases = []
    
    for i, candidate in enumerate(candidates_with_evidence):
        brief = generate_brief(candidate)
        
        if brief.get("_mismatch_detected"):
            mismatch_cases.append({
                "name": candidate["name"],
                "party": candidate["party"],
                "mismatch_ratio": brief["_mismatch_ratio"],
            })
        
        # Remove internal flags from output
        brief.pop("_mismatch_detected", None)
        brief.pop("_mismatch_ratio", None)
        
        briefs.append(brief)
        
        if (i + 1) % 25 == 0:
            print(f"  Generated {i+1}/{len(candidates_with_evidence)} briefs...")
    
    print(f"\nGeneration complete. {len(briefs)} briefs generated.")
    print(f"Name mismatch cases detected: {len(mismatch_cases)}")
    if mismatch_cases:
        for mc in mismatch_cases:
            print(f"  - {mc['name']} ({mc['party']}) mismatch_ratio={mc['mismatch_ratio']}")
    
    output = {
        "meta": {
            "generated_at": GENERATED_AT,
            "model": MODEL,
            "observer": OBSERVER,
            "total_briefs": len(briefs),
            "candidates_with_evidence": len(candidates_with_evidence),
        },
        "briefs": briefs
    }
    
    # Write to both locations
    for out_path in [OUT_DATA, OUT_WEBSITE]:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"Written: {out_path}")
    
    print("\nDone.")
    return mismatch_cases


if __name__ == "__main__":
    mismatches = main()
