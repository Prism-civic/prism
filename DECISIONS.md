
## D-017 — Candidate Profile Visual Design
**Date:** 2026-03-21
**Decision:** Candidate profiles use a hexagonal radar chart overlaid on the profile photo, inspired by trait visualisation in games (e.g. Illuvium).
**Six traits:** EU, Migráció, Gazdaság, Jogállamiság, Ukrajna, Környezet (Environment)
**Key principle:** Radar shows *alignment between user and candidate*, not absolute score. User sees their own profile reflected in the shape. Full hexagon = full alignment.
**Credibility bar:** Separate horizontal bar at bottom of photo. Objective score from law records, broken promises, financial transparency, police/court records. Same for all users.
**Mobile-first:** Design must be legible on small screens at a glance.

## D-019 — Hive Participation Visual
**Date:** 2026-03-21
**Decision:** The living network animation on the landing page IS the hive map — not a separate decorative element. Same visual ships in the phone app when built (no delay). Nodes represent regional clusters (not individuals). The map zooms to the user's country on load (after a ~0.8s world-view establishing shot). User's node pulses on participation events. See `docs/HIVE_VISUAL_SPEC.md` for full behaviour.
**Key principles:**
- Privacy-first: nodes cluster by region/constituency, never GPS-precise
- No usernames or avatars on the map — presence only
- Animation is reactive to real events, not simulated
- Zoom-to-country is the default experience; world view is the reveal, not the landing

## D-018 — Community Intelligence Layer
**Date:** 2026-03-21
**Decision:** Users can submit claims about candidates (e.g. "X promised Y but didn't deliver"). Claims enter a processing queue. Weight accumulates if multiple users report the same issue. AI investigates against records and confirms, refutes, or flags as unverified. Capacity-dependent investigation depth.
**Rationale:** Crowdsourced civic memory. Fills gaps that scrapers can't reach. Requires careful anti-abuse design (spam, coordinated attacks).
**Open questions:** Moderation, identity verification for claim submitters, minimum weight threshold for investigation, public visibility of unverified claims.
