from __future__ import annotations

from .service import CountryMindService


def create_app(service: CountryMindService | None = None):
    from fastapi import FastAPI, HTTPException, Query

    service = service or CountryMindService()
    app = FastAPI(title="Prism UK Country Mind", version="0.3.0")

    @app.get("/health")
    def health() -> dict[str, object]:
        return service.health()

    @app.get("/topics")
    def topics() -> list[dict[str, object]]:
        return service.topics()

    @app.get("/packs")
    def packs(topic: str | None = Query(default=None)) -> list[dict[str, object]]:
        return [pack.to_dict() for pack in service.list_packs(topic)]

    @app.get("/packs/{pack_id}")
    def pack_by_id(pack_id: str) -> dict[str, object]:
        pack = service.get_pack(pack_id)
        if pack is None:
            raise HTTPException(status_code=404, detail="Pack not found")
        return pack.to_dict()

    @app.get("/transparency-log")
    def transparency_log() -> list[dict[str, object]]:
        return [entry.to_dict() for entry in service.list_transparency_log()]

    return app


app = create_app()
