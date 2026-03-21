import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

/**
 * GET /api/hu/candidate/[id]
 *
 * Returns intelligence data for a candidate by their NVI kpn_id.
 * Reads from data/hungary/intelligence/ at runtime so new scraper
 * output becomes visible without a rebuild.
 *
 * Returns 404 if no intelligence files exist for this candidate yet.
 * Returns 200 with sources:{} if files exist but all are empty.
 */

const INTEL_BASE = path.join(process.cwd(), "..", "data", "hungary", "intelligence");

const SOURCE_DIRS: Record<string, { label: string; weight: "high" | "medium" | "low" }> = {
  "media/atalatzo": { label: "Átlátszó", weight: "high" },
  "media/hvg":      { label: "HVG",       weight: "medium" },
  "media/telex":    { label: "Telex",     weight: "medium" },
  "media/444":      { label: "444",       weight: "medium" },
  parliament:       { label: "Parliament", weight: "high" },
  business:         { label: "Business Registry", weight: "medium" },
  procurement:      { label: "Procurement", weight: "high" },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const kpnId = parseInt(id, 10);

  if (isNaN(kpnId)) {
    return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });
  }

  const sources: Record<string, unknown> = {};
  let anyFound = false;

  for (const [dir, meta] of Object.entries(SOURCE_DIRS)) {
    const filePath = path.join(INTEL_BASE, dir, `${kpnId}.json`);
    if (!fs.existsSync(filePath)) continue;

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      sources[dir] = {
        ...meta,
        scraped_at: data.scraped_at,
        item_count: data.item_count ?? 0,
        items: (data.items ?? []).slice(0, 20), // cap at 20 per source
      };
      anyFound = true;
    } catch {
      // malformed file — skip
    }
  }

  if (!anyFound) {
    return NextResponse.json({ error: "No intelligence data found" }, { status: 404 });
  }

  return NextResponse.json({
    kpn_id: kpnId,
    sources,
    generated_at: new Date().toISOString(),
  });
}
