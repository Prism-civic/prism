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

BASE_URL = 'https://www.e-cegjegyzek.hu'
SEARCH_URL = 'https://www.e-cegjegyzek.hu/?cegkereses'
RATE_LIMIT = 5.0


def search_business_registry(session, name):
    """Search for person as company director/officer."""
    items = []
    # e-cegjegyzek uses POST form or GET params
    # Try GET with name param
    search_url = f'{BASE_URL}/?cegkereses&cegnev={quote_plus(name)}'

    try:
        resp = session.get(search_url, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        log.warning(f'Business registry search failed for {name}: {e}')
        return items

    soup = BeautifulSoup(resp.text, 'lxml')

    # Look for company results
    for row in soup.find_all(['tr', 'li', 'div'], class_=re.compile(r'(ceg|company|result|row)', re.I)):
        text = row.get_text(separator=' ', strip=True)
        link = row.find('a', href=True)

        if len(text) > 10 and len(text) < 300:
            company_url = None
            if link:
                href = link['href']
                company_url = href if href.startswith('http') else BASE_URL + href

            items.append({
                'type': 'company_directorship',
                'text': text[:200],
                'url': company_url,
                'source': 'e-cegjegyzek.hu',
                'confidence': 'medium',
                'weight': 'medium',
                'note': 'Requires manual verification — registry search result'
            })

    # Also search for the person directly (not company name)
    # e-cegjegyzek has a "személy keresés" (person search) option
    person_url = f'{BASE_URL}/?szemelykereses&nev={quote_plus(name)}'
    try:
        resp2 = session.get(person_url, timeout=30)
        if resp2.status_code == 200:
            soup2 = BeautifulSoup(resp2.text, 'lxml')
            for row in soup2.find_all(['tr', 'li', 'div'], class_=re.compile(r'(szemely|person|result|row)', re.I)):
                text = row.get_text(separator=' ', strip=True)
                if len(text) > 10 and len(text) < 300:
                    # Check if this looks like a real result (has company reference)
                    if any(kw in text.lower() for kw in ['kft', 'zrt', 'bt', 'rt', 'nyrt', 'alapítvány', 'egyesület']):
                        link = row.find('a', href=True)
                        company_url = None
                        if link:
                            href = link['href']
                            company_url = href if href.startswith('http') else BASE_URL + href
                        items.append({
                            'type': 'person_company_link',
                            'text': text[:200],
                            'url': company_url,
                            'source': 'e-cegjegyzek.hu',
                            'confidence': 'high',
                            'weight': 'medium',
                            'note': 'Direct person-company link from registry'
                        })
    except Exception as e:
        log.debug(f'Person search fallback failed: {e}')

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
