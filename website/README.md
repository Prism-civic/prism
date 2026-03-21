## Prism Website

Phase 1 public website for Prism.

The site lives in `website/` so it can evolve independently from the Expo mobile app already in the repo.

### Stack

- Next.js 15 App Router
- Tailwind CSS
- Server-rendered homepage with client-side stats refresh enhancement

### Run locally

```bash
cd website
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Stats data seam

- By default the homepage stats use a bundled mock snapshot.
- If `PRISM_STATS_ENDPOINT` is set, the site fetches that JSON endpoint server-side and via `/api/network-stats`.
- If the live endpoint fails, the UI falls back to the mock snapshot and marks the state clearly.

Expected live payload shape:

```json
{
  "nodesOnline": 24,
  "countryMinds": 6,
  "worldMinds": 3,
  "evidencePacks": 1204,
  "queriesToday": 342,
  "lastUpdated": "2026-03-21T09:00:00.000Z"
}
```

### Principles kept in Phase 1

- No cookies
- No analytics
- No tracking
- Core content available without JavaScript
- Mobile-first layout with keyboard-accessible navigation
