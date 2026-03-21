#!/usr/bin/env python3
"""
Scrape public procurement database (ekr.gov.hu) for candidate connections.

Public procurement in Hungary is a matter of public record. Connections between
candidates (or their close associates/companies) and public contracts are
high-weight civic intelligence — directly traceable to public money.

Source: ekr.gov.hu — Elektronikus Közbeszerzési Rendszer
Also: kozbeszerzes.hu (Közbeszerzési Hatóság — Procurement Authority)

Rate limit: 5s — government site
Output: data/hungary/intelligence/procurement/{kpn_id}.json
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

PROCUREMENT_SOURCES = [
    {
        'key': 'ekr',
        'name': 'EKR — Elektronikus Közbeszerzési Rendszer',
        'search_url': 'https://ekr.gov.hu/portal/hu/search/results?query={query}',
        'base': 'https://ekr.gov.hu',
        'weight': 'high',
    },
    {
        'key': 'kozbeszerzesi_hatosag',
        'name': 'Közbeszerzési Hatóság',
        'search_url': 'https://www.kozbeszerzesi.hu/search?q={query}',
        'base': 'https://www.kozbeszerzesi.hu',
        'weight': 'high',
    },
]


def search_ekr(session, name):
    """Search EKR procurement database."""
    items = []
    url = f'https://ekr.gov.hu/portal/hu/search/results?query={quote_plus(name)}'

    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        log.warning(f'EKR search failed for {name}: {e}')
        return items

    soup = BeautifulSoup(resp.text, 'lxml')
    name_lower = name.lower()
    name_parts = [p for p in name_lower.split() if len(p) > 3]

    for result in soup.find_all(['div', 'tr', 'article'], class_=re.compile(r'(result|row|item|tender)', re.I)):
        text = result.get_text(separator=' ', strip=True)
        link = result.find('a', href=True)

        if len(text) < 20:
            continue

        text_lower = text.lower()
        if any(part in text_lower for part in name_parts):
            href = link['href'] if link else None
            if href and not href.startswith('http'):
                href = 'https://ekr.gov.hu' + href

            items.append({
                'type': 'procurement_record',
                'text': text[:300],
                'url': href,
                'source': 'ekr.gov.hu',
                'confidence': 'high',
                'weight': 'high',
                'note': 'Public procurement record — direct public money connection'
            })

    return items


def run(limit=None, party_filter=None, skip_existing=True):
    candidates = load_candidates()

    if party_filter:
        candidates = [c for c in candidates if c.get('party_id') == party_filter]

    main_parties = ['fidesz-kdnp', 'tisza', 'mi-hazank', 'dk', 'mkkp']
    candidates.sort(key=lambda c: main_parties.index(c.get('party_id')) if c.get('party_id') in main_parties else 99)

    if limit:
        candidates = candidates[:limit]

    session = make_session(rate_limit_s=RATE_LIMIT)
    results = {'found': 0, 'empty': 0, 'errors': 0}

    log.info(f'Scanning {len(candidates)} candidates in procurement databases...')

    for cand in candidates:
        kpn_id = cand['nvi_id']
        name = cand['name']
        search_name = name_to_search(name)
        out = out_path('procurement', kpn_id)

        if skip_existing:
            existing = load_existing(out)
            if existing and existing.get('scraped_at', '')[:10] == time.strftime('%Y-%m-%d'):
                continue

        try:
            items = search_ekr(session, search_name)

            record = make_intel_record(kpn_id, name, 'ekr.gov.hu', items)
            record['party'] = cand.get('party')
            record['constituency'] = cand.get('constituency_name_en')
            save_intel(out, record)

            if items:
                log.info(f'{name}: {len(items)} procurement records')
                results['found'] += 1
            else:
                results['empty'] += 1

        except Exception as e:
            log.error(f'Error processing {name}: {e}')
            results['errors'] += 1

    log.info(f'Procurement scrape complete: {results}')
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scrape public procurement records')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--party', help='Filter by party_id')
    parser.add_argument('--no-skip', action='store_true')
    args = parser.parse_args()
    run(limit=args.limit, party_filter=args.party, skip_existing=not args.no_skip)
