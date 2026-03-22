
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

## D-020 — Observer Network Architecture (replaces country/world mind hierarchy)
**Date:** 2026-03-22
**Decision:** Retire the country mind / world mind hierarchy. Replace with a flat Observer Network model.
**Model:** Each observer node scrapes local + international data, analyses it, and feeds its local sensors (phones in its area). The hive mind is the emergent aggregate of all observers. No HQ, no central editorial authority, no privileged tier.
**Rationale:** A hierarchy implies a single point of authority and failure. The observer model is federated by design — no single node can be pressured, captured, or shut down to silence the network. Cross-border patterns emerge from observer overlap, not from a top-down synthesis node.
**Tiers reframed as capability spectrum, not authority levels:**
- Phone: smallest model, personal preference layer, offline Q&A
- Observer node (Pi, laptop, VPS): scrapes, analyses, serves local sensors, peers with other observers
- No "world mind server" — world-level intelligence emerges from observer consensus
**Model diversity:** Each observer chooses their own AI model. Quality minimum advised (strong analytical + conversational capability). Diversity of models is a feature — reduces monoculture bias.

## D-021 — AI Intelligence Briefs: Pre-generated, Observer-local
**Date:** 2026-03-22
**Decision:** Candidate intelligence briefs are pre-generated on the observer machine (not at request time). The observer runs a local script using their chosen model (pilot: Anthropic Sonnet 4.6 on Viktor's P52). Output is static JSON committed to the repo. The API serves static lookups — no runtime AI calls, no Vercel API key, no per-request cost.
**Rationale:** Consistent briefs, no latency, no cost per request, no API key exposure. Re-run the script after each scraper update to refresh briefs.
**Format:** `data/hungary/briefs.json` keyed by kpn_id. Each entry: brief_en, brief_hu, confidence, evidence_count, sources_used, generated_at, model_used.

## D-022 — Website Users: Feed Curation Without Local LLM
**Date:** 2026-03-22
**Decision:** Website users have no local LLM. Their feed is curated directly by the observer, skipping the local personalisation layer. Personal topic preferences still stored in browser localStorage (existing). Contribution capability is identical to phone users: verifications, reports, evidence flags, translations — all feed the network map the same way.
**Rationale:** Don't constrain web users. The personalisation layer is a phone-native privacy feature, not a requirement for participation. Observer curates the default feed; user adjusts via topic toggles.
