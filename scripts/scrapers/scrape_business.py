#!/usr/bin/env python3
"""
Scrape business registry (e-cegjegyzek.hu) for candidate company directorships.

Hungarian company registry is public. Directors, shareholders and registered
company officials are public record. This is relevant for:
- Detecting public procurement conflicts
- Understanding financial interests
- Flagging shell company structures near public funds

Source: e-cegjegyzek.hu (Igazságügyi Minisztérium cégnyilvántartás)
Rate limit: 4s — government site, be respectful
Output: data/hungary/intelligence/business/{kpn_id}.json
"""
import sys
import re
import time
import argparse
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (make_session, load_candidates, out_path, load_existing,
                    save_intel, make_intel_record, name_to_search, log)

RATE_LIMIT = 5.0

COMPANY_KEYWORDS = ['kft', 'zrt', 'bt', 'rt', 'nyrt', 'alapítvány', 'egyesület', 'szövetkezet']


def _search_ceginfo(session, name):
    """Search céginfo.hu for companies bearing the candidate's surname.

    Uses the POST /cegkereso/rapid endpoint (server-side rendered, no JS required).
    Searches by surname to find companies the candidate may be associated with.
    Note: this is a company-name search, not a person-as-director search —
    full director lookup requires login. Match confidence is therefore 'low'.
    """
    items = []
    # Use surname only (first token in Hungarian surname-first format)
    parts = name.strip().split()
    surname = parts[0] if parts else name

    try:
        resp = session.post(
            'https://ceginfo.hu/cegkereso/rapid',
            data={'rapid': surname, 'honeypot': ''},
            headers={'Referer': 'https://www.ceginfo.hu/', 'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=30,
            allow_redirects=True,
        )
        if resp.status_code not in (200, 301, 302):
            return items
    except Exception as e:
        log.debug(f'Céginfo search failed for {name}: {e}')
        return items

    soup = BeautifulSoup(resp.text, 'lxml')
    # Results come as h2/h3 headings with company names
    for heading in soup.find_all(['h2', 'h3']):
        text = heading.get_text(strip=True)
        text_lower = text.lower()
        if not text or len(text) < 5 or len(text) > 200:
            continue
        if not any(kw in text_lower for kw in COMPANY_KEYWORDS):
            continue
        # Find nearest link
        link = heading.find('a', href=True) or heading.find_next('a', href=True)
        href = link['href'] if link else None
        if href and not href.startswith('http'):
            href = 'https://ceginfo.hu' + href
        items.append({
            'type': 'company_name_match',
            'text': text,
            'url': href,
            'source': 'ceginfo.hu',
            'confidence': 'low',
            'weight': 'medium',
            'note': f'Company name contains surname "{surname}" — manual verification required to confirm directorship',
        })
    return items


def search_business_registry(session, name):
    """Search for company connections via céginfo.hu.

    e-cegjegyzek.hu is a JS SPA and returns no server-side data.
    opten.hu requires login for search results.
    céginfo.hu allows surname-based company search via POST (no login needed).
    """
    items = []
    try:
        ceginfo_items = _search_ceginfo(session, name)
        items.extend(ceginfo_items)
        if ceginfo_items:
            log.debug(f'Céginfo found {len(ceginfo_items)} results for {name}')
    except Exception as e:
        log.debug(f'Business registry source failed for {name}: {e}')
    return items


def run(limit=None, party_filter=None, skip_existing=True):
    candidates = load_candidates()
    log.info(f'Loaded {len(candidates)} candidates')

    if party_filter:
        candidates = [c for c in candidates if c.get('party_id') == party_filter]

    # Prioritise main parties
    main_parties = ['fidesz-kdnp', 'tisza', 'mi-hazank', 'dk', 'mkkp']
    candidates.sort(key=lambda c: main_parties.index(c.get('party_id')) if c.get('party_id') in main_parties else 99)

    if limit:
        candidates = candidates[:limit]

    session = make_session(rate_limit_s=RATE_LIMIT)
    results = {'found': 0, 'empty': 0, 'errors': 0}

    log.info(f'Scanning {len(candidates)} candidates in business registry...')

    for cand in candidates:
        kpn_id = cand['nvi_id']
        name = cand['name']
        search_name = name_to_search(name)
        out = out_path('business', kpn_id)

        if skip_existing:
            existing = load_existing(out)
            if existing and existing.get('scraped_at', '')[:10] == time.strftime('%Y-%m-%d'):
                continue

        try:
            items = search_business_registry(session, search_name)

            record = make_intel_record(kpn_id, name, 'e-cegjegyzek.hu', items)
            record['party'] = cand.get('party')
            record['constituency'] = cand.get('constituency_name_en')
            save_intel(out, record)

            if items:
                log.info(f'{name}: {len(items)} business registry entries')
                results['found'] += 1
            else:
                results['empty'] += 1

        except Exception as e:
            log.error(f'Error processing {name}: {e}')
            results['errors'] += 1

    log.info(f'Business registry scrape complete: {results}')
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scrape business registry for candidate company links')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--party', help='Filter by party_id')
    parser.add_argument('--no-skip', action='store_true')
    args = parser.parse_args()
    run(limit=args.limit, party_filter=args.party, skip_existing=not args.no_skip)
