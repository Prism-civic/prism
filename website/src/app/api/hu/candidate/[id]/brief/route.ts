import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/hu/candidate/[id]/brief
 *
 * Returns a pre-generated AI intelligence brief for a candidate.
 *
 * Briefs are generated offline on the observer machine (BaraBonc-P52)
 * using scripts/generate_briefs.py and committed as static JSON.
 * No runtime AI calls — this is a pure static lookup.
 *
 * D-021: Briefs are observer-local, pre-generated, model-agnostic.
 */

import briefsData from "../../../../../../data/hungary/briefs.json";

type Brief = {
  kpn_id: number;
  name: string;
  party: string;
  brief_en: string;
  brief_hu: string;
  confidence: "high" | "medium" | "low";
  evidence_count: number;
  sources_used: string[];
  generated_at: string;
  model_used: string;
  evidence_hash: string;
};

type BriefsFile = {
  meta: {
    generated_at: string;
    model: string;
    observer: string;
    total_briefs: number;
  };
  briefs: Brief[];
};

// Build lookup map at module init
const briefsMap = new Map<number, Brief>();
for (const brief of (briefsData as BriefsFile).briefs) {
  briefsMap.set(brief.kpn_id, brief);
}

const CANNED_BRIEF = {
  brief_en:
    "No public records have been found for this candidate at this time. This does not indicate a positive or negative assessment — our intelligence database is still being populated ahead of the April 12 election.",
  brief_hu:
    "Ehhez a jelölthöz jelenleg nem találtunk nyilvános adatot. Ez nem jelent sem pozitív, sem negatív értékelést — az intelligencia-adatbázisunk feltöltése folyamatban van az április 12-i választás előtt.",
  confidence: "none" as const,
  evidence_count: 0,
  sources_used: [] as string[],
  is_canned: true,
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

  const brief = briefsMap.get(kpnId);

  if (!brief) {
    // Return canned response — no brief generated yet for this candidate
    return NextResponse.json(
      {
        kpn_id: kpnId,
        ...CANNED_BRIEF,
        generated_at: (briefsData as BriefsFile).meta.generated_at,
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=3600" },
      }
    );
  }

  return NextResponse.json(brief, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
