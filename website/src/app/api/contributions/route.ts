import { NextRequest, NextResponse } from "next/server";
import contributionsData from "../../../data/hungary/contributions.json";

/**
 * GET /api/contributions
 *
 * Returns mock contribution network data for all regions.
 *
 * D-022: Website users contribute the same way as phone users.
 * The contribution map is a visual representation of network participation
 * by region. Cached for 5 minutes.
 */

export async function GET(_req: NextRequest) {
  return NextResponse.json(contributionsData, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
