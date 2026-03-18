# Prism Website Specification

*Version 0.1 — Founding Document — March 2026*

---

## Purpose

The Prism website is not a marketing page. It is a **live window into the network** — a real-time visualization of a civic intelligence organism breathing, thinking, and healing itself. It should make someone who visits for the first time feel like they are looking at something genuinely new.

It also serves as the project's public face: what Prism is, how to contribute, where the money goes, and who is building it.

---

## Design Philosophy

- **Alive, not static** — the homepage should feel like watching a heartbeat, not reading a brochure
- **Honest by default** — capacity, load, and fund data are real and live, never prettified
- **Contributors are celebrated** — the people building this are the story
- **Accessible** — works on mobile, works without JavaScript (degraded but functional), works in low-bandwidth environments
- **No tracking** — no cookies, no analytics fingerprinting, no ad infrastructure. Ever.

---

## Pages & Sections

---

### 1. Homepage — The Living Network

**The centrepiece: Neural Network Globe**

A full-viewport, real-time 3D visualization of the Prism network.

- **Nodes** appear as points of light — positioned roughly geographically on a globe, or abstractly as a neural mesh (both views available, user can toggle)
- **Country minds** pulse with a warm amber glow — brighter = more active
- **World minds** are the brightest nodes, slightly larger, a cool white-blue
- **Phone/edge connections** appear as faint threads connecting to their country mind
- **Data sync events** animate as a visible signal travelling between nodes — a brief streak of light along the connection line
- **Node going offline** — the node dims slowly, its connections redistribute visibly to neighbours. You watch the network heal in real time.
- **Node coming online** — it brightens gradually, connections form, neighbours acknowledge it

**Below the globe: Live Stats Bar**
```
🌍 24 nodes online  |  🧠 6 country minds  |  🌐 3 world minds  |  📦 1,204 evidence packs  |  🔍 342 queries today
```
All live, updating every 30 seconds via WebSocket.

**Hero text (minimal, beneath the visualization):**
> *Civic intelligence for everyone.*
> *Transparent. Open. Owned by no one.*

Two buttons: **How it works** and **Run a node**

---

### 2. How It Works

Clean, visual explainer. No jargon. Three panels:

**Panel 1 — You**
> You tell Prism what you care about. In your own words. Rent. Healthcare. Schools. Corruption. Whatever is real to you.
> Your words never leave your phone. A small local AI turns them into topics and looks for evidence.

**Panel 2 — The Network**
> Somewhere in the world, a node has already processed thousands of public sources on that topic — parliamentary records, voting histories, policy outcomes, verified data.
> Your phone retrieves the relevant evidence and shows you what it found. Not opinions. Evidence.

**Panel 3 — The Answer**
> Prism shows you which policies and positions align with your priorities — and which don't. It tells you how confident it is. It shows you the sources. It tells you when it doesn't know.
> It never tells you how to vote. That's yours.

---

### 3. The Network — Live Node Dashboard

A full page dedicated to network health and transparency.

**Global map view** (same visualization as homepage, but larger and more detailed)

**Node list** — filterable by:
- Tier (country mind / world mind / verifier / archive)
- Country
- Status (healthy / stressed / degraded / offline)
- Uptime

**Each node card shows:**
- Node ID (pseudonymous handle chosen by operator)
- Country / region
- Tier and role
- Status indicator (green / amber / red)
- Uptime percentage (last 30 days)
- Evidence packs served
- Last heartbeat
- Operator's public profile link (optional)

**Assist events log** — a live feed of cross-node assistance:
> `uk-mind-2 assisted de-mind-1 · 14 minutes ago · 23 requests served`

This makes the self-healing behaviour visible and tangible.

---

### 4. Contribute — Run a Node

The single most important conversion page on the site.

**Three contribution tiers clearly explained:**

**🔵 Light Node — any laptop or desktop**
> Run a verifier or archive node. Costs nothing. Uses idle CPU.
> One command to start. Your machine joins the network while you sleep.

**🟡 Country Mind — a VPS or home server**
> Run a full country mind for your country. Requires a VPS (~€10–20/month) and a source registry for your country.
> We provide the software, the documentation, and the community.
> You provide the local knowledge.

**🌐 World Mind — for organisations and institutions**
> For universities, research institutions, and civic organisations with serious infrastructure.
> Requires coordination with the core team.
> Highest contribution tier — your organisation is named on the site.

**Quick Start box:**
```bash
# Run a light node in one command
docker run -d prismcivic/node:latest --role=verifier --country=GB
```

Link to full documentation.

**FAQ:**
- *Do I need technical knowledge?* Light nodes — no. Country minds — some. We have guides.
- *What does it cost to run?* Light node: nothing. Country mind VPS: ~€10–20/month.
- *Can I run a node anonymously?* Yes. Your node ID is pseudonymous by default.
- *What happens if I go offline?* The network heals around you automatically. No penalty.

---

### 5. Contributors — The Wall

Every person building Prism has a presence here. This is the community's public record.

**Contributor cards** (pseudonymous by default, real name optional):
- Handle / name
- Country
- Node type and role
- Contribution score (evidence packs verified, uptime, source submissions accepted)
- Member since
- Optional: short bio, link to personal site

**Badges earned:**
- 🌱 *Early Node* — joined before 100 nodes
- 🔥 *Always On* — 99%+ uptime for 30 days
- 🌍 *Pioneer* — first node in a new country
- 🛡️ *Guardian* — caught and reported a poisoning attempt
- 📚 *Source Hunter* — submitted 10+ accepted sources
- ⚡ *First Responder* — assisted a degraded node within 60 seconds

**The dopamine loop:**
When a contributor's node verifies an evidence pack, they get a real-time notification. Their card pulses on the wall. Their score increments visibly. Small, but meaningful — it says *your machine did something real for the network right now.*

---

### 6. Transparency — Money & Decisions

Two sections on one page.

**Fund Transparency**

Live feed from Open Collective API.

```
March 2026
Received:   €340
Spent:      €280  (inference: €180 · hosting: €70 · domain: €30)
Reserve:    €60

All-time
Received:   €340
Spent:      €280
Reserve:    €60
```

Every line item is a link to the Open Collective transaction. No summarising, no smoothing. Full receipts, always.

A simple chart showing monthly income vs spend over time.

**Decision Log**

Every significant project decision — architectural, governance, policy — is logged here with:
- Date
- Decision made
- Why
- Who was consulted
- Link to the GitHub discussion or issue

This is the project's institutional memory. It proves the project has nothing to hide about how it makes decisions.

---

### 7. About

Brief. Human. No corporate language.

> Prism started in March 2026 with a simple question: what if ordinary people had access to the same quality of civic intelligence that institutions and governments take for granted?
>
> It is free. It is open source. It is owned by no one and governed by its community.
>
> The floor beneath it is the Humanitarian Charter — a small set of principles that no version of Prism, in any country, may violate.
>
> Everything else is up to the people who build it.

Link to Humanitarian Charter. Link to GitHub. Link to Open Collective.

Founder credit: *[name to be added when ready]*

---

## Technical Specification

### Stack
- **Framework:** Next.js 15 (App Router)
- **Visualization:** Three.js (globe) + D3.js (node graphs, fund charts)
- **Real-time:** WebSockets for node heartbeat data and live stats
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (free tier sufficient for early stage) or self-hosted on Hetzner VPS
- **Analytics:** None. No tracking. No cookies.
- **Open Collective:** Public API for fund transparency panel

### Performance
- Globe visualization lazy-loaded — page is functional before it renders
- Static fallback for all live data — if WebSocket fails, last-known state is shown with timestamp
- Mobile-first — the globe degrades to a simple node count on small screens

### Accessibility
- Full keyboard navigation
- Screen reader compatible (all visualization data available as text alternative)
- High contrast mode
- Works without JavaScript (text-only version of all content)

---

## Visual Identity

**Colour palette:**
- Background: deep space dark `#0a0e1a`
- Primary accent: prism white `#f0f4ff`
- Country minds: amber warm `#f59e0b`
- World minds: electric blue-white `#e0f2fe`
- Healthy: `#22c55e`
- Stressed: `#f59e0b`
- Degraded: `#ef4444`
- Offline / dim: `#374151`

**Typography:**
- Headings: Inter or Geist (clean, modern, neutral)
- Body: System font stack (fast, no external dependency)
- Code: JetBrains Mono

**Motion:**
- Subtle. Never distracting. The network pulses slowly, like breathing.
- Data events animate at human pace — fast enough to feel live, slow enough to be readable
- No auto-playing anything loud or intrusive

---

## Development Phases

### Phase 1 — Static Foundation
- Homepage with static globe (no live data yet)
- How it works page
- About page with Humanitarian Charter
- GitHub and Open Collective links
- Deployable in a weekend

### Phase 2 — Live Network
- Node heartbeat API
- Live stats bar
- Real node cards with live status
- Assist events log
- Requires at least 2–3 nodes running

### Phase 3 — Community Layer
- Contributor wall
- Badge system
- Real-time contribution notifications
- Fund transparency panel (Open Collective live feed)

### Phase 4 — Full Dashboard
- Full interactive globe with all node types
- Decision log
- Network health history
- Country chapter pages

---

*The website is the project's face to the world. It should make someone feel, in the first ten seconds, that they are looking at something honest, something alive, and something worth being part of.*
