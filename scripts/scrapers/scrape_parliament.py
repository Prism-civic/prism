#!/usr/bin/env python3
"""
Scrape parliament.hu for incumbent MP data.

Uses the public HTML pages (no API token needed for basic data):
- aktiv-kepviseloi-nevsor: current MP list with parliament IDs
- egy-kepviselo-adatai: individual MP profile

Parliament API requires registration (api-reg2@parlament.hu) for XML data.
This scraper uses the public HTML pages and extracts structured data.

Current cycle: 42 (2022–2026)
"""
import sys
import re
import json
import logging
import time
from bs4 import BeautifulSoup
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import make_session, load_candidates, out_path, load_existing, save_intel, make_intel_record, name_to_search, log

PARLIAMENT_BASE = 'https://www.parlament.hu'
ACTIVE_MP_LIST_URL = f'{PARLIAMENT_BASE}/aktiv-kepviseloi-nevsor'
RATE_LIMIT = 3.0  # seconds between requests — be respectful


def fetch_active_mp_list(session):
    """Fetch the current list of active MPs with their parliament IDs."""
    log.info('Fetching active MP list from parlament.hu...')
    resp = session.get(ACTIVE_MP_LIST_URL, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'lxml')

    mps = {}
    # Parliament page structure: table or list of MP names with links
    # Links follow pattern: /egy-kepviselo-adatai?...p_azon=XXX
    for link in soup.find_all('a', href=True):
        href = link['href']
        if 'p_azon' in href:
            from urllib.parse import unquote
            href_decoded = unquote(href)
            azon_match = re.search(r'p_azon=([a-zA-Z0-9]+)', href_decoded)
            if azon_match:
                azon = azon_match.group(1)
                name = link.get_text(strip=True).upper()
                if name and len(name) > 3:
                    mps[azon] = {'parliament_id': azon, 'name': name, 'profile_url': href if href.startswith('http') else PARLIAMENT_BASE + href}

    log.info(f'Found {len(mps)} active MPs')
    return mps


def fetch_mp_profile(session, parliament_id, profile_url):
    """Fetch individual MP profile page and extract structured data."""
    try:
        resp = session.get(profile_url, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        log.warning(f'Failed to fetch MP profile {parliament_id}: {e}')
        return None

    soup = BeautifulSoup(resp.text, 'lxml')

    data = {
        'parliament_id': parliament_id,
        'profile_url': profile_url,
        'raw_fields': {}
    }

    # Extract key fields from the profile page
    # Parliament pages use various table/dl structures
    for row in soup.find_all(['tr', 'dd', 'li']):
        text = row.get_text(separator=' ', strip=True)
        if ':' in text and len(text) < 200:
            parts = text.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip().lower()[:50]
                val = parts[1].strip()[:200]
                if val:
                    data['raw_fields'][key] = val

    # Look for party/faction
    for tag in soup.find_all(text=re.compile(r'(Fidesz|TISZA|Mi Hazánk|MKKP|DK|Jobbik|frakció)', re.IGNORECASE)):
        parent = tag.parent
        if parent:
            text = parent.get_text(strip=True)
            if 'frakció' in text.lower() or 'párt' in text.lower():
                data['faction'] = text[:100]
                break

    # Look for committee memberships
    committees = []
    for tag in soup.find_all(text=re.compile(r'bizottság', re.IGNORECASE)):
        parent = tag.parent
        if parent:
            text = parent.get_text(strip=True)
            if len(text) < 150:
                committees.append(text)
    if committees:
        data['committees'] = list(set(committees))[:10]

    return data


def match_candidate_to_mp(candidate, mp_list):
    """Try to match a candidate to an incumbent MP by name."""
    cand_name = name_to_search(candidate['name'])
    cand_parts = set(cand_name.lower().split())

    best_match = None
    best_score = 0

    for azon, mp in mp_list.items():
        mp_name = mp['name'].lower()
        mp_parts = set(mp_name.split())
        # Jaccard similarity on name tokens
        intersection = cand_parts & mp_parts
        union = cand_parts | mp_parts
        if union:
            score = len(intersection) / len(union)
            if score > best_score and score >= 0.6:
                best_score = score
                best_match = (azon, mp, score)

    return best_match


def run(limit=None, party_filter=None):
    """Main scraper entry point."""
    session = make_session(rate_limit_s=RATE_LIMIT)

    # Load candidate list
    candidates = load_candidates()
    log.info(f'Loaded {len(candidates)} candidates')

    # Only Fidesz-KDNP incumbents are likely sitting MPs
    # (Parliament hasn't changed since 2022 election)
    incumbent_parties = {'fidesz-kdnp', 'dk', 'mi-hazank'}
    if party_filter:
        target = [c for c in candidates if c.get('party_id') == party_filter]
    else:
        target = [c for c in candidates if c.get('party_id') in incumbent_parties]

    if limit:
        target = target[:limit]

    log.info(f'Targeting {len(target)} candidates for parliament lookup')

    # Fetch MP list first
    try:
        mp_list = fetch_active_mp_list(session)
    except Exception as e:
        log.error(f'Failed to fetch MP list: {e}')
        # Fallback: try to proceed without matching
        mp_list = {}

    if not mp_list:
        log.warning('No MPs found from parliament list — site may be CAPTCHA-protected. Saving empty records.')

    results = {'matched': 0, 'no_match': 0, 'errors': 0}

    for cand in target:
        kpn_id = cand['nvi_id']
        name = cand['name']
        out = out_path('parliament', kpn_id)

        # Skip if already scraped today
        existing = load_existing(out)
        if existing and existing.get('scraped_at', '')[:10] == time.strftime('%Y-%m-%d'):
            log.debug(f'Skipping {name} — already scraped today')
            continue

        items = []
        mp_match = match_candidate_to_mp(cand, mp_list) if mp_list else None

        if mp_match:
            azon, mp_data, score = mp_match
            log.info(f'Matched {name} → parliament ID {azon} (score {score:.2f})')
            profile_data = fetch_mp_profile(session, azon, mp_data['profile_url'])
            if profile_data:
                items.append({
                    'type': 'parliament_profile',
                    'parliament_id': azon,
                    'match_score': round(score, 3),
                    'url': mp_data['profile_url'],
                    'data': profile_data,
                    'confidence': 'high' if score >= 0.8 else 'medium',
                })
                results['matched'] += 1
        else:
            log.info(f'No parliament match for {name} ({cand.get("party")})')
            results['no_match'] += 1

        record = make_intel_record(kpn_id, name, 'parlament.hu', items)
        record['is_incumbent_party'] = cand.get('party_id') in incumbent_parties
        record['party'] = cand.get('party')
        record['constituency'] = cand.get('constituency_name_en')
        save_intel(out, record)

    log.info(f'Parliament scrape complete: {results}')
    return results


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Scrape parlament.hu MP data')
    parser.add_argument('--limit', type=int, help='Limit candidates processed')
    parser.add_argument('--party', help='Filter by party_id (e.g. fidesz-kdnp)')
    args = parser.parse_args()
    run(limit=args.limit, party_filter=args.party)
