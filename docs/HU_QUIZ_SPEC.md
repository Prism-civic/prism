# Hungary Pilot — User Alignment Quiz Spec

## Purpose
Establish the user's position on 6 civic traits so the alignment radar can be rendered relative to each candidate/party. The quiz runs on first visit to `/hu` and takes ~90 seconds.

## 6 Traits & Questions

Each question uses a 1–5 slider (Strongly Disagree → Strongly Agree). Labels shown in Hungarian, English fallback.

---

### 1. EU (European Union)
**HU:** "Magyarország érdeke, hogy aktív és elkötelezett tagja legyen az Európai Uniónak."
**EN:** "It is in Hungary's interest to be an active, committed member of the European Union."

### 2. Migráció (Migration)
**HU:** "Magyarországnak be kell fogadnia az EU által javasolt menekültkvótákat."
**EN:** "Hungary should accept the EU-proposed refugee quotas."

### 3. Gazdaság (Economy)
**HU:** "Az állam feladata, hogy erős szociális hálót biztosítson és csökkentse a gazdasági egyenlőtlenségeket."
**EN:** "The state should provide a strong social safety net and reduce economic inequality."

### 4. Jogállamiság (Rule of Law)
**HU:** "A bírói függetlenség és a sajtószabadság fontosabb, mint a kormányzati hatékonyság."
**EN:** "Judicial independence and press freedom are more important than governmental efficiency."

### 5. Ukrajna (Ukraine)
**HU:** "Magyarországnak támogatnia kell Ukrajna EU- és NATO-csatlakozását."
**EN:** "Hungary should support Ukraine's EU and NATO accession."

### 6. Környezet (Environment)
**HU:** "A környezetvédelem és a klímacselekvés a legfontosabb politikai prioritások közé tartozik."
**EN:** "Environmental protection and climate action are among the most important political priorities."

---

## UX Flow

1. User arrives at `/hu` for the first time
2. Modal/overlay: "Mielőtt megnézed a jelölteket, mondj el pár dolgot magadról. 90 másodperc." (Before you see the candidates, tell us a little about yourself. 90 seconds.)
3. 6 questions, one at a time, full-screen card with slider
4. Skip option always visible — quiz is optional
5. On completion: results saved to `localStorage` as `prism_user_profile` JSON
6. Radar renders immediately for whichever candidate/party is viewed

## Profile Storage Format

```json
{
  "version": 1,
  "completedAt": "2026-03-21T20:00:00Z",
  "scores": {
    "eu": 4,
    "migracio": 2,
    "gazdasag": 3,
    "jogallamisag": 5,
    "ukrajna": 3,
    "kornyezet": 4
  }
}
```

Stored in `localStorage` key: `prism_user_profile`
No server-side storage — user data stays on device (sovereignty principle).

## Alignment Calculation

For each trait:
```
alignment = 5 - abs(user_score - party_score)
```
Range: 1 (opposite) → 5 (full alignment)

Normalise to 0–1 for radar rendering:
```
radar_value = (alignment - 1) / 4
```

## Radar Component Props

```typescript
interface AlignmentRadar {
  userProfile: UserProfile       // from localStorage
  partyPositions: PartyPositions // from HU_PARTY_POSITIONS data
  partyId: string                // e.g. 'fidesz-kdnp'
  size?: number                  // default 200px
  overlayOnPhoto?: boolean       // true for candidate card, false for comparison table
}
```

## Implementation Notes

- Quiz component: `website/components/AlignmentQuiz.tsx`
- Radar component: `website/components/AlignmentRadar.tsx`  
- Party positions data: `website/data/hu-party-positions.json` (generated from docs/HU_PARTY_POSITIONS.md)
- Radar uses SVG — no canvas, no external lib needed
- Must work without JS enabled: show static comparison table as fallback
- Must be fully accessible (ARIA labels on all slider inputs)
- i18n: all strings in `messages/hu.json` and `messages/en.json`

## Credibility Bar (separate component)

`CredibilityBar.tsx` — horizontal bar, 0–100 score, shown below candidate photo.

Inputs (for now, static/manual for top candidates):
- Law/court records: weight 0.4
- Broken promises: weight 0.3  
- Financial transparency: weight 0.2
- Media/integrity flags (Átlátszó): weight 0.1

For Hungary pilot v1: calculate for top 20 Fidesz-KDNP incumbents only (most data available).
