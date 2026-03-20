from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, timezone

from .config import CountryMindConfig
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
        for topic in sorted({topic for source in self.registry.sources for topic in source.topics}):
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

    def build_pack(self, topic: str, generated_at: str):
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
        topic_list = sorted(set(topics or [item["topic"] for item in self.topics()]))
        source_ids = {
            source.source_id
            for topic in topic_list
            for source in self.registry.for_topic(topic)
        }
        snapshot_time = fetched_at or _utc_now()
        pack_time = generated_at or snapshot_time
        pipeline = SnapshotPipeline(self.snapshot_store, fetcher=fetcher)
        snapshots = []

        for source in sorted(self.registry.sources, key=lambda item: item.source_id):
            if source.source_id not in source_ids:
                continue
            snapshots.append(pipeline.snapshot_source(source, snapshot_time))

        packs = [self.build_pack(topic, pack_time) for topic in topic_list]
        return {
            "topics": topic_list,
            "fetched_at": snapshot_time,
            "generated_at": pack_time,
            "snapshots_created": len(snapshots),
            "packs_created": [pack.pack_id for pack in packs],
        }

    def list_packs(self, topic: str | None = None):
        return self.pack_store.list(topic)

    def get_pack(self, pack_id: str):
        return self.pack_store.get(pack_id)

    def list_transparency_log(self):
        return self.transparency_log_store.list_entries()

    def health(self) -> dict[str, object]:
        return {
            "status": "ok",
            "country_code": self.registry.country_code,
            "registry_sources": len(self.registry.sources),
            "topics": [item["topic"] for item in self.topics()],
            "pack_count": len(self.list_packs()),
            "transparency_log_entries": len(self.list_transparency_log()),
        }


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
