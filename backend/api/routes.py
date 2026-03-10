from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from shared.core.parsers import parse_dbf_bytes, parse_excel_bytes
from shared.core.analytics import compute_summary

router = APIRouter()


@router.post("/parse/dbf")
async def parse_dbf(file: UploadFile = File(...)):
    """Parse uploaded DBF file, return records as JSON."""
    if not file.filename.lower().endswith(".dbf"):
        raise HTTPException(400, "Expected .dbf file")
    data = await file.read()
    try:
        records = parse_dbf_bytes(data)
    except Exception as e:
        raise HTTPException(422, f"Parse error: {e}")
    return {"filename": file.filename, "count": len(records), "records": records}


@router.post("/analyze/wup-data")
async def analyze_wup(file: UploadFile = File(...)):
    """Parse uploaded Excel (.xlsx) and return analytics payload."""
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(400, "Expected .xlsx file")
    data = await file.read()
    try:
        result = parse_excel_bytes(data)
    except Exception as e:
        raise HTTPException(422, f"Parse error: {e}")
    return result


@router.get("/summary")
async def get_summary():
    """Return pre-computed dashboard_final.json from disk."""
    json_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "wup-dashboard", "public", "data", "dashboard_final.json"
    )
    if not os.path.exists(json_path):
        raise HTTPException(404, "dashboard_final.json not found — run extract_data.py first")
    try:
        summary = compute_summary(json_path)
    except Exception as e:
        raise HTTPException(500, f"Analytics error: {e}")
    return JSONResponse(content=summary)
