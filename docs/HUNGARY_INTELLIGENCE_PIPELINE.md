# Hungary Intelligence Pipeline

*Drafted: 2026-03-21*
*Election: 2026-04-12 (22 days)*

This document defines the multi-source intelligence system for the Hungary 2026 pilot.
All data is public. All sources are attributed. No inferred or synthetic data.

---

## Architecture

```
Sources (raw)
    │
    ▼
Scrapers (per-source, idempotent, scheduled)
    │
    ▼
data/hungary/intelligence/
    ├── parliament/         ← voting records, attendance, declarations
    ├── media/              ← press mentions, investigations
    ├── atalatzo/           ← corruption watchdog reports
    ├── court/              ← public judgments involving candidates
    └── candidates/         ← merged per-candidate intelligence profiles
    │
    ▼
Weighting engine (score.py)
    │
    ▼
data/hungary/scored-candidates.json   ← powers the /hu web route
```

---

## Sources & Weights

### Tier 1 — Foundational (identity, affiliation)
| Source | What | Weight | Notes |
|--------|------|--------|-------|
| NVI (vtr.valasztas.hu) | Official registration, party, constituency | N/A | Identity layer — not scored, always shown |
| parlament.hu | MP voting records (2018–2026) | High | Only for incumbents |
| parlament.hu | Parliamentary attendance | Medium | Incumbents only |
| parlament.hu | Asset declarations | Medium | Public record since 2012 |

### Tier 2 — Track Record (incumbents)
| Source | What | Weight | Notes |
|--------|------|--------|-------|
| parlament.hu/kepviselo | Voting record summary by topic | High | 8 topic categories |
| parlament.hu/kepviselo | Committee memberships | Low | Context only |
| parlament.hu | Bills authored / co-signed | Medium | Legislative activity |
| mkogy.hu open data | Full vote-by-vote record (XML/CSV available) | High | Machine-parseable |

### Tier 3 — Public Record (all candidates)
| Source | What | Weight | Notes |
|--------|------|--------|-------|
| Átlátszó (atlatszo.hu) | Investigative reporting on candidates | High | Corruption-focused |
| 444.hu | Investigative journalism | High | Independent |
| Telex.hu | News coverage | Medium | Independent |
| HVG.hu | News coverage | Medium | Independent |
| Bírósági határozatok (birosag.hu) | Public court judgments | High | Public domain |
| Céginfo / e-cegjegyzek | Business registry — company directorships | Medium | Public registry |
| Közbeszerzési Hatóság | Public procurement contracts | High | Official, machine-readable |

### Tier 4 — Party Context (all candidates via party)
| Source | What | Weight | Notes |
|--------|------|--------|-------|
| Party manifestos (all 5 parties) | Policy positions | Medium | Already in parties.json |
| Party websites | Candidate bios | Low | Often promotional |
| Wikipedia (HU) | Incumbent biographies | Low | Secondary source |

### Out of scope (this pilot)
- Social media scraping (ToS violations, unreliable, defamation risk)
- Police / criminal records (not publicly accessible under Hungarian law)
- Leaked documents (not appropriate for Prism v1)
- Polling/survey data (we show records, not predictions)

---

## Scoring Model

### What we score (per candidate)
Each dimension gets a score from 0–100 (higher = better civic record) and a confidence level (high/medium/low/none).

```
transparency_score:
  - Asset declaration filed on time: +20
  - Business interests declared (none): +10
  - No public procurement conflicts found: +20
  - Source count: confidence indicator

accountability_score (incumbents only):
  - Parliamentary attendance rate: 0–30
  - Voted with official party line % vs. constitution: 0–20
  - Bills/motions authored: 0–20
  - Questions/interpellations filed: 0–20
  - Committee attendance: 0–10

press_record_score:
  - Investigative journalism mentions: -5 per confirmed investigation
  - Court proceedings (public): -10 per case
  - Átlátszó mentions: -15 per investigation (weighted high — they are rigorous)
  - No press record: neutral (not scored)

evidence_count: total sourced items attached to candidate profile
```

### Composite display
We do NOT show a single "trust score". We show:
- Individual dimension scores with source counts
- A "Prism evidence card" per dimension
- Explicit confidence levels
- "No data found" is shown honestly, not hidden

This is the Prism principle: **radical transparency over convenient simplicity**.

---

## Data Collection Plan

### Phase 1 — NVI (DONE ✅)
- [x] `data/hungary/candidates.json` — 666 active candidates, 106 constituencies
- [x] Raw NVI JSON files archived in `data/hungary/nvi-raw/`
- [x] Refresh detection via `/ogy2026/data/config.json` (ver field)

### Phase 2 — Parliament records (incumbent MPs)
Target: all incumbent MPs running again (~80–90 of 106 Fidesz-KDNP candidates)

**Source A: parlament.hu/kepviselo/{id}**
- Individual MP pages have voting record, attendance, committee roles
- Structured data available via official open data API (mkogy.hu)

**Source B: mkogy.hu open data**
- Full voting records in machine-readable format
- URL pattern: `https://www.mkogy.hu/nyilvanossag/adat/szavazasi-adatok`

Script: `scripts/scrape-parliament.py`
Output: `data/hungary/intelligence/parliament/{candidate_id}.json`

### Phase 3 — Átlátszó scrape
Target: search all 666 candidate names against Átlátszó's search

**Source: atlatszo.hu/search?q={name}**
- Investigative journalism archive
- Filter for articles mentioning candidate name in investigative context
- Extract: article title, date, summary, URL, tags

Script: `scripts/scrape-atalatzo.py`
Output: `data/hungary/intelligence/media/atalatzo/{candidate_id}.json`

### Phase 4 — Independent media (Telex, 444, HVG)
Target: all major candidates (top parties, incumbents first)

**Sources:**
- Telex: `telex.hu/kereses?q={name}`
- 444.hu: `444.hu/cimke/{name-slug}` or search
- HVG: `hvg.hu/search/?q={name}`

Script: `scripts/scrape-media.py`
Output: `data/hungary/intelligence/media/{source}/{candidate_id}.json`

### Phase 5 — Business registry
Target: all candidates

**Source: e-cegjegyzek.hu**
- Company directorships are public record in Hungary
- Search by name → extract company roles, dates, sectors

Script: `scripts/scrape-business-registry.py`
Output: `data/hungary/intelligence/business/{candidate_id}.json`

### Phase 6 — Public procurement
Target: all candidates + their party/associated companies

**Source: ekr.gov.hu (Elektronikus Közbeszerzési Rendszer)**
- Public procurement contracts searchable
- High weight — direct public money connection

Script: `scripts/scrape-procurement.py`
Output: `data/hungary/intelligence/procurement/{candidate_id}.json`

### Phase 7 — Public court judgments
Target: incumbents + flagged candidates

**Source: birosag.hu/ugykereso**
- Public court judgment database
- Only final judgments that are public record
- Filter: civil + criminal cases only (not administrative)

Script: `scripts/scrape-courts.py`
Output: `data/hungary/intelligence/court/{candidate_id}.json`

---

## Refresh Schedule

The NVI data updates at 17:00 daily. Poll `config.json` ver field.
Media scrapes: run once per day during the campaign period.
Parliament data: static (parliament is not in session during campaign).

---

## Anti-Patterns (what we explicitly avoid)

1. **Never infer** a position not publicly stated
2. **Never aggregate** unverified social media claims
3. **Never show** incomplete investigations as confirmed findings
4. **Never suppress** "no data found" — show it explicitly
5. **Never score** without a source citation
6. **Rate-limit** all scrapers — no aggressive crawling
7. **robots.txt** — respect all robots.txt files

---

## File Conventions

```
data/hungary/intelligence/
  parliament/
    {kpn_id}.json        ← keyed on NVI kpn_id
  media/
    atalatzo/
      {kpn_id}.json
    telex/
      {kpn_id}.json
    444/
      {kpn_id}.json
    hvg/
      {kpn_id}.json
  business/
    {kpn_id}.json
  procurement/
    {kpn_id}.json
  court/
    {kpn_id}.json

Each file schema:
{
  "kpn_id": 123456,
  "candidate_name": "KOVÁCS JÁNOS",
  "source": "atlatszo.hu",
  "scraped_at": "2026-03-21T18:00:00Z",
  "items": [
    {
      "title": "...",
      "url": "...",
      "date": "YYYY-MM-DD",
      "summary": "...",
      "tags": ["corruption", "public-procurement"],
      "confidence": "high|medium|low"
    }
  ]
}
```
