# Contribution Protocol

*D-022 — Website Users + Phone Contributors*

---

## Overview

Prism's edge tier (phone app and website) enables citizens to contribute anonymised, aggregated signals upstream to the observer network. This creates a two-way feedback loop: the network gets smarter as more people use it, while no individual's data is ever exposed.

Both phone app users and website users can contribute the same way. Website users have no local LLM, so their feed is curated directly by the observer; phone users' feeds are personalised locally. Both contribute identically to the network.

---

## What Can Be Contributed

### 1. Verifications
User confirms or disputes a biographical or public record claim.

Example:
- *"This candidate's Wikipedia says they studied at Oxford, but my schoolmate says we were classmates at the public school in X."*
- App processes locally, aggregates with similar signals, sends: `verification { claim_id: 12345, confirmed: false, confidence: medium }`

Weight: High (direct knowledge)

### 2. Ground Reports
Timestamped, geolocated observations from local contributors.

Examples:
- Campaign rally attendance estimate
- Campaign poster sightings (location, quantity, date)
- Door-to-door canvassing activity
- Local candidate debate recordings or summaries

The app asks: location (optional, at user's permission), timestamp, type, description.
Weight: Medium (first-hand but limited context)

### 3. Cultural Context / Translations
Corrections to translation or cultural meaning of political phrases.

Example:
- *"In Hungarian, the phrase [X] has historically meant [Y], but this politician is using it to signal [Z]. This nuance is lost in English coverage."*

Weight: Medium (specialist knowledge)

### 4. Evidence Flags
User identifies a new public record item not yet in the database.

Example:
- *"I found this procurement contract from 2023 that mentions candidate X on the vendor list. URL: [link]"*
- App sends: `evidence_flag { source: "government_gazette", url: "...", candidate_kpn_id: 123456, comment: "..." }`

Weight: Medium–High (depends on source, but direct referral)

---

## Privacy Architecture

All processing on-device first. Only aggregated signals or explicit user-submitted facts leave the phone.

### What Stays On Device
- Reading history
- Topic preferences
- User's expressed values (the preference profile)
- Browsing behaviour
- Location (unless user explicitly includes it in a report)

### What Can Leave (if user explicitly allows)
- Ground reports with location (user chooses to include or not)
- Verifications (no personal data attached)
- Evidence flags (link + comment, user controls what's shared)
- Cultural context (text only)

### Anonymisation
Contributions are anonymised before transmission. No user ID, no device ID, no account linkage. The observer aggregates contributions by topic/candidate/source, not by user. Your name never appears on a contribution you make.

### User Control
The app shows users exactly what they are contributing before it leaves the device. They see:
- What data is being sent
- Whether it includes their location
- Which candidate(s) it affects
- How it will be used (aggregated with similar reports)

They approve or cancel. Contribution is voluntary, always.

---

## Implementation Status

### Phase 1 (Now)
- Mock contribution data on website (showing what will exist)
- Network visualization showing regional participation
- Static API serving regional statistics

### Phase 2 (Phone App Launch)
- Real contributions from phone app
- Verification flow in app (user confirms/disputes a claim)
- Ground report submission (location, timestamp, photo optional)
- Evidence flag submission (paste a URL, add context)
- Real-time contribution map update

### Phase 3 (Observer Network Maturity)
- Weighted contributions influence scoring models
- Most-reported claims get priority investigation by observer AI
- Community-flagged evidence is auto-curated into evidence packs
- Verification consensus moves candidate scores in evidence dashboard

---

## Contribution Types in Practice

### Example: A Verification

**Scenario:** The intelligence database says "Candidate X has a law degree from Budapest University (2008)" based on their Wikipedia page.

**User contribution:** "I was a classmate at the university, and X did not study law there. They may have attended but did not complete a law degree."

**Processing:**
1. App shows: "You're about to flag a disputed claim for candidate X. Your location will NOT be shared. Your identity will NOT be attached. This will be aggregated with similar reports."
2. User approves.
3. Signal sent upstream: `{ claim_ref: 12345, disputed: true, confidence: high, reason: "witness_knowledge" }`
4. Observer node receives signal, weighs it against other similar reports and existing evidence.
5. If consensus disagrees with original claim, the evidence pack is updated and marked: *"Educational background: disputed in community reports — see evidence notes."*

### Example: A Ground Report

**Scenario:** User attends a campaign rally for candidate Y in Budapest.

**User contribution:** "3 April, 14:00, Batthyány Lajos Tér, ~800 attendees, candidate Y spoke for 12 minutes, discussed healthcare and education."

**Processing:**
1. App shows: "You're about to report a rally. Your location will be aggregated by district only (not precise). Your identity will NOT be attached."
2. User confirms location sharing.
3. Signal sent upstream: `{ candidate_nvi_id: 456789, event_type: "rally", date: "2026-04-03", location_district: "budapest_05", attendees_estimate: 800, notes: "healthcare, education" }`
4. Observer node uses this to build a picture of candidate visibility and grassroots activity.
5. Over time, frequency of reports becomes part of the candidate's civic engagement score.

### Example: An Evidence Flag

**Scenario:** User finds a 2021 procurement contract mentioning candidate Z's company as a vendor.

**User contribution:** "Found this contract on the government procurement website. Candidate Z's company (TechCorp Ltd) won a contract for IT services to the municipality."

**Processing:**
1. App shows: "You're flagging a potential conflict of interest. The URL will be sent to the observer. You'll be anonymous."
2. User confirms.
3. Signal sent: `{ candidate_nvi_id: 789012, evidence_type: "procurement_contract", source_url: "govt_procurement_site", date: "2021-11-15", note: "company is TechCorp Ltd" }`
4. Observer node's scraper may have already found this, or may add it to follow-up investigations.
5. If new, it's added to the candidate's evidence pack under "Business Registry & Contracts."

---

## Contribution Quality & Spam Prevention

### Community Moderation
Contributions are visible to the observer team (not to other users). The observer:
- Verifies the source (does the link work, is the data real)
- Checks for spam (same exact submission many times = likely spam)
- Flags bad faith reports (claims that contradict themselves or are absurd)
- Weights contributions by source reliability

### Anti-Spam Mechanisms
- Rate limiting: max 5 contributions per user per day
- Duplicate detection: similar submissions within 1 hour = consolidated
- Source validation: URLs must actually exist and contain claimed information
- Community consensus: claims that contradict 10+ other reports are flagged as suspicious

### Appeal / Correction
If a user's contribution was rejected or downweighted, they can appeal once. Escalation goes to the observer team. This is not a popularity contest — if your source is real and your report is accurate, you're credible regardless of previous disputes.

---

## Social Layer & Recognition

Contributors are shown on the observer's network map as active nodes in their region. The map shows:

- **Total contributors by county/region**
- **Contribution type breakdown** (verifications, reports, flags, translations)
- **Personal score** (visible only to user unless they choose to share): your total contributions weighted by type and quality
- **Local ranking** (visible only to user): "You're one of 34 contributors in your district"
- **Streaks & milestones**: 7-day verification streak, first contribution, 10 reports, etc.

### Why This Matters

People contribute when:
1. They feel heard (their contribution is visible on the map)
2. They feel useful (they can see how their reports affect the intelligence)
3. They see community (they know there are others contributing in their area)
4. They get feedback (their contribution was used, changed a score, flagged something important)

The map provides all four. Contribution is social, not anonymous — but anonymity is protected from the public. Other contributors see you as an active node in your region, not as a named person.

### Sharing & Growth

Users can voluntarily share:
- Their personal contribution score (e.g. "I've made 47 contributions to Prism")
- Their streak (e.g. "7-day verification streak 🔥")
- Their local ranking if they're in the top 10% (e.g. "Top contributor in my district")

A screenshot of the contribution map with their own node highlighted is shareable — it says *"I'm helping build civic intelligence in Budapest. Join us."*

This is a natural growth lever. Contribution → share → friend sees it → friend starts contributing → network grows.

---

## Fairness & Representation

### Global Contribution Limits
No single user's contributions are ever weighted so heavily that they can swing a score alone. Consensus requires corroboration.

### Minority Voices Protected
A single report of a real, verifiable fact is not lost even if others disagree. The evidence pack might say: *"[Source] reports [fact]. This has not been corroborated by other reports, but the source is credible."*

### Coordinated Attacks Detected
If 100 accounts suddenly submit false reports about the same candidate within 24 hours, the observer's fraud detection flags it. Those reports are downweighted or removed. Coordinated campaigns have a signature — repetition, timing, source patterns — and are neutralized.

### Long-term Reputation
Contributors who consistently provide accurate, well-sourced information build a reputation within the observer network. (Not a public score — an internal weighting.) Their future contributions are treated as higher-confidence signals. Bad-faith contributors lose weight over time.

---

## Open Questions for Phase 2+

- How do we handle photo/video evidence for ground reports? (Privacy concerns with faces in rally footage)
- Should contribution streaks be reset if a user is inactive for >30 days?
- Can translators suggest new translation packs for candidates' speeches/manifestos?
- How do we prevent a coordinated campaign from submitting 1,000 false ground reports?
- Should observers cross-validate each other's contributions (e.g. Budapest observer checks London observer's reports)?

These will be addressed as the phone app is built and real contributions start flowing in. For now, the protocol is ready.
