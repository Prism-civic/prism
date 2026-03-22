/**
 * GET /api/hive/snapshot
 * Returns current node states — activity level per regional cluster.
 * Stub: returns mock data.
 * Replace with real country-mind query when backend is live.
 */

export const dynamic = 'force-dynamic';

const MOCK_NODES = [
  { id: 'gb-london',    country: 'GB', lat: 51.5,  lng: -0.1,   active: true,  activityLevel: 87 },
  { id: 'gb-manchester',country: 'GB', lat: 53.5,  lng: -2.2,   active: false, activityLevel: 12 },
  { id: 'hu-budapest',  country: 'HU', lat: 47.5,  lng: 19.0,   active: true,  activityLevel: 94 },
  { id: 'hu-debrecen',  country: 'HU', lat: 47.5,  lng: 21.6,   active: true,  activityLevel: 41 },
  { id: 'de-berlin',    country: 'DE', lat: 52.5,  lng: 13.4,   active: true,  activityLevel: 73 },
  { id: 'fr-paris',     country: 'FR', lat: 48.9,  lng: 2.3,    active: true,  activityLevel: 65 },
  { id: 'us-nyc',       country: 'US', lat: 40.7,  lng: -74.0,  active: true,  activityLevel: 58 },
  { id: 'jp-tokyo',     country: 'JP', lat: 35.7,  lng: 139.7,  active: true,  activityLevel: 47 },
  { id: 'au-sydney',    country: 'AU', lat: -33.9, lng: 151.2,  active: true,  activityLevel: 33 },
  { id: 'br-saopaulo',  country: 'BR', lat: -23.5, lng: -46.6,  active: true,  activityLevel: 29 },
];

export async function GET() {
  return Response.json({
    nodes:     MOCK_NODES,
    timestamp: Date.now(),
    totalActive: MOCK_NODES.filter(n => n.active).length,
    // Minimum cluster size enforced server-side: nodes only appear if 3+ active users
    // (privacy rule — prevents single-user de-anonymisation)
    minClusterSize: 3,
  });
}
