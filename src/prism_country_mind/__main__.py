from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .errors import CountryMindError, RefreshFailedError, RegistryValidationError
from .app import create_app
from .config import CountryMindConfig
from .service import CountryMindService


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prism UK Country Mind utilities")
    parser.add_argument("--registry-path", help="Override the source registry path")
    parser.add_argument("--storage-dir", help="Override the runtime storage directory")
    parser.add_argument("--signing-secret", help="Override the signing secret")
    parser.add_argument("--signing-key-id", help="Override the signing key id")
    subparsers = parser.add_subparsers(dest="command", required=True)

    refresh = subparsers.add_parser("refresh", help="Fetch sources and generate packs")
    refresh.add_argument(
        "--topic",
        action="append",
        choices=["housing", "nhs", "cost_of_living"],
        dest="topics",
        help="Restrict refresh to one or more topics",
    )
    refresh.add_argument("--fetched-at", help="Override snapshot fetch timestamp (ISO-8601 UTC)")
    refresh.add_argument("--generated-at", help="Override pack generation timestamp (ISO-8601 UTC)")
    refresh.add_argument("--fixture-dir", help="Read source bodies from local fixture files for reproducible local runs")

    serve = subparsers.add_parser("serve", help="Start the FastAPI service")
    serve.add_argument("--host", default="127.0.0.1", help="Host interface to bind")
    serve.add_argument("--port", type=int, default=8000, help="Port to bind")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        service = CountryMindService(build_config(args))

        if args.command == "refresh":
            result = service.refresh(
                topics=args.topics,
                fetched_at=args.fetched_at,
                generated_at=args.generated_at,
                fetcher=build_fixture_fetcher(args.fixture_dir),
            )
            print(json.dumps(result, indent=2, sort_keys=True))
            return 0

        if args.command == "serve":
            import uvicorn

            uvicorn.run(create_app(service), host=args.host, port=args.port)
            return 0

        parser.error(f"Unknown command: {args.command}")
        return 1
    except RefreshFailedError as exc:
        print(
            json.dumps(
                {
                    "error": str(exc),
                    "failures": [
                        {"source_id": failure.source_id, "url": failure.url, "reason": failure.reason}
                        for failure in exc.failures
                    ],
                },
                indent=2,
                sort_keys=True,
            ),
            file=sys.stderr,
        )
        return 1
    except RegistryValidationError as exc:
        print(json.dumps({"error": str(exc), "details": exc.errors}, indent=2, sort_keys=True), file=sys.stderr)
        return 1
    except CountryMindError as exc:
        print(json.dumps({"error": str(exc)}, indent=2, sort_keys=True), file=sys.stderr)
        return 1

def build_config(args: argparse.Namespace) -> CountryMindConfig:
    config = CountryMindConfig()
    if args.registry_path:
        config = CountryMindConfig(
            root_dir=config.root_dir,
            country_code=config.country_code,
            registry_path=Path(args.registry_path),
            storage_dir=config.storage_dir,
            signing_secret=config.signing_secret,
            signing_key_id=config.signing_key_id,
        )
    if args.storage_dir or args.signing_secret or args.signing_key_id:
        config = CountryMindConfig(
            root_dir=config.root_dir,
            country_code=config.country_code,
            registry_path=config.registry_path,
            storage_dir=Path(args.storage_dir) if args.storage_dir else config.storage_dir,
            signing_secret=args.signing_secret or config.signing_secret,
            signing_key_id=args.signing_key_id or config.signing_key_id,
        )
    return config


def build_fixture_fetcher(fixture_dir: str | None):
    if fixture_dir is None:
        return None

    fixture_root = Path(fixture_dir)

    def fetcher(source):
        path = fixture_root / f"{source.source_id}.txt"
        return path.read_bytes(), "text/plain"

    return fetcher


if __name__ == "__main__":
    raise SystemExit(main())
