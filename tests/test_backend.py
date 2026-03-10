"""
Testy backendu — uruchom z katalogu /aplikacja/:
    python -m pytest tests/ -v
"""
import io, sys, os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ── Test 1: parse_dbf_bytes ────────────────────────────────────────────────

from backend.shared.core.parsers import parse_dbf_bytes

DBF_PATH = os.path.join(os.path.dirname(__file__), "..", "dane", "dbf", "2025", "MP1250114.dbf")

def test_parse_dbf_returns_records():
    with open(DBF_PATH, "rb") as f:
        data = f.read()
    records = parse_dbf_bytes(data)
    assert len(records) == 5376, f"Oczekiwano 5376 rekordów, got {len(records)}"
    assert records[0]["WGM"] == "1401"
    assert records[0]["ROK"] == "2025"
    assert isinstance(records[0]["R5"], int)


# ── Test 2: parse_stopa_bytes ──────────────────────────────────────────────

from backend.shared.core.parsers import parse_stopa_bytes
import glob

STOPA_FILES = sorted(glob.glob(
    os.path.join(os.path.dirname(__file__), "..", "dane", "stopa_bezrobocia", "**", "*.xlsx"),
    recursive=True
))

def test_parse_stopa_returns_42_powiaty():
    assert STOPA_FILES, "Brak plików stopy bezrobocia"
    with open(STOPA_FILES[-1], "rb") as f:
        data = f.read()
    result = parse_stopa_bytes(data)
    assert len(result["powiaty_maz"]) == 42, f"Oczekiwano 42 powiaty, got {len(result['powiaty_maz'])}"
    assert result["stopa_maz"] is not None
    assert result["stopa_pl"] is not None
    assert len(result["woj_stopy"]) == 15


# ── Test 3: GET /api/summary przez FastAPI test client ─────────────────────

from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_summary_endpoint_returns_all_keys():
    resp = client.get("/api/summary")
    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text[:200]}"
    body = resp.json()
    for key in ("meta", "pulpit", "bezrobotni", "stopa", "wynagrodzenia", "pracujacy", "powiaty_lista"):
        assert key in body, f"Brak klucza '{key}' w /api/summary"
    assert body["meta"]["okres"] == "2026-01"


def test_summary_cors_header():
    resp = client.get("/api/summary", headers={"Origin": "http://localhost:5173"})
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
