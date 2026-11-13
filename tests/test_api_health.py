"""API smoke tests for the scaffold."""

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_root_redirects_to_docs():
    r = client.get("/", follow_redirects=False)
    assert r.status_code in (307, 302)
    assert r.headers["location"] == "/docs"


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["status"] == "ok"


def test_calendar_stub_shape():
    r = client.post(
        "/api/calendar",
        json={
            "aoi": {"bbox": [29.5, 22.0, 33.0, 31.5]},
            "start": "2025-01-01",
            "end": "2025-12-31",
            "include_static": False,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert "months" in body["data"]
    assert "years" in body["data"]
    assert body["meta"].get("stub") is True


def test_calendar_rejects_bad_bbox():
    r = client.post(
        "/api/calendar",
        json={
            "aoi": {"bbox": [33.0, 22.0, 29.5, 31.5]},
            "start": "2025-01-01",
            "end": "2025-12-31",
        },
    )
    assert r.status_code == 422


def test_methodology_stub():
    r = client.get("/api/methodology")
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert "plain_language" in r.json()["data"]

