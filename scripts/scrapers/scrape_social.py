#!/usr/bin/env python3
"""
Scrape public social signals about Hungary / election topics.

Sources:
  - Reddit r/hungary         — English-language public discussion [weight: low, sentiment]
  - Reddit r/europe          — European perspective on Hungary    [weight: low, sentiment]
  - Twitter/X hashtags       — Public trend signals (no auth)     [weight: low, trend]

These are NOT evidence sources — they are sentiment/trend signals.
They appear in the feed as "Public conversation" with a clear label.
They are NOT used in candidate scoring.

Output:
  data/hungary/intelligence/social/reddit.json    — Reddit posts
  data/hungary/intelligence/social/trends.json    — Twitter trend signals
  data/hungary/intelligence/social/feed.json      — merged social feed for UI
"""
import sys
import json
import time
import logging
from datetime import datetime, timezone
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).parent))
from common import INTEL_BASE, log

SOCIAL_BASE = INTEL_BASE / 'social'

HEADERS = {
    'User-Agent': 'Prism-Civic-Bot/1.0 (open source civic intelligence; github.com/Prism-civic/prism)',
    'Accept': 'application/json',
}

HUNGARY_KEYWORDS = [
    'hungary', 'orbán', 'orban', 'fidesz', 'tisza party',
    'magyar péter', 'peter magyar', 'hungarian election',
    'budapest', 'viktor orban',
]

TOPICS = {
    'elections': ['election', 'vote', 'ballot', 'választás', 'campaign'],
    'rule_of_law': ['rule of law', 'court', 'corruption', 'democracy', 'press freedom'],
    'economy': ['economy', 'inflation', 'gdp', 'budget', 'poverty'],
    'eu_relations': ['european union', 'eu', 'brussels', 'nato'],
    'ukraine_russia': ['ukraine', 'russia', 'war', 'zelensky', 'putin'],
}


def make_session():
    s = requests.Session()
    s.headers.update(HEADERS)
    retry = Retry(total=3, backoff_factor=2, status_forcelist=[429, 500, 502, 503, 504])
    s.mount('https://', HTTPAdapter(max_retries=retry))
    return s


def detect_topic(text):
    text = text.lower()
    for topic, keywords in TOPICS.items():
        if any(k in text for k in keywords):
            return topic
    return 'politics'


# ── Reddit ────────────────────────────────────────────────────────────────────

SUBREDDITS = ['hungary', 'europe', 'worldnews']
REDDIT_SEARCH_TERMS = ['hungary election', 'fidesz', 'orbán', 'tisza party']


def fetch_reddit_subreddit(session, subreddit, limit=25):
    """Fetch hot posts from a subreddit via the public JSON API."""
    url = f'https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}'
    try:
        resp = session.get(url, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        posts = data.get('data', {}).get('children', [])
        return [p['data'] for p in posts]
    except Exception as e:
        log.warning(f'[reddit/{subreddit}] Fetch failed: {e}')
        return []


def fetch_reddit_search(session, query, subreddit=None, limit=15):
    """Search Reddit for Hungary-related posts."""
    base = f'https://www.reddit.com/r/{subreddit}/search.json' if subreddit else 'https://www.reddit.com/search.json'
    params = f'?q={query}&limit={limit}&sort=new&restrict_sr={"1" if subreddit else "0"}'
    try:
        resp = session.get(base + params, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        posts = data.get('data', {}).get('children', [])
        return [p['data'] for p in posts]
    except Exception as e:
        log.warning(f'[reddit search "{query}"] Failed: {e}')
        return []


def process_reddit_post(post, subreddit):
    """Convert a Reddit post dict to a Prism feed item."""
    text = (post.get('title', '') + ' ' + (post.get('selftext', '') or ''))
    return {
        'id':           f'reddit_{post.get("id", "")}',
        'title':        post.get('title', ''),
        'url':          f'https://reddit.com{post.get("permalink", "")}',
        'snippet':      (post.get('selftext', '') or '')[:300],
        'score':        post.get('score', 0),
        'num_comments': post.get('num_comments', 0),
        'subreddit':    subreddit,
        'source_key':   'reddit',
        'source_name':  f'Reddit r/{subreddit}',
        'source_domain': 'reddit.com',
        'weight':       'low',
        'content_type': 'social',
        'language':     'en',
        'source_country': 'US',
        'topic':        detect_topic(text),
        'published':    datetime.fromtimestamp(
                            post.get('created_utc', 0), tz=timezone.utc
                        ).isoformat(),
        'fetched_at':   datetime.now(timezone.utc).isoformat(),
        'is_sentiment': True,  # flag: not evidence, sentiment only
    }


def scrape_reddit(session):
    """Scrape Reddit for Hungary-related content."""
    all_posts = []
    seen_ids = set()

    # r/hungary — all hot posts (it's small, all relevant)
    log.info('[reddit] Fetching r/hungary hot...')
    posts = fetch_reddit_subreddit(session, 'hungary', limit=50)
    for p in posts:
        pid = p.get('id', '')
        if pid and pid not in seen_ids:
            seen_ids.add(pid)
            all_posts.append(process_reddit_post(p, 'hungary'))
    time.sleep(2)

    # r/europe + r/worldnews — search for Hungary terms
    for term in ['hungary election', 'fidesz orbán', 'peter magyar tisza']:
        log.info(f'[reddit] Searching "{term}" in r/europe...')
        posts = fetch_reddit_search(session, term, subreddit='europe', limit=10)
        for p in posts:
            pid = p.get('id', '')
            text = (p.get('title', '') + ' ' + (p.get('selftext', '') or '')).lower()
            if pid and pid not in seen_ids and any(k in text for k in ['hungary', 'orbán', 'orban', 'fidesz', 'tisza']):
                seen_ids.add(pid)
                all_posts.append(process_reddit_post(p, 'europe'))
        time.sleep(2)

    log.info(f'[reddit] {len(all_posts)} posts collected')
    return all_posts


# ── Twitter/X trend signals ───────────────────────────────────────────────────

TWITTER_SEARCH_TERMS = [
    '#magyarvalasztas2026',
    '#választás2026',
    '#fidesz',
    '#tiszapart',
    '#orbán',
    '#magyarpetertisza',
    'site:twitter.com/search?q=%23MagyarV%C3%A1laszt%C3%A1s',
]

# We use Nitter (public Twitter mirror) — no auth required
NITTER_INSTANCES = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
]


def fetch_nitter_search(session, query, nitter_base):
    """Fetch search results from a Nitter instance."""
    url = f'{nitter_base}/search?f=tweets&q={query}&lang=hu'
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code != 200:
            return []
        soup = BeautifulSoup(resp.text, 'lxml')
        tweets = []
        for item in soup.select('.timeline-item')[:20]:
            content_el = item.select_one('.tweet-content')
            link_el    = item.select_one('.tweet-link')
            date_el    = item.select_one('.tweet-date a')
            stats      = item.select('.icon-container')

            content = content_el.get_text().strip() if content_el else ''
            link    = nitter_base + link_el['href'] if link_el else ''
            date    = date_el.get('title', '') if date_el else ''

            if content:
                tweets.append({
                    'content': content[:280],
                    'url':     link,
                    'date':    date,
                })
        return tweets
    except Exception as e:
        log.warning(f'[nitter] {nitter_base} failed: {e}')
        return []


def scrape_twitter_trends(session):
    """Collect public Twitter/X trend signals via Nitter."""
    all_tweets = []
    seen_contents = set()

    hashtags = ['#magyarvalasztas2026', '#fidesz', '#tiszapart', '#orbán', 'Magyarország választás 2026']

    for nitter in NITTER_INSTANCES:
        log.info(f'[twitter] Trying Nitter instance: {nitter}')
        for tag in hashtags[:3]:  # limit per instance
            tweets = fetch_nitter_search(session, tag, nitter)
            for t in tweets:
                content_key = t['content'][:80]
                if content_key not in seen_contents:
                    seen_contents.add(content_key)
                    topic = detect_topic(t['content'])
                    all_tweets.append({
                        'id':           f'tweet_{hash(t["content"]) % 10**9}',
                        'title':        t['content'][:100],
                        'snippet':      t['content'],
                        'url':          t['url'],
                        'source_key':   'twitter',
                        'source_name':  'Twitter / X (public)',
                        'source_domain': 'twitter.com',
                        'weight':       'low',
                        'content_type': 'social',
                        'language':     'hu',
                        'source_country': 'HU',
                        'topic':        topic,
                        'published':    t.get('date', ''),
                        'fetched_at':   datetime.now(timezone.utc).isoformat(),
                        'is_sentiment': True,
                        'hashtag':      tag,
                    })
            time.sleep(1.5)
        if all_tweets:
            break  # got data from this instance, no need for fallback
        time.sleep(2)

    log.info(f'[twitter] {len(all_tweets)} tweet signals collected')
    return all_tweets


# ── Save ──────────────────────────────────────────────────────────────────────

def save_social_feed(reddit_posts, tweets):
    """Merge and save the full social feed."""
    SOCIAL_BASE.mkdir(parents=True, exist_ok=True)

    # Save individual feeds
    with open(SOCIAL_BASE / 'reddit.json', 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'item_count': len(reddit_posts),
            'items': reddit_posts,
        }, f, ensure_ascii=False, indent=2)

    with open(SOCIAL_BASE / 'trends.json', 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'item_count': len(tweets),
            'items': tweets,
        }, f, ensure_ascii=False, indent=2)

    # Merge and sort
    all_social = reddit_posts + tweets
    all_social.sort(key=lambda x: x.get('fetched_at', ''), reverse=True)

    with open(SOCIAL_BASE / 'feed.json', 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'item_count': len(all_social),
            'items': all_social,
        }, f, ensure_ascii=False, indent=2)

    log.info(f'Social feed saved: {len(all_social)} items')
    return all_social


def main():
    session = make_session()

    log.info('=== Social scrape: Reddit ===')
    reddit_posts = scrape_reddit(session)

    log.info('=== Social scrape: Twitter trends ===')
    tweets = scrape_twitter_trends(session)

    save_social_feed(reddit_posts, tweets)
    log.info(f'Social scrape complete: {len(reddit_posts)} Reddit + {len(tweets)} Twitter signals')


if __name__ == '__main__':
    main()
