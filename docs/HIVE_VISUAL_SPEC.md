# Hive Participation Visual — Design Spec

**Status:** Spec v1 (2026-03-21)
**Decision:** D-019
**Issue:** #8 — Prism Living Network

---

## Overview

The Prism hive map is the primary visual identity of the product. It is not decorative — it is a live reflection of the community participating right now. Every node represents real people in a region who are actively using Prism. Every pulse is a real event.

This visual lives in two places:
- **Website landing page** — ships first (Phase 1)
- **Phone app** — ships when app is built (no delay, same spec)

---

## Default View: Zoom to User's Country

### On load sequence
1. Globe/map starts at **world view** — all nodes visible, full network
2. After ~0.8s, camera **eases in to user's country cluster**
   - Smooth, not a jump — the user should feel the world contracting around them
3. User's country nodes **brighten**; other countries dim but remain visible
4. If country cannot be detected (no locale signal) → stay at world view, show a subtle "Where are you?" prompt

### Why the world view first
The 0.8s establishing shot is intentional. It tells the user: *you are part of something global*. Then it brings them home. Skip this and it's just a map. Keep it and it's a statement.

---

## Node Design

### What a node represents
- A **regional cluster** — constituency, city, or district level
- Never a single user, never a GPS point
- Node size scales with active participants in that region today

### Node states
| State | Appearance |
|---|---|
| Active (answered today) | Warm white glow, full opacity, slightly enlarged |
| Dormant (no activity today) | Dim, small, low opacity |
| User's region | Distinct colour ring — cyan/teal, always visible |
| Neighbour activity | Faint ripple when nearby node activates |

### Privacy rules (non-negotiable)
- No usernames on map
- No avatars on map
- No individual GPS precision — minimum granularity is constituency/district level
- "You" is distinguished by colour ring only, not by label or identifier

---

## Participation Pulses

### Trigger events and effects

| User action | Effect on user's node | Duration |
|---|---|---|
| Answer a priority question | Soft pulse — yellow-white ring expands outward | ~1.5s fade |
| Submit evidence or hive message | Stronger pulse — blue-white, ripple travels to nearby nodes | ~2s, ripple ~1s |
| First action of the session | Node glows on bright for ~3s, then settles to active state | 3s hold, soft settle |
| Consecutive answers | Pulses compound — each one adds brightness, caps at max glow | Additive |

### Neighbour awareness
When a user in the same region or neighbouring region answers the same question:
- Their node emits a **faint pulse** (~30% opacity of a user's own pulse)
- This shows the user they are not alone without revealing who the other person is
- Creates organic sense of community momentum

---

## Technical Implementation

### Website (Three.js)
- Globe rendered with Three.js (already planned for landing page)
- Nodes: particle system, position data from country-mind API
- Pulse animations: custom shader or post-processing glow effect
- Participation events: SSE stream from `/api/hive/events` endpoint
- Camera: lerp to country bounding box on load, smooth easing (ease-out cubic)
- Fallback: static SVG map for no-JS / slow connections

### Phone App (React Native / Expo)
- 2D hex grid representing the country (not a globe — too heavy for mobile)
- Cells represent regions; lighting up on participation
- Same event stream model, same privacy rules
- Glow: Reanimated 2 animated values, not CSS — hardware accelerated
- Fallback: static cells with last-known activity state from local cache

### API surface needed
```
GET  /api/hive/snapshot          → current node states (region, activity level)
GET  /api/hive/events            → SSE stream of participation events
POST /api/hive/ping              → record participation event (server-side, not client-exposed)
```

Participation events are **server-emitted** — the client never calls `/api/hive/events` with identifying data. The server knows the event happened (answer submitted) and broadcasts the region-level signal.

---

## What This Is Not

- Not a surveillance map — no tracking, no GPS, no identifiers
- Not a vanity metric — node count is real participants, not registered accounts
- Not simulated — if nobody is using Prism in a region, that region is dark. That's honest.

---

## Open Questions

1. **Minimum cluster size for a node to appear** — suggest 3+ active users in a region before a node lights up (prevents single-user de-anonymisation)
2. **Historical vs live** — do we show today's activity only, or rolling 7-day glow? Lean toward today-only for now (more honest)
3. **Event rate limiting** — if a user answers 20 questions fast, do we pulse 20 times? Suggest max 1 pulse per 10s, with brightness accumulating instead

---

## Relationship to Hungary Pilot

For the Hungary pilot (/hu route), the hive visual should default to Hungary with OEVK-level (constituency) granularity. 106 constituencies = 106 potential nodes. This is the first real test of the map with meaningful data density.
