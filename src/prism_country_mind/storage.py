from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path
from typing import Iterable

from .models import EvidencePack, SourceDefinition, SourceSnapshot, TransparencyLogEntry


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


class SnapshotStore:
    def __init__(self, root: Path) -> None:
        self.root = root

    def store(
        self,
        source: SourceDefinition,
        body: bytes,
        fetched_at: str,
        content_type: str = "application/octet-stream",
    ) -> SourceSnapshot:
        digest = sha256(body).hexdigest()
        snapshot_id = sha256(f"{source.source_id}:{fetched_at}:{digest}".encode("utf-8")).hexdigest()[:24]
        source_dir = self.root / source.source_id
        body_path = source_dir / f"{digest}.bin"
        metadata_path = source_dir / f"{snapshot_id}.json"
        source_dir.mkdir(parents=True, exist_ok=True)
        if not body_path.exists():
            body_path.write_bytes(body)
        elif body_path.read_bytes() != body:
            raise ValueError(f"Snapshot body collision detected for {source.source_id}")
        snapshot = SourceSnapshot(
            schema_version="source-snapshot/v1",
            snapshot_id=snapshot_id,
            source_id=source.source_id,
            url=source.url,
            fetched_at=fetched_at,
            sha256=digest,
            size_bytes=len(body),
            content_type=content_type,
            storage_path=str(body_path),
        )
        if metadata_path.exists():
            existing = _read_json(metadata_path)
            if existing != snapshot.to_dict():
                raise ValueError(f"Snapshot metadata collision detected for {source.source_id}")
        else:
            _write_json(metadata_path, snapshot.to_dict())
        return snapshot

    def list_snapshots(self, source_id: str) -> list[SourceSnapshot]:
        source_dir = self.root / source_id
        if not source_dir.exists():
            return []
        snapshots: list[SourceSnapshot] = []
        for path in sorted(source_dir.glob("*.json")):
            payload = json.loads(path.read_text(encoding="utf-8"))
            snapshots.append(
                SourceSnapshot(
                    schema_version=payload["schema_version"],
                    snapshot_id=payload["snapshot_id"],
                    source_id=payload["source_id"],
                    url=payload["url"],
                    fetched_at=payload["fetched_at"],
                    sha256=payload["sha256"],
                    size_bytes=payload["size_bytes"],
                    content_type=payload["content_type"],
                    storage_path=payload["storage_path"],
                )
            )
        return snapshots

    def latest_snapshot(self, source_id: str) -> SourceSnapshot | None:
        snapshots = self.list_snapshots(source_id)
        if not snapshots:
            return None
        return max(snapshots, key=lambda item: (item.fetched_at, item.snapshot_id))


class PackStore:
    def __init__(self, root: Path) -> None:
        self.root = root

    def store(self, pack: EvidencePack) -> Path:
        path = self.root / pack.topic / f"{pack.pack_id}.json"
        if path.exists():
            existing = _read_json(path)
            if existing != pack.to_dict():
                raise ValueError(f"Pack collision detected for {pack.pack_id}")
        else:
            _write_json(path, pack.to_dict())
        return path

    def load(self, topic: str, pack_id: str) -> EvidencePack | None:
        path = self.root / topic / f"{pack_id}.json"
        if not path.exists():
            return None
        payload = json.loads(path.read_text(encoding="utf-8"))
        return EvidencePack(
            schema_version=payload["schema_version"],
            pack_id=payload["pack_id"],
            topic=payload["topic"],
            country_code=payload["country_code"],
            generated_at=payload["generated_at"],
            source_snapshot_ids=tuple(payload["source_snapshot_ids"]),
            summary=payload["summary"],
            signature=payload["signature"],
            signing_key_id=payload["signing_key_id"],
            evidence=tuple(payload["evidence"]),
        )

    def list(self, topic: str | None = None) -> list[EvidencePack]:
        roots: Iterable[Path]
        if topic is None:
            roots = [path for path in sorted(self.root.iterdir()) if path.is_dir()] if self.root.exists() else []
        else:
            roots = [self.root / topic]
        packs: list[EvidencePack] = []
        for root in roots:
            if not root.exists():
                continue
            for path in sorted(root.glob("*.json")):
                payload = json.loads(path.read_text(encoding="utf-8"))
                packs.append(
                    EvidencePack(
                        schema_version=payload["schema_version"],
                        pack_id=payload["pack_id"],
                        topic=payload["topic"],
                        country_code=payload["country_code"],
                        generated_at=payload["generated_at"],
                        source_snapshot_ids=tuple(payload["source_snapshot_ids"]),
                        summary=payload["summary"],
                        signature=payload["signature"],
                        signing_key_id=payload["signing_key_id"],
                        evidence=tuple(payload["evidence"]),
                    )
                )
        return packs

    def get(self, pack_id: str) -> EvidencePack | None:
        for pack in self.list():
            if pack.pack_id == pack_id:
                return pack
        return None


class TransparencyLogStore:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.index_path = self.root / "entries.jsonl"

    def append(self, entry: TransparencyLogEntry) -> Path:
        path = self.root / f"{entry.entry_id}.json"
        self.root.mkdir(parents=True, exist_ok=True)
        if path.exists():
            existing = _read_json(path)
            if existing != entry.to_dict():
                raise ValueError(f"Transparency log collision detected for {entry.entry_id}")
            return path
        _write_json(path, entry.to_dict())
        with self.index_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry.to_dict(), sort_keys=True) + "\n")
        return path

    def list_entries(self) -> list[TransparencyLogEntry]:
        if not self.root.exists():
            return []
        entries: list[TransparencyLogEntry] = []
        for path in sorted(self.root.glob("*.json")):
            payload = json.loads(path.read_text(encoding="utf-8"))
            entries.append(
                TransparencyLogEntry(
                    schema_version=payload["schema_version"],
                    entry_id=payload["entry_id"],
                    entry_type=payload["entry_type"],
                    subject_id=payload["subject_id"],
                    created_at=payload["created_at"],
                    sha256=payload["sha256"],
                    signature=payload["signature"],
                    signing_key_id=payload["signing_key_id"],
                    payload=payload["payload"],
                )
            )
        return sorted(entries, key=lambda item: (item.created_at, item.entry_id))
