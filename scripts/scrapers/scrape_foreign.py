#!/usr/bin/env python3
"""
Scrape foreign/international sources for Hungary-related coverage.

Sources (RSS-based, no auth required):
  - Radio Free Europe / RFE-RL  [weight: HIGH  — independent, democracy-focused]
  - Reuters                      [weight: HIGH  — factual wire service]
  - Politico Europe              [weight: HIGH  — EU political analysis]
  - Deutsche Welle (HU edition)  [weight: MEDIUM — German perspective, HU-language]
  - Euractiv                     [weight: MEDIUM — EU policy]
  - The Guardian                 [weight: MEDIUM — investigative, EN]

Output:
  data/hungary/intelligence/foreign/{source}/{kpn_id}.json   — candidate-linked articles
  data/hungary/intelligence/foreign/feed.json                — full unfiltered feed (for news UI)

Rate limit: 3s between requests per domain.
"""
import sys
import re
import json
import time
import logging
import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote_plus

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).parent))
from common import (make_session, load_candidates, INTEL_BASE,
                    save_intel, make_intel_record, name_to_search, log)

FOREIGN_BASE = INTEL_BASE / 'foreign'

# ── Source definitions ────────────────────────────────────────────────────────

SOURCES = {
    'rferl': {
        'name': 'Radio Free Europe / RFE-RL',
        'domain': 'rferl.org',
        'weight': 'high',
        'language': 'en',
        'country': 'US',
        'rss_url': 'https://www.rferl.org/api/z-ymqxpe_ume',
        'rss_fallback': 'https://www.rferl.org/z/631',  # Hungary section
        'search_url': 'https://www.rferl.org/search/?q={query}&c=Hungary',
        'topic_tags': ['democracy', 'rule_of_law', 'elections'],
        'rate_limit': 3.0,
    },
    'reuters': {
        'name': 'Reuters',
        'domain': 'reuters.com',
        'weight': 'high',
        'language': 'en',
        'country': 'UK',
        'rss_url': 'https://feeds.reuters.com/reuters/worldNews',
        'search_url': 'https://www.reuters.com/search/news?blob={query}+Hungary',
        'topic_tags': ['politics', 'elections', 'economy'],
        'rate_limit': 3.0,
    },
    'politico_eu': {
        'name': 'Politico Europe',
        'domain': 'politico.eu',
        'weight': 'high',
        'language': 'en',
        'country': 'EU',
        'rss_url': 'https://www.politico.eu/feed/',
        'topic_tags': ['eu_politics', 'rule_of_law', 'elections'],
        'rate_limit': 3.0,
    },
    'dw_hu': {
        'name': 'Deutsche Welle (Magyar)',
        'domain': 'dw.com',
        'weight': 'medium',
        'language': 'hu',
        'country': 'DE',
        'rss_url': 'https://rss.dw.com/rdf/rss-hun-all',
        'topic_tags': ['politics', 'eu_relations'],
        'rate_limit': 3.0,
    },
    'euractiv': {
        'name': 'Euractiv',
        'domain': 'euractiv.com',
        'weight': 'medium',
        'language': 'en',
        'country': 'EU',
        'rss_url': 'https://www.euractiv.com/feed/',
        'topic_tags': ['eu_policy', 'rule_of_law'],
        'rate_limit': 3.0,
    },
    'guardian': {
        'name': 'The Guardian',
        'domain': 'theguardian.com',
        'weight': 'medium',
        'language': 'en',
        'country': 'UK',
        'rss_url': 'https://www.theguardian.com/world/hungary/rss',
        'topic_tags': ['politics', 'investigative'],
        'rate_limit': 3.0,
    },
}

# Hungary-related search terms for filtering feed items
HUNGARY_TERMS = [
    'hungary', 'hungarian', 'orbán', 'orban', 'fidesz', 'tisza',
    'magyar péter', 'budapest', 'viktor orbán',
    'magyarország', 'magyar', 'fidész',  # HU-language terms
]

# Candidate-related: we'll try to link articles to specific candidates
PARTY_TERMS = {
    'fidesz': ['fidesz', 'fidész', 'kdnp'],
    'tisza': ['tisza', 'magyar péter', 'peter magyar'],
    'dk': ['dk', 'demokratikus koalíció', 'gyurcsány'],
    'mi_hazank': ['mi hazánk', 'toroczkai'],
    'momentum': ['momentum'],
}


# ── RSS parsing ───────────────────────────────────────────────────────────────

def fetch_rss(session, url, source_key):
    """Fetch and parse an RSS/Atom feed. Returns list of items."""
    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except ET.ParseError:
        # Try as HTML/Atom
        try:
            soup = BeautifulSoup(resp.text, 'lxml')
            return parse_atom(soup, source_key)
        except Exception as e:
            log.warning(f'[{source_key}] RSS parse error: {e}')
            return []
    except Exception as e:
        log.warning(f'[{source_key}] RSS fetch failed: {e}')
        return []

    items = []
    ns = {'atom': 'http://www.w3.org/2005/Atom'}

    # RSS 2.0
    for item in root.findall('.//item'):
        title = (item.findtext('title') or '').strip()
        link  = (item.findtext('link') or '').strip()
        desc  = (item.findtext('description') or '').strip()
        pub   = (item.findtext('pubDate') or '').strip()
        items.append({
            'title': title,
            'url':   link,
            'snippet': BeautifulSoup(desc, 'lxml').get_text()[:300] if desc else '',
            'published': pub,
        })

    # Atom
    for entry in root.findall('atom:entry', ns):
        title = (entry.findtext('atom:title', namespaces=ns) or '').strip()
        link_el = entry.find('atom:link', ns)
        link  = link_el.get('href', '') if link_el is not None else ''
        summary = (entry.findtext('atom:summary', namespaces=ns) or '').strip()
        pub   = (entry.findtext('atom:updated', namespaces=ns) or '').strip()
        items.append({
            'title': title,
            'url':   link,
            'snippet': BeautifulSoup(summary, 'lxml').get_text()[:300] if summary else '',
            'published': pub,
        })

    return items


def parse_atom(soup, source_key):
    """Fallback Atom parser via BeautifulSoup."""
    items = []
    for entry in soup.find_all('entry'):
        title = entry.find('title')
        link  = entry.find('link')
        summary = entry.find('summary') or entry.find('content')
        pub   = entry.find('updated') or entry.find('published')
        items.append({
            'title':   title.get_text().strip() if title else '',
            'url':     link.get('href', '') if link else '',
            'snippet': summary.get_text()[:300].strip() if summary else '',
            'published': pub.get_text().strip() if pub else '',
        })
    return items


def is_hungary_related(item):
    """Return True if the item is related to Hungary."""
    text = (item.get('title', '') + ' ' + item.get('snippet', '')).lower()
    return any(term in text for term in HUNGARY_TERMS)


def detect_topic(item):
    """Detect primary topic tag from item content."""
    text = (item.get('title', '') + ' ' + item.get('snippet', '')).lower()
    if any(t in text for t in ['election', 'választás', 'vote', 'szavazás', 'ballot']):
        return 'elections'
    if any(t in text for t in ['corruption', 'korrupció', 'fraud', 'bribery']):
        return 'corruption'
    if any(t in text for t in ['rule of law', 'jogállam', 'court', 'judiciary']):
        return 'rule_of_law'
    if any(t in text for t in ['economy', 'gazdaság', 'inflation', 'gdp', 'budget']):
        return 'economy'
    if any(t in text for t in ['eu', 'european', 'brussels', 'európai']):
        return 'eu_relations'
    if any(t in text for t in ['ukraine', 'ukrajna', 'russia', 'oroszország', 'war', 'háború']):
        return 'ukraine_russia'
    if any(t in text for t in ['migration', 'migráció', 'refugee', 'menekült']):
        return 'migration'
    return 'politics'


def link_to_candidate(item, candidates):
    """Return list of kpn_ids this article likely refers to."""
    text = (item.get('title', '') + ' ' + item.get('snippet', '')).lower()
    matched = []
    for cand in candidates:
        search_name = name_to_search(cand['name']).lower()
        parts = search_name.split()
        if len(parts) >= 2:
            # Both surname + given name must appear
            surname = parts[0]
            given   = parts[1] if len(parts) > 1 else ''
            if surname in text and given in text:
                matched.append(cand['kpn_id'])
    return matched[:5]  # cap at 5 to avoid false positives


# ── Main scrape ───────────────────────────────────────────────────────────────

def scrape_source(session, source_key, source_cfg, candidates):
    """Fetch one source, filter for Hungary, link to candidates. Returns feed items."""
    log.info(f'=== Scraping {source_cfg["name"]} ===')
    raw_items = fetch_rss(session, source_cfg['rss_url'], source_key)

    if not raw_items and source_cfg.get('rss_fallback'):
        log.info(f'[{source_key}] Primary RSS empty, trying fallback...')
        raw_items = fetch_rss(session, source_cfg['rss_fallback'], source_key)

    log.info(f'[{source_key}] {len(raw_items)} items fetched')

    hu_items = [item for item in raw_items if is_hungary_related(item)]
    log.info(f'[{source_key}] {len(hu_items)} Hungary-related items')

    enriched = []
    for item in hu_items:
        enriched.append({
            **item,
            'source_key':  source_key,
            'source_name': source_cfg['name'],
            'source_domain': source_cfg['domain'],
            'weight':      source_cfg['weight'],
            'language':    source_cfg['language'],
            'source_country': source_cfg['country'],
            'topic':       detect_topic(item),
            'linked_candidates': link_to_candidate(item, candidates),
            'topic_tags':  source_cfg.get('topic_tags', []),
            'fetched_at':  datetime.now(timezone.utc).isoformat(),
        })

    return enriched


def save_candidate_intel(items, candidates):
    """Group items by linked candidate and save per-candidate intel files."""
    by_candidate = {}
    for item in items:
        for kpn_id in item.get('linked_candidates', []):
            by_candidate.setdefault(kpn_id, []).append(item)

    saved = 0
    for kpn_id, cand_items in by_candidate.items():
        # Group by source
        by_source = {}
        for item in cand_items:
            sk = item['source_key']
            by_source.setdefault(sk, []).append(item)

        for source_key, source_items in by_source.items():
            path = FOREIGN_BASE / source_key / f'{kpn_id}.json'
            cand = next((c for c in candidates if c['kpn_id'] == kpn_id), None)
            name = cand['name'] if cand else str(kpn_id)
            record = make_intel_record(kpn_id, name, source_key, source_items)
            save_intel(path, record)
            saved += 1

    log.info(f'Saved {saved} candidate intel files from foreign sources')


def save_feed(all_items):
    """Save the complete unfiltered feed for the news UI."""
    feed_path = FOREIGN_BASE / 'feed.json'
    feed_path.parent.mkdir(parents=True, exist_ok=True)

    # Deduplicate by URL
    seen_urls = set()
    deduped = []
    for item in all_items:
        url = item.get('url', '')
        if url and url not in seen_urls:
            seen_urls.add(url)
            deduped.append(item)

    # Sort by fetched_at desc
    deduped.sort(key=lambda x: x.get('fetched_at', ''), reverse=True)

    feed = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'item_count': len(deduped),
        'sources': list(SOURCES.keys()),
        'items': deduped,
    }
    with open(feed_path, 'w', encoding='utf-8') as f:
        json.dump(feed, f, ensure_ascii=False, indent=2)

    log.info(f'Saved feed: {len(deduped)} items → {feed_path}')
    return deduped


def main():
    candidates = load_candidates()
    session = make_session(rate_limit_s=3.0)
    all_items = []

    for source_key, source_cfg in SOURCES.items():
        try:
            items = scrape_source(session, source_key, source_cfg, candidates)
            all_items.extend(items)
            time.sleep(2.0)
        except Exception as e:
            log.error(f'[{source_key}] Unhandled error: {e}')

    feed_items = save_feed(all_items)
    save_candidate_intel(feed_items, candidates)

    log.info(f'Foreign scrape complete: {len(feed_items)} Hungary-related items across {len(SOURCES)} sources')


if __name__ == '__main__':
    main()
