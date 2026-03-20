from __future__ import annotations

from .errors import RefreshValidationError
from .service import CountryMindService


def create_app(service: CountryMindService | None = None):
    from fastapi import FastAPI, HTTPException, Query

    service = service or CountryMindService()
    app = FastAPI(title="Prism UK Country Mind", version="0.4.0")

    def api_error(status_code: int, code: str, message: str, details: dict[str, object] | None = None):
        payload = {"error": {"code": code, "message": message}}
        if details:
            payload["error"]["details"] = details
        raise HTTPException(status_code=status_code, detail=payload)

    @app.get("/health")
    def health() -> dict[str, object]:
        return service.health()

    @app.get("/topics")
    def topics() -> dict[str, object]:
        topics_payload = service.topics()
        return {"topics": topics_payload, "count": len(topics_payload)}

    @app.get("/packs")
    def packs(topic: str | None = Query(default=None)) -> dict[str, object]:
        try:
            pack_items = [pack.to_dict() for pack in service.list_packs(topic)]
        except RefreshValidationError as exc:
            api_error(422, "invalid_topic", str(exc), {"topic": topic})
        return {"packs": pack_items, "count": len(pack_items), "topic_filter": topic}

    @app.get("/packs/{pack_id}")
    def pack_by_id(pack_id: str) -> dict[str, object]:
        pack = service.get_pack(pack_id)
        if pack is None:
            api_error(404, "pack_not_found", "Pack not found", {"pack_id": pack_id})
        return {"pack": pack.to_dict()}

    @app.get("/transparency-log")
    def transparency_log() -> dict[str, object]:
        entries = [entry.to_dict() for entry in service.list_transparency_log()]
        return {"entries": entries, "count": len(entries)}

    return app


app = create_app()
