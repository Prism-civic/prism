# Country Mind Developer Runbook

Minimal local flow for the UK Country Mind.

## Install dependencies

```bash
python3 -m venv .venv
.venv/bin/pip install -e .
```

## Run tests

```bash
PYTHONPATH=src .venv/bin/python -m unittest discover -s tests -v
```

## Start the API

```bash
PYTHONPATH=src .venv/bin/uvicorn prism_country_mind.app:app --app-dir src --reload
```

The app serves:
- `GET /health`
- `GET /topics`
- `GET /packs`
- `GET /packs/{id}`
- `GET /transparency-log`

API notes:
- `GET /health` now distinguishes process health from readiness via `status`, `ready`, `checks`, and `inventory`.
- Collection endpoints return consistent envelopes with `count` plus `topics`, `packs`, or `entries`.
- Invalid topic filters and missing packs return structured error payloads in the FastAPI `detail` field.

## Run refresh/bootstrap

Fetch live registry sources, store snapshots under `var/uk_country_mind/`, and generate packs:

```bash
PYTHONPATH=src .venv/bin/python -m prism_country_mind refresh
```

Refresh a subset of topics:

```bash
PYTHONPATH=src .venv/bin/python -m prism_country_mind refresh --topic housing --topic nhs
```

Use fixed timestamps for reproducible runs:

```bash
PYTHONPATH=src .venv/bin/python -m prism_country_mind refresh \
  --fetched-at 2026-03-20T12:00:00Z \
  --generated-at 2026-03-20T12:05:00Z
```

Operational notes:
- Refresh is strict by default: if any required source fetch fails, pack generation is aborted and the CLI exits non-zero with structured error details.
- Re-running refresh with the same snapshots and generation timestamps is idempotent: existing packs and transparency log entries are reused instead of duplicated.
