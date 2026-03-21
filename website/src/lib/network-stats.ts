export type NetworkMetric = {
  id: string;
  label: string;
  value: number;
};

export type NetworkStatsSnapshot = {
  asOf: string;
  source: "mock" | "live" | "fallback";
  isLive: boolean;
  isStale: boolean;
  note: string;
  metrics: NetworkMetric[];
};

type HeartbeatPayload = {
  nodesOnline?: number;
  countryMinds?: number;
  worldMinds?: number;
  evidencePacks?: number;
  queriesToday?: number;
  lastUpdated?: string;
};

const MOCK_METRICS: NetworkMetric[] = [
  { id: "nodes-online", label: "Nodes online", value: 24 },
  { id: "country-minds", label: "Country minds", value: 6 },
  { id: "world-minds", label: "World minds", value: 3 },
  { id: "evidence-packs", label: "Evidence packs", value: 1204 },
  { id: "queries-today", label: "Queries today", value: 342 },
];

function buildMockSnapshot(
  source: "mock" | "fallback",
  note: string,
): NetworkStatsSnapshot {
  return {
    asOf: new Date().toISOString(),
    source,
    isLive: false,
    isStale: source === "fallback",
    note,
    metrics: MOCK_METRICS,
  };
}

function normalizeLivePayload(payload: HeartbeatPayload): NetworkStatsSnapshot {
  const asOf = payload.lastUpdated ?? new Date().toISOString();

  return {
    asOf,
    source: "live",
    isLive: true,
    isStale: false,
    note: "Live heartbeat snapshot",
    metrics: [
      { id: "nodes-online", label: "Nodes online", value: payload.nodesOnline ?? 0 },
      { id: "country-minds", label: "Country minds", value: payload.countryMinds ?? 0 },
      { id: "world-minds", label: "World minds", value: payload.worldMinds ?? 0 },
      { id: "evidence-packs", label: "Evidence packs", value: payload.evidencePacks ?? 0 },
      { id: "queries-today", label: "Queries today", value: payload.queriesToday ?? 0 },
    ],
  };
}

async function loadHeartbeatStats(endpoint: string): Promise<NetworkStatsSnapshot> {
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(2500),
  });

  if (!response.ok) {
    throw new Error(`Heartbeat endpoint returned ${response.status}`);
  }

  const payload = (await response.json()) as HeartbeatPayload;
  return normalizeLivePayload(payload);
}

export async function getPublicNetworkStats(): Promise<NetworkStatsSnapshot> {
  const endpoint = process.env.PRISM_STATS_ENDPOINT;

  if (!endpoint) {
    return buildMockSnapshot(
      "mock",
      "Mock snapshot until the heartbeat API is wired in.",
    );
  }

  try {
    return await loadHeartbeatStats(endpoint);
  } catch {
    return buildMockSnapshot(
      "fallback",
      "Heartbeat unavailable. Showing the last bundled mock snapshot.",
    );
  }
}
