import { NextResponse } from "next/server";
import { getPublicNetworkStats } from "@/lib/network-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getPublicNetworkStats();
  return NextResponse.json(stats);
}
