#!/usr/bin/env python3
"""
Scrape independent Hungarian media for candidate mentions.

Sources:
  - Átlátszó (atlatszo.hu)  — investigative, corruption-focused  [weight: HIGH]
  - Telex (telex.hu)        — independent news                   [weight: MEDIUM]
  - 444.hu                  — independent news                   [weight: MEDIUM]
  - HVG (hvg.hu)            — independent news/analysis          [weight: MEDIUM]

Rate limit: 3s between requests per domain.
Output: data/hungary/intelligence/media/{source}/{kpn_id}.json
"""
import sys
import re
import json
import time
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode, quote_plus
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).parent))
from common import (make_session, load_candidates, out_path, load_existing,
                    save_intel, make_intel_record, name_to_search, log)

SOURCES = {
    'atalatzo': {
        'base_url': 'https://atlatszo.hu',
        'search_url': 'https://atlatszo.hu/?s={query}',
        'weight': 'high',
        'description': 'Investigative journalism, corruption watchdog',
        'rate_limit': 4.0,
    },
    'telex': {
        'base_url': 'https://telex.hu',
        'search_url': 'https://telex.hu/legfrissebb?text={query}',
        'weight': 'medium',
        'description': 'Independent news',
        'rate_limit': 3.0,
    },
    '444': {
        'base_url': 'https://444.hu',
        'search_url': 'https://444.hu/?s={query}',
        'weight': 'medium',
        'description': 'Independent news',
        'rate_limit': 3.0,
    },
    'hvg': {
        'base_url': 'https://hvg.hu',
        'search_url': 'https://hvg.hu/search?q={query}',
        'weight': 'medium',
        'description': 'News and analysis',
        'rate_limit': 3.0,
    },
}


def search_atlatszo(session, name):
    """Search Átlátszó for candidate mentions. Returns list of article items."""
    query = quote_plus(name)
    url = f'https://atlatszo.hu/?s={query}'
    items = []

    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        log.warning(f'Átlátszó search failed for {name}: {e}')
        return items

    soup = BeautifulSoup(resp.text, 'lxml')

    # Átlátszó is WordPress — try standard article tags and also class variants
    all_articles = soup.find_all('article')
    if not all_articles:
        # Fallback: look for divs that look like article cards
        all_articles = soup.find_all('div', class_=re.compile(r'(post|article|entry|card|item)', re.I))

    name_lower = name.lower()
    name_parts = name_lower.split()

    candidate_items = []  # items with confirmed name match
    proximity_items = []  # fallback items without confirmed name match

    for article in all_articles:
        title_tag = article.find(['h2', 'h3', 'h1'])
        link_tag = article.find('a', href=True)
        date_tag = article.find('time')
        excerpt_tag = article.find('p')

        title = title_tag.get_text(strip=True) if title_tag else None
        url_art = link_tag['href'] if link_tag else None
        date = date_tag.get('datetime', date_tag.get_text(strip=True))[:10] if date_tag else None
        excerpt = excerpt_tag.get_text(strip=True)[:300] if excerpt_tag else None

        if not title or not url_art:
            continue

        text_check = ((title or '') + ' ' + (excerpt or '')).lower()
        name_matched = any(part in text_check for part in name_parts if len(part) > 3)

        if name_matched:
            candidate_items.append({
                'title': title,
                'url': url_art,
                'date': date,
                'excerpt': excerpt,
                'source': 'atlatszo.hu',
                'weight': 'high',
                'confidence': 'high',
                'tags': extract_tags(article),
            })
        else:
            proximity_items.append({
                'title': title,
                'url': url_art,
                'date': date,
                'excerpt': excerpt,
                'source': 'atlatszo.hu',
                'weight': 'high',
                'confidence': 'low',
                'tags': extract_tags(article),
                'note': 'name match not confirmed — proximity result',
            })

    if candidate_items:
        items.extend(candidate_items)
    else:
        # No name-matched results — save up to 3 proximity results so we have something to work with
        items.extend(proximity_items[:3])

    return items


def search_telex(session, name):
    """Search Telex.hu for candidate mentions via tag pages (JS-safe)."""
    items = []
    name_lower = name.lower()
    name_parts = [p for p in name_lower.split() if len(p) > 3]

    # Try tag page first (more reliable than JS search)
    # Telex tags are URL-slugified
    for slug_variant in [
        name_lower.replace(' ', '-'),
        name_lower.split()[0] + '-' + name_lower.split()[-1] if ' ' in name_lower else name_lower,
    ]:
        tag_url = f'https://telex.hu/cimke/{slug_variant}'
        
        try:
            resp = session.get(tag_url, timeout=30)
            if resp.status_code == 404:
                continue
            resp.raise_for_status()
        except Exception:
            continue

        soup = BeautifulSoup(resp.text, 'lxml')
        
        # Look for article links in the page
        for link in soup.find_all('a', href=re.compile(r'telex\.hu/[\w-]+/\d{4}')):
            title = link.get_text(strip=True)
            href = link['href']
            
            if title and len(title) > 10:
                text_check = title.lower()
                # Check if any significant part of the name is in the title
                if any(part in text_check for part in name_parts):
                    items.append({
                        'title': title,
                        'url': href,
                        'date': None,
                        'excerpt': None,
                        'source': 'telex.hu',
                        'weight': 'medium',
                        'confidence': 'medium',
                        'tags': ['from-tag-page'],
                    })
        
        if items:
            break  # Found results, don't try other variants

    return items


def search_444(session, name):
    """Search 444.hu for candidate mentions."""
    query = quote_plus(name)
    url = f'https://444.hu/?s={query}'
    items = []

    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        log.warning(f'444.hu search failed for {name}: {e}')
        return items

    soup = BeautifulSoup(resp.text, 'lxml')
    name_lower = name.lower()
    name_parts = [p for p in name_lower.split() if len(p) > 3]

    for article in soup.find_all(['article', 'div'], class_=re.compile(r'(article|post|entry|card|item)', re.I)):
        title_tag = article.find(['h2', 'h3', 'h4'])
        link_tag = article.find('a', href=re.compile(r'444\.hu'))
        date_tag = article.find('time')
        excerpt_tag = article.find('p')

        if not title_tag:
            continue

        title = title_tag.get_text(strip=True)
        link = link_tag['href'] if link_tag else None
        date = date_tag.get('datetime', '')[:10] if date_tag else None
        excerpt = excerpt_tag.get_text(strip=True)[:300] if excerpt_tag else None

        if title and link:
            text_check = ((title or '') + ' ' + (excerpt or '')).lower()
            if any(part in text_check for part in name_parts):
                items.append({
                    'title': title,
                    'url': link,
                    'date': date,
                    'excerpt': excerpt,
                    'source': '444.hu',
                    'weight': 'medium',
                    'confidence': 'medium',
                    'tags': [],
                })

    return items


def search_hvg(session, name):
    """Search HVG.hu for candidate mentions."""
    query = quote_plus(name)
    url = f'https://hvg.hu/search?q={query}'
    items = []

    try:
        resp = session.get(url, timeout=30)
        if resp.status_code == 404:
            # Try alternate URL
            url = f'https://hvg.hu/?s={query}'
            resp = session.get(url, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        log.warning(f'HVG search failed for {name}: {e}')
        return items

    soup = BeautifulSoup(resp.text, 'lxml')
    name_lower = name.lower()
    name_parts = [p for p in name_lower.split() if len(p) > 3]

    for article in soup.find_all(['article', 'div'], class_=re.compile(r'(article|news|content|card)', re.I)):
        title_tag = article.find(['h2', 'h3', 'h4'])
        link_tag = article.find('a', href=True)
        date_tag = article.find('time')

        if not title_tag:
            continue

        title = title_tag.get_text(strip=True)
        link = link_tag['href'] if link_tag else None
        if link and not link.startswith('http'):
            link = 'https://hvg.hu' + link
        date = date_tag.get('datetime', '')[:10] if date_tag else None

        if title and link and 'hvg.hu' in link:
            text_check = title.lower()
            if any(part in text_check for part in name_parts):
                items.append({
                    'title': title,
                    'url': link,
                    'date': date,
                    'excerpt': None,
                    'source': 'hvg.hu',
                    'weight': 'medium',
                    'confidence': 'medium',
                    'tags': [],
                })

    return items


def extract_tags(article_tag):
    """Extract category/tag labels from an article element."""
    tags = []
    for tag in article_tag.find_all(['a', 'span'], class_=re.compile(r'(tag|category|label|cimke)', re.I)):
        text = tag.get_text(strip=True).lower()
        if text and len(text) < 40:
            tags.append(text)
    return list(set(tags))[:8]


SEARCH_FUNCTIONS = {
    'atalatzo': search_atlatszo,
    'telex': search_telex,
    '444': search_444,
    'hvg': search_hvg,
}


def run(sources=None, limit=None, party_filter=None, skip_existing=True):
    """Run media scrapers for all or selected candidates."""
    if sources is None:
        sources = list(SOURCES.keys())

    candidates = load_candidates()
    log.info(f'Loaded {len(candidates)} candidates')

    if party_filter:
        candidates = [c for c in candidates if c.get('party_id') == party_filter]
        log.info(f'Filtered to {len(candidates)} candidates for party {party_filter}')

    # Prioritise: main parties first (most likely to have press coverage)
    main_parties = ['fidesz-kdnp', 'tisza', 'mi-hazank', 'dk', 'mkkp']
    def sort_key(c):
        pid = c.get('party_id')
        return main_parties.index(pid) if pid in main_parties else 99
    candidates.sort(key=sort_key)

    if limit:
        candidates = candidates[:limit]

    log.info(f'Processing {len(candidates)} candidates across sources: {sources}')

    totals = {s: {'found': 0, 'empty': 0, 'errors': 0} for s in sources}

    for src_key in sources:
        src_config = SOURCES[src_key]
        session = make_session(rate_limit_s=src_config['rate_limit'])
        search_fn = SEARCH_FUNCTIONS[src_key]
        src_dir = f'media/{src_key}'

        log.info(f'=== Scraping {src_key} ===')

        for cand in candidates:
            kpn_id = cand['nvi_id']
            name = cand['name']
            search_name = name_to_search(name)
            out = out_path(src_dir, kpn_id)

            # Skip if already done today
            if skip_existing:
                existing = load_existing(out)
                if existing and existing.get('scraped_at', '')[:10] == time.strftime('%Y-%m-%d'):
                    continue

            try:
                items = search_fn(session, search_name)

                # Also try surname-only for disambiguation
                parts = search_name.split()
                if len(parts) >= 2 and len(items) == 0:
                    # Try given name + surname (Hungarian names are surname-first)
                    alt_name = ' '.join(reversed(parts))
                    items = search_fn(session, alt_name)

                record = make_intel_record(kpn_id, name, src_config['base_url'], items)
                record['party'] = cand.get('party')
                record['constituency'] = cand.get('constituency_name_en')
                record['search_name_used'] = search_name
                save_intel(out, record)

                if items:
                    log.info(f'  {name} ({src_key}): {len(items)} articles')
                    totals[src_key]['found'] += 1
                else:
                    totals[src_key]['empty'] += 1

            except Exception as e:
                log.error(f'  Error scraping {name} ({src_key}): {e}')
                totals[src_key]['errors'] += 1

    log.info(f'Media scrape complete: {totals}')
    return totals


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scrape Hungarian media for candidate mentions')
    parser.add_argument('--sources', nargs='+', choices=list(SOURCES.keys()), help='Sources to scrape (default: all)')
    parser.add_argument('--limit', type=int, help='Limit number of candidates')
    parser.add_argument('--party', help='Filter by party_id')
    parser.add_argument('--no-skip', action='store_true', help='Re-scrape even if done today')
    args = parser.parse_args()
    run(sources=args.sources, limit=args.limit, party_filter=args.party, skip_existing=not args.no_skip)
