/**
 * GET /api/hive/events
 * SSE stream of participation events.
 * Stub: emits mock events every 5–10s.
 * Replace with real event source when backend is live.
 */

export const dynamic = 'force-dynamic';

const NODE_IDS = [
  'gb-london', 'gb-manchester', 'hu-budapest', 'hu-debrecen',
  'de-berlin', 'fr-paris', 'us-nyc', 'au-sydney', 'jp-tokyo',
  'br-saopaulo', 'in-mumbai', 'ng-lagos', 'kr-seoul', 'pl-warsaw',
];

const EVENT_TYPES = ['answer', 'answer', 'evidence', 'answer'] as const;

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send an initial snapshot event
      const snapshot = {
        type: 'snapshot',
        nodes: NODE_IDS.map(id => ({
          id,
          active: Math.random() > 0.4,
          activityLevel: Math.floor(Math.random() * 100),
        })),
        timestamp: Date.now(),
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`)
      );

      // Emit mock participation events
      const interval = setInterval(() => {
        const nodeId = NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)];
        const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
        const event = {
          type: eventType,
          nodeId,
          timestamp: Date.now(),
        };
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          clearInterval(interval);
        }
      }, 5000 + Math.random() * 5000);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20000);

      return () => {
        clearInterval(interval);
        clearInterval(heartbeat);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
