#!/usr/bin/env python3
"""
generate_briefs.py — Pre-generate AI intelligence briefs for all candidates.

Observer: Viktor's P52 (pilot HU-0)
Model: claude-sonnet-4-6 (via Anthropic API)

Reads:  data/hungary/scored-candidates.json
Writes: data/hungary/briefs.json

Run after each scraper + merge cycle.
Only regenerates candidates whose evidence has changed since last run
(unless --force is passed).

Usage:
  python3 scripts/generate_briefs.py
  python3 scripts/generate_briefs.py --force
  python3 scripts/generate_briefs.py --limit 10   # test run
  python3 scripts/generate_briefs.py --dry-run     # show prompts, no API calls
"""

import json
import os
import sys
import time
import hashlib
import argparse
from datetime import datetime, timezone
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent.parent
SCORED_PATH = REPO_ROOT / "data/hungary/scored-candidates.json"
BRIEFS_PATH = REPO_ROOT / "data/hungary/briefs.json"

# ── Config ─────────────────────────────────────────────────────────────────────
MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 600
RATE_LIMIT_DELAY = 0.5   # seconds between API calls (avoid 429s)
MIN_EVIDENCE_FOR_BRIEF = 1  # generate even for 1 item, mark confidence accordingly

SYSTEM_PROMPT = """You are Prism's civic intelligence layer — a non-partisan, open-source civic intelligence platform.

Your job is to synthesise public record data about political candidates into a brief, factual summary that helps voters make informed decisions. 

Rules you must follow without exception:
- State ONLY what is supported by the evidence provided. Do not infer, speculate, or add outside knowledge.
- Use neutral, factual language. Never judgmental, inflammatory, or sensationalist.
- Focus on what is materially relevant to voters making a democratic choice.
- Be concise: 3–5 sentences maximum per language.
- Do not make voting recommendations or tell the user what to conclude.
- If evidence is sparse or low-confidence, say so explicitly.
- The Hungarian brief must be a faithful translation of the English, not a separate composition.

Respond with valid JSON only — no markdown, no commentary, just the JSON object."""

def build_user_prompt(candidate: dict) -> str:
    name = candidate.get("name", "Unknown")
    party = candidate.get("party", "Unknown")
    constituency = candidate.get("constituency_name_en", "")
    evidence = candidate.get("evidence", [])
    scores = candidate.get("scores", {})
    flags = candidate.get("flags", [])
    data_quality = candidate.get("data_quality", "none")
    total_items = candidate.get("total_evidence_items", 0)

    lines = [
        f"Candidate: {name}",
        f"Party: {party}",
        f"Constituency: {constituency}",
        f"Data quality: {data_quality} ({total_items} evidence items)",
        "",
        "Evidence items:",
    ]

    for i, ev in enumerate(evidence[:10], 1):  # cap at 10 items
        source = ev.get("source", "unknown")
        ev_type = ev.get("type", "unknown")
        title = ev.get("title", ev.get("text", ev.get("excerpt", "")))[:200]
        confidence = ev.get("confidence", "unknown")
        date = ev.get("date", "")
        lines.append(f"  {i}. [{source}] {ev_type} — \"{title}\" (confidence: {confidence}, date: {date})")

    if scores:
        lines.append("")
        lines.append("Scores:")
        for k, v in scores.items():
            if isinstance(v, dict):
                val = v.get("value", "?")
                note = v.get("note", "")
                lines.append(f"  {k}: {val}/100 — {note}")

    if flags:
        lines.append("")
        lines.append("Flags raised:")
        for f in flags[:5]:
            lines.append(f"  - [{f.get('severity','?')}] {f.get('type','?')}: {f.get('title','')[:100]}")

    lines.append("")
    lines.append("Generate a voter intelligence brief. Respond with this exact JSON structure:")
    lines.append('{')
    lines.append('  "brief_en": "3-5 sentence factual summary in English.",')
    lines.append('  "brief_hu": "3-5 mondatos tárgyilagos összefoglaló magyarul."')
    lines.append('}')

    return "\n".join(lines)


def evidence_hash(candidate: dict) -> str:
    """Hash of evidence items to detect changes since last run."""
    evidence_str = json.dumps(candidate.get("evidence", []), sort_keys=True)
    return hashlib.md5(evidence_str.encode()).hexdigest()[:12]


def generate_brief(client: anthropic.Anthropic, candidate: dict, dry_run: bool = False) -> dict | None:
    """Call Anthropic API and return brief dict, or None on failure."""
    prompt = build_user_prompt(candidate)

    if dry_run:
        print(f"\n{'='*60}")
        print(f"DRY RUN — {candidate['name']}")
        print(prompt[:500])
        return {
            "brief_en": "[DRY RUN — no API call made]",
            "brief_hu": "[DRY RUN — nincs API hívás]",
        }

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        # Strip markdown code fences if model adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw)
        return result
    except json.JSONDecodeError as e:
        print(f"  JSON parse error for {candidate['name']}: {e}")
        print(f"  Raw response: {raw[:200]}")
        return None
    except anthropic.RateLimitError:
        print(f"  Rate limited — waiting 10s...")
        time.sleep(10)
        return None
    except Exception as e:
        print(f"  API error for {candidate['name']}: {e}")
        return None


def confidence_from_quality(data_quality: str, total_items: int) -> str:
    if data_quality == "rich" or total_items >= 5:
        return "high"
    elif data_quality == "some" or total_items >= 2:
        return "medium"
    else:
        return "low"


def main():
    parser = argparse.ArgumentParser(description="Generate AI briefs for all candidates")
    parser.add_argument("--force", action="store_true", help="Regenerate all briefs, even unchanged ones")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N candidates (for testing)")
    parser.add_argument("--dry-run", action="store_true", help="Show prompts without making API calls")
    parser.add_argument("--kpn-id", type=int, default=None, help="Process only this candidate (by kpn_id)")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key and not args.dry_run:
        print("ERROR: ANTHROPIC_API_KEY environment variable not set.")
        print("Export it before running: export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key) if not args.dry_run else None

    # Load scored candidates
    print(f"Loading {SCORED_PATH}...")
    with open(SCORED_PATH) as f:
        scored = json.load(f)
    candidates = scored["candidates"]
    print(f"  {len(candidates)} candidates loaded")

    # Load existing briefs
    existing: dict = {}
    if BRIEFS_PATH.exists():
        with open(BRIEFS_PATH) as f:
            existing_data = json.load(f)
            existing = {str(b["kpn_id"]): b for b in existing_data.get("briefs", [])}
    print(f"  {len(existing)} existing briefs found")

    # Filter candidates to process
    to_process = []
    skipped = 0
    no_evidence = 0

    for c in candidates:
        kpn_id = c.get("kpn_id")
        total_items = c.get("total_evidence_items", 0)

        if args.kpn_id and kpn_id != args.kpn_id:
            continue

        if total_items == 0:
            no_evidence += 1
            continue  # skip no-evidence candidates — serve canned response from API

        ev_hash = evidence_hash(c)
        existing_entry = existing.get(str(kpn_id))

        if not args.force and existing_entry and existing_entry.get("evidence_hash") == ev_hash:
            skipped += 1
            continue

        to_process.append(c)

    if args.limit:
        to_process = to_process[:args.limit]

    print(f"  {no_evidence} candidates with no evidence (skipped — canned response)")
    print(f"  {skipped} candidates unchanged (skipped)")
    print(f"  {len(to_process)} candidates to process")

    if not to_process:
        print("Nothing to do.")
        return

    # Generate briefs
    results = dict(existing)  # start with all existing
    success = 0
    failed = 0

    for i, candidate in enumerate(to_process, 1):
        kpn_id = candidate["kpn_id"]
        name = candidate["name"]
        total_items = candidate.get("total_evidence_items", 0)
        print(f"[{i}/{len(to_process)}] {name} ({total_items} items)...")

        brief_content = generate_brief(client, candidate, dry_run=args.dry_run)

        if brief_content is None:
            print(f"  ✗ Failed")
            failed += 1
            continue

        sources_used = list({ev.get("source") for ev in candidate.get("evidence", []) if ev.get("source")})

        entry = {
            "kpn_id": kpn_id,
            "name": name,
            "party": candidate.get("party"),
            "brief_en": brief_content.get("brief_en", ""),
            "brief_hu": brief_content.get("brief_hu", ""),
            "confidence": confidence_from_quality(candidate.get("data_quality", "none"), total_items),
            "evidence_count": total_items,
            "sources_used": sources_used,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model_used": MODEL if not args.dry_run else "dry-run",
            "evidence_hash": evidence_hash(candidate),
        }

        results[str(kpn_id)] = entry
        success += 1
        print(f"  ✓ Done")

        if not args.dry_run:
            time.sleep(RATE_LIMIT_DELAY)

    # Write output
    output = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model": MODEL,
            "observer": "BaraBonc-P52 (HU pilot observer)",
            "total_briefs": len(results),
            "candidates_with_evidence": len(results),
        },
        "briefs": list(results.values()),
    }

    with open(BRIEFS_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"Done. {success} generated, {failed} failed, {skipped} skipped (unchanged).")
    print(f"Output: {BRIEFS_PATH}")
    print(f"Total briefs in file: {len(results)}")


if __name__ == "__main__":
    main()
