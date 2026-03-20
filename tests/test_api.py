from __future__ import annotations

from pathlib import Path
import tempfile
import unittest

from prism_country_mind.app import create_app
from prism_country_mind.config import CountryMindConfig
from prism_country_mind.service import CountryMindService

try:
    from fastapi.testclient import TestClient
except ModuleNotFoundError:  # pragma: no cover - depends on local env
    TestClient = None


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data" / "uk" / "source_registry.v1.json"


@unittest.skipIf(TestClient is None, "fastapi test client is not installed")
class ApiTests(unittest.TestCase):
    def test_health_shows_ready_state_before_and_after_refresh(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            config = CountryMindConfig(
                root_dir=ROOT,
                registry_path=REGISTRY_PATH,
                storage_dir=Path(tmpdir) / "var",
                signing_secret="slice5-api-secret",
                signing_key_id="slice5-api-key",
            )
            service = CountryMindService(config)
            client = TestClient(create_app(service))

            health = client.get("/health")
            self.assertEqual(health.status_code, 200)
            self.assertFalse(health.json()["ready"])
            self.assertFalse(health.json()["checks"]["packs_available"])

            def fetcher(source):
                return b"ok", "text/plain"

            service.refresh(
                fetched_at="2026-03-20T12:00:00Z",
                generated_at="2026-03-20T12:05:00Z",
                fetcher=fetcher,
            )

            ready_health = client.get("/health")
            self.assertEqual(ready_health.status_code, 200)
            self.assertTrue(ready_health.json()["ready"])
            self.assertEqual(ready_health.json()["inventory"]["pack_count"], 3)

    def test_read_only_endpoints_return_expected_data(self) -> None:
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
                signing_secret="slice3-api-secret",
                signing_key_id="slice3-api-key",
            )
            service = CountryMindService(config)
            refresh_result = service.refresh(
                fetched_at="2026-03-20T12:00:00Z",
                generated_at="2026-03-20T12:05:00Z",
                fetcher=fetcher,
            )
            client = TestClient(create_app(service))

            health = client.get("/health")
            self.assertEqual(health.status_code, 200)
            self.assertEqual(health.json()["inventory"]["pack_count"], 3)

            topics = client.get("/topics")
            self.assertEqual(topics.status_code, 200)
            self.assertEqual([item["topic"] for item in topics.json()["topics"]], ["cost_of_living", "housing", "nhs"])
            self.assertEqual(topics.json()["count"], 3)

            packs = client.get("/packs")
            self.assertEqual(packs.status_code, 200)
            self.assertEqual(packs.json()["count"], 3)

            housing_packs = client.get("/packs", params={"topic": "housing"})
            self.assertEqual(housing_packs.status_code, 200)
            self.assertEqual([item["topic"] for item in housing_packs.json()["packs"]], ["housing"])

            pack_id = refresh_result["packs_created"][0]
            pack = client.get(f"/packs/{pack_id}")
            self.assertEqual(pack.status_code, 200)
            self.assertEqual(pack.json()["pack"]["pack_id"], pack_id)

            missing = client.get("/packs/not-a-real-pack")
            self.assertEqual(missing.status_code, 404)
            self.assertEqual(missing.json()["detail"]["error"]["code"], "pack_not_found")

            log = client.get("/transparency-log")
            self.assertEqual(log.status_code, 200)
            self.assertEqual(log.json()["count"], 3)

    def test_invalid_topic_returns_structured_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            config = CountryMindConfig(
                root_dir=ROOT,
                registry_path=REGISTRY_PATH,
                storage_dir=Path(tmpdir) / "var",
                signing_secret="slice5-api-secret",
                signing_key_id="slice5-api-key",
            )
            service = CountryMindService(config)
            client = TestClient(create_app(service))

            response = client.get("/packs", params={"topic": "transport"})
            self.assertEqual(response.status_code, 422)
            self.assertEqual(response.json()["detail"]["error"]["code"], "invalid_topic")
