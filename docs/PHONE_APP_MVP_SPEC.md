# Phone App MVP Spec

*Version 0.1 — Implementation handoff — March 2026*

## Purpose

This document turns the app vision into a buildable Phase 1 mobile product.

The MVP is not trying to prove the full Prism philosophy in one release. It only needs to prove four things:

1. A user can onboard quickly and understand what Prism is
2. Prism can build a transparent, editable local interest profile
3. Prism can deliver a useful daily brief from country-mind evidence packs
4. The app can feel alive and trustworthy without becoming noisy or manipulative

## MVP Outcome

A user installs Prism, completes onboarding in under 4 minutes, receives a calm morning brief, reads cached evidence offline, sees a visible connection to the network through the pulse orb, and can inspect or edit what the app believes they care about.

## Scope

### In scope for MVP
- React Native app for iOS and Android
- Local-first onboarding flow
- Editable interest profile
- Morning brief from country-mind evidence packs
- Pulse orb with network states
- Offline reading of cached brief + evidence packs
- Privacy settings for brief/sync/sharing
- Lightweight feedback on brief items
- Background refresh for brief/evidence sync

### Out of scope for MVP
- Full 3D globe / living network visualisation
- Civic Alignment Engine
- Source Integrity Layer UI
- Voice/community board
- Daily Civic Pulse question flow
- Account system / sign-in
- Push-heavy notification system
- Social features
- Fine-grained personalization beyond explicit profile + simple feedback

## Product Principles

1. **Calm by default** — no doom-feed mechanics, no infinite scroll, no engagement bait
2. **Transparent personalization** — user can always inspect and change their profile
3. **Local-first privacy** — raw onboarding text and concern history stay on device
4. **Explain uncertainty** — if evidence is weak, say so plainly
5. **Accessible from day one** — large tap targets, adjustable text, reduced motion

## Primary User Story

> I want a calm app that helps me understand what matters in my world, based on what I actually care about, without tracking me or pushing me politically.

## Core User Journey

1. User opens app for first time
2. User reads short explanation of Prism and privacy promise
3. User selects country and completes quick onboarding conversation
4. App extracts an editable interest profile locally
5. User confirms profile and privacy settings
6. Home screen shows pulse orb and latest brief state
7. Morning brief arrives once per day
8. User opens 3–5 items, reads summaries, checks sources/confidence
9. User marks items useful / not relevant / like
10. App updates local weighting transparently
11. If offline, user can still open cached brief and evidence details

## Information Architecture

### Primary tabs / sections
For MVP, keep navigation minimal.

1. **Home**
   - Pulse orb
   - Morning brief block
   - Latest sync state
   - Empty states / offline states

2. **Brief**
   - 3–5 ranked items
   - Item cards with summary, source count, confidence, topic tags
   - Tap into evidence detail

3. **My Priorities**
   - Visible editable topic profile
   - Topic weights shown as low / medium / high
   - Add, remove, rebalance topics
   - Optional short “why” explanation

4. **Settings**
   - Country
   - Notification time
   - Text size
   - Reduced motion
   - Sharing / sync toggles
   - Privacy explanation

Note: concern history can remain hidden/internal for MVP unless implementation is cheap. It is not required as a first-class UI surface in phase 1.

## Screen-by-Screen Spec

### 1. Welcome / What Prism Is
**Goal:** establish trust quickly.

**Content:**
- One-paragraph explanation
- Clear privacy promise
- “No account required”
- Link to Humanitarian Charter / learn more

**Primary action:** Continue

**Success criteria:** user understands what Prism does and what it does not do.

### 2. Country Selection
**Goal:** bind user to a country mind without GPS.

**UI:**
- Searchable country list
- Plain explanation: “This decides which country mind prepares your evidence packs.”

**Data stored:** selected country

### 3. Onboarding Conversation
**Goal:** gather explicit user preferences in natural language or simple picks.

**Questions:**
- What are your main interests?
- What area do you live in? (free text, coarse, optional town/region)
- Do you want more local, national, or global coverage?
- What text size is comfortable for you?

**Input modes:**
- quick topic chips
- optional free-text answer
- segmented choices for local/national/global
- text size presets

**Constraints:**
- finish in under 3 minutes
- no political profiling language
- no pressure to share more than necessary

### 4. Your Profile
**Goal:** show the extracted interpretation back to the user.

**UI:**
- “Here’s what I heard” summary
- Topic list with low / medium / high emphasis
- Coverage preference
- Region / locality summary
- Edit controls before confirm

**Primary action:** Looks right / Edit

**Rule:** the app must never silently accept a profile without showing it back.

### 5. Privacy Settings
**Goal:** explicit consent for optional network contribution behavior.

**Toggles:**
- Share sanitized issue summaries to improve the network — default off
- Allow morning brief — default on
- Allow evening sync — default on, wifi preferred

**Copy style:** simple, non-legal, honest

### 6. Done / First Home
**Goal:** complete setup and land in a meaningful state.

**UI:**
- Pulse orb animates into resting state
- Brief status card: “Preparing your first brief” or “No brief yet”
- Short confirmation: “You’re part of the network.”

### 7. Home
**Goal:** one calm status surface.

**Content priority:**
1. Pulse orb / sync state
2. Today’s brief summary
3. Last updated timestamp
4. Offline message if applicable

**Do not include:**
- noisy feed metrics
- gamification
- infinite cards

### 8. Morning Brief List
**Goal:** deliver a compact, high-signal reading experience.

**Card fields:**
- headline / claim title
- 2–4 sentence Prism summary
- source count
- confidence band: high / medium / low
- topic tags
- locality marker when relevant

**Interaction:**
- open detail
- Useful
- Like
- Not relevant

**MVP cap:** 3–5 items per brief

### 9. Evidence Detail
**Goal:** make the brief inspectable.

**Content:**
- expanded summary
- source list
- confidence explanation
- freshness / timestamp
- note when evidence is incomplete or stale

**Principle:** detail must deepen trust, not overwhelm.

### 10. My Priorities
**Goal:** make personalization inspectable and editable.

**Features:**
- topic list
- weight controls: low / medium / high
- add topic
- remove topic
- optional reason text, e.g. “You selected this during onboarding” or “You marked 3 housing items useful”

**Rule:** avoid opaque numeric scoring in MVP.

### 11. Settings
**MVP fields:**
- country
- morning brief time
- text size
- reduced motion
- notifications on/off
- sharing toggle
- wifi-only sync toggle
- privacy / charter links

## Pulse Orb Spec

The pulse orb is the MVP’s living transparency layer.

### Required states
- **Idle / offline** — dim cool pulse
- **Syncing** — amber outward ripple
- **Evidence retrieved** — brief green settle
- **Processing** — travelling signal / active shimmer
- **Degraded network** — amber steady glow
- **Result ready** — white bloom then settle

### Constraints
- animation must be subtle
- reduced-motion mode must provide static/stateful alternatives
- state changes should always map to real app/network state
- no fake activity just to feel alive

## Data Model — MVP Level

### Local profile
- selected country
- coarse region / locality
- topics[]
- weight per topic (low/medium/high)
- coverage preference (local/national/global balance)
- text size
- reduced motion preference
- feedback history summary
- privacy toggles

### Brief item
- id
- headline
- summary
- topic tags
- locality scope
- confidence band
- source references
- published/updated timestamp
- cached evidence payload

### Feedback event
- brief_item_id
- signal type: like / useful / not_relevant
- timestamp
- local-only profile adjustment rationale

## Local AI Responsibilities

For MVP, the on-device model should do only bounded, explainable tasks:
- parse onboarding free text into topic candidates
- produce a profile summary in plain language
- rank evidence-pack items against local profile
- generate short user-facing summaries if not precomputed upstream
- update local topic weights from explicit feedback

### It must not do in MVP
- infer political affiliation
- build hidden behavioral profiles from dwell time or scroll depth
- upload raw user text
- make unexplainable recommendations

## Country Mind Contract — MVP

The app should assume the country mind can provide topic-tagged evidence packs suitable for morning brief assembly.

### Required upstream capabilities
- fetch evidence packs by country
- filter by topics / locality / freshness
- return structured metadata and source references
- support incremental refresh for cached updates

### App fallback behavior
If the network is unavailable:
- show last cached brief
- mark freshness clearly
- allow full local reading of cached details
- queue sync until connection returns

## Ranking Rules for Morning Brief

Keep ranking simple and explicit in MVP.

### Inputs
- explicit topic weights
- selected local/national/global preference
- freshness
- source confidence
- locality relevance
- diversity constraint to avoid 5 near-identical items

### Output rules
- show 3–5 items
- prefer at least one “Your World” item if relevant
- avoid duplicate angles on same story
- do not maximize outrage or novelty

## Notification Rules

MVP notification philosophy is strict.

### Allowed
- one morning brief notification per day
- optional significant-event exception later, but not required for MVP

### Not allowed
- streaks
- urgency bait
- “come back” prompts
- breaking-news spam

## Offline Behavior

The app must remain useful offline.

### Required
- open latest cached brief
- open cached evidence detail
- show last sync time
- queue sync work for later

### Nice-to-have but not required
- offline onboarding recovery after app close
- richer sync queue visualization

## Accessibility Requirements

Non-negotiable for MVP:
- font size choice during onboarding
- change text size later in settings
- strong contrast support
- large tap targets
- plain language labels
- reduced motion mode
- no color-only meaning for confidence or orb state

## Technical Delivery Notes

### Suggested stack
- React Native
- local encrypted storage for profile/settings/cache
- native background refresh mechanisms
- deterministic state handling for sync/orb transitions

### Architecture guidance
- keep UI thin and deterministic
- keep ranking logic inspectable
- isolate model-assisted steps behind interfaces that can swap model/provider later
- prefer mockable country-mind API adapters from day one

## Acceptance Criteria

### Product acceptance
- User completes onboarding in under 4 minutes
- Profile is visible and editable immediately after onboarding
- Morning brief displays 3–5 items from cached or fetched evidence packs
- Each item shows summary, sources, and confidence
- Pulse orb reflects real state changes
- Offline mode can read latest cached brief
- User can provide simple feedback on items
- Privacy toggles are explicit and understandable

### Technical acceptance
- App builds for iOS and Android
- Local profile persists across app restarts
- Brief cache persists across restarts
- Background refresh updates brief when possible
- No raw onboarding text is sent upstream
- Reduced-motion mode disables nonessential animation

## Open Questions Before Implementation

1. **Framework choice confirmation** — React Native is the issue target, but should Expo be allowed for faster MVP delivery?
2. **Country mind API shape** — what exact payload will the app consume for evidence packs?
3. **On-device summarization boundary** — should summaries be generated locally or shipped pre-summarized in early MVP?
4. **Model benchmark decision** — Llama 3.2 3B vs Phi-4 Mini remains open on real-device performance
5. **Locality granularity** — what is the minimum location input needed for useful local briefs without raising privacy friction?

## Recommended Build Sequence

### Slice A — app shell
- navigation
- theme tokens
- settings scaffold
- pulse orb component with mocked states

### Slice B — onboarding
- welcome
- country selection
- conversation flow
- extracted profile screen
- privacy settings

### Slice C — local data layer
- encrypted profile store
- brief cache
- feedback persistence
- settings persistence

### Slice D — brief experience
- home screen
- brief list
- evidence detail
- empty/offline states

### Slice E — sync integration
- country-mind adapter
- refresh logic
- background update hooks
- error/degraded state handling

### Slice F — polish + accessibility
- reduced motion
- larger text support
- contrast audit
- onboarding timing and copy cleanup

## Handoff Summary for Claude Code

Build the smallest trustworthy version of Prism mobile.

Prioritize:
1. calm onboarding
2. transparent local profile
3. readable morning brief
4. truthful network state via the orb
5. offline usefulness

Do not build the full vision yet. Build the smallest version that proves the product philosophy is real.
