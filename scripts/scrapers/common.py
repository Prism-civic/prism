"""
Common utilities for Prism Hungary scrapers.
Rate-limiting, session management, output conventions.
"""
import json
import time
import os
import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('prism.scraper')

INTEL_BASE = Path(__file__).parent.parent.parent / 'data' / 'hungary' / 'intelligence'
CANDIDATES_JSON = Path(__file__).parent.parent.parent / 'data' / 'hungary' / 'candidates.json'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
}

def make_session(rate_limit_s=2.0):
    """Create a session with retry logic and rate limiting built in."""
    s = requests.Session()
    s.headers.update(HEADERS)
    retry = Retry(total=3, backoff_factor=2, status_forcelist=[429, 500, 502, 503, 504])
    s.mount('https://', HTTPAdapter(max_retries=retry))
    s.mount('http://', HTTPAdapter(max_retries=retry))
    s._rate_limit = rate_limit_s
    s._last_request = 0
    orig_send = s.send
    def rate_limited_send(request, **kwargs):
        elapsed = time.time() - s._last_request
        if elapsed < s._rate_limit:
            time.sleep(s._rate_limit - elapsed)
        s._last_request = time.time()
        return orig_send(request, **kwargs)
    s.send = rate_limited_send
    return s

def load_candidates():
    """Load the processed candidates.json, return flat list of active candidates."""
    with open(CANDIDATES_JSON, encoding='utf-8') as f:
        data = json.load(f)
    candidates = []
    for c in data['constituencies']:
        for cand in c.get('candidates', []):
            cand['constituency_name_hu'] = c['name_hu']
            cand['constituency_name_en'] = c['name_en']
            cand['county_name_hu'] = c['county_name_hu']
            cand['county_code'] = c['county_code']
            cand['constituency_no'] = c['constituency_no']
            candidates.append(cand)
    return candidates

def out_path(source_dir, kpn_id):
    """Return output path for a candidate's intelligence file."""
    p = INTEL_BASE / source_dir
    p.mkdir(parents=True, exist_ok=True)
    return p / f'{kpn_id}.json'

def load_existing(path):
    """Load existing intelligence file if present."""
    if path.exists():
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    return None

def save_intel(path, data):
    """Save intelligence file atomically."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = str(path) + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)

def make_intel_record(kpn_id, name, source, items):
    """Create a standard intelligence record."""
    return {
        'kpn_id': kpn_id,
        'candidate_name': name,
        'source': source,
        'scraped_at': datetime.now(timezone.utc).isoformat(),
        'item_count': len(items),
        'items': items,
    }

def name_to_search(name):
    """Convert ALL-CAPS Hungarian name to search-friendly form."""
    # Remove Dr. prefix variants
    name = name.replace('DR. ', '').replace('DR.', '')
    # Title case
    parts = name.strip().split()
    # Hungarian names are surname-first; for search, try both orderings
    return ' '.join(p.capitalize() for p in parts)
