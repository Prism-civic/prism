# Prism Hungary Pilot — Phase HU-0

*Decision date: 2026-03-21*
*Election date: 12 April 2026 (22 days)*
*Decision: D-015 — Hungary as first Prism pilot*

---

## Why Hungary

- **April 12 2026** — Hungarian parliamentary election, described by Politico Europe as *"the EU's most important election of 2026"*
- **Fidesz vs TISZA** — Orbán's fourth-term government vs Péter Magyar's new challenger party. High public interest, high controversy, media landscape dominated by state-aligned outlets
- **106 single-member constituencies + national lists** — bounded, mappable, completable in scope
- **Viktor has personal connections** — irreplaceable for grassroots spread and beta testing
- **Small enough to do properly** — ~10M population, 199 seats total

If Prism helps Hungarian voters cut through noise in this election, that's the proof-of-concept that opens every door.

---

## Electoral System (for reference)

- **199 total seats**
- **106 seats** — single-member constituencies (OEVK), first-past-the-post
- **93 seats** — national party lists
- **Threshold:** 5% for single parties, 10% for two-party coalitions, 15% for three+
- **Main contenders:** Fidesz–KDNP (incumbent), TISZA (Magyar), Mi Hazánk (Toroczkai), DK (Dobrev), MKKP (Two-Tailed Dog Party)
- **Current polls:** TISZA ~96 seats, Fidesz–KDNP ~90 seats, Mi Hazánk ~13 seats

---

## What We Build (Web-First)

### The product for April 12
A Hungarian-language web tool at `prism-sooty-chi.vercel.app/hu` (or a subdomain):

1. **Constituency lookup** — enter postcode or select county → see who is running in your OEVK
2. **Candidate profiles** — name, party, key policy positions, voting record where available, party affiliation history
3. **Party comparison** — side-by-side on key issues: housing, healthcare, education, EU relations, rule of law
4. **Evidence cards** — sourced, factual, no editorial spin
5. **"What does this mean for me?"** — plain-language explainer for each constituency race

**No app required.** Fully functional in a browser. Shareable links per constituency.

---

## Phase HU-0 Work Plan (This Week)

### Day 1-2 — Data foundation
- [ ] Scrape/compile all 106 OEVK (single-member constituencies): name, number, county, main town
- [ ] Source: `vtr.valasztas.hu/ogy2026` (official NVI database) + Telex interactive map
- [ ] Compile confirmed candidate nominations per constituency (NVI publishes official lists)
- [ ] Build a structured JSON data file: `data/hungary/constituencies.json`
- [ ] Build party registry: `data/hungary/parties.json` (name, ideology summary, leader, key positions)

### Day 3-4 — Candidate profiles
- [ ] For each constituency: confirmed candidates with party affiliation
- [ ] For incumbent MPs: voting record summary (parliament.hu records)
- [ ] For new candidates: biography stub from party sources
- [ ] Key positions: extract from party manifestos (all publicly available)
- [ ] Source everything — no unsourced claims

### Day 5-6 — Web tool build
- [ ] Add `/hu` route to existing Next.js website
- [ ] Hungarian-language UI (i18n layer — `next-intl` or simple JSON strings)
- [ ] Constituency search by county dropdown + postcode lookup
- [ ] Candidate profile cards
- [ ] Party comparison table
- [ ] Mobile-first (most Hungarian users on phones)
- [ ] No cookies, no tracking (Prism principle)

### Day 7 — Test + soft launch
- [ ] Viktor tests with Hungarian contacts
- [ ] Fix issues
- [ ] Soft launch to Viktor's network

---

## i18n Architecture

Both the website and future app need Hungarian from day one. Plan:

**Website (Next.js):**
- Use `next-intl` — minimal setup, file-based translations
- `messages/en.json` and `messages/hu.json`
- Route structure: `/` (English), `/hu/` (Hungarian)
- Language switcher in header (🇬🇧 / 🇭🇺)

**App (React Native / Expo):**
- Use `expo-localization` + `i18n-js`
- Same translation key structure as website for consistency
- Auto-detect device language, allow manual override in Settings

**Translation approach for now:**
- Atlas drafts Hungarian strings (native-level quality check needed from Viktor/contacts)
- Viktor reviews key civic terminology before publish

---

## Data Sources

| Source | What it provides |
|---|---|
| `vtr.valasztas.hu/ogy2026` | Official candidate registrations, constituency maps |
| `parlament.hu` | MP voting records, parliamentary activity |
| `valasztas.hu` | Official electoral commission data |
| `telex.hu` constituency map | Verified constituency/candidate data (independent media) |
| Party websites | Manifestos, candidate bios |
| Wikipedia HU | Incumbent MP histories |

**Important:** All data sourced and attributed. No inference about positions not publicly stated.

---

## Constraints & Honesty

- **22 days to election** — we build what is genuinely useful, not what looks impressive
- **We are not a polling tool** — we show records and positions, not predictions
- **No editorial stance** — Prism does not say who to vote for
- **Incomplete data is shown as incomplete** — never filled with inference
- **Hungarian civic terminology is precise** — Viktor reviews before publish

---

## Success Definition

By April 10 (2 days before the vote):
- All 106 constituencies have at least: candidate names, party affiliation, one sourced position per major party
- The web tool is live, mobile-friendly, and shareable
- At least 5 Hungarian contacts have tested and confirmed it's useful
- Zero factual errors reported

That is the bar. Everything else is a bonus.

---

## Decision Log Reference
- D-015: Hungary as first Prism pilot — April 2026 election, web-first
- D-016: i18n architecture — next-intl (website), expo-localization (app), EN+HU from launch

---

## Next Steps
1. Atlas begins constituency data compilation (Day 1)
2. Viktor provides contacts for beta testing
3. Claude Code builds `/hu` route and i18n layer (Day 5)
4. Viktor reviews Hungarian copy before publish
