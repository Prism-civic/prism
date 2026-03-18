# Prism Roadmap

*Last updated: March 2026*

This roadmap is public and honest. It shows where we are, where we're going, and what we don't know yet. It will change as the community grows and reality intervenes.

---

## Where We Are Now

**Phase 0 — Founding** ✅ *(March 2026)*

The project exists. The founding documents are written and public. The architecture is designed. The Humanitarian Charter is in place. The GitHub org is live.

What exists: documentation, vision, architecture specs.
What doesn't exist yet: working software.

---

## Phase 1 — First Light
*Target: April–June 2026*

**Goal:** A minimal working system that proves the concept end-to-end. Ugly is fine. Working is everything.

### Milestones

**1.1 — Node Software Alpha**
- [ ] Docker container for a basic verifier node
- [ ] Health signal broadcasting (heartbeat protocol)
- [ ] Node registration with a central coordinator
- [ ] Basic peer discovery

**1.2 — UK Country Mind v0**
- [ ] Single VPS running the country mind API
- [ ] Source registry: 5–10 UK public sources (parliament.uk, ONS, NHS England)
- [ ] Evidence pack generation for 3 topics: housing, NHS, cost of living
- [ ] Signed evidence pack output
- [ ] Basic transparency log

**1.3 — Phone App MVP**
- [ ] iOS + Android (React Native)
- [ ] Onboarding conversation (3 questions)
- [ ] Interest profile (visible, editable)
- [ ] Morning brief (pulls from UK country mind)
- [ ] One alignment result view
- [ ] The pulse orb (ambient network status)

**1.4 — Website Phase 1**
- [ ] Static landing page with globe visualization
- [ ] "How it works" explainer
- [ ] Link to GitHub and future Open Collective
- [ ] Node count (live, from heartbeat API)

**Hardware note:** Viktor's P52 handles development. Mac Mini (June 2026) becomes first production UK country mind node.

---

## Phase 2 — Community
*Target: July–September 2026*

**Goal:** First external contributors. First country chapter beyond UK. First real users.

### Milestones

**2.1 — Open Collective Live**
- [ ] Donation page public
- [ ] First month of transparent fund reporting

**2.2 — First Country Chapter**
- [ ] Country chapter application process open
- [ ] First non-UK chapter accepted and onboarded
- [ ] Their node visible on the website map

**2.3 — Contributor Wall Live**
- [ ] Website Phase 2: contributor profiles
- [ ] Badge system
- [ ] Real-time node activity

**2.4 — Daily Civic Pulse**
- [ ] Ground truth question generation
- [ ] Follow-up intelligence (budget trail, contractor records)
- [ ] Accountability gap flagging

---

## Phase 3 — Scale
*Target: 2027*

**Goal:** Multi-country network, self-sustaining community, production-grade infrastructure.

### Milestones

**3.1 — World Mind v1**
- [ ] First world mind node operational
- [ ] International law corpus ingested
- [ ] Cross-country policy comparisons live
- [ ] Multi-perspective geopolitical analysis

**3.2 — Self-Healing Network**
- [ ] Full peer-assistance protocol implemented
- [ ] Cross-country shadow node capability
- [ ] Network health dashboard public

**3.3 — Model Independence Progress**
- [ ] Self-hosted 70B model tested for country mind tier
- [ ] Quality gap assessment vs API models published
- [ ] Migration plan updated based on findings

**3.4 — Governance**
- [ ] First steering group elected
- [ ] Country chapter representatives included
- [ ] Formal amendment process for Humanitarian Charter established

---

## Phase 4 — Maturity
*Target: 2028+*

- Full independence from proprietary AI APIs (open weights world mind)
- 20+ country chapters operational
- Academic and research partnerships
- Policy impact forecasting
- Open research platform for civic intelligence
- Formal open governance model

---

## What We Don't Know Yet

Honest unknowns:

- **Exact tech stack** for node software — Rust vs Go decision pending
- **Phone app model** — Phi-4 Mini vs Llama 3.2 3B, needs benchmarking on real devices
- **Country mind hosting costs** at scale — depends on caching efficiency
- **Legal exposure** in different jurisdictions — needs proper legal review before Phase 2
- **Community growth rate** — entirely depends on word of mouth and early quality

---

## How to Help Right Now

See [CONTRIBUTING.md](CONTRIBUTING.md) — especially:
- Running a light node (when software is ready)
- Starting a country chapter application
- Improving the documentation
- Translating into your language

The most useful thing right now: if you care about this, tell someone else who might too.

---

*This roadmap is a living document. It will be updated as the project evolves.*
*Last updated by: Atlas (Project Lead) — March 2026*
