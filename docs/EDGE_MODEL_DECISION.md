# Edge Model Decision Note

*Prism Civic Intelligence — March 2026*

---

## Decision Summary

For Prism MVP, the recommended baseline on-device model is:

# **Llama 3.2 3B**

Phi-4 Mini remains a strong benchmark challenger and should be tested later, but Llama 3.2 3B is the lower-risk, more deployment-ready starting point for average phones.

---

## Why This Decision

Prism does not need the phone model to be the entire civic intelligence engine. It needs the phone model to be **private, responsive, and useful**.

Current evidence suggests:
- 3B-class quantized models are now practical on modern smartphones
- Llama 3.2 3B has stronger public evidence of mobile-oriented deployment and benchmarking
- Average phone RAM in 2025–2026 is now broadly in the 8–10 GB range, with 12 GB increasingly common on higher-end devices
- Phone-sized models are good enough for local personalization and explanation tasks, but not yet trustworthy enough for full civic reasoning on-device

That means Prism should adopt a split architecture:
- **phone = smart, private interpreter**
- **country mind = heavier civic reasoning engine**

---

## What the On-Device Model Should Do

The phone model should handle:
- onboarding conversation
- topic extraction
- local user profile updates
- ranking curated items against local priorities
- summarising already-prepared evidence packs
- rewriting civic material into plain language
- generating lightweight daily question phrasing from structured inputs
- privacy-sensitive local interaction and filtering

These are narrow, high-value tasks that benefit from privacy and low latency.

---

## What the On-Device Model Should Not Own Yet

The phone model should **not** be responsible for:
- broad autonomous web/news scanning from scratch
- source credibility scoring on its own
- deep multi-document political reasoning
- candidate alignment scoring from raw source material
- long-context national-scale synthesis
- truth arbitration across the open web

These tasks should remain in the country mind until edge models improve further.

---

## Why Llama 3.2 3B Wins the MVP Slot

### Advantages
- Better evidence of practical mobile deployment
- More likely to run acceptably on average contemporary phones
- Good enough for summarisation, profile extraction, and local personalization
- Lower deployment risk than betting MVP on a less-proven edge path

### Why Not Phi-4 Mini First
Phi-4 Mini may be stronger in some reasoning-heavy cases, but for Prism MVP the key question is not raw benchmark cleverness. The key question is: **what runs reliably on real phones for real people?**

That makes Llama 3.2 3B the better first choice.

---

## Benchmark Plan

Phi-4 Mini should still be tested as a challenger model.

Benchmark both models on representative Prism tasks:
1. onboarding topic extraction
2. interest-profile summarisation
3. ranking 5 curated stories against a user profile
4. rewriting one evidence pack into plain language
5. generating one daily civic pulse question from structured inputs

Measure:
- latency on real devices
- memory footprint
- thermal/battery behaviour
- output consistency
- hallucination rate
- user readability / clarity

---

## Product Interpretation

This decision supports the broader Prism architecture:
- **the phone makes civic intelligence personal and humane**
- **the country mind makes it rigorous and trustworthy**

Prism should not ask a phone-sized model to perform miracles. It should ask it to do the private, local, human-facing part well.

That is achievable now.

---

## Status

- **Decision:** provisional MVP baseline selected
- **Baseline:** Llama 3.2 3B
- **Challenger:** Phi-4 Mini
- **Next step:** benchmark both on real Prism task prompts and representative devices
