from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, timezone
from typing import Any

from .config import CountryMindConfig
from .errors import RefreshFailedError, RefreshValidationError, SourceFetchError
from .pipeline import FetchFn, SnapshotPipeline, TopicPackBuilder
from .registry import load_registry
from .signing import Signer
from .storage import PackStore, SnapshotStore, TransparencyLogStore


class CountryMindService:
    def __init__(self, config: CountryMindConfig | None = None) -> None:
        self.config = config or CountryMindConfig()
        self.registry = load_registry(self.config.registry_path)
        self.snapshot_store = SnapshotStore(self.config.snapshot_dir)
        self.pack_store = PackStore(self.config.pack_dir)
        self.transparency_log_store = TransparencyLogStore(self.config.transparency_log_dir)
        self.signer = Signer(self.config.signing_secret, self.config.signing_key_id)

    def topics(self) -> list[dict[str, object]]:
        items: list[dict[str, object]] = []
        for topic in self.topic_names():
            items.append(
                {
                    "topic": topic,
                    "source_ids": [
                        source.source_id
                        for source in sorted(self.registry.for_topic(topic), key=lambda item: item.source_id)
                    ],
                }
            )
        return items

    def topic_names(self) -> list[str]:
        return sorted({topic for source in self.registry.sources for topic in source.topics})

    def build_pack(self, topic: str, generated_at: str):
        self._validate_topics([topic])
        builder = TopicPackBuilder(
            topic=topic,
            snapshot_store=self.snapshot_store,
            pack_store=self.pack_store,
            transparency_log_store=self.transparency_log_store,
            signer=self.signer,
        )
        return builder.build(self.registry, generated_at)

    def refresh(
        self,
        topics: Iterable[str] | None = None,
        fetched_at: str | None = None,
        generated_at: str | None = None,
        fetcher: FetchFn | None = None,
    ) -> dict[str, object]:
        topic_list = sorted(set(topics or self.topic_names()))
        self._validate_topics(topic_list)
        source_ids = {
            source.source_id
            for topic in topic_list
            for source in self.registry.for_topic(topic)
        }
        snapshot_time = fetched_at or _utc_now()
        pack_time = generated_at or snapshot_time
        pipeline = SnapshotPipeline(self.snapshot_store, fetcher=fetcher)
        snapshots = []
        failures: list[SourceFetchError] = []

        for source in sorted(self.registry.sources, key=lambda item: item.source_id):
            if source.source_id not in source_ids:
                continue
            try:
                snapshots.append(pipeline.snapshot_source(source, snapshot_time))
            except SourceFetchError as exc:
                failures.append(exc)

        if failures:
            raise RefreshFailedError(failures)

        packs = [self.build_pack(topic, pack_time) for topic in topic_list]
        return {
            "topics": topic_list,
            "fetched_at": snapshot_time,
            "generated_at": pack_time,
            "snapshots_created": len(snapshots),
            "packs_created": [pack.pack_id for pack in packs],
        }

    def list_packs(self, topic: str | None = None):
        return self.query_packs(topic=topic)["packs"]

    def query_packs(
        self,
        topic: str | None = None,
        generated_after: str | None = None,
        generated_before: str | None = None,
        limit: int | None = None,
        newest_first: bool = True,
    ) -> dict[str, Any]:
        if topic is not None:
            self._validate_topics([topic])
        if limit is not None and limit <= 0:
            raise RefreshValidationError("limit must be greater than zero")
        generated_after_dt = _parse_filter_datetime("generated_after", generated_after)
        generated_before_dt = _parse_filter_datetime("generated_before", generated_before)
        if generated_after_dt and generated_before_dt and generated_after_dt > generated_before_dt:
            raise RefreshValidationError("generated_after must be before or equal to generated_before")

        packs = self.pack_store.list(topic)
        if generated_after_dt is not None:
            packs = [pack for pack in packs if _parse_timestamp(pack.generated_at) >= generated_after_dt]
        if generated_before_dt is not None:
            packs = [pack for pack in packs if _parse_timestamp(pack.generated_at) <= generated_before_dt]
        packs = sorted(packs, key=lambda item: (item.generated_at, item.pack_id), reverse=newest_first)
        if limit is not None:
            packs = packs[:limit]
        return {
            "packs": packs,
            "filters": {
                "topic": topic,
                "generated_after": generated_after,
                "generated_before": generated_before,
                "limit": limit,
                "newest_first": newest_first,
            },
        }

    def get_pack(self, pack_id: str):
        return self.pack_store.get(pack_id)

    def explain_pack(self, pack_id: str) -> dict[str, Any] | None:
        pack = self.get_pack(pack_id)
        if pack is None:
            return None
        log_entries = self.transparency_log_store.list_entries(subject_id=pack.pack_id)
        evidence_items = list(pack.evidence)
        source_ids = sorted({item["source_id"] for item in evidence_items})
        source_snapshot_ids = list(pack.source_snapshot_ids)
        explanation_blocks = [
            {
                "kind": "summary",
                "label": "Pack summary",
                "text": pack.summary,
            },
            {
                "kind": "evidence",
                "label": "Evidence coverage",
                "text": (
                    f"This pack contains {len(evidence_items)} evidence items from {len(source_ids)} registry sources "
                    f"for the {pack.topic} topic."
                ),
            },
            {
                "kind": "provenance",
                "label": "Provenance",
                "text": (
                    f"Inputs are pinned to {len(source_snapshot_ids)} source snapshots and signed with "
                    f"{pack.signing_key_id}."
                ),
            },
        ]
        return {
            "pack_id": pack.pack_id,
            "topic": pack.topic,
            "generated_at": pack.generated_at,
            "summary": pack.summary,
            "source_snapshot_ids": source_snapshot_ids,
            "source_count": len(source_ids),
            "evidence_count": len(evidence_items),
            "signing_key_id": pack.signing_key_id,
            "explanation": {
                "text": (
                    f"Pack {pack.pack_id} was deterministically built from stored source snapshots for {pack.topic}."
                ),
                "blocks": explanation_blocks,
            },
            "transparency_references": [entry.entry_id for entry in log_entries],
        }

    def explain_topic(self, topic: str) -> dict[str, Any] | None:
        self._validate_topics([topic])
        packs = self.query_packs(topic=topic, limit=1, newest_first=True)["packs"]
        if not packs:
            return None
        return self.explain_pack(packs[0].pack_id)

    def list_transparency_log(
        self,
        subject_id: str | None = None,
        entry_type: str | None = None,
    ):
        return self.query_transparency_log(subject_id=subject_id, entry_type=entry_type)["entries"]

    def query_transparency_log(
        self,
        subject_id: str | None = None,
        entry_type: str | None = None,
    ) -> dict[str, Any]:
        entries = self.transparency_log_store.list_entries(subject_id=subject_id, entry_type=entry_type)
        return {
            "entries": entries,
            "filters": {
                "subject_id": subject_id,
                "entry_type": entry_type,
            },
        }

    def health(self) -> dict[str, object]:
        pack_count = len(self.list_packs())
        topics = self.topic_names()
        ready = bool(topics) and pack_count > 0
        return {
            "status": "ok",
            "ready": ready,
            "country_code": self.registry.country_code,
            "checks": {
                "registry_loaded": True,
                "topics_available": bool(topics),
                "packs_available": pack_count > 0,
            },
            "inventory": {
                "registry_sources": len(self.registry.sources),
                "topics": topics,
                "pack_count": pack_count,
                "transparency_log_entries": len(self.list_transparency_log()),
            },
        }

    def _validate_topics(self, topics: Iterable[str]) -> None:
        topic_list = list(topics)
        if not topic_list:
            raise RefreshValidationError("At least one topic must be provided")
        known_topics = set(self.topic_names())
        unknown_topics = sorted(set(topic_list) - known_topics)
        if unknown_topics:
            raise RefreshValidationError(f"Unsupported topics requested: {', '.join(unknown_topics)}")


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _parse_filter_datetime(field_name: str, value: str | None) -> datetime | None:
    if value is None:
        return None
    try:
        return _parse_timestamp(value)
    except ValueError as exc:
        raise RefreshValidationError(f"{field_name} must be an ISO-8601 UTC timestamp") from exc


def _parse_timestamp(value: str) -> datetime:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    return datetime.fromisoformat(normalized)
