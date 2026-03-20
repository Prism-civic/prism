from __future__ import annotations

import argparse
import json

from .service import CountryMindService


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prism UK Country Mind utilities")
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
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    service = CountryMindService()

    if args.command == "refresh":
        result = service.refresh(
            topics=args.topics,
            fetched_at=args.fetched_at,
            generated_at=args.generated_at,
        )
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0

    parser.error(f"Unknown command: {args.command}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
