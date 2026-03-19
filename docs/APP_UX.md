# Prism App — UX, Visual Design & User Intelligence

*Version 0.1 — Founding Document — March 2026*

---

## Design Philosophy

The app should feel like a **calm, intelligent companion** — not a news feed, not a social platform, not an alert machine. It breathes. It listens. It tells the truth quietly.

Three feelings to design for:
- **Trust** — it never surprises you in a bad way
- **Presence** — it feels alive even when you're not actively using it
- **Clarity** — complexity is always one layer beneath simplicity

---

## Visual Language — The Living App

The app shares the same visual DNA as the website: the network is alive, and you are part of it.

### The Pulse

The core visual metaphor is a **breathing pulse** — a soft, slow animation that tells you the state of your connection to the network at a glance.

| State | Visual |
|-------|--------|
| Idle / offline | Slow dim pulse, cool grey — *resting* |
| Syncing with country mind | Gentle amber ripple outward — *listening* |
| Evidence retrieved | Brief bright flash, settles to green — *found something* |
| Query processing | Travelling signal animation — *thinking* |
| Network degraded | Warm amber steady glow — *working with what it has* |
| Result ready | Clean white bloom, then settles — *here's what I found* |

This lives at the top of every screen as a small ambient orb — never intrusive, always informative.

### Your Node on the Map

The app shows the user a miniature version of the network map from the website. Their phone is a visible node — a small point of light connecting to their country mind. When they sync, they see the signal travel. When the network is busy, they see it. When a world mind assists their query, they see that too.

This is not decoration. It is transparency made visual. The user always knows exactly how their query was served and by whom.

### The "You Are Part of This" Moment

When the user opts in to share sanitized issue summaries upstream, their node pulses on the global map. A small counter increments: *"Your input has contributed to 14 evidence clusters."*

This is the same dopamine loop as the website contributor wall — but on the phone. It turns passive users into invested participants.

---

## Daily Idle Behaviour — What the App Does When You're Not Using It

The app is not dormant when idle. It is working quietly on your behalf.

### Morning Brief & Default Feed (once per day, user-configured time)

This is Prism's **default value layer**. Before a user understands the hive mind, the weighting engine, or the philosophy, they already get something immediately useful: a clean, intelligent stream built around their interests and their world.

At the user's chosen time — default 8am — the local AI runs a background news scan:

1. **Fetches curated topic feeds** from the country mind based on the user's interest profile
2. **Separates them into two subtle modes**:
   - **Your Interests** — what the user explicitly asked for (science, sport, technology, Formula 1, etc.)
   - **Your World** — local and civic developments the user may not have asked for, but should understand
3. **Filters ruthlessly** — removes duplicates, wire-report repetition, obvious clickbait, emotional manipulation language, and weakly sourced claims
4. **Scores each item** — source reliability, claim confidence, local relevance, and fit with the user's stated priorities
5. **Presents a clean reading block** — typically 5 headlines at a time, tappable to open a detail thread with Prism summary, sources, and confidence indicator
6. **Learns gently from interaction** — heart/like, opens, skips, and explicit feedback help reweight the local profile over time

The brief is delivered as a quiet notification — not a banner alarm, a gentle pulse on the orb. The user opens it when ready.

**What the brief is not:**
- Not a manipulative infinite scroll feed
- Not breaking news alerts — Prism is not a news ticker
- Not personalized to maximize engagement — personalized to reflect genuine user interests
- Not ad-supported — ever
- Not politically pushy — civic relevance is introduced gradually and honestly

### Evening Sync (once per day, optional)

At a user-configured evening time, the app silently:
- Syncs its local evidence packs with the country mind (downloads updates)
- Uploads any permissioned, sanitized issue summaries the user approved
- Updates the user's local alignment scores if new policy data arrived
- Downloads international context updates from the world mind

This happens in the background, uses minimal data, and completes in seconds. The orb pulses once to confirm. The user may never notice — and that is fine.

### What Never Happens Without Permission
- No background location tracking
- No reading notifications or other apps
- No uploading raw text the user typed
- No sync without explicit user approval for each category

---

## How the App Learns the User

This is the most important design question in the project. The answer must be: **the user teaches Prism explicitly, and always knows what Prism thinks they care about.**

There is no hidden profiling. There is no behavioral surveillance. There is no algorithmic inference happening silently in the background. The user's profile is always visible, always editable, and always honest.

### Layer 1 — Onboarding: The Conversation

The app does not start with a form. It starts with a conversation — but a practical one.

The local AI asks a small number of simple questions — warmly, clearly, without pressure:

- What are your main interests?
- What area do you live in?
- Do you want more local, national, or global coverage?
- What text size is comfortable for you?

The topic picker should be broad and human, not overly political. Examples:
- Politics
- Environment
- Science
- Technology
- Health
- Local community
- Sport
- Formula 1
- Cost of living
- Education

The user can also answer in natural language if they prefer. The local AI extracts topics, weights them, and shows the result back immediately:

> *"Here's what I heard: housing affordability is your top concern, followed by healthcare waiting times, and you'd like more local than global coverage. Does this feel right?"*

The user corrects it if needed. This should take under 3 minutes. At the end, the user has a visible interest profile that they built themselves, consciously, in their own words.

### Layer 2 — The Priority Dashboard

Accessible from the main menu at any time: **My Priorities**.

A simple list of the topics Prism believes the user cares about, with a weight for each (shown as a simple low / medium / high bar, not a number). The user can:
- Add a topic
- Remove a topic
- Adjust the weight
- See *why* Prism assigned a weight ("You mentioned housing 3 times in your concern history")

This is the user's civic identity within the app. It is never uploaded to the network in identifiable form. It lives on the device.

### Layer 3 — Explicit Feedback

Every result the app returns has lightweight feedback:
- **Heart / Like** — positive signal
- **Useful** — strong positive signal
- **Not relevant** — negative signal

That's it. No star ratings, no elaborate feedback forms. The local AI uses these signals to quietly reweight the user's interest profile over time.

The user can see the effect: if they heart three housing results and mark two immigration results as not relevant, their profile updates visibly. They are never surprised by what the app has learned about them.

### Layer 4 — Concern History

Every time the user types a concern, it is processed locally and added to their concern history — a private, on-device log. The user can read, edit, or delete any entry.

The local AI periodically reviews this history (on device, never uploaded) and suggests profile updates:

> *"You've asked about NHS waiting times four times this month. Want me to add healthcare as a priority?"*

The user approves or declines. Nothing changes without an explicit yes.

### Layer 5 — What the App Will Never Do

- It will never infer political affiliation from reading habits
- It will never use app usage patterns (time spent, scroll depth) to build a behavioral profile
- It will never share the user's raw concerns, search history, or reading habits with anyone
- It will never sell or trade user interest data — there is no business model that touches this data
- It will never present personalized results without the user understanding why they are seeing them

**The test:** at any moment, the user should be able to open their profile and say "yes, this is me" — or "no, this is wrong" and fix it. If Prism cannot explain why it thinks something about the user, it does not get to act on it.

---

## Day-to-Day User Journey

### A typical Tuesday

**8:03am** — Orb pulses gently. Morning brief ready.

> *Today's brief:*
> *• Chancellor announces autumn budget preview — spending cuts expected in public services (BBC, ONS data, confidence: high)*
> *• Local council planning approval for 400 homes near Kempston (Bedford Borough, confidence: high)*
> *• NHS England reports 7.6m waiting list, down 200k from peak (NHS England, confidence: high)*

User reads, taps "useful" on the housing item. Profile quietly notes it.

**12:30pm** — User opens the app on lunch break. Types:

> *"I heard my council tax is going up again. Is this because of government cuts or local decisions?"*

The orb ripples amber. Local AI structures the concern. Country mind retrieves evidence packs on local authority funding, central government grants, and council tax rules. Response comes back in 8 seconds:

> *"Council tax rises are primarily a local decision, but they're heavily influenced by central government grant reductions. Here's what the evidence shows for your region..."*

Source list. Confidence band. An honest note that some local figures are 6 months old.

User taps "useful." Closes the app.

**6:00pm** — Evening sync runs silently in the background. New evidence pack on housing policy downloaded. Orb pulses once. Done.

**Before bed** — User thinks about the budget news from the morning. Opens the app:

> *"Which parties have the strongest record on NHS funding?"*

Country mind returns an alignment view — not a verdict, a comparison. Party A: promised X, delivered Y. Party B: promised X, delivered Z. Historical spending data. Confidence: medium (manifesto promises vs actual budgets are hard to compare directly). The uncertainty is shown, not hidden.

User closes the app and thinks for themselves. Prism's job is done.

---

## The Daily Civic Pulse — One Question

After the morning brief, the app may present a single optional question. Not a survey. Not a form. One question, one tap, then done.

This is the feature that turns Prism from a passive information tool into an **active ground-truth network.**

---

### Why This Matters

The country mind knows what official sources say *should* happen. It can read the budget, the council minutes, the policy announcements. What it cannot know — without users — is what *actually* happened.

Did the potholes get fixed after the budget allocated funds?
Was the promised new GP surgery built?
Did the air quality improve after the industrial zone regulation?

No government dataset answers these questions reliably. Local journalists used to — but most local journalism is gone. **Users are the only source of ground truth at the hyperlocal level.** The Civic Pulse is how Prism collects it — voluntarily, one question at a time, completely in the open.

---

### How Questions Are Generated

The country mind generates candidate questions by cross-referencing:

1. **Official commitments** — budget line items, council decisions, manifesto pledges, planning approvals
2. **Expected delivery dates** — if a commitment had a timeline, did it pass?
3. **User's location** — questions are geographically relevant to the user's area
4. **Absence of evidence** — if no verification data exists for a commitment, that's a candidate
5. **User's interest profile** — questions match topics the user has already said they care about

The question is only surfaced if:
- The expected delivery date has passed (or is imminent)
- No verified ground-truth data exists for that commitment
- The question is genuinely answerable by a local resident
- It hasn't been asked of this user in the last 30 days

---

### Question Types

**Type 1 — Ground Truth Verification**
The mind knows a commitment was made. It doesn't know if it was delivered.

> *"Bedford Council allocated £340k for road repairs in your area last April. Have the potholes on the main roads near you been repaired?"*
> **[Yes, mostly] [No, still bad] [Partially] [Not sure]**

If the user taps **No** or **Partially**, the app immediately follows up — not with another question, but with an explainer:

> *"That's useful. Here's what the records show about why this budget may not have been spent:*
> *• £120k was reallocated to emergency flood repairs in October*
> *• The contractor tender process was delayed twice*
> *• £80k remains unspent — no public explanation found*
> Want to see the full budget trail?"*

The user's response is added to the evidence base (anonymized, aggregated). When enough users in the same area report the same thing, the country mind flags it as a verified discrepancy — a real gap between promise and reality.

**Type 2 — Political Preference Calibration**
When a genuine policy trade-off is relevant to upcoming decisions, the app asks the user's view directly.

> *"There's a planning decision in your area next month: expand the industrial estate (350 jobs, increased lorry traffic) or protect the green belt (no jobs, no development). What matters more to you?*
> **[Jobs and growth] [Environmental protection] [Need more information] [Both matter equally]**"

This is not a poll. It is not published. It feeds the user's priority profile — their answer tells the alignment engine something real about where they stand on a genuine trade-off. It is always framed as a trade-off, never as "are you for or against" a party.

**Type 3 — Personal Experience**
Simple, experiential, no wrong answer.

> *"NHS waiting times in your region are officially 18 weeks for a GP referral. Has your experience matched that, been better, or worse?"*
> **[About right] [Better] [Much worse] [Haven't needed it recently]**

These questions build a picture of lived experience vs. official statistics. When the gap between the two is large, Prism surfaces it — not as a political attack on any party, but as honest evidence that official data may not reflect reality.

---

### The Follow-Up Intelligence

The most powerful part of this feature is what happens *after* a user says something wasn't delivered.

The local AI doesn't just record it and move on. It investigates automatically:

1. **Budget trail check** — was the money reallocated? To what? Was there a public record?
2. **Contractor records** — was a tender issued? Was it awarded? Was there a delay?
3. **Council minutes** — was it discussed in a public meeting? Was a reason given?
4. **Pattern detection** — is this a one-off or a pattern? Has this type of commitment been missed before in this area?

It presents the findings to the user in plain language:

> *"Here's what I found about why the road repairs may not have happened..."*

And crucially — it marks the confidence level honestly:
> *"I found a partial explanation (budget reallocation). I couldn't find a full public explanation for the remaining £80k."*

That gap — publicly funded commitment, no public explanation — is logged in the evidence base as an **accountability gap**. Enough of these, across enough users in the same area, and the country mind has built something no official dataset contains: a map of where promises went.

---

### What Happens to the Answers

All user responses are:
- **Anonymized** before leaving the device — no user ID, no precise location
- **Aggregated** — individual responses are never shown; only clusters of similar responses across a region
- **Permissioned** — the user explicitly opted in to sharing responses during onboarding, and can turn it off at any time
- **Transparent** — the user can see exactly what was contributed from their device in their profile

When enough responses cluster around the same issue in the same area, the country mind:
1. Flags it as a **verified ground-truth signal**
2. Adds it to the local evidence base with a confidence score
3. Uses it to enrich alignment scoring — parties or councils with multiple accountability gaps score lower on delivery, regardless of their stated positions

---

### One Question. Always One.

The rule is strict: **one Civic Pulse question per day, maximum.** Often zero — the question is only surfaced if a genuinely good candidate exists.

In the feed, the question should appear naturally after a reading block rather than feeling like an interruption. Early versions may place it after roughly 5 headlines, but the long-term rule should be adaptive to engagement and never mechanically intrusive.

No question is ever asked unless:
- It is answerable by a local resident
- It is relevant to the user's stated interests or local world
- It respects the user's time (answerable in one tap)
- The answer will actually improve the evidence base

If Prism cannot meet all four criteria, it asks nothing that day. The morning brief stands alone.

The user can skip every question, every day, forever. The app remains fully functional. Prism never makes the user feel obligated. It only asks because it genuinely wants to know.

---

### The Long-Term Picture

Over months and years, the Civic Pulse builds something extraordinary: a **ground-truth layer** on top of official data. A living record of what was promised, what was delivered, and what the gap between the two looks like — told by the people who actually live with the consequences.

No journalist can do this at scale. No government will fund it. No social media platform has any reason to build it.

Prism can — because it is the only platform where users are contributing to a system that explicitly works for them, with no hidden agenda and nowhere for the data to go except back into better answers.

---

## Notification Philosophy

Prism sends **one type of notification per day, maximum.** The morning brief. That's it.

No breaking news alerts. No "you haven't checked in a while." No engagement bait. No streaks. No red badges demanding attention.

If something genuinely significant happens — a major policy announcement that directly touches the user's top priority — the app may send one additional notification that day. One. With a reason shown.

The user can disable all notifications. The app remains fully functional. It will be there when they want it, and silent when they don't.

---

## The Onboarding Flow (Step by Step)

**Screen 1 — What Prism Is**
One paragraph. Plain language. What it does, what it never does, how privacy works. A link to the full Humanitarian Charter for those who want it.

**Screen 2 — Where Are You?**
Country selection. This determines which country mind serves the user. No GPS required — user picks from a list. They can change it later.

**Screen 3 — Interests & Reading Preferences**
Simple topic selection plus optional natural-language input. Also asks:
- local / national / global balance
- comfortable text size
- reduced motion preference (if needed)

**Screen 4 — Your Profile**
The extracted profile, shown back to the user. Editable immediately. Confirmation tap to accept.

**Screen 5 — Privacy Settings**
Three toggles, explained simply:
- *Share sanitized issue summaries to improve the network* (default: off)
- *Allow morning brief* (default: on)
- *Allow evening sync* (default: on, wifi only)

**Screen 6 — Done**
The globe. Their node, lit up. One sentence: *"You're part of the network."*

Total onboarding: under 4 minutes. No account required. No email. No password. No phone number.

---

## Technical Notes for Implementation

- **Local model** runs entirely on-device — Phi-4 Mini or Llama 3.2 3B
- **Interest profile** stored in encrypted local storage — never in plaintext
- **Concern history** never leaves the device unless explicitly exported by the user
- **News feed curation** runs locally — the country mind provides topic-tagged evidence packs, the local AI filters and ranks them against the local profile
- **Background tasks** use OS-native background processing (iOS Background App Refresh, Android WorkManager) — no persistent connections, no battery drain
- **Offline mode** — full read access to cached briefs and evidence packs with no network; write queue for syncing when connection returns

---

## Accessibility Principles

Prism must be genuinely comfortable for older users and for people who are not fluent in app culture.

Non-negotiables:
- font size preset during onboarding
- easy in-app text resizing at any time
- strong contrast mode
- uncluttered layout
- large tap targets
- plain-language summaries
- reduced-motion option for the living visual layer

If the app is beautiful but tiring to read, we have failed.

## Platform Targets

| Platform | Phase |
|----------|-------|
| iOS | Phase 1 |
| Android | Phase 1 |
| Web (progressive web app) | Phase 2 |
| Desktop (Electron / Tauri) | Phase 3 |

---

*The app earns trust by being genuinely useful, genuinely honest, and genuinely quiet. It is not trying to keep the user engaged. It is trying to make the user better informed — and then get out of the way.*
