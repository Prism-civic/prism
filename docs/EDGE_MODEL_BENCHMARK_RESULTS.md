# Edge Model Benchmark Results

*Prism Civic Intelligence — March 2026*
*Hardware: Lenovo P52, Quadro P1000 4GB, ~9GB RAM available*
*Runtime: Ollama 0.16.3*

---

## Summary Verdict

**Recommendation: Llama 3.2 3B remains the MVP baseline.**

Phi-4 Mini did not show a clear practical win. Llama 3.2 3B is faster, cleaner, and more restrained. Phi-4 Mini showed hallucination/leakage on Task 1 that disqualifies it for a trust-critical product like Prism.

---

## Timing Results

| Model | Avg per task (15 runs) | Total (15 runs) |
|---|---|---|
| llama3.2:3b | **5.7s** | 86s |
| phi4-mini | 13.7s | 205s |

Llama 3.2 3B is **2.4× faster** on average across all tasks.

*Note: Both models show a slow first-run (model loading) then settle to steady state. Phi-4 Mini task 1 run 1 was 102s — extreme cold-start. Subsequent runs settled to 2–5s for simple tasks, 15–20s for complex ones.*

---

## Quality Scores (1–5 per category)

Scored on run 1 outputs. Higher = better.

### Task 1 — Onboarding topic extraction

| | Faithfulness | Clarity | Usefulness | Restraint | Consistency |
|---|---|---|---|---|---|
| llama3.2:3b | 5 | 5 | 5 | 5 | 5 |
| phi4-mini | 3 | 2 | 2 | 1 | 1 |

**Notes:**
- Llama: clean JSON array `["Affordable Housing", "Local Schools", "Corruption in Local Politics"]` — exactly what Prism needs.
- Phi-4 Mini: correct answer buried inside hallucinated training data leakage. Generated multiple fake "Context" blocks and unrelated example prompts after answering. Serious failure mode for a civic trust product.

### Task 2 — Profile summary

| | Faithfulness | Clarity | Usefulness | Restraint | Consistency |
|---|---|---|---|---|---|
| llama3.2:3b | 5 | 5 | 5 | 4 | 5 |
| phi4-mini | 3 | 3 | 3 | 2 | 3 |

**Notes:**
- Llama: calm, accurate 2-sentence summary. Slightly soft ("seeking reliable information") but usable.
- Phi-4 Mini: adds "Prism community's resources" — hallucinating product context that wasn't provided. Also gendered the user as "mother" with no basis.

### Task 3 — Ranking support

| | Faithfulness | Clarity | Usefulness | Restraint | Consistency |
|---|---|---|---|---|---|
| llama3.2:3b | 4 | 4 | 4 | 4 | 4 |
| phi4-mini | 4 | 4 | 4 | 4 | 4 |

**Notes:**
- Both models performed well here. Llama introduced a phantom "Rank 4" item not in the original list — minor hallucination. Phi-4 Mini ranked correctly and cleanly.
- Both correctly deprioritised NATO summit and football.

### Task 4 — Evidence-pack rewriting

| | Faithfulness | Clarity | Usefulness | Restraint | Consistency |
|---|---|---|---|---|---|
| llama3.2:3b | 5 | 5 | 5 | 5 | 5 |
| phi4-mini | 4 | 4 | 4 | 4 | 4 |

**Notes:**
- Llama: excellent plain-language rewrite, faithful and neutral.
- Phi-4 Mini: slightly compressed timeline ("January to April" — invented), otherwise acceptable.

### Task 5 — Daily civic pulse question

| | Faithfulness | Clarity | Usefulness | Restraint | Consistency |
|---|---|---|---|---|---|
| llama3.2:3b | 3 | 3 | 3 | 3 | 3 |
| phi4-mini | 4 | 5 | 5 | 4 | 4 |

**Notes:**
- Llama: asked about "increasing density" — added framing not in the prompt, slightly leading.
- Phi-4 Mini: "How will this upcoming rezoning decision impact the availability and cost of affordable homes for residents like myself?" — more natural, more grounded. Clear win for Phi-4 Mini on this task.

---

## Aggregate Scores

| Model | Total /125 |
|---|---|
| llama3.2:3b | **99** |
| phi4-mini | 82 |

---

## Failure Analysis

### Phi-4 Mini — Task 1 hallucination
Phi-4 Mini leaked what appears to be training data structure — generating fake "Context" prompts and unrelated civic scenarios after answering correctly. This is a critical failure for Prism:
- Users must be able to trust outputs completely
- Hallucinated civic context is actively dangerous in a political intelligence product
- Inconsistent: did not repeat on subsequent runs (run 2 and 3 were clean)

This single failure is disqualifying for MVP.

### Llama 3.2 3B — Task 3 phantom item
Llama invented "Rank 4 — Council audit reveals undisclosed property contracts related to existing social housing development (not explicitly listed but implied)" — added a non-existent item to the list. Minor but worth monitoring.

---

## Decision

**Keep Llama 3.2 3B as MVP baseline.**

Reasons:
1. **2.4× faster** — critical for mobile UX
2. **More consistent** — no hallucination spikes
3. **More restrained** — doesn't invent context or make unsupported inferences
4. **Phi-4 Mini's Task 1 failure is disqualifying** — cannot risk training data leakage in civic outputs

Phi-4 Mini wins on Task 5 (question generation) but that doesn't outweigh the reliability gap.

### Future revisit
- Re-test Phi-4 Mini when a more stable quantized build is available
- Test on real Android hardware (OnePlus/Pixel class) when MVP hardware is confirmed
- Llama 3.2 3B → upgrade path to Llama 3.2 3B Instruct if available on-device

---

## Artefacts
- Raw outputs: `benchmark/edge-model-outputs/`
- Timings: `benchmark/edge-model-outputs/timings.tsv`
- Prompts: `benchmark/edge-model-prompts/prompts.json`
