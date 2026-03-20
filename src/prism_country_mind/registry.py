from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlparse

from .errors import RegistryValidationError
from .models import SourceDefinition, SourceRegistry


KNOWN_TOPICS = {"housing", "nhs", "cost_of_living"}


def load_registry(path: Path) -> SourceRegistry:
    payload = json.loads(path.read_text(encoding="utf-8"))
    registry = SourceRegistry(
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
    validate_registry(registry)
    return registry


def validate_registry(registry: SourceRegistry) -> None:
    errors: list[str] = []
    seen_ids: set[str] = set()

    for source in registry.sources:
        if not source.source_id:
            errors.append("Source registry contains an entry with an empty source_id")
            continue
        if source.source_id in seen_ids:
            errors.append(f"Duplicate source_id: {source.source_id}")
        seen_ids.add(source.source_id)
        if not source.title:
            errors.append(f"Source {source.source_id} is missing a title")
        if not source.publisher:
            errors.append(f"Source {source.source_id} is missing a publisher")
        parsed = urlparse(source.url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            errors.append(f"Source {source.source_id} has an invalid URL: {source.url}")
        if not source.topics:
            errors.append(f"Source {source.source_id} must include at least one topic")
        unknown_topics = sorted(set(source.topics) - KNOWN_TOPICS)
        if unknown_topics:
            errors.append(f"Source {source.source_id} has unsupported topics: {', '.join(unknown_topics)}")

    if errors:
        raise RegistryValidationError(errors)
