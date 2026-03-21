# Edge Model Benchmark Plan

*Prism Civic Intelligence — March 2026*

---

## Purpose

This benchmark exists to answer one practical question:

> **Which on-device model is the better MVP choice for Prism on real hardware?**

The contenders are:
- **Baseline:** Llama 3.2 3B
- **Challenger:** Phi-4 Mini

This is not a general model bake-off. It is a product decision for Prism's phone app.

---

## Decision Context

For MVP, the on-device model is responsible for **bounded, private, explainable tasks**.
It is not the full civic reasoning engine.

The phone model should help with:
- onboarding topic extraction
- profile summarisation
- local ranking support
- plain-language rewriting of already-prepared evidence
- lightweight question phrasing

The country mind remains responsible for heavier reasoning and source-grounded synthesis.

---

## Benchmark Questions

The benchmark should answer:

1. Which model feels more responsive on the Lenovo P52 as a development proxy?
2. Which model stays within realistic memory limits for future mobile deployment?
3. Which model produces clearer, more usable outputs for Prism tasks?
4. Which model is more consistent and less likely to hallucinate or overreach?
5. Does Phi-4 Mini offer enough practical upside to displace Llama 3.2 3B as the MVP baseline?

---

## Hardware / Test Environment

### Initial benchmark machine
- **Device:** Lenovo P52
- **Role:** development proxy, not final phone hardware

### Why this still matters
The P52 is not a smartphone, but it is good enough to compare:
- relative latency
- memory pressure
- output quality on Prism tasks
- implementation friction

It should be treated as a **screening benchmark**.
A later real-phone validation pass can follow if needed.

---

## Models Under Test

### Model A — Baseline
- **Llama 3.2 3B**
- Quantized variant suitable for local inference

### Model B — Challenger
- **Phi-4 Mini**
- Quantized variant suitable for local inference

### Requirement
Where possible, both models should be tested under comparable local inference conditions:
- same runtime class
- same approximate quantization level
- same prompt format discipline
- same machine

Document any mismatch clearly if exact parity is not possible.

---

## Prism Task Set

Use a small fixed suite of representative MVP tasks.
Each task should be run multiple times per model.

### Task 1 — Onboarding topic extraction
**Goal:** parse free text into usable topic candidates.

**Input type:** short user paragraph

**Expected output characteristics:**
- extracts topics actually mentioned
- avoids over-inference
- keeps labels readable
- does not infer political affiliation

### Task 2 — Profile summary
**Goal:** turn explicit onboarding signals into a short plain-language profile summary.

**Expected output characteristics:**
- readable and calm tone
- faithful to provided inputs
- no extra claims
- concise enough for mobile UX

### Task 3 — Ranking support
**Goal:** rank 5 curated brief items against a local user profile.

**Expected output characteristics:**
- explicit rationale
- stable ordering
- no hidden leaps
- respects stated priorities over sensationalism

### Task 4 — Evidence-pack rewriting
**Goal:** rewrite a prepared evidence pack summary into plain language.

**Expected output characteristics:**
- preserves meaning
- improves readability
- does not add unsupported claims
- remains neutral in tone

### Task 5 — Daily civic pulse question generation
**Goal:** generate one lightweight daily question from structured inputs.

**Expected output characteristics:**
- short and natural
- not manipulative
- not alarmist
- clearly tied to supplied context

---

## Metrics to Record

### Performance
For each task and model, record:
- time to first token / first visible output if available
- total completion time
- peak RAM usage if available
- qualitative thermal / fan behaviour on the P52

### Output quality
Score each run on:
- **Faithfulness** — stays inside the provided input
- **Clarity** — readable for an ordinary user
- **Usefulness** — good enough for Prism MVP UX
- **Restraint** — avoids speculative or political overreach
- **Consistency** — similar quality across repeated runs

Use a simple 1–5 score per category.

### Failure tracking
Note whether a run shows:
- hallucinated facts
- hidden assumptions
- political inference not asked for
- verbosity beyond mobile usefulness
- malformed structure
- refusal / instability / obvious degradation

---

## Test Method

### Run count
- Run each task **3 times per model** minimum
- If results vary significantly, run **5 times**

### Prompt discipline
- Keep prompts fixed between models
- Use the same structured input data for both models
- Save the prompts and outputs for comparison

### Evaluation method
For each task:
1. run Model A
2. run Model B
3. record raw timings
4. record short evaluator notes
5. assign 1–5 scores

At the end, total the scores across tasks.

---

## Decision Rule

### Default position
Llama 3.2 3B remains the MVP baseline unless Phi-4 Mini shows a **clear practical win**.

### Phi-4 Mini should replace Llama 3.2 3B only if it is:
- clearly better on output quality **and**
- not materially worse on latency / memory / local deployment risk

### If results are mixed
Prefer the model that is:
- more predictable
- easier to ship
- easier to explain
- more likely to run acceptably for ordinary users

For Prism MVP, **reliability beats cleverness**.

---

## Output Artefacts

The benchmark session should produce:
- a short benchmark result note in `docs/`
- preserved prompts used for testing
- captured outputs for both models
- a final recommendation: keep Llama 3.2 3B or switch to Phi-4 Mini

Suggested follow-up files:
- `docs/EDGE_MODEL_BENCHMARK_RESULTS.md`
- `benchmark/edge-model-prompts/`
- `benchmark/edge-model-outputs/`

---

## Time Box

Target: **~1 hour** for the first screening pass.

Suggested split:
- 10 min — environment setup
- 30 min — benchmark runs
- 15 min — scoring and notes
- 5 min — recommendation write-up

---

## Success Condition

At the end of this session, Prism should have:
- a defensible MVP edge-model choice
- recorded reasoning for that choice
- enough evidence to proceed with implementation confidently

That is the goal.
