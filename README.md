# Prism — Civic Intelligence for Everyone

> *"Separating light into its components, without adding colour of its own."*

**Status:** Founding / Pre-alpha  
**License:** Open Source (TBD — MIT or Apache 2.0)  
**Donations:** Traceable via Open Collective (planned)  
**Founded:** March 2026

---

## Mission

Help ordinary people understand public reality more clearly.

Prism is a free, open-source civic intelligence platform that maps verified policy and performance evidence to a user's own priorities — then explains fit, trade-offs, and uncertainty. It does not tell anyone how to vote. It does not profile users secretly. It does not optimise for persuasion.

---

## Core Promise

- **Transparent evidence** — every output is traceable to a source
- **Explainable alignment** — not recommendations, but reasoned comparisons
- **No hidden persuasion** — the algorithm is open; anyone can audit it
- **User sovereignty** — raw opinions and notes stay on-device by default

---

## What Prism Does

Prism maps verified policy and performance evidence to user priorities, then explains alignment, trade-offs, and uncertainty.

A user can say: *"Rent is rising, NHS access is worse, and I don't trust campaign promises."*  
Prism turns that into structured issues, researches public evidence, and returns a balanced, sourced explainer — not a verdict.

---

## What Prism Must Never Do

- Tell users how to vote
- Profile them secretly
- Optimise for a political outcome
- Present contested claims as settled facts

---

## How It Works

```
Layer A — Local Assistant
  Runs on phone or desktop. Captures priorities and concerns.
  Processes on-device. Only uploads sanitized, permissioned summaries.

Layer B — Distributed Ingestion Network
  Public-source crawlers, claim extractors, deduplication workers.
  Evidence indexers run across multiple nodes and regions.

Layer C — Verification & Transparency
  Independent verifier nodes re-run analysis, validate source hashes.
  Results published to an append-only, public transparency log.

Layer D — Delivery
  APIs and website: explainers, alignment views, issue maps,
  methodology pages, and public dashboards.
```

## UK Country Mind Dev Status

The repo currently includes a pre-alpha UK Country Mind backend under [`src/prism_country_mind`](/home/barabonc/.openclaw/workspace/projects/prism/src/prism_country_mind).

Current local capabilities include:
- deterministic refresh and signed evidence-pack generation from the UK source registry
- read APIs for health, topics, packs, pack explainers, and transparency-log access
- read-only CLI commands for listing packs, showing a pack, and filtering transparency-log entries

Developer runbook: [`docs/COUNTRY_MIND.md`](/home/barabonc/.openclaw/workspace/projects/prism/docs/COUNTRY_MIND.md)

---

## Website Phase 1

The repo now includes a standalone website app under [`website`](/home/barabonc/.openclaw/workspace/projects/prism/website).

- Stack: Next.js 15 App Router + Tailwind CSS
- Current scope: public homepage, living-network visual placeholder, stats bar, how-it-works explainer, contribution links
- Privacy posture: no cookies, no analytics, no tracking code

Run locally:

```bash
cd website
npm install
npm run dev
```

Stats data defaults to a bundled mock snapshot. Set `PRISM_STATS_ENDPOINT` to point the site at a future heartbeat/node API. If the live endpoint fails, the site falls back to mock data and labels that state clearly.

Website-specific notes: [`website/README.md`](/home/barabonc/.openclaw/workspace/projects/prism/website/README.md)

---

## Country Chapter Model

Prism is **internationally governed but locally operated.**

- The **core team** maintains the protocol, node software, security, and the core alignment algorithm
- **Country chapters** are self-organised by people living in that country — they own and operate their local data pipelines, source registries, and regional nodes
- The **international node network** provides resilience, verification, and security — contributed by the community
- No central authority decides what counts as a credible local source — the local community does

### To Start a Country Chapter

1. Fork the `prism-country-pack` template (coming soon)
2. Define your approved source registry (parliamentary records, national statistics, party manifestos, etc.)
3. Set up at least one Collector node and one Verifier node
4. Apply to join the international node network
5. Maintain and update your source registry as elections and policies change

---

## Node Network

The node system is **opt-in, role-based, and layered.**

| Role | Purpose | Trust Level |
|------|---------|-------------|
| Collector | Fetches and normalises public sources | Low → Medium |
| Verifier | Re-runs analysis to confirm reproducibility | Medium → High |
| Archive | Stores source snapshots for resilience | Low |
| Analytics | Runs trend aggregation and statistics | Medium |
| Regional | Country/language-specific collection and verification | Medium → High |

Nodes **cannot** write to canonical scoring rules, user profiles, or final outputs. Their power is to contribute and verify — not to silently alter the system.

---

## Identity & Trust

Prism uses **layered trust**, not invasive identity collection.

- **Layer 1:** Standard app account with device binding
- **Layer 2:** Regional confidence estimated from language, timezone, and location consent
- **Layer 3:** Optional verified citizen path for contributors who want higher-weight input
- **Layer 4:** Node operator trust tier — stronger verification required for Collector and Verifier roles

The goal is to reduce botting and coordinated manipulation — not to build a surveillance database.

---

## Transparency & Donations

All financial activity will be managed through **Open Collective**, where every donation and expense is publicly visible.

- Funds go toward infrastructure, security audits, and supporting country chapter onboarding
- Nothing is hidden. Ever.

---

## Governance

Prism is designed to be **community-governed** over time:

- **Founding phase:** Core protocol and algorithm defined by founder(s) and early contributors
- **Growth phase:** Elected steering group representing country chapters and node operators
- **Mature phase:** Formal open governance model (details TBD with the community)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Political backlash | Radical neutrality + transparency; open algorithm |
| Data poisoning | Multi-source validation; verifier node network |
| Loss of trust | Always show uncertainty; never claim certainty |
| Source capture | Country chapters control their own source registries |
| Funding pressure | Donation-only; traceable via Open Collective |
| Coordinated manipulation | Slow-moving reputation scores; behavioral detection |

---

## Roadmap (High Level)

### Phase 1 — Foundation
- [ ] Finalise open source licence
- [ ] Publish core protocol specification
- [ ] Build core alignment algorithm (open source)
- [ ] Launch transparency log format
- [ ] UK pilot: first country chapter

### Phase 2 — Community
- [ ] Open country chapter application process
- [ ] Node software released (Collector + Verifier)
- [ ] Open Collective donation page live
- [ ] First external contributors onboarded

### Phase 3 — Scale
- [ ] Multi-country comparative analysis
- [ ] Economic simulation / policy impact forecasting
- [ ] Open research platform for civic intelligence
- [ ] Elected steering group established

---

## Contributing

Prism grows by word of mouth and community contribution. If you believe in the mission:

- **Build:** contribute to the core protocol or country packs
- **Verify:** run a node in your region
- **Translate:** help localise the interface and documentation
- **Spread:** share it with people who value clarity over noise

---

## Founding Documents

The original steering briefs from March 2026 are preserved as historical reference in [`docs/archive/founding-briefs/`](docs/archive/founding-briefs/).

They are not the current source of truth. Current authoritative documentation lives in the markdown files in `docs/` and root files such as `ROADMAP.md`, `DECISIONS.md`, and `CONTRIBUTING.md`.

---

*Prism is built on the belief that if people trust it is honest, it will grow. If they doubt it, it will fail. Honesty is the only strategy.*
