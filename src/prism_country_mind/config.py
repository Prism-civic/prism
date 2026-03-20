from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


@dataclass(frozen=True, slots=True)
class CountryMindConfig:
    root_dir: Path = project_root()
    country_code: str = "GB"
    registry_path: Path = project_root() / "data" / "uk" / "source_registry.v1.json"
    storage_dir: Path = project_root() / "var" / "uk_country_mind"
    signing_secret: str = "prism-uk-country-mind-dev-secret"
    signing_key_id: str = "uk-country-mind-dev-v1"

    @property
    def snapshot_dir(self) -> Path:
        return self.storage_dir / "snapshots"

    @property
    def pack_dir(self) -> Path:
        return self.storage_dir / "packs"

    @property
    def transparency_log_dir(self) -> Path:
        return self.storage_dir / "transparency_log"
