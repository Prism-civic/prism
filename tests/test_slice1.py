from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import tempfile
import unittest

from prism_country_mind.pipeline import SnapshotPipeline, TopicPackBuilder
from prism_country_mind.registry import load_registry
from prism_country_mind.service import CountryMindService
from prism_country_mind.signing import Signer
from prism_country_mind.storage import PackStore, SnapshotStore, TransparencyLogStore
from prism_country_mind.config import CountryMindConfig
from prism_country_mind.errors import RefreshFailedError, RefreshValidationError


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data" / "uk" / "source_registry.v1.json"


class Slice1Tests(unittest.TestCase):
    def test_registry_loads_expected_sources(self) -> None:
        registry = load_registry(REGISTRY_PATH)
        self.assertEqual(registry.schema_version, "source-registry/v1")
        self.assertEqual(registry.country_code, "GB")
        self.assertEqual(len(registry.sources), 7)
        self.assertEqual(
            [source.source_id for source in sorted(registry.for_topic("housing"), key=lambda item: item.source_id)],
            ["mhclg_housing_supply", "ons_house_prices", "ons_private_rent"],
        )

    def test_snapshot_storage_is_deterministic(self) -> None:
        registry = load_registry(REGISTRY_PATH)
        source = registry.by_id()["ons_house_prices"]
        with tempfile.TemporaryDirectory() as tmpdir:
            store = SnapshotStore(Path(tmpdir) / "snapshots")
            body = b"ons-house-prices-v1"
            fetched_at = "2026-03-20T08:36:00Z"
            snapshot = store.store(source, body, fetched_at, "text/plain")
            duplicate = store.store(source, body, fetched_at, "text/plain")

            expected_digest = sha256(body).hexdigest()
            expected_snapshot_id = sha256(
                f"{source.source_id}:{fetched_at}:{expected_digest}".encode("utf-8")
            ).hexdigest()[:24]

            self.assertEqual(snapshot.sha256, expected_digest)
            self.assertEqual(snapshot.snapshot_id, expected_snapshot_id)
            self.assertEqual(snapshot, duplicate)
            self.assertTrue(Path(snapshot.storage_path).exists())

    def test_housing_pack_builds_end_to_end(self) -> None:
        registry = load_registry(REGISTRY_PATH)
        housing_sources = sorted(registry.for_topic("housing"), key=lambda item: item.source_id)
        fixtures = {
            "mhclg_housing_supply": b"housing-supply-2026-03",
            "ons_house_prices": b"house-prices-2026-03",
            "ons_private_rent": b"private-rents-2026-03",
        }

        def fetcher(source):
            return fixtures[source.source_id], "text/plain"

        with tempfile.TemporaryDirectory() as tmpdir:
            snapshot_store = SnapshotStore(Path(tmpdir) / "snapshots")
            pack_store = PackStore(Path(tmpdir) / "packs")
            log_store = TransparencyLogStore(Path(tmpdir) / "transparency_log")
            pipeline = SnapshotPipeline(snapshot_store, fetcher=fetcher)
            signer = Signer("slice2-test-secret", "slice2-test-key")

            for index, source in enumerate(housing_sources, start=1):
                pipeline.snapshot_source(source, f"2026-03-2{index}T00:00:00Z")

            pack = TopicPackBuilder(
                topic="housing",
                snapshot_store=snapshot_store,
                pack_store=pack_store,
                transparency_log_store=log_store,
                signer=signer,
            ).build(
                registry=registry,
                generated_at="2026-03-25T12:00:00Z",
            )

            self.assertEqual(pack.schema_version, "evidence-pack/v1")
            self.assertEqual(pack.topic, "housing")
            self.assertEqual(pack.country_code, "GB")
            self.assertEqual(pack.signing_key_id, "slice2-test-key")
            self.assertTrue(pack.signature)
            self.assertEqual(
                pack.source_snapshot_ids,
                tuple(sorted(item["snapshot_id"] for item in pack.evidence)),
            )
            self.assertIn("mhclg_housing_supply", pack.summary)
            stored = pack_store.load("housing", pack.pack_id)
            self.assertEqual(stored, pack)
            log_entries = log_store.list_entries()
            self.assertEqual(len(log_entries), 1)
            self.assertEqual(log_entries[0].subject_id, pack.pack_id)

    def test_all_topic_packs_and_transparency_log_are_deterministic(self) -> None:
        registry = load_registry(REGISTRY_PATH)
        fixtures = {
            "mhclg_housing_supply": b"housing-supply-2026-03",
            "ons_house_prices": b"house-prices-2026-03",
            "ons_private_rent": b"private-rents-2026-03",
            "nhs_waiting_times": b"nhs-waiting-times-2026-03",
            "nhs_ae_attendances": b"nhs-ae-2026-03",
            "ons_cpi": b"cpi-2026-03",
            "ofgem_price_cap": b"price-cap-2026-q2",
        }

        def fetcher(source):
            return fixtures[source.source_id], "text/plain"

        with tempfile.TemporaryDirectory() as tmpdir:
            config = CountryMindConfig(
                root_dir=ROOT,
                registry_path=REGISTRY_PATH,
                storage_dir=Path(tmpdir) / "var",
                signing_secret="slice2-service-secret",
                signing_key_id="slice2-service-key",
            )
            service = CountryMindService(config)
            pipeline = SnapshotPipeline(service.snapshot_store, fetcher=fetcher)

            for index, source in enumerate(sorted(registry.sources, key=lambda item: item.source_id), start=1):
                pipeline.snapshot_source(source, f"2026-03-{index:02d}T00:00:00Z")

            housing_pack = service.build_pack("housing", "2026-03-25T12:00:00Z")
            nhs_pack = service.build_pack("nhs", "2026-03-25T12:05:00Z")
            col_pack = service.build_pack("cost_of_living", "2026-03-25T12:10:00Z")

            self.assertEqual(len(service.list_packs()), 3)
            self.assertEqual(service.get_pack(housing_pack.pack_id), housing_pack)
            self.assertEqual([pack.topic for pack in service.list_packs("nhs")], ["nhs"])
            self.assertEqual(
                [entry.subject_id for entry in service.list_transparency_log()],
                [housing_pack.pack_id, nhs_pack.pack_id, col_pack.pack_id],
            )
            self.assertTrue(housing_pack.signature)
            self.assertTrue(nhs_pack.signature)
            self.assertTrue(col_pack.signature)
            self.assertEqual(service.health()["transparency_log_entries"], 3)

    def test_refresh_is_idempotent_for_same_inputs(self) -> None:
        fixtures = {
            "mhclg_housing_supply": b"housing-supply-2026-03",
            "ons_house_prices": b"house-prices-2026-03",
            "ons_private_rent": b"private-rents-2026-03",
            "nhs_waiting_times": b"nhs-waiting-times-2026-03",
            "nhs_ae_attendances": b"nhs-ae-2026-03",
            "ons_cpi": b"cpi-2026-03",
            "ofgem_price_cap": b"price-cap-2026-q2",
        }

        def fetcher(source):
            return fixtures[source.source_id], "text/plain"

        with tempfile.TemporaryDirectory() as tmpdir:
            config = CountryMindConfig(
                root_dir=ROOT,
                registry_path=REGISTRY_PATH,
                storage_dir=Path(tmpdir) / "var",
                signing_secret="slice4-secret",
                signing_key_id="slice4-key",
            )
            service = CountryMindService(config)

            first = service.refresh(
                fetched_at="2026-03-20T12:00:00Z",
                generated_at="2026-03-20T12:05:00Z",
                fetcher=fetcher,
            )
            second = service.refresh(
                fetched_at="2026-03-20T12:00:00Z",
                generated_at="2026-03-20T12:05:00Z",
                fetcher=fetcher,
            )

            self.assertEqual(first["packs_created"], second["packs_created"])
            self.assertEqual(len(service.list_packs()), 3)
            self.assertEqual(len(service.list_transparency_log()), 3)

    def test_refresh_fails_cleanly_on_source_fetch_error(self) -> None:
        def fetcher(source):
            if source.source_id == "ons_house_prices":
                raise RuntimeError("upstream timeout")
            return b"ok", "text/plain"

        with tempfile.TemporaryDirectory() as tmpdir:
            config = CountryMindConfig(
                root_dir=ROOT,
                registry_path=REGISTRY_PATH,
                storage_dir=Path(tmpdir) / "var",
                signing_secret="slice4-secret",
                signing_key_id="slice4-key",
            )
            service = CountryMindService(config)

            with self.assertRaises(RefreshFailedError) as context:
                service.refresh(topics=["housing"], fetched_at="2026-03-20T12:00:00Z", fetcher=fetcher)

            self.assertEqual([failure.source_id for failure in context.exception.failures], ["ons_house_prices"])
            self.assertEqual(service.list_packs(), [])
            self.assertEqual(service.list_transparency_log(), [])

    def test_refresh_rejects_unknown_topics(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            config = CountryMindConfig(
                root_dir=ROOT,
                registry_path=REGISTRY_PATH,
                storage_dir=Path(tmpdir) / "var",
                signing_secret="slice4-secret",
                signing_key_id="slice4-key",
            )
            service = CountryMindService(config)

            with self.assertRaises(RefreshValidationError):
                service.refresh(topics=["transport"])


if __name__ == "__main__":
    unittest.main()
