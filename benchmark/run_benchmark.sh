#!/bin/bash
# Prism Edge Model Benchmark — fixed prompt loop
set -e

MODELS=("llama3.2:3b" "phi4-mini")
OUTPUT_DIR="$(dirname "$0")/edge-model-outputs"
RESULTS_FILE="$OUTPUT_DIR/timings.tsv"
RUNS=3

mkdir -p "$OUTPUT_DIR"

# Append header only if file is new
if [ ! -f "$RESULTS_FILE" ]; then
  echo -e "model\ttask_id\ttask_name\trun\telapsed_sec" > "$RESULTS_FILE"
fi

declare -A TASK_NAMES
declare -A TASK_PROMPTS

TASK_NAMES["task2"]="Profile summary"
TASK_PROMPTS["task2"]="Write a short plain-language profile summary (2–3 sentences) for a Prism user based on these onboarding signals. Be faithful to the inputs. Do not add extra claims or political assumptions. Keep it calm and readable.

Signals:
- Primary concerns: housing affordability, local schools, council corruption
- Location: UK city (unspecified)
- Life stage: parent with primary-age children
- Trust level in local politics: low"

TASK_NAMES["task3"]="Ranking support"
TASK_PROMPTS["task3"]="Rank these 5 brief items for a Prism user whose top priorities are housing affordability and local government accountability. Give each item a rank (1=most relevant) and a one-sentence reason. Be explicit. Do not favour sensational items.

Items:
1. Council approves new social housing development in east ward
2. Prime Minister attends NATO summit
3. Local MP votes against renter's rights bill
4. National football team qualifies for Euros
5. Council audit reveals undisclosed property contracts

Format: ranked list with reason for each."

TASK_NAMES["task4"]="Evidence-pack rewriting"
TASK_PROMPTS["task4"]="Rewrite this evidence pack summary in plain language for an ordinary reader. Preserve the meaning exactly. Do not add unsupported claims. Keep a neutral tone.

Original summary: Parliamentary voting record analysis (2019–2024) indicates the incumbent MP voted in favour of legislation associated with increased private landlord protections on 7 of 9 relevant divisions. On 2 occasions the MP was absent. No affirmative votes for renter protection legislation were recorded in this period.

Rewrite in 2–3 sentences suitable for a mobile app."

TASK_NAMES["task5"]="Daily civic pulse question"
TASK_PROMPTS["task5"]="Generate one short daily civic question for a Prism user. It should feel natural, not alarming, and be clearly grounded in the context provided. Do not be manipulative.

Context: The user cares about housing affordability. Today's available data shows a council planning meeting is scheduled to vote on a rezoning proposal that would affect residential land in their area.

Respond with a single question only, no explanation."

TASKS=("task2" "task3" "task4" "task5")

echo "=== Prism Edge Model Benchmark (tasks 2–5) ==="

for MODEL in "${MODELS[@]}"; do
  echo "--- Model: $MODEL ---"
  MODEL_SLUG="${MODEL//:/_}"
  MODEL_DIR="$OUTPUT_DIR/$MODEL_SLUG"
  mkdir -p "$MODEL_DIR"

  for TASK_ID in "${TASKS[@]}"; do
    TASK_NAME="${TASK_NAMES[$TASK_ID]}"
    TASK_PROMPT="${TASK_PROMPTS[$TASK_ID]}"
    echo "  Task: $TASK_NAME"

    for RUN in $(seq 1 $RUNS); do
      OUT_FILE="$MODEL_DIR/${TASK_ID}_run${RUN}.txt"
      START=$(date +%s%N)
      ollama run "$MODEL" "$TASK_PROMPT" > "$OUT_FILE" 2>/dev/null
      END=$(date +%s%N)
      ELAPSED=$(echo "scale=2; ($END - $START) / 1000000000" | bc)
      echo -e "$MODEL\t$TASK_ID\t$TASK_NAME\t$RUN\t$ELAPSED" >> "$RESULTS_FILE"
      echo "    Run $RUN: ${ELAPSED}s → $OUT_FILE"
    done
  done
  echo ""
done

echo "=== All tasks complete ==="
echo ""
echo "Full timing summary:"
python3 - "$RESULTS_FILE" << 'EOF'
import sys, csv
from collections import defaultdict
data = defaultdict(list)
with open(sys.argv[1]) as f:
    reader = csv.DictReader(f, delimiter='\t')
    for row in reader:
        data[row['model']].append(float(row['elapsed_sec']))
for model, times in data.items():
    avg = sum(times) / len(times)
    total = sum(times)
    print(f"  {model}: avg {avg:.1f}s per task, total {total:.0f}s across {len(times)} runs")
EOF

openclaw system event --text "Done: Edge model benchmark tasks 2-5 complete — ready to score and recommend" --mode now
