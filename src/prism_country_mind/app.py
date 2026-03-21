from __future__ import annotations

from .errors import RefreshValidationError
from .service import CountryMindService


def create_app(service: CountryMindService | None = None):
    from fastapi import FastAPI, HTTPException, Query

    service = service or CountryMindService()
    app = FastAPI(title="Prism UK Country Mind", version="0.5.0")

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
    def packs(
        topic: str | None = Query(default=None),
        generated_after: str | None = Query(default=None),
        generated_before: str | None = Query(default=None),
        limit: int | None = Query(default=None, ge=1),
        newest_first: bool = Query(default=True),
    ) -> dict[str, object]:
        try:
            result = service.query_packs(
                topic=topic,
                generated_after=generated_after,
                generated_before=generated_before,
                limit=limit,
                newest_first=newest_first,
            )
        except RefreshValidationError as exc:
            error_code = "invalid_topic" if topic and "Unsupported topics requested" in str(exc) else "invalid_pack_filter"
            api_error(
                422,
                error_code,
                str(exc),
                {
                    "topic": topic,
                    "generated_after": generated_after,
                    "generated_before": generated_before,
                    "limit": limit,
                    "newest_first": newest_first,
                },
            )
        pack_items = [pack.to_dict() for pack in result["packs"]]
        return {"packs": pack_items, "count": len(pack_items), "filters": result["filters"]}

    @app.get("/packs/{pack_id}")
    def pack_by_id(pack_id: str) -> dict[str, object]:
        pack = service.get_pack(pack_id)
        if pack is None:
            api_error(404, "pack_not_found", "Pack not found", {"pack_id": pack_id})
        return {"pack": pack.to_dict()}

    @app.get("/packs/{pack_id}/explain")
    def explain_pack(pack_id: str) -> dict[str, object]:
        explanation = service.explain_pack(pack_id)
        if explanation is None:
            api_error(404, "pack_not_found", "Pack not found", {"pack_id": pack_id})
        return {"explanation": explanation}

    @app.get("/explain")
    def explain_topic(topic: str = Query(...)) -> dict[str, object]:
        try:
            explanation = service.explain_topic(topic)
        except RefreshValidationError as exc:
            api_error(422, "invalid_topic", str(exc), {"topic": topic})
        if explanation is None:
            api_error(404, "topic_pack_not_found", "No pack found for topic", {"topic": topic})
        return {"explanation": explanation}

    @app.get("/transparency-log")
    def transparency_log(
        subject_id: str | None = Query(default=None),
        entry_type: str | None = Query(default=None),
    ) -> dict[str, object]:
        result = service.query_transparency_log(subject_id=subject_id, entry_type=entry_type)
        entries = [entry.to_dict() for entry in result["entries"]]
        return {"entries": entries, "count": len(entries), "filters": result["filters"]}

    return app


app = create_app()
