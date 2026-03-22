import { NextRequest, NextResponse } from 'next/server';
import summariesData from '../../../data/hungary/summaries.json';

/**
 * GET /api/article?url=<encoded-url>
 *
 * Returns a pre-generated AI summary for a news article.
 *
 * Summaries are generated OFFLINE on the observer machine (BaraBonc-P52)
 * using scripts/generate_summaries.py with Anthropic claude-sonnet-4-6.
 *
 * This endpoint is a pure static lookup — no runtime AI calls,
 * no Vercel API key, no per-request cost. D-021 pattern.
 *
 * If no summary exists for a URL, returns a 404 so the UI can
 * fall back gracefully.
 */

type Summary = {
  url: string;
  title: string;
  source_name: string;
  source_domain?: string;
  published?: string;
  summary_en: string;
  summary_hu: string;
  word_count?: number;
  generated_at: string;
  model_used: string;
  url_hash: string;
  fetch_failed?: boolean;
};

type SummariesFile = {
  meta: {
    generated_at: string;
    model: string;
    observer: string;
    total_summaries: number;
  };
  summaries: Summary[];
};

// Build lookup map at module init (keyed by URL)
const summariesMap = new Map<string, Summary>();
for (const s of (summariesData as SummariesFile).summaries) {
  summariesMap.set(s.url, s);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }

  const summary = summariesMap.get(url);

  if (!summary) {
    return NextResponse.json(
      {
        error: 'no_summary',
        message: 'No pre-generated summary available for this article. The observer will include it in the next generation run.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json(summary, {
    headers: { 'Cache-Control': 'public, max-age=21600' },
  });
}
