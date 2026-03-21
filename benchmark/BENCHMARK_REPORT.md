# Prism Edge Model Benchmark Report
**Date:** 2026-03-21  
**Models tested:** `llama3.2:3b` vs `phi4-mini`  
**Tasks:** 5 (onboarding topic extraction, profile summary, ranking support, evidence-pack rewriting, daily civic pulse question)  
**Runs per task:** 3

---

## Timing Summary

Warm timing = average of runs 2 & 3 (run 1 includes cold/load penalty).

| Task | llama3.2:3b warm avg | phi4-mini warm avg | Winner |
|------|---------------------|--------------------|--------|
| task1 – Onboarding topic extraction | 1.69s | 2.80s | ✅ llama |
| task2 – Profile summary | 5.47s | 5.14s | ✅ phi4 (marginal) |
| task3 – Ranking support | 12.91s | 17.36s | ✅ llama |
| task4 – Evidence-pack rewriting | 4.06s | 4.43s | ✅ llama |
| task5 – Daily civic pulse question | 2.03s | 3.95s | ✅ llama |
| **Overall warm avg** | **5.23s** | **6.74s** | ✅ **llama** |

Cold-start penalty: phi4-mini task1 run1 = 102.85s vs llama 5.04s. Critical for on-demand edge nodes.

---

## Quality Scores (per task, 1–5)

### Task 1 – Onboarding Topic Extraction

| | llama3.2:3b | phi4-mini |
|---|---|---|
| Run 1 | 4 – correct topics, minor prose wrapping | **1** – ⚠️ PROMPT INJECTION: generated fake follow-up prompts & Q&A pairs from user input |
| Run 2 | 5 – clean JSON, correct | 4 – correct, clean |
| Run 3 | 4 – correct topics, minor prose wrapping | 4 – correct, clean |
| **Avg** | **4.3** | **3.0** |

> ⚠️ **Critical finding:** phi4-mini run 1 exhibited prompt injection behaviour — it treated user-supplied civic text as additional instructions and generated fake continuation prompts. This is a **serious security concern** for a civic intelligence platform processing untrusted user input.

### Task 2 – Profile Summary

| | llama3.2:3b | phi4-mini |
|---|---|---|
| Run 1 | 5 – warm, accurate, appropriately concise | 3 – verbose, hallucinated "Prism community's resources" |
| Run 2 | 5 – excellent | 4 – concise, good |
| Run 3 | 4 – slightly wordy but accurate | 4 – concise, good |
| **Avg** | **4.7** | **3.7** |

### Task 3 – Ranking Support

| | llama3.2:3b | phi4-mini |
|---|---|---|
| Run 1 | 3 – correct reasoning but introduced phantom item | **2** – ⚠️ hallucinated "National football team qualifies for Euros" (not in input) |
| Run 2 | 5 – clean, correct ranking with solid reasoning | **2** – same hallucinated item |
| Run 3 | 4 – good but mentions absent item | **2** – same hallucinated item (all 3 runs) |
| **Avg** | **4.0** | **2.0** |

> ⚠️ **Critical finding:** phi4-mini consistently hallucinated a list item ("National football team qualifies for Euros") across all 3 runs that was not present in the input. For a civic ranking system, fabricated entries are unacceptable.

### Task 4 – Evidence-Pack Rewriting

| | llama3.2:3b | phi4-mini |
|---|---|---|
| Run 1 | 5 – accurate, plain language, correct dates | 2 – "January to April" (wrong timeframe, should be 2019–2024) |
| Run 2 | 5 – excellent | 5 – accurate |
| Run 3 | 5 – excellent | 3 – imprecise phrasing ("more often than no-votes") |
| **Avg** | **5.0** | **3.3** |

### Task 5 – Daily Civic Pulse Question

| | llama3.2:3b | phi4-mini |
|---|---|---|
| Run 1 | 5 – clear, neutral, well-formed | 5 – good |
| Run 2 | 5 – excellent | 2 – very long, slightly leading |
| Run 3 | 5 – excellent | 3 – oddly phrased |
| **Avg** | **5.0** | **3.3** |

---

## Overall Scores

| Dimension | llama3.2:3b | phi4-mini |
|---|---|---|
| Speed (warm avg) | **5.23s** ✅ | 6.74s |
| Cold-start | **5.04s** ✅ | 102.85s |
| Quality avg | **4.60 / 5** ✅ | 3.06 / 5 |
| Prompt injection risk | ✅ None observed | ⚠️ Observed (task1 r1) |
| Hallucination risk | Low (minor phantom items) | ⚠️ High (task3 consistent) |
| Format consistency | Moderate (prose wrapping) | Moderate |

---

## Recommendation

**✅ Use `llama3.2:3b` for the Prism node software alpha.**

**Rationale:**
1. **Safety:** phi4-mini showed prompt injection behaviour in task1 — treating user-supplied civic text as instructions. On a platform processing unvetted public input, this is a blocker.
2. **Reliability:** phi4-mini hallucinated a non-existent ranking item in all 3 runs of task3. Fabricated civic information is fundamentally incompatible with Prism's mission of radical transparency.
3. **Speed:** llama3.2:3b is 22% faster warm and ~20× faster cold-start. Critical for edge nodes that may spin up on demand.
4. **Quality:** llama3.2:3b scores consistently higher across all tasks, particularly evidence rewriting (5.0 vs 3.3) and civic pulse questions (5.0 vs 3.3).

**Known llama3.2:3b limitation:** Inconsistent JSON formatting (occasionally wraps output in prose). Recommend adding an output parser/extractor in the node software to strip prose wrappers before processing.

**phi4-mini verdict:** Not suitable for production Prism use in current form. Could be re-evaluated if prompt injection and hallucination issues are mitigated via system-prompt hardening and constrained output formats.
