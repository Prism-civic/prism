#!/usr/bin/env python3
"""
generate_summaries.py — Pre-generate AI article summaries on the observer machine.

Observer: BaraBonc-P52 (HU pilot)
Model: claude-sonnet-4-6 (via local Claude CLI OAuth — no API key, observer-only)

Reads:  data/hungary/intelligence/foreign/feed.json
        data/hungary/intelligence/social/feed.json
        (and any other feed.json files discovered under data/)

Writes: data/hungary/summaries.json
        website/src/data/hungary/summaries.json  (Vercel bundle copy)

The web API (/api/article) becomes a pure static lookup — no Vercel API key,
no runtime AI calls, no per-request cost. D-021 pattern.

IMPORTANT: Uses the local `claude` CLI (OAuth via claude.ai) — NOT an API key.
           ANTHROPIC_API_KEY must NOT be set when running this script.

Usage:
  python3 scripts/generate_summaries.py
  python3 scripts/generate_summaries.py --force          # regenerate all
  python3 scripts/generate_summaries.py --limit 5        # test run
  python3 scripts/generate_summaries.py --dry-run        # no AI calls
  python3 scripts/generate_summaries.py --url <url>      # single article
"""

import json
import os
import sys
import time
import hashlib
import argparse
import re
import subprocess
import shutil
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# ── Claude CLI check ───────────────────────────────────────────────────────────
CLAUDE_BIN = shutil.which('claude')
if not CLAUDE_BIN:
    print("ERROR: `claude` CLI not found in PATH. Install Claude Code: npm install -g @anthropic-ai/claude-code")
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO_ROOT   = Path(__file__).parent.parent
DATA_DIR    = REPO_ROOT / "data/hungary/intelligence"
OUT_DATA    = REPO_ROOT / "data/hungary/summaries.json"
OUT_WEBSITE = REPO_ROOT / "website/src/data/hungary/summaries.json"

# ── Config ─────────────────────────────────────────────────────────────────────
MODEL        = "claude-sonnet-4-6"
MAX_TOKENS   = 800
RATE_LIMIT   = 0.6   # seconds between API calls
FETCH_TIMEOUT = 12   # seconds for URL fetch
MAX_BODY_CHARS = 8000

SYSTEM_PROMPT = """You are Prism's article summariser — a neutral civic intelligence platform.

Your job: extract the core content of a news article and present it cleanly, without ads, without clutter, without paywall content.

Rules:
- Summarise in 3–5 short paragraphs
- Neutral, factual language only — no opinion, no framing not present in the source
- Cover who, what, when, where, why where the article does
- Keep each paragraph 2–4 sentences
- Do NOT make up details not in the article text
- If the text is too sparse to summarise meaningfully, say so briefly
- The Hungarian summary must be a faithful translation of the English — not a separate composition

Respond with valid JSON only — no markdown, no commentary:
{"summary_en": "...", "summary_hu": "..."}"""


# ── HTML text extraction ───────────────────────────────────────────────────────

def extract_text(html: str) -> dict:
    """Strip HTML to plain article text. Returns {title, body}."""
    # Kill noise elements
    for tag in ['script', 'style', 'nav', 'header', 'footer', 'aside', 'figure', 'form', 'noscript', 'iframe']:
        html = re.sub(rf'<{tag}[^>]*>[\s\S]*?</{tag}>', ' ', html, flags=re.IGNORECASE)
    html = re.sub(r'<!--[\s\S]*?-->', '', html)

    # Extract title
    m = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    title = m.group(1).strip() if m else ''
    # Clean title — remove site name after " - " or " | "
    title = re.split(r'\s*[|\-–—]\s*', title)[0].strip()

    # Prefer <article> or <main>
    for tag in ['article', 'main']:
        m = re.search(rf'<{tag}[^>]*>([\s\S]*?)</{tag}>', html, re.IGNORECASE)
        if m:
            html = m.group(1)
            break

    # Strip all tags
    body = re.sub(r'<[^>]+>', ' ', html)
    # Decode common entities
    for ent, ch in [('&nbsp;', ' '), ('&amp;', '&'), ('&lt;', '<'), ('&gt;', '>'),
                    ('&quot;', '"'), ('&#39;', "'"), ('&hellip;', '…')]:
        body = body.replace(ent, ch)
    # Normalise whitespace
    body = re.sub(r'[ \t]{3,}', ' ', body)
    body = re.sub(r'\n{3,}', '\n\n', body)
    body = body.strip()

    return {'title': title, 'body': body}


def fetch_article(url: str) -> dict | None:
    """Fetch URL and return {title, body, word_count} or None on failure."""
    try:
        req = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; Prism-Observer/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-GB,en;q=0.9,hu;q=0.8',
        })
        with urlopen(req, timeout=FETCH_TIMEOUT) as resp:
            html = resp.read().decode('utf-8', errors='replace')
        extracted = extract_text(html)
        word_count = len(extracted['body'].split())
        return {**extracted, 'word_count': word_count}
    except HTTPError as e:
        print(f"  HTTP {e.code}: {url[:60]}")
        return None
    except URLError as e:
        print(f"  Fetch failed: {e.reason} — {url[:60]}")
        return None
    except Exception as e:
        print(f"  Error fetching {url[:60]}: {e}")
        return None


# ── AI summary generation (via local Claude CLI — OAuth, no API key) ───────────

def generate_summary(article: dict, url: str, dry_run: bool) -> dict | None:
    """Call local `claude` CLI (OAuth) and return {summary_en, summary_hu} or None."""
    body = article['body'][:MAX_BODY_CHARS]
    title = article.get('title', '')

    if dry_run:
        print(f"  DRY RUN — would summarise {len(body)} chars")
        return {'summary_en': '[DRY RUN]', 'summary_hu': '[DRY RUN]'}

    if len(body) < 200:
        return {
            'summary_en': 'The article text could not be extracted from this source. The site may require a subscription or block automated access.',
            'summary_hu': 'A cikk szövege nem volt kinyerhető ebből a forrásból. Az oldal előfizetést igényelhet vagy blokkolhatja az automatikus hozzáférést.',
        }

    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Article URL: {url}\nTitle: {title}\n\nArticle text:\n{body}\n\n"
        "Generate a clean summary. Respond with a JSON object with two keys: summary_en and summary_hu. "
        "Use double quotes only. Escape any quotes inside the strings. No markdown, no code fences."
    )

    # Strip ANTHROPIC_API_KEY so Claude CLI uses its OAuth session
    env = {k: v for k, v in os.environ.items() if k != 'ANTHROPIC_API_KEY'}

    try:
        result = subprocess.run(
            [CLAUDE_BIN, '--print', '--model', MODEL, prompt],
            capture_output=True, text=True, timeout=90, env=env,
        )
        if result.returncode != 0:
            print(f"  claude CLI error: {result.stderr.strip()[:120]}")
            return None
        raw = result.stdout.strip()
        # Strip code fences if present
        if '```' in raw:
            parts = raw.split('```')
            for part in parts:
                stripped = part.strip()
                if stripped.startswith('json'):
                    stripped = stripped[4:].strip()
                if stripped.startswith('{'):
                    raw = stripped
                    break
        # Find first JSON object in output
        start = raw.find('{')
        end = raw.rfind('}')
        if start != -1 and end != -1:
            raw = raw[start:end+1]
        return json.loads(raw)
    except subprocess.TimeoutExpired:
        print("  Timeout after 90s")
        return None
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e} — raw: {raw[:150]}")
        return None
    except Exception as e:
        print(f"  CLI error: {e}")
        return None


# ── URL hash ───────────────────────────────────────────────────────────────────

def url_hash(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()[:12]


# ── Collect all article URLs from feed files ──────────────────────────────────

def collect_urls() -> list[dict]:
    """Walk intelligence directories and collect all press article URLs."""
    found = []
    for feed_path in DATA_DIR.rglob('feed.json'):
        try:
            data = json.load(open(feed_path))
            items = data if isinstance(data, list) else data.get('items', [])
            for item in items:
                url = item.get('url', '')
                if not url or not url.startswith('http'):
                    continue
                if item.get('content_type') == 'social':
                    continue
                found.append({
                    'url': url,
                    'title': item.get('title', ''),
                    'source_name': item.get('source', item.get('source_name', '')),
                    'source_domain': item.get('source_domain', ''),
                    'published': item.get('published', item.get('date', '')),
                })
        except Exception as e:
            print(f"Skipping {feed_path}: {e}")

    # Deduplicate by URL
    seen = set()
    deduped = []
    for item in found:
        if item['url'] not in seen:
            seen.add(item['url'])
            deduped.append(item)

    return deduped


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate article summaries on the observer machine")
    parser.add_argument('--force',   action='store_true', help='Regenerate all, even if cached')
    parser.add_argument('--limit',   type=int, default=None, help='Process at most N articles (for testing)')
    parser.add_argument('--dry-run', action='store_true', help='No API calls — show what would run')
    parser.add_argument('--url',     type=str, default=None, help='Summarise a single URL')
    args = parser.parse_args()

    # Uses local Claude CLI (OAuth) — no API key needed or allowed
    if not args.dry_run:
        print(f"Using Claude CLI: {CLAUDE_BIN} (OAuth — no API key)")

    # Load existing summaries
    existing: dict[str, dict] = {}
    if OUT_DATA.exists():
        try:
            data = json.load(open(OUT_DATA))
            for s in data.get('summaries', []):
                existing[s['url']] = s
        except Exception:
            pass
    print(f"Loaded {len(existing)} existing summaries")

    # Collect URLs
    if args.url:
        urls = [{'url': args.url, 'title': '', 'source_name': '', 'source_domain': '', 'published': ''}]
    else:
        urls = collect_urls()
    print(f"Found {len(urls)} URLs in feeds")

    # Filter: skip already done unless --force
    to_process = []
    skipped = 0
    for item in urls:
        if not args.force and item['url'] in existing:
            skipped += 1
            continue
        to_process.append(item)

    if args.limit:
        to_process = to_process[:args.limit]

    print(f"Skipped (already done): {skipped}")
    print(f"To process: {len(to_process)}")

    if not to_process:
        print("Nothing to do. Use --force to regenerate all.")
        if not args.dry_run:
            _write_output(existing)
        return

    results = dict(existing)
    success = failed = fetch_fail = 0

    for i, item in enumerate(to_process, 1):
        url = item['url']
        print(f"[{i}/{len(to_process)}] {item.get('title', url)[:60]}")

        # Fetch
        article = fetch_article(url)
        if not article:
            fetch_fail += 1
            # Still create an entry so we don't retry every run
            results[url] = {
                'url': url,
                'title': item.get('title', ''),
                'source_name': item.get('source_name', ''),
                'summary_en': 'This article could not be fetched. The source may require a subscription or block automated access.',
                'summary_hu': 'Ez a cikk nem volt letölthető. A forrás előfizetést igényelhet vagy blokkolhatja az automatikus hozzáférést.',
                'word_count': 0,
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'model_used': 'none (fetch failed)',
                'url_hash': url_hash(url),
                'fetch_failed': True,
            }
            continue

        print(f"  Fetched {article['word_count']} words — summarising...")

        # Summarise
        summary = generate_summary(article, url, args.dry_run)
        if not summary:
            failed += 1
            continue

        results[url] = {
            'url': url,
            'title': article['title'] or item.get('title', ''),
            'source_name': item.get('source_name', ''),
            'source_domain': item.get('source_domain', ''),
            'published': item.get('published', ''),
            'summary_en': summary.get('summary_en', ''),
            'summary_hu': summary.get('summary_hu', ''),
            'word_count': article['word_count'],
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'model_used': MODEL if not args.dry_run else 'dry-run',
            'url_hash': url_hash(url),
        }
        success += 1
        print(f"  ✓ Done")

        if not args.dry_run:
            time.sleep(RATE_LIMIT)

    if not args.dry_run:
        _write_output(results)

    print(f"\n{'='*60}")
    print(f"Done. {success} generated, {failed} API failed, {fetch_fail} fetch failed, {skipped} skipped")
    print(f"Total in output: {len(results)}")


def _write_output(results: dict):
    output = {
        'meta': {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'model': MODEL,
            'observer': 'BaraBonc-P52 (HU pilot observer)',
            'total_summaries': len(results),
        },
        'summaries': list(results.values()),
    }
    for out_path in [OUT_DATA, OUT_WEBSITE]:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Written to {OUT_DATA} and {OUT_WEBSITE}")


if __name__ == '__main__':
    main()
