from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
import json
from pathlib import Path
import tempfile
import unittest

from prism_country_mind.__main__ import main
from prism_country_mind.app import create_app
from prism_country_mind.config import CountryMindConfig
from prism_country_mind.service import CountryMindService

try:
    from fastapi.testclient import TestClient
except ModuleNotFoundError:  # pragma: no cover - depends on local env
    TestClient = None


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data" / "uk" / "source_registry.v1.json"
FIXTURE_DIR = ROOT / "tests" / "fixtures" / "uk_sources"


@unittest.skipIf(TestClient is None, "fastapi test client is not installed")
class SmokeTests(unittest.TestCase):
    def test_cli_refresh_then_api_read_flow(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            storage_dir = Path(tmpdir) / "var"
            buffer = StringIO()
            with redirect_stdout(buffer):
                exit_code = main(
                    [
                        "--registry-path",
                        str(REGISTRY_PATH),
                        "--storage-dir",
                        str(storage_dir),
                        "--signing-secret",
                        "slice6-secret",
                        "--signing-key-id",
                        "slice6-key",
                        "refresh",
                        "--fixture-dir",
                        str(FIXTURE_DIR),
                        "--fetched-at",
                        "2026-03-20T12:00:00Z",
                        "--generated-at",
                        "2026-03-20T12:05:00Z",
                    ]
                )
            self.assertEqual(exit_code, 0)

            service = CountryMindService(
                CountryMindConfig(
                    root_dir=ROOT,
                    registry_path=REGISTRY_PATH,
                    storage_dir=storage_dir,
                    signing_secret="slice6-secret",
                    signing_key_id="slice6-key",
                )
            )
            client = TestClient(create_app(service))

            health = client.get("/health")
            self.assertEqual(health.status_code, 200)
            self.assertTrue(health.json()["ready"])

            packs = client.get("/packs")
            self.assertEqual(packs.status_code, 200)
            self.assertEqual(packs.json()["count"], 3)

            pack_id = packs.json()["packs"][0]["pack_id"]
            pack = client.get(f"/packs/{pack_id}")
            self.assertEqual(pack.status_code, 200)
            self.assertEqual(pack.json()["pack"]["pack_id"], pack_id)

    def test_cli_read_only_commands_return_machine_readable_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            storage_dir = Path(tmpdir) / "var"
            refresh_stdout = StringIO()
            with redirect_stdout(refresh_stdout):
                exit_code = main(
                    [
                        "--registry-path",
                        str(REGISTRY_PATH),
                        "--storage-dir",
                        str(storage_dir),
                        "--signing-secret",
                        "slice7-cli-secret",
                        "--signing-key-id",
                        "slice7-cli-key",
                        "refresh",
                        "--fixture-dir",
                        str(FIXTURE_DIR),
                        "--fetched-at",
                        "2026-03-20T12:00:00Z",
                        "--generated-at",
                        "2026-03-20T12:05:00Z",
                    ]
                )
            self.assertEqual(exit_code, 0)
            refresh_payload = json.loads(refresh_stdout.getvalue())
            housing_pack_id = refresh_payload["packs_created"][1]

            list_stdout = StringIO()
            with redirect_stdout(list_stdout):
                exit_code = main(
                    [
                        "--registry-path",
                        str(REGISTRY_PATH),
                        "--storage-dir",
                        str(storage_dir),
                        "list-packs",
                        "--topic",
                        "housing",
                    ]
                )
            self.assertEqual(exit_code, 0)
            list_payload = json.loads(list_stdout.getvalue())
            self.assertEqual(list_payload["count"], 1)
            self.assertEqual(list_payload["filters"]["topic"], "housing")
            self.assertEqual(list_payload["packs"][0]["pack_id"], housing_pack_id)

            show_stdout = StringIO()
            with redirect_stdout(show_stdout):
                exit_code = main(
                    [
                        "--registry-path",
                        str(REGISTRY_PATH),
                        "--storage-dir",
                        str(storage_dir),
                        "show-pack",
                        housing_pack_id,
                    ]
                )
            self.assertEqual(exit_code, 0)
            show_payload = json.loads(show_stdout.getvalue())
            self.assertEqual(show_payload["pack"]["pack_id"], housing_pack_id)

            log_stdout = StringIO()
            with redirect_stdout(log_stdout):
                exit_code = main(
                    [
                        "--registry-path",
                        str(REGISTRY_PATH),
                        "--storage-dir",
                        str(storage_dir),
                        "list-transparency-log",
                        "--subject-id",
                        housing_pack_id,
                        "--entry-type",
                        "evidence-pack",
                    ]
                )
            self.assertEqual(exit_code, 0)
            log_payload = json.loads(log_stdout.getvalue())
            self.assertEqual(log_payload["count"], 1)
            self.assertEqual(log_payload["entries"][0]["subject_id"], housing_pack_id)

    def test_cli_show_pack_returns_structured_error_for_missing_pack(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            stderr = StringIO()
            with redirect_stderr(stderr):
                exit_code = main(
                    [
                        "--registry-path",
                        str(REGISTRY_PATH),
                        "--storage-dir",
                        str(Path(tmpdir) / "var"),
                        "show-pack",
                        "missing-pack",
                    ]
                )
            self.assertEqual(exit_code, 1)
            self.assertEqual(json.loads(stderr.getvalue())["error"], "Pack not found: missing-pack")
