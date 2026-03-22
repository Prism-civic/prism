# Local Intelligence — The Edge Tier Explained

*Version 1.0 — March 2026*

---

## The Core Question

Why run an AI model on the phone at all? The country mind is more powerful. The world mind is more capable. Why put anything on the edge?

**One word: privacy.**

Everything the local model processes stays on your device. Your reading habits, your civic priorities, your location, your questions — none of it leaves unless you explicitly choose to contribute it. And when you do contribute, only a sanitised, permissioned summary goes upstream. Not your raw data.

This is structurally different from every other news and civic platform. Facebook, Google News, Apple News, Spotify for Podcasts — they all know your behaviour because their algorithms run on their servers. Prism's personalisation runs on yours.

---

## What the Local Model Actually Does

### 1. Private personalisation

The country mind sends a batch of 60–100 articles, evidence packs, and civic briefings to your phone every sync. The local model re-ranks them using a preference profile stored only on your device. It knows you care about housing more than foreign affairs, that you live in Bedford, and that you've flagged three local candidates as interesting. The country mind does not know any of this.

**The ranking is not decided by an algorithm controlled by Prism, a government, or an advertiser. It is decided by a model running privately on your hardware.**

### 2. Local synthesis — your briefing, not the national one

The country mind processes national news. The local model synthesises it for you. Given:
- Your location (Bedford, UK)
- The national news batch
- The Bedford RSS items mixed in
- Your priority profile

It produces: *"Here's what matters in Bedford this week — and how it connects to what's happening nationally."*

That synthesis requires knowing who you are and where you are. Because that runs locally, no server ever needs to know either.

### 3. Offline civic queries

You are on the Tube with no connection. You tap: *"What is my MP's record on housing?"*

The local model answers from last night's sync cache — evidence packs the country mind prepared and delivered. No round-trip. No network. No privacy cost.

Without the local model, this requires a cloud API call. With it, you have a knowledgeable civic assistant in your pocket regardless of connectivity.

### 4. Constituency-level contextualisation

A national news story arrives about a planning bill. The country mind knows the bill. The local model knows you're in Bedford South. It says: *"This bill directly affects the A421 corridor — your constituency debated this in the last council session."*

That connection is made locally, privately, without a server knowing your postcode.

---

## What the Local Model Does NOT Do

| Task | Why it stays upstream |
|---|---|
| Scrape sources | Network task, no intelligence needed |
| Generate alignment scores | Requires full country evidence base |
| Process large evidence sets | Too large for edge inference |
| Reason over multi-document policy | Country mind's job |
| Access the internet directly | All data arrives via sync |

The local model is not a mini country mind. It is a private interface layer — it understands you, presents information intelligently, and answers questions from pre-loaded evidence. Heavy lifting stays upstream.

---

## The Local Node — A Separate Concept

Beyond the phone, there is an optional **local node** — a volunteer-run server in a town, city, or neighbourhood.

This is not an LLM. This is a lightweight scraper and aggregator.

**What it does:**
- Scrapes genuinely hyperlocal sources: council planning portals, parish meeting minutes, community forums, local charity registers, local crime statistics
- Summarises and indexes this content (optionally using a small model, but often just structured parsing)
- Contributes hyperlocal intelligence *upward* to the country mind

**Why this matters:**

BBC Local RSS is good. But it doesn't cover the Bedford Borough Council planning application for the site on the edge of town, or the school that just received a damning Ofsted report, or the pothole that's been logged 400 times.

That genuinely hyperlocal intelligence can only exist if someone local maintains it. Prism's local node model means any volunteer with a spare Raspberry Pi or home server can become the civic intelligence source for their town — contributing to a network that serves everyone.

The country mind aggregates it. The phone's local model personalises it. The user sees it without revealing their identity to anyone.

---

## Architecture Summary

```
WORLD MIND (frontier reasoning — cross-country synthesis)
    ↕
COUNTRY MIND (national intelligence — evidence packs, alignment scores)
    ↕ sync
COUNTRY MIND RSS FETCH (national + BBC Local + international RSS — no LLM)
    ↕
LOCAL NODE (volunteer-run — hyperlocal scraping, council portals, community data)
    ↕
PHONE — LOCAL MODEL (private — re-ranks, synthesises, answers offline queries)
    ↓
USER (sees personalised feed — no server ever saw their preferences)
```

### Data flows

| Data | Direction | Who sees it |
|---|---|---|
| Evidence packs (national) | Country mind → phone | Country mind sends; phone receives |
| BBC Local RSS items | Country mind → phone | Country mind fetches; phone receives |
| Hyperlocal items | Local node → country mind → phone | Country mind aggregates; phone receives |
| User preference profile | Phone only | Nobody but the device |
| Reading behaviour | Phone only | Nobody but the device |
| Location (city/town) | Phone only | Nobody but the device |
| Ranked/personalised feed | Computed on phone | Nobody but the device |
| Civic query answers | Computed on phone from cache | Nobody but the device |
| Optional: anonymised concern cluster | Phone → country mind | Permissioned, aggregated, no personal data |

---

## The Privacy Guarantee

Prism's local intelligence layer exists specifically so that:

1. **No server ever sees what you read**
2. **No server ever knows your civic priorities**
3. **No server ever knows your location** (unless you contribute to a local node)
4. **Personalisation cannot be sold, hacked, or subpoenaed** — because it doesn't exist anywhere but your device

This is not a privacy policy. It is an architectural guarantee. You cannot extract data that is never collected.

---

## Model Candidates for the Phone (Edge Tier)

| Model | Size | Strengths |
|---|---|---|
| Llama 3.2 3B | 3B | Best multilingual support, proven on benchmarks |
| Phi-4 Mini | 3.8B | Strong structured reasoning, Microsoft |
| Gemma 3 1B | 1B | Ultra-lightweight for low-end devices |
| Qwen 2.5 3B | 3B | Strong on structured output |

**Current MVP baseline:** Llama 3.2 3B (benchmarked March 2026 — see `docs/EDGE_MODEL_BENCHMARK_RESULTS.md`)

The model runs fully on-device. No API call. No inference cost to Prism. No vendor dependency.

---

## Roadmap

| Phase | What ships |
|---|---|
| Phase 1 (now) | Country mind feeds pre-ranked items to app. Local model placeholder. |
| Phase 2 | Local model re-ranks feed on device. Offline Q&A from evidence cache. |
| Phase 3 | Local synthesis — personalised briefing generated on device. |
| Phase 4 | Local node reference implementation — Raspberry Pi runbook. |
| Phase 5 | Local node network — community-maintained hyperlocal intelligence. |
