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
FIXTURES = {
    "mhclg_housing_supply": b"housing-supply-2026-03",
    "ons_house_prices": b"house-prices-2026-03",
    "ons_private_rent": b"private-rents-2026-03",
    "nhs_waiting_times": b"nhs-waiting-times-2026-03",
    "nhs_ae_attendances": b"nhs-ae-2026-03",
    "ons_cpi": b"cpi-2026-03",
    "ofgem_price_cap": b"price-cap-2026-q2",
}


@unittest.skipIf(TestClient is None, "fastapi test client is not installed")
class ApiTests(unittest.TestCase):
    def build_client_with_data(self):
        def fetcher(source):
            return FIXTURES[source.source_id], "text/plain"

        tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(tmpdir.cleanup)
        config = CountryMindConfig(
            root_dir=ROOT,
            registry_path=REGISTRY_PATH,
            storage_dir=Path(tmpdir.name) / "var",
            signing_secret="slice7-api-secret",
            signing_key_id="slice7-api-key",
        )
        service = CountryMindService(config)
        refresh_result = service.refresh(
            fetched_at="2026-03-20T12:00:00Z",
            generated_at="2026-03-20T12:05:00Z",
            fetcher=fetcher,
        )
        second_refresh_result = service.refresh(
            topics=["housing"],
            fetched_at="2026-03-21T12:00:00Z",
            generated_at="2026-03-21T12:05:00Z",
            fetcher=fetcher,
        )
        return TestClient(create_app(service)), refresh_result, second_refresh_result

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
        client, refresh_result, _ = self.build_client_with_data()

        health = client.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["inventory"]["pack_count"], 4)

        topics = client.get("/topics")
        self.assertEqual(topics.status_code, 200)
        self.assertEqual([item["topic"] for item in topics.json()["topics"]], ["cost_of_living", "housing", "nhs"])
        self.assertEqual(topics.json()["count"], 3)

        packs = client.get("/packs")
        self.assertEqual(packs.status_code, 200)
        self.assertEqual(packs.json()["count"], 4)
        self.assertTrue(packs.json()["filters"]["newest_first"])

        housing_packs = client.get("/packs", params={"topic": "housing"})
        self.assertEqual(housing_packs.status_code, 200)
        self.assertEqual([item["topic"] for item in housing_packs.json()["packs"]], ["housing", "housing"])

        pack_id = refresh_result["packs_created"][0]
        pack = client.get(f"/packs/{pack_id}")
        self.assertEqual(pack.status_code, 200)
        self.assertEqual(pack.json()["pack"]["pack_id"], pack_id)

        missing = client.get("/packs/not-a-real-pack")
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(missing.json()["detail"]["error"]["code"], "pack_not_found")

        log = client.get("/transparency-log")
        self.assertEqual(log.status_code, 200)
        self.assertEqual(log.json()["count"], 4)
        self.assertEqual(log.json()["filters"], {"entry_type": None, "subject_id": None})

    def test_explain_endpoint_returns_deterministic_summary(self) -> None:
        client, refresh_result, _ = self.build_client_with_data()

        pack_id = refresh_result["packs_created"][0]
        response = client.get(f"/packs/{pack_id}/explain")

        self.assertEqual(response.status_code, 200)
        explanation = response.json()["explanation"]
        self.assertEqual(explanation["pack_id"], pack_id)
        self.assertIn(explanation["topic"], ["cost_of_living", "housing", "nhs"])
        self.assertEqual(explanation["source_count"], explanation["evidence_count"])
        self.assertTrue(explanation["transparency_references"])
        self.assertEqual(explanation["signing_key_id"], "slice7-api-key")

        by_topic = client.get("/explain", params={"topic": explanation["topic"]})
        self.assertEqual(by_topic.status_code, 200)
        self.assertEqual(by_topic.json()["explanation"]["pack_id"], explanation["pack_id"])

    def test_explain_endpoint_fails_cleanly(self) -> None:
        client, _, _ = self.build_client_with_data()

        missing_pack = client.get("/packs/not-a-real-pack/explain")
        self.assertEqual(missing_pack.status_code, 404)
        self.assertEqual(missing_pack.json()["detail"]["error"]["code"], "pack_not_found")

        missing_topic = client.get("/explain", params={"topic": "transport"})
        self.assertEqual(missing_topic.status_code, 422)
        self.assertEqual(missing_topic.json()["detail"]["error"]["code"], "invalid_topic")

    def test_pack_filtering_supports_date_limit_and_sorting(self) -> None:
        client, first_refresh_result, second_refresh_result = self.build_client_with_data()

        housing_only = client.get(
            "/packs",
            params={
                "topic": "housing",
                "generated_after": "2026-03-21T00:00:00Z",
                "limit": 1,
                "newest_first": "true",
            },
        )
        self.assertEqual(housing_only.status_code, 200)
        self.assertEqual(housing_only.json()["count"], 1)
        self.assertEqual(housing_only.json()["packs"][0]["pack_id"], second_refresh_result["packs_created"][0])

        oldest_first = client.get("/packs", params={"topic": "housing", "newest_first": "false"})
        self.assertEqual(oldest_first.status_code, 200)
        self.assertEqual(
            [item["pack_id"] for item in oldest_first.json()["packs"]],
            [first_refresh_result["packs_created"][1], second_refresh_result["packs_created"][0]],
        )

        invalid_filter = client.get("/packs", params={"generated_after": "not-a-timestamp"})
        self.assertEqual(invalid_filter.status_code, 422)
        self.assertEqual(invalid_filter.json()["detail"]["error"]["code"], "invalid_pack_filter")

    def test_transparency_log_filtering_supports_subject_and_type(self) -> None:
        client, refresh_result, _ = self.build_client_with_data()

        pack_id = refresh_result["packs_created"][1]
        by_subject = client.get("/transparency-log", params={"subject_id": pack_id})
        self.assertEqual(by_subject.status_code, 200)
        self.assertEqual(by_subject.json()["count"], 1)
        self.assertEqual(by_subject.json()["entries"][0]["subject_id"], pack_id)
        self.assertEqual(by_subject.json()["filters"]["subject_id"], pack_id)

        by_type = client.get("/transparency-log", params={"entry_type": "evidence-pack"})
        self.assertEqual(by_type.status_code, 200)
        self.assertEqual(by_type.json()["count"], 4)
        self.assertTrue(all(entry["entry_type"] == "evidence-pack" for entry in by_type.json()["entries"]))

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
