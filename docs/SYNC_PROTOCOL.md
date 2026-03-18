# Prism Sync Protocol

*Version 0.1 — Founding Document — March 2026*

---

## Design Philosophy: The Living Brain

Prism's network is not a hierarchy of servers. It is a distributed neural network — a living organism where every node is both a participant and a backup.

In a healthy brain, no single region holds all cognition. When one area is damaged, others adapt and compensate. The system degrades gracefully rather than failing completely. This is the model Prism follows.

There is no master server. There is no single world mind. There is no authoritative country node. There is only the network — and the network is always trying to stay alive, stay consistent, and stay honest.

---

## Network Topology

### Three Tiers — All Interconnected

```
┌─────────────────────────────────────────────────────────────┐
│                        WORLD TIER                            │
│   [World Mind A]  ←→  [World Mind B]  ←→  [World Mind C]   │
│         ↕                   ↕                   ↕           │
├─────────────────────────────────────────────────────────────┤
│                       COUNTRY TIER                           │
│  [UK-1] ←→ [UK-2]    [DE-1] ←→ [DE-2]    [HU-1] ←→ [HU-2] │
│      ↕           ↕         ↕         ↕         ↕            │
│  [UK-3]      [FR-1] ←→ [FR-2]    [PL-1]    [RO-1]          │
├─────────────────────────────────────────────────────────────┤
│                        EDGE TIER                             │
│  [Phone]  [Phone]  [Phone]  [Phone]  [Phone]  [Phone]       │
└─────────────────────────────────────────────────────────────┘
```

### Key Properties
- **Every tier is horizontally replicated** — multiple nodes per country, multiple world minds globally
- **Tiers assist each other** — a UK node can serve DE requests if DE is degraded
- **No single point of failure exists** at any tier
- **Cross-country assistance is a first-class feature** — not a fallback, but a designed behaviour

---

## Node Roles & Responsibilities

### Country Mind Node
Primary responsibility: serve the civic intelligence needs of its designated country.

**Holds:**
- Country-specific evidence packs (parliamentary records, policy documents, voting records, manifestos, national statistics)
- Local issue heat maps (aggregated, anonymized user concern clusters)
- Source registry for its country (approved domains and institutions)
- Policy alignment vectors for local parties and candidates
- Transparency log for all scoring and source decisions

**Serves:**
- Phone apps registered in its country
- Verifier nodes re-running its outputs
- World tier nodes requesting country-specific data
- **Other country minds that need assistance**

**Cross-country assistance rules:**
- A country mind may serve another country's requests only for internationally relevant evidence (foreign policy positions, treaty obligations, cross-border comparisons)
- A country mind must never generate civic alignment scores for a country it does not operate — it provides raw evidence only
- Local scoring always remains with nodes that have local context and accountability

### World Mind Node
Primary responsibility: synthesize international context and maintain geopolitical intelligence.

**Holds:**
- International law corpus (UN resolutions, ICC rulings, Geneva Conventions, major treaties)
- Foreign policy positions of all connected countries (sourced from official records, not interpretation)
- Cross-border policy comparisons and outcome data
- Geopolitical relationship maps (alliances, trade dependencies, active conflicts, diplomatic positions)
- International evidence packs (World Bank, WHO, OECD, Amnesty International, etc.)
- Humanitarian baseline enforcement rules

**Serves:**
- Country minds requesting international context
- Direct queries about cross-border or geopolitical topics
- Resilience backup for country minds under load or attack
- The transparency log aggregation layer

**Multiple world minds:**
- At least three world mind nodes must be active at all times
- They are geographically distributed (different continents, different legal jurisdictions)
- They continuously sync evidence packs and source hashes
- Any world mind can answer any query — they are fully interchangeable
- If one is taken offline (legal pressure, hardware failure, attack), the others absorb its load automatically

---

## The Self-Healing Protocol

This is the core of what makes Prism a living system.

### Health Signals
Every node broadcasts a health signal every 60 seconds:
```json
{
  "node_id": "uk-mind-2",
  "tier": "country",
  "country": "GB",
  "status": "healthy",
  "load": 0.43,
  "evidence_version": "2026.03.18-r4",
  "last_sync": 1774000000,
  "can_assist": true,
  "assist_capacity": 0.57
}
```

### Degradation States
- **Healthy:** serving normally, broadcasting availability
- **Stressed:** load > 70%, requests assistance from peers, reduces non-critical sync
- **Degraded:** load > 90% or partial failure, hands off new requests to peers immediately
- **Offline:** unreachable — peers detect via missed heartbeats, absorb all traffic

### Assistance Protocol
When a node is stressed or degraded:

1. It broadcasts an `ASSIST_REQUEST` to its peer list with its current load and deficit type
2. Peers with `can_assist: true` respond with their available capacity
3. The stressed node begins routing overflow requests to willing peers
4. Peers serving assistance flag their responses as `assisted: true` with the assisting node ID
5. This is logged in the transparency record — users can see when their query was served by a peer node
6. When the original node recovers, traffic migrates back gradually (not instantly, to avoid oscillation)

### Cross-Country Assistance
When all nodes of one country are degraded:

1. The world tier detects total country outage via missed heartbeats
2. World minds broadcast the outage to all country minds
3. Country minds with overhead volunteer as **shadow nodes** for the affected country
4. Shadow nodes serve cached evidence only — they never generate fresh local scoring for another country
5. Shadow responses are clearly labelled: `"source": "shadow-node", "country_mind_available": false`
6. The phone app shows a notification: *"Your local data is temporarily served from the international network. Results may be less detailed."*

---

## Data Schemas

### Evidence Pack
The atomic unit of knowledge in the Prism network.
```json
{
  "pack_id": "gb-housing-2026-q1",
  "country": "GB",
  "topic": "housing",
  "subtopics": ["rent", "affordability", "planning"],
  "generated_at": 1774000000,
  "valid_until": 1776592000,
  "source_hashes": ["sha256:abc...", "sha256:def..."],
  "claims": [...],
  "confidence": 0.84,
  "disputed_elements": [...],
  "transparency_url": "https://log.prism.network/pack/gb-housing-2026-q1",
  "signed_by": "uk-mind-1",
  "verified_by": ["uk-mind-2", "verifier-node-7"]
}
```

### Issue Summary (Phone → Country Mind)
```json
{
  "summary_id": "anon-uuid",
  "country": "GB",
  "region": "East of England",
  "topics": ["housing", "healthcare"],
  "urgency": "medium",
  "submitted_at": 1774000000,
  "user_confirmed": true,
  "raw_text": null
}
```
*Raw text is never uploaded. Only the structured extraction.*

### Sync Package (Country Mind → World Mind)
```json
{
  "package_id": "gb-sync-2026-03-18",
  "country": "GB",
  "period": "2026-03-11/2026-03-18",
  "issue_clusters": [...],
  "foreign_policy_positions": [...],
  "updated_evidence_packs": [...],
  "source_registry_version": "2026.03.18",
  "signed_by": "uk-mind-1",
  "signature": "ed25519:..."
}
```

### International Context Package (World Mind → Country Mind)
```json
{
  "context_id": "intl-2026-03-18",
  "relevant_countries": ["GB", "EU", "US"],
  "international_law_refs": [...],
  "foreign_policy_map": {...},
  "cross_border_comparisons": [...],
  "geopolitical_alerts": [...],
  "signed_by": "world-mind-a",
  "co_signed_by": ["world-mind-b"]
}
```

---

## Signing & Trust

Every data package is cryptographically signed. No unsigned data enters the network.

- Each node has an **Ed25519 keypair** generated at registration
- Public keys are published to the transparency log
- Evidence packs require **at least one verifier co-signature** before being considered canonical
- World mind packages require **co-signature from a second world mind** before distribution
- Compromised keys are revoked via network consensus and logged permanently

---

## Resilience Targets

| Scenario | Expected behaviour |
|----------|-------------------|
| Single country node fails | Peer country nodes absorb traffic within 2 minutes |
| All nodes of one country fail | World tier serves cached evidence, shadow nodes activate |
| Single world mind goes offline | Remaining world minds absorb load immediately |
| Two of three world minds go offline | Emergency mode: country minds operate independently on cached data |
| Network partition | Each partition continues serving locally; reconciles on reconnection |
| Coordinated attack on one country | Nodes in other countries verify and re-serve clean data |

**Design goal:** The network never goes fully dark. It degrades gracefully, always tells the truth about its degraded state, and recovers automatically.

---

## Transparency Log

Every significant network event is written to an append-only, publicly readable transparency log:

- Evidence pack created, updated, or retired
- Node joined or left the network
- Assistance events (who helped whom, when, why)
- Key rotations and revocations
- Source registry changes
- Humanitarian baseline enforcement actions

The log is replicated across all world mind nodes and selected archive nodes. It cannot be deleted or altered. Anyone can read it.

---

## Federation Rules

To join the Prism network, a node operator agrees to:

1. The Humanitarian Charter — non-negotiable
2. Open source software only — no closed modifications
3. Transparency log participation — all events reported
4. Signed data only — no unsigned packages accepted or emitted
5. Graceful degradation — nodes must implement the self-healing protocol
6. No user data — nodes never request, store, or transmit raw personal data

Nodes that violate these rules are disconnected by network consensus and their keys are revoked.
