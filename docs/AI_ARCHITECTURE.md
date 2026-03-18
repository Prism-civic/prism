# Prism AI Architecture

*Version 0.1 — Founding Document — March 2026*

---

## Design Philosophy: Reasoning Over Evidence, Not Generating Opinion

The AI in Prism is not a chatbot. It does not generate opinions. It does not speculate freely. It reasons over a verified evidence base and explains what it finds — including what it cannot find.

Every AI output in Prism is:
- **Grounded** — tied to a specific source or evidence pack
- **Bounded** — constrained by the evidence base, not free generation
- **Auditable** — traceable back to the exact sources and reasoning steps
- **Honest** — uncertainty is surfaced, not smoothed over

The architecture is **Retrieval-Augmented Generation (RAG)** at every tier. The model retrieves verified evidence packs, reasons over them, and returns structured explainers. It does not generate from parametric knowledge alone.

---

## Three-Tier Intelligence Architecture

```
┌──────────────────────────────────────────────────────┐
│  TIER 3 — WORLD MIND                                  │
│  Frontier-class reasoning                             │
│  Cross-country synthesis, geopolitical analysis,      │
│  international law interpretation                     │
│  Multiple redundant nodes, multi-provider routing     │
├──────────────────────────────────────────────────────┤
│  TIER 2 — COUNTRY MIND                                │
│  Mid-tier reasoning                                   │
│  National evidence processing, alignment scoring,     │
│  local explainer generation, claim extraction         │
│  Multiple nodes per country, peer-assisted            │
├──────────────────────────────────────────────────────┤
│  TIER 1 — PHONE (LOCAL)                               │
│  Edge model                                           │
│  Intent extraction, concern structuring,              │
│  evidence pack summarisation, basic Q&A               │
│  Fully offline capable, private by design             │
└──────────────────────────────────────────────────────┘
```

---

## Tier 1 — The Phone Brain

### Role
The phone model is the **interface intelligence** — not the analytical brain. It understands the user, structures their concern, and presents results in plain language. Heavy reasoning happens upstream.

### Responsibilities
- Parse natural language concerns into structured topics and priorities
- Show the user the extracted interpretation before anything is sent upstream
- Summarise pre-fetched evidence packs into readable explainers
- Answer follow-up questions using cached evidence packs (no network required)
- Manage the local values profile and priority weighting
- Honest about its limits — escalates to country mind when needed

### Model Candidates
| Model | Size | Notes |
|-------|------|-------|
| Phi-4 Mini | 3.8B | Microsoft, excellent reasoning per parameter, good for structured tasks |
| Gemma 3 1B | 1B | Google, extremely lightweight, runs on low-end phones |
| Llama 3.2 3B | 3B | Meta, strong multilingual support — good for non-English countries |
| Qwen 2.5 3B | 3B | Strong on structured output and reasoning |

**Recommended starting point:** Phi-4 Mini for English-language pilot (UK), Llama 3.2 3B for multilingual expansion.

### What the Phone Model Does NOT Do
- Reason over large evidence sets (too slow, too large for edge)
- Generate alignment scores (requires country-specific context)
- Access the internet directly
- Store or process raw user data in any networked form

### Offline Capability
The phone must work without a network connection. It operates on cached evidence packs from the last sync. It clearly indicates when data is stale:
*"Based on evidence last updated 3 days ago."*

If no evidence packs are cached and no network is available, it shows honestly:
*"No data available. Connect to sync."*

---

## Tier 2 — The Country Mind Brain

### Role
The country mind is the **analytical engine** for national civic intelligence. It processes raw sources, extracts claims, scores alignment, and generates structured explainers that the phone can present to users.

### Responsibilities
- Ingest and process national sources (parliamentary records, manifestos, voting histories, official statistics)
- Extract and classify claims (promises, factual assertions, forecasts, opinions)
- Score source reliability and claim confidence
- Generate policy vectors for parties and candidates
- Compute alignment scores against user priority profiles
- Produce structured evidence packs (cached, versioned, signed)
- Serve explainer requests from phone apps
- Sync issue clusters and evidence packs with world mind nodes
- Participate in cross-country assistance when capacity allows

### Model Requirements
The country mind needs genuine reasoning capability — nuanced policy analysis, claim classification, and multi-document synthesis. A capable mid-tier model is required.

**Options:**

**Self-hosted (preferred for independence):**
| Model | VRAM Required | Notes |
|-------|-------------|-------|
| Llama 3.3 70B | ~40GB (2x RTX 3090) | Strong reasoning, fully open weights |
| Qwen 2.5 72B | ~40GB | Excellent multilingual, strong structured output |
| Mistral Large 2 | ~40GB | Strong European language support |
| Llama 4 Scout | ~20GB (estimated) | Next-gen, smaller footprint expected |

**API fallback (when self-hosting not available):**
| Provider | Model | Notes |
|----------|-------|-------|
| Anthropic | Claude Haiku 3.5 | Fast, cost-efficient, strong reasoning |
| Google | Gemini 2.0 Flash | Excellent multilingual, low latency |
| OpenAI | GPT-4o Mini | Reliable fallback |

**Abstraction layer is mandatory** — the country mind calls a model interface, never a specific provider. Swap without code changes.

### Evidence Processing Pipeline
```
Raw Source
    ↓
Fetch + Hash (snapshot stored immutably)
    ↓
Deduplication + Clustering
    ↓
Entity Extraction (parties, candidates, policies, regions, dates)
    ↓
Claim Extraction + Classification
    ↓
Evidence Linking (supporting / disputing / contextual)
    ↓
Trust Scoring (source reliability + claim confidence)
    ↓
Policy Vector Generation
    ↓
Evidence Pack (signed, versioned, cached)
    ↓
Transparency Log Entry
```

### Multiple Minds, Same Country
Each country should target **at least 2–3 country mind nodes**. These are fully interchangeable — identical software, identical source registry, identical evidence packs (synced continuously).

Benefits:
- **Resilience:** one goes down, others absorb instantly
- **Verification:** nodes independently process sources and compare outputs — divergence is flagged and investigated
- **Load distribution:** high-traffic events (elections, major news) are distributed across nodes
- **Geographic distribution:** different legal jurisdictions reduce single-country legal risk

Running multiple minds of the same country on different continents is explicitly encouraged.

---

## Tier 3 — The World Mind Brain

### Role
The world mind is the **synthesis and geopolitical intelligence layer**. It holds no opinions. It reasons over international evidence to produce cross-country context that country minds cannot generate alone.

### Responsibilities
- Maintain and reason over the international law corpus
- Map foreign policy positions across all connected countries
- Generate cross-border comparisons (policy, outcomes, spending)
- Synthesize multiple country perspectives on international questions
- Provide geopolitical context to country minds on request
- Enforce humanitarian baseline compliance across the network
- Maintain the global transparency log aggregation

### The Multi-Perspective Advantage
This is Prism's most powerful capability.

When an international question arises (a conflict, a trade dispute, a migration crisis), the world mind can:
1. Retrieve the official position of every connected country
2. Retrieve independent evidence from international organisations
3. Surface the areas of genuine consensus
4. Surface the areas of genuine disagreement — with evidence for each position
5. Apply international law context
6. Present the full picture with honest uncertainty bounds

No single government, media outlet, or institution can do this. The more country minds that connect, the more accurate and complete the world picture becomes.

### Model Requirements
The world mind requires **frontier-class reasoning** — deep multi-document synthesis, legal reasoning, cross-language analysis, nuanced geopolitical interpretation.

**Current reality: API-dependent in the near term.**

| Provider | Model | Notes |
|----------|-------|-------|
| Anthropic | Claude Sonnet / Opus | Deep reasoning, strong for legal/policy text |
| Google | Gemini 2.5 Pro | Excellent long-context, strong multilingual |
| OpenAI | GPT-4o | Reliable, wide language support |

**Multi-provider routing is mandatory from day one.** The world mind never depends on a single API provider. Requests are routed across providers based on availability, cost, and task type. If one provider refuses a request or goes offline, others absorb it transparently.

### Independence Roadmap
API dependency is a known risk. The migration path:

**Phase 1 (now — 2026):** API-dependent, multi-provider routing, no single point of failure
**Phase 2 (2026–2027):** Test self-hosted 70B models for world mind tasks — evaluate quality gap
**Phase 3 (2027+):** As open weights models mature (Llama 4+, future Mistral, Qwen 3), migrate world mind inference to community-contributed compute
**Goal:** Full independence from proprietary API providers by 2028

### Multiple World Minds
Same principle as country minds — minimum three world mind nodes, geographically distributed:
- Different continents (e.g. Europe, North America, Asia-Pacific)
- Different legal jurisdictions
- Different hardware providers
- Continuously synced — fully interchangeable

A world mind taken offline by legal pressure in one country does not affect the others. The network continues.

---

## The RAG Architecture

At every tier, the model reasons over retrieved evidence — it does not generate freely.

```
User Query / System Request
    ↓
Query Analysis (intent, topics, country, timeframe)
    ↓
Evidence Retrieval (vector search over evidence packs)
    ↓
Context Assembly (relevant packs + international context + uncertainty flags)
    ↓
Bounded Reasoning (model reasons ONLY over assembled context)
    ↓
Structured Output (claims, confidence, sources, uncertainty, alternatives)
    ↓
Transparency Record (query hash + evidence refs + model version logged)
```

**The model cannot introduce facts not present in the evidence base.** If it attempts to, the output is flagged as unsupported and the fact is excluded. This is enforced at the output parsing layer, not by hoping the model behaves.

---

## Caching Strategy

Intelligence is expensive. Cache aggressively.

| Content Type | Cache Duration | Invalidation |
|-------------|---------------|-------------|
| Historical policy positions | 30 days | Source update |
| Voting records | 90 days | New session/vote |
| Manifesto analysis | Until new manifesto | New manifesto published |
| Current polling / statistics | 24 hours | New data release |
| Breaking news context | 1 hour | Continuous |
| International law corpus | 7 days | Amendment/ruling |
| Alignment scores | 7 days | Source update |

When 1,000 users ask about the same policy, the country mind computes once and serves the cached evidence pack to all. This reduces inference costs dramatically and makes the system scalable on modest hardware.

---

## Model Independence Layer

The abstraction that makes Prism independent of any single AI provider.

```python
# Every tier calls this interface — never a specific model
response = prism_reason(
    task="alignment_scoring",
    context=evidence_packs,
    query=user_query,
    tier="country",
    constraints=humanitarian_baseline_rules
)
```

The router behind this interface:
1. Selects the best available model for the task and tier
2. Falls back automatically if a provider is unavailable
3. Logs which model was used (transparency)
4. Can be swapped from API to self-hosted with zero application code changes

---

## Humanitarian Baseline Enforcement

The AI layer has one hard constraint above all others: the Humanitarian Charter.

At every tier, before any output is returned:
1. Output is checked against the humanitarian baseline rules
2. Any output that violates the rules is blocked — not modified, blocked
3. The block is logged to the transparency record
4. The user or requesting node receives: `"Output blocked: humanitarian baseline"`

This check runs at the **application layer**, not inside the model. It cannot be bypassed by clever prompting. The model does not decide whether to apply it — the application always does.

---

## Cost Projections (Early Stage)

| Stage | Users | Est. Monthly Inference Cost |
|-------|-------|---------------------------|
| Pilot (UK only, 50 users) | 50 | ~€20–50 (mostly cached) |
| Early (3 countries, 500 users) | 500 | ~€200–500 |
| Growth (10 countries, 5,000 users) | 5,000 | ~€1,000–3,000 |
| Scale (50 countries, 50,000 users) | 50,000 | ~€5,000–15,000 (aggressive caching) |

Aggressive caching, especially for common policy queries, keeps costs far below naive per-query pricing. The goal is one inference serves thousands of users on the same topic.

---

## Summary: What Makes This Different

Most AI systems are black boxes. Prism is not.

- **Every output is sourced** — you can trace any claim to its origin
- **Uncertainty is first-class** — the system tells you when it doesn't know
- **The model is interchangeable** — no vendor lock-in, no single point of failure
- **Reasoning is bounded** — the AI cannot introduce facts that aren't in the evidence base
- **The network is self-healing** — if a node goes dark, others compensate
- **The brain scales with the community** — more country minds means better world mind outputs

The intelligence grows as the network grows. The more people who build country minds, the more accurate the world picture becomes. This is the core value proposition: **collective civic intelligence that no single institution can replicate or capture.**
