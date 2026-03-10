"""
Shared analytics — ładuje dashboard_final.json i zwraca go jako-is.
Punkt rozszerzenia dla przyszłych transformacji server-side.
"""

import json
import os


def compute_summary(json_path: str) -> dict:
    """Load pre-computed dashboard_final.json and return as dict."""
    with open(json_path, encoding="utf-8") as f:
        return json.load(f)
