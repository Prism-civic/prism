# Country Mind Developer Runbook

Minimal local flow for the UK Country Mind.

## Install dependencies

```bash
python3 -m venv .venv
.venv/bin/pip install -e .
```

## Run tests

```bash
bash scripts/test_country_mind.sh
```

The script assumes the package has already been installed in the active interpreter with `pip install -e .`.

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

## Reproducible local smoke workflow

Refresh from checked-in fixtures into an isolated local storage dir:

```bash
.venv/bin/python -m prism_country_mind \
  --registry-path data/uk/source_registry.v1.json \
  --storage-dir var/local-smoke \
  --signing-secret local-smoke-secret \
  --signing-key-id local-smoke-key \
  refresh \
  --fixture-dir tests/fixtures/uk_sources \
  --fetched-at 2026-03-20T12:00:00Z \
  --generated-at 2026-03-20T12:05:00Z
```

Serve the API against that same storage dir:

```bash
.venv/bin/python -m prism_country_mind \
  --registry-path data/uk/source_registry.v1.json \
  --storage-dir var/local-smoke \
  --signing-secret local-smoke-secret \
  --signing-key-id local-smoke-key \
  serve \
  --host 127.0.0.1 \
  --port 8000
```

## Reproducible Docker dev path

Build the local developer image:

```bash
docker build -f Dockerfile.dev -t prism-country-mind-dev .
```

Start the service with fixture-backed bootstrap and serve:

```bash
docker run --rm -p 8000:8000 prism-country-mind-dev
```

This path:
- installs the package in a clean Python 3.12 container
- runs fixture-backed refresh into `/app/var/local-smoke`
- starts the API on `http://127.0.0.1:8000`

Override behavior with environment variables such as `PRISM_STORAGE_DIR`, `PRISM_FIXTURE_DIR`, `PRISM_FETCHED_AT`, `PRISM_GENERATED_AT`, `PRISM_HOST`, and `PRISM_PORT`.

## CI baseline

Clean-checkout CI uses:
- Python 3.12
- `python -m pip install -e .`
- `bash scripts/test_country_mind.sh`
