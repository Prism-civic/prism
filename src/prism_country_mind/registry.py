from __future__ import annotations

import json
from pathlib import Path

from .models import SourceDefinition, SourceRegistry


def load_registry(path: Path) -> SourceRegistry:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return SourceRegistry(
        schema_version=payload["schema_version"],
        country_code=payload["country_code"],
        sources=tuple(
            SourceDefinition(
                source_id=item["source_id"],
                title=item["title"],
                publisher=item["publisher"],
                url=item["url"],
                format=item["format"],
                description=item["description"],
                topics=tuple(item["topics"]),
            )
            for item in payload["sources"]
        ),
    )

