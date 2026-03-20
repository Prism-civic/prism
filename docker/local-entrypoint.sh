#!/usr/bin/env bash
set -euo pipefail

REGISTRY_PATH="${PRISM_REGISTRY_PATH:-/app/data/uk/source_registry.v1.json}"
STORAGE_DIR="${PRISM_STORAGE_DIR:-/app/var/local-smoke}"
SIGNING_SECRET="${PRISM_SIGNING_SECRET:-local-smoke-secret}"
SIGNING_KEY_ID="${PRISM_SIGNING_KEY_ID:-local-smoke-key}"
FIXTURE_DIR="${PRISM_FIXTURE_DIR:-/app/tests/fixtures/uk_sources}"
FETCHED_AT="${PRISM_FETCHED_AT:-2026-03-20T12:00:00Z}"
GENERATED_AT="${PRISM_GENERATED_AT:-2026-03-20T12:05:00Z}"
HOST="${PRISM_HOST:-0.0.0.0}"
PORT="${PRISM_PORT:-8000}"

python -m prism_country_mind \
  --registry-path "${REGISTRY_PATH}" \
  --storage-dir "${STORAGE_DIR}" \
  --signing-secret "${SIGNING_SECRET}" \
  --signing-key-id "${SIGNING_KEY_ID}" \
  refresh \
  --fixture-dir "${FIXTURE_DIR}" \
  --fetched-at "${FETCHED_AT}" \
  --generated-at "${GENERATED_AT}"

exec python -m prism_country_mind \
  --registry-path "${REGISTRY_PATH}" \
  --storage-dir "${STORAGE_DIR}" \
  --signing-secret "${SIGNING_SECRET}" \
  --signing-key-id "${SIGNING_KEY_ID}" \
  serve \
  --host "${HOST}" \
  --port "${PORT}"

