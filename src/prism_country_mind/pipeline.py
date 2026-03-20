from __future__ import annotations

from collections.abc import Callable
from hashlib import sha256
import json
from urllib.request import Request, urlopen

from .errors import SourceFetchError
from .models import EvidencePack, SourceDefinition, SourceRegistry, SourceSnapshot, TransparencyLogEntry
from .signing import Signer
from .storage import PackStore, SnapshotStore, TransparencyLogStore

FetchResult = tuple[bytes, str]
FetchFn = Callable[[SourceDefinition], FetchResult]


def default_fetch(source: SourceDefinition) -> FetchResult:
    request = Request(source.url, headers={"User-Agent": "PrismCountryMind/0.1"})
    with urlopen(request, timeout=30) as response:
        return response.read(), response.headers.get_content_type()


class SnapshotPipeline:
    def __init__(self, snapshot_store: SnapshotStore, fetcher: FetchFn | None = None) -> None:
        self.snapshot_store = snapshot_store
        self.fetcher = fetcher or default_fetch

    def snapshot_source(self, source: SourceDefinition, fetched_at: str) -> SourceSnapshot:
        try:
            body, content_type = self.fetcher(source)
        except SourceFetchError:
            raise
        except Exception as exc:
            raise SourceFetchError(source.source_id, source.url, str(exc)) from exc
        if not body:
            raise SourceFetchError(source.source_id, source.url, "empty response body")
        if not fetched_at:
            raise ValueError("fetched_at must be provided")
        return self.snapshot_store.store(
            source=source,
            body=body,
            fetched_at=fetched_at,
            content_type=content_type or "application/octet-stream",
        )


TOPIC_LABELS = {
    "housing": "Housing",
    "nhs": "NHS",
    "cost_of_living": "Cost of living",
}


class TopicPackBuilder:
    def __init__(
        self,
        topic: str,
        snapshot_store: SnapshotStore,
        pack_store: PackStore,
        transparency_log_store: TransparencyLogStore,
        signer: Signer,
    ) -> None:
        self.topic = topic
        self.snapshot_store = snapshot_store
        self.pack_store = pack_store
        self.transparency_log_store = transparency_log_store
        self.signer = signer

    def build(self, registry: SourceRegistry, generated_at: str) -> EvidencePack:
        sources = sorted(registry.for_topic(self.topic), key=lambda item: item.source_id)
        if not sources:
            raise ValueError(f"Registry does not contain sources for topic {self.topic}")

        evidence: list[dict[str, str]] = []
        snapshot_ids: list[str] = []
        for source in sources:
            snapshot = self.snapshot_store.latest_snapshot(source.source_id)
            if snapshot is None:
                raise ValueError(f"Missing snapshot for source {source.source_id}")
            snapshot_ids.append(snapshot.snapshot_id)
            evidence.append(
                {
                    "source_id": source.source_id,
                    "title": source.title,
                    "publisher": source.publisher,
                    "url": source.url,
                    "snapshot_id": snapshot.snapshot_id,
                    "snapshot_sha256": snapshot.sha256,
                    "fetched_at": snapshot.fetched_at,
                    "storage_path": snapshot.storage_path,
                }
            )

        topic_label = TOPIC_LABELS.get(self.topic, self.topic.replace("_", " ").title())
        summary = (
            f"{topic_label} pack built from {len(evidence)} official UK sources: "
            + ", ".join(item["source_id"] for item in evidence)
            + "."
        )
        unsigned_payload = {
            "country_code": registry.country_code,
            "evidence": evidence,
            "generated_at": generated_at,
            "schema_version": "evidence-pack/v1",
            "source_snapshot_ids": tuple(sorted(snapshot_ids)),
            "summary": summary,
            "topic": self.topic,
        }
        signature = self.signer.sign_json(
            json.dumps(unsigned_payload, sort_keys=True, separators=(",", ":"))
        )
        pack_id = sha256(
            json.dumps(unsigned_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()[:24]
        pack = EvidencePack(
            schema_version="evidence-pack/v1",
            pack_id=pack_id,
            topic=self.topic,
            country_code=registry.country_code,
            generated_at=generated_at,
            source_snapshot_ids=tuple(sorted(snapshot_ids)),
            summary=summary,
            signature=signature,
            signing_key_id=self.signer.key_id,
            evidence=tuple(evidence),
        )
        self.pack_store.store(pack)
        log_payload = {
            "topic": pack.topic,
            "pack_id": pack.pack_id,
            "signature": pack.signature,
            "source_snapshot_ids": list(pack.source_snapshot_ids),
        }
        log_sha = sha256(
            json.dumps(log_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        entry_id = sha256(f"evidence-pack:{pack.pack_id}:{generated_at}".encode("utf-8")).hexdigest()[:24]
        log_entry = TransparencyLogEntry(
            schema_version="transparency-log/v1",
            entry_id=entry_id,
            entry_type="evidence-pack",
            subject_id=pack.pack_id,
            created_at=generated_at,
            sha256=log_sha,
            signature=self.signer.sign_json(
                json.dumps(log_payload, sort_keys=True, separators=(",", ":"))
            ),
            signing_key_id=self.signer.key_id,
            payload=log_payload,
        )
        self.transparency_log_store.append(log_entry)
        return pack


class HousingPackBuilder(TopicPackBuilder):
    def __init__(
        self,
        snapshot_store: SnapshotStore,
        pack_store: PackStore,
        transparency_log_store: TransparencyLogStore,
        signer: Signer,
    ) -> None:
        super().__init__("housing", snapshot_store, pack_store, transparency_log_store, signer)
