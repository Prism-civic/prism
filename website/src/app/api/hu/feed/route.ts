/**
 * GET /api/hu/feed
 *
 * Unified news feed for Prism — Hungary pilot + global categories.
 *
 * Query params:
 *   ?topic=all|elections|rule_of_law|economy|eu_relations|ukraine_russia|
 *          politics|migration|corruption|science|technology|entertainment|local
 *   ?lang=en|hu|all
 *   ?limit=20 (max 50)
 *   ?localRegion=bedford_uk|london_uk|budapest_hu|...  (for local headlines)
 *
 * Data sources (server-side fs reads, populated by scrapers):
 *   data/hungary/intelligence/foreign/feed.json   — foreign press
 *   data/hungary/intelligence/social/feed.json    — social signals
 *   data/hungary/intelligence/local/feed.json     — local headlines by region
 *
 * Falls back to curated static items when scrapers haven't run yet.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ── Topic taxonomy ─────────────────────────────────────────────────────────────

const TOPIC_SECTIONS = [
  // Civic / political
  { id: 'elections',      label_en: 'Elections',             label_hu: 'Választás',               emoji: '🗳️', group: 'civic' },
  { id: 'politics',       label_en: 'Politics',              label_hu: 'Belpolitika',              emoji: '🏛️', group: 'civic' },
  { id: 'rule_of_law',    label_en: 'Rule of Law',           label_hu: 'Jogállamiság',             emoji: '⚖️', group: 'civic' },
  { id: 'corruption',     label_en: 'Accountability',        label_hu: 'Átláthatóság',             emoji: '🔍', group: 'civic' },
  { id: 'eu_relations',   label_en: 'EU & World',            label_hu: 'EU és külpolitika',        emoji: '🌍', group: 'civic' },
  { id: 'ukraine_russia', label_en: 'Ukraine / Russia',      label_hu: 'Ukrajna / Oroszország',    emoji: '🕊️', group: 'civic' },
  { id: 'economy',        label_en: 'Economy',               label_hu: 'Gazdaság',                 emoji: '💰', group: 'civic' },
  { id: 'migration',      label_en: 'Migration',             label_hu: 'Migráció',                 emoji: '🌐', group: 'civic' },
  // General interest
  { id: 'science',        label_en: 'Science',               label_hu: 'Tudomány',                 emoji: '🔬', group: 'general' },
  { id: 'technology',     label_en: 'Technology',            label_hu: 'Technológia',              emoji: '💻', group: 'general' },
  { id: 'entertainment',  label_en: 'Entertainment',         label_hu: 'Kultúra & szórakozás',     emoji: '🎭', group: 'general' },
  // Local
  { id: 'local',          label_en: 'Local Headlines',       label_hu: 'Helyi hírek',              emoji: '📍', group: 'local' },
];

// ── UK local regions → BBC Local RSS + regional papers ───────────────────────

const UK_LOCAL_SOURCES: Record<string, { label: string; rss: string[] }> = {
  bedford_uk:       { label: 'Bedford',         rss: ['https://feeds.bbci.co.uk/news/england/beds_bucks_and_herts/rss.xml'] },
  london_uk:        { label: 'London',           rss: ['https://feeds.bbci.co.uk/news/england/london/rss.xml'] },
  manchester_uk:    { label: 'Manchester',       rss: ['https://feeds.bbci.co.uk/news/england/manchester/rss.xml'] },
  birmingham_uk:    { label: 'Birmingham',       rss: ['https://feeds.bbci.co.uk/news/england/birmingham/rss.xml'] },
  leeds_uk:         { label: 'Leeds',            rss: ['https://feeds.bbci.co.uk/news/england/leeds/rss.xml'] },
  bristol_uk:       { label: 'Bristol',          rss: ['https://feeds.bbci.co.uk/news/england/bristol/rss.xml'] },
  edinburgh_uk:     { label: 'Edinburgh',        rss: ['https://feeds.bbci.co.uk/news/scotland/edinburgh_east_and_fife/rss.xml'] },
  cardiff_uk:       { label: 'Cardiff',          rss: ['https://feeds.bbci.co.uk/news/wales/south_east_wales/rss.xml'] },
  cambridge_uk:     { label: 'Cambridge',        rss: ['https://feeds.bbci.co.uk/news/england/beds_bucks_and_herts/rss.xml'] },
  oxford_uk:        { label: 'Oxford',           rss: ['https://feeds.bbci.co.uk/news/england/oxford/rss.xml'] },
  nottingham_uk:    { label: 'Nottingham',       rss: ['https://feeds.bbci.co.uk/news/england/nottingham/rss.xml'] },
  liverpool_uk:     { label: 'Liverpool',        rss: ['https://feeds.bbci.co.uk/news/england/merseyside/rss.xml'] },
  newcastle_uk:     { label: 'Newcastle',        rss: ['https://feeds.bbci.co.uk/news/england/tyne/rss.xml'] },
  sheffield_uk:     { label: 'Sheffield',        rss: ['https://feeds.bbci.co.uk/news/england/south_yorkshire/rss.xml'] },
};

// ── Hungary local regions → county/city news sources ──────────────────────────

const HU_LOCAL_SOURCES: Record<string, { label: string; rss: string[] }> = {
  budapest_hu:      { label: 'Budapest',         rss: ['https://444.hu/feed', 'https://telex.hu/rss'] },
  debrecen_hu:      { label: 'Debrecen',         rss: ['https://dehir.hu/feed/'] },
  miskolc_hu:       { label: 'Miskolc',          rss: ['https://miskolcmost.hu/feed/'] },
  pecs_hu:          { label: 'Pécs',             rss: ['https://pecsinapilap.hu/feed/'] },
  gyor_hu:          { label: 'Győr',             rss: ['https://kisalfold.hu/rss/friss'] },
  szeged_hu:        { label: 'Szeged',           rss: ['https://szegedma.hu/feed/'] },
};

// ── Curated fallback items ─────────────────────────────────────────────────────

const CURATED_FALLBACK = [
  {
    id: 'c_001', topic: 'elections', weight: 'high', language: 'en', source_country: 'US',
    source_name: 'Radio Free Europe / RFE-RL', source_domain: 'rferl.org',
    title: 'Hungary 2026 parliamentary election — what you need to know',
    snippet: 'On April 12, Hungarians go to the polls. RFE-RL covers the race between Fidesz and the Tisza opposition.',
    url: 'https://www.rferl.org/z/631', content_type: 'press', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
  {
    id: 'c_002', topic: 'rule_of_law', weight: 'high', language: 'en', source_country: 'UK',
    source_name: 'The Guardian', source_domain: 'theguardian.com',
    title: 'Hungary rule of law: the full picture',
    snippet: 'The Guardian\'s ongoing coverage of democratic backsliding, press freedom, and judicial independence in Hungary.',
    url: 'https://www.theguardian.com/world/hungary', content_type: 'press', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
  {
    id: 'c_003', topic: 'eu_relations', weight: 'high', language: 'en', source_country: 'EU',
    source_name: 'Politico Europe', source_domain: 'politico.eu',
    title: 'Hungary and the EU: the latest',
    snippet: 'Politico Europe\'s coverage of Hungary\'s relationship with Brussels, rule of law conditionality, and the 2026 elections.',
    url: 'https://www.politico.eu/europe-poll-of-polls/hungary/', content_type: 'press', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
  {
    id: 'c_004', topic: 'corruption', weight: 'high', language: 'hu', source_country: 'HU',
    source_name: 'Átlátszó', source_domain: 'atlatszo.hu',
    title: 'Átlátszó: jelöltek és közpénzek',
    snippet: 'Az Átlátszó korrupció-ellenes nyomozó újságírás — jelöltek üzleti érdekeltségei, közbeszerzési kapcsolatok.',
    url: 'https://atlatszo.hu', content_type: 'press', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
  {
    id: 'c_005', topic: 'economy', weight: 'medium', language: 'en', source_country: 'EU',
    source_name: 'Euractiv', source_domain: 'euractiv.com',
    title: 'Hungary economy: inflation, EU funds and the forint',
    snippet: 'Euractiv\'s coverage of Hungarian economic policy, frozen EU cohesion funds, and the impact on ordinary Hungarians.',
    url: 'https://www.euractiv.com/section/central-europe/', content_type: 'press', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
  {
    id: 'c_006', topic: 'science', weight: 'high', language: 'en', source_country: 'UK',
    source_name: 'BBC Science', source_domain: 'bbc.com',
    title: 'Latest science & technology news',
    snippet: 'BBC Science covers the latest breakthroughs, research, and discoveries — independent of political coverage.',
    url: 'https://www.bbc.com/news/science_and_environment', content_type: 'press', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
  {
    id: 'c_007', topic: 'technology', weight: 'medium', language: 'en', source_country: 'US',
    source_name: 'The Verge', source_domain: 'theverge.com',
    title: 'Technology news — independent coverage',
    snippet: 'Technology news from independent sources. Prism will curate tech news relevant to your region and interests.',
    url: 'https://www.theverge.com', content_type: 'press', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
  {
    id: 'c_008', topic: 'entertainment', weight: 'medium', language: 'en', source_country: 'UK',
    source_name: 'The Guardian Culture', source_domain: 'theguardian.com',
    title: 'Culture, arts and entertainment',
    snippet: 'Film, music, books and culture from The Guardian — a break from politics without losing quality journalism.',
    url: 'https://www.theguardian.com/culture', content_type: 'press', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
  {
    id: 'c_009', topic: 'local', weight: 'medium', language: 'en', source_country: 'UK',
    source_name: 'BBC Local', source_domain: 'bbc.co.uk',
    title: '📍 Local headlines — set your location to personalise',
    snippet: 'Prism\'s local headlines come from your country mind — your local BBC region, council feeds, and trusted local sources. Set your town or city to activate.',
    url: '#set-location', content_type: 'local', published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true, is_local_prompt: true,
  },
  {
    id: 'c_010', topic: 'politics', weight: 'low', language: 'en', source_country: 'US',
    source_name: 'Reddit r/hungary', source_domain: 'reddit.com',
    title: 'Public discussion: Hungary 2026 elections',
    snippet: 'English-language community discussion about Hungarian politics, the election, and daily life.',
    url: 'https://reddit.com/r/hungary', content_type: 'social', is_sentiment: true, published: new Date().toISOString(), fetched_at: new Date().toISOString(), is_curated: true,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function readJsonFeed(filePath: string): Record<string, unknown>[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs   = require('fs')   as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const resolved = path.resolve(process.cwd(), '..', filePath);
    if (!fs.existsSync(resolved)) return [];
    const raw = fs.readFileSync(resolved, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch { return []; }
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic       = searchParams.get('topic')       ?? 'all';
  const lang        = searchParams.get('lang')        ?? 'all';
  const limit       = Math.min(parseInt(searchParams.get('limit') ?? '30'), 50);
  const localRegion = searchParams.get('localRegion') ?? null;

  // Load scraped feeds
  const foreignItems = readJsonFeed('data/hungary/intelligence/foreign/feed.json');
  const socialItems  = readJsonFeed('data/hungary/intelligence/social/feed.json');
  const localItems   = readJsonFeed('data/hungary/intelligence/local/feed.json');

  let items: Record<string, unknown>[] = [];
  const hasScrapedData = foreignItems.length > 0 || socialItems.length > 0;

  if (hasScrapedData) {
    items = [...CURATED_FALLBACK, ...foreignItems, ...socialItems, ...localItems];
  } else {
    items = [...CURATED_FALLBACK];
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  items = items.filter(item => {
    const url = String(item.url ?? '');
    if (!url || url === '#set-location' || seen.has(url)) return !seen.has(url) && Boolean(url);
    seen.add(url);
    return true;
  });

  // Filter by local region — only include local items for the requested region
  if (localRegion) {
    items = items.filter(item =>
      item.topic !== 'local' ||
      (item as Record<string, unknown>).local_region === localRegion ||
      (item as Record<string, unknown>).is_local_prompt === true
    );
  }

  // Topic filter
  if (topic !== 'all') {
    items = items.filter(i => i.topic === topic);
  }

  // Lang filter
  if (lang !== 'all') {
    items = items.filter(i => i.language === lang);
  }

  // Sort: local pinned first if topic=local, then by weight, then recency
  const weightOrder = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => {
    if (a.is_local_prompt && !b.is_local_prompt) return -1;
    if (!a.is_local_prompt && b.is_local_prompt) return 1;
    const wa = weightOrder[a.weight as keyof typeof weightOrder] ?? 2;
    const wb = weightOrder[b.weight as keyof typeof weightOrder] ?? 2;
    if (wa !== wb) return wa - wb;
    return String(b.fetched_at ?? '').localeCompare(String(a.fetched_at ?? ''));
  });

  // Determine available local sources for the client
  const allLocalSources = { ...UK_LOCAL_SOURCES, ...HU_LOCAL_SOURCES };

  return NextResponse.json({
    items:        items.slice(0, limit),
    total:        items.length,
    sections:     TOPIC_SECTIONS,
    localSources: allLocalSources,
    generated_at: new Date().toISOString(),
  });
}
