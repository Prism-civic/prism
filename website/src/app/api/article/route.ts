import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/article?url=<encoded-url>&lang=en|hu
 *
 * Fetches a news article, extracts clean text, and returns an AI-generated
 * summary (3–5 paragraphs) without ads or bloat.
 *
 * Observer: BaraBonc-P52 (HU pilot)
 * Model: claude-sonnet-4-6 (via Anthropic SDK)
 *
 * Cache: 6 hours per URL (in-memory). On Vercel, cache resets per cold start.
 * Rate limit: 1 request per URL per 6 hours.
 */

// ── In-memory cache ───────────────────────────────────────────────────────────

type CachedArticle = {
  url: string;
  title: string;
  summary_en: string;
  summary_hu: string;
  source_name: string;
  source_url: string;
  published?: string;
  cached_at: string;
  word_count?: number;
};

const cache = new Map<string, CachedArticle>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const cacheTimestamps = new Map<string, number>();

// ── Text extraction ───────────────────────────────────────────────────────────

function extractText(html: string): { title: string; body: string } {
  // Remove scripts, styles, nav, header, footer, aside
  const clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Extract title from <title> or <h1>
  const titleMatch = clean.match(/<title[^>]*>([^<]+)<\/title>/i)
    ?? clean.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';

  // Extract main article body — look for <article>, <main>, or largest <div>
  const articleMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    ?? clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const body_html = articleMatch ? articleMatch[1] : clean;

  // Strip remaining HTML tags
  const body = body_html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, '\n\n')
    .replace(/\n{4,}/g, '\n\n')
    .trim();

  return { title, body };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const _lang = searchParams.get('lang') ?? 'en';

  if (!url) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Check cache
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  const cachedAt = cacheTimestamps.get(cacheKey) ?? 0;
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached, from_cache: true });
  }

  // Fetch article
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Prism-Observer/1.0; +https://prism-sooty-chi.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9,hu;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Source returned ${res.status}` }, { status: 502 });
    }
    html = await res.text();
  } catch (e) {
    return NextResponse.json({
      error: 'Failed to fetch article',
      detail: e instanceof Error ? e.message : 'Unknown error',
    }, { status: 502 });
  }

  // Extract text
  const { title, body } = extractText(html);
  if (!body || body.length < 200) {
    return NextResponse.json({ error: 'Could not extract article text — source may block automated access' }, { status: 422 });
  }

  // Truncate to ~6000 chars for the model
  const bodyForModel = body.slice(0, 6000);
  const wordCount = body.split(/\s+/).length;

  // Generate AI summary — using claude-sonnet-4-6 (I am the model)
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let summary_en = '';
  let summary_hu = '';

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `You are Prism's article summariser. Your job is to extract the core content of news articles and present it cleanly — no ads, no clutter, no paywall material.

Rules:
- Summarise in 3–5 short paragraphs covering the key facts
- Neutral, factual language only
- Include who, what, when, where, why if the article covers them
- Do not add analysis or opinion not present in the source
- Keep each paragraph to 2–4 sentences
- Respond with valid JSON only: { "summary_en": "...", "summary_hu": "..." }
The Hungarian summary must be a faithful translation of the English, not a separate composition.`,
      messages: [{
        role: 'user',
        content: `Article URL: ${url}\nTitle: ${title}\n\nArticle text:\n${bodyForModel}\n\nGenerate a clean summary. Respond with JSON only.`,
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const jsonStr = raw.startsWith('```') ? raw.split('```')[1].replace(/^json\n?/, '') : raw;
    const parsed_response = JSON.parse(jsonStr);
    summary_en = parsed_response.summary_en ?? '';
    summary_hu = parsed_response.summary_hu ?? '';
  } catch (e) {
    // If API fails, return extracted text directly
    summary_en = body.slice(0, 1200).replace(/\n{3,}/g, '\n\n');
    summary_hu = '';
    console.error('AI summary failed:', e);
  }

  const result: CachedArticle = {
    url,
    title: title || parsed.hostname,
    summary_en,
    summary_hu,
    source_name: parsed.hostname.replace('www.', ''),
    source_url: url,
    cached_at: new Date().toISOString(),
    word_count: wordCount,
  };

  cache.set(cacheKey, result);
  cacheTimestamps.set(cacheKey, Date.now());

  return NextResponse.json({ ...result, from_cache: false }, {
    headers: { 'Cache-Control': 'public, max-age=21600' },
  });
}
