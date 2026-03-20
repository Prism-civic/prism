from __future__ import annotations

from dataclasses import asdict, dataclass, field
import json
from typing import Any


def _canonicalize(value: Any) -> Any:
    if isinstance(value, tuple):
        return [_canonicalize(item) for item in value]
    if isinstance(value, list):
        return [_canonicalize(item) for item in value]
    if isinstance(value, dict):
        return {key: _canonicalize(value[key]) for key in sorted(value)}
    return value


@dataclass(frozen=True, slots=True)
class CanonicalModel:
    def to_dict(self) -> dict[str, Any]:
        return _canonicalize(asdict(self))

    def to_canonical_json(self) -> str:
        return json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"))


@dataclass(frozen=True, slots=True)
class SourceDefinition(CanonicalModel):
    source_id: str
    title: str
    publisher: str
    url: str
    format: str
    description: str
    topics: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class SourceRegistry(CanonicalModel):
    schema_version: str
    country_code: str
    sources: tuple[SourceDefinition, ...]

    def for_topic(self, topic: str) -> tuple[SourceDefinition, ...]:
        return tuple(source for source in self.sources if topic in source.topics)

    def by_id(self) -> dict[str, SourceDefinition]:
        return {source.source_id: source for source in self.sources}


@dataclass(frozen=True, slots=True)
class SourceSnapshot(CanonicalModel):
    schema_version: str
    snapshot_id: str
    source_id: str
    url: str
    fetched_at: str
    sha256: str
    size_bytes: int
    content_type: str
    storage_path: str


@dataclass(frozen=True, slots=True)
class EvidencePack(CanonicalModel):
    schema_version: str
    pack_id: str
    topic: str
    country_code: str
    generated_at: str
    source_snapshot_ids: tuple[str, ...]
    summary: str
    signature: str
    signing_key_id: str
    evidence: tuple[dict[str, Any], ...] = field(default_factory=tuple)


@dataclass(frozen=True, slots=True)
class TransparencyLogEntry(CanonicalModel):
    schema_version: str
    entry_id: str
    entry_type: str
    subject_id: str
    created_at: str
    sha256: str
    signature: str
    signing_key_id: str
    payload: dict[str, Any]
