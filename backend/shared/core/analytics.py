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


def _min_max(values: list[float], invert: bool = False) -> list[float]:
    if not values:
        return []
    v_min = min(values)
    v_max = max(values)
    span = (v_max - v_min) if (v_max - v_min) != 0 else 1.0
    out = [(v - v_min) / span for v in values]
    if invert:
        out = [1.0 - v for v in out]
    return out


def compute_resilience_from_summary(summary: dict) -> dict:
    """
    LMR teaser (Mazowsze): syntetyczny ranking odporności rynku pracy.
    Składowe:
    - stopa bezrobocia (im niższa, tym lepiej)
    - V/U ratio = oferty / bezrobotni (im wyższe, tym lepiej)
    - udział młodych bezrobotnych (im niższy, tym lepiej)
    - poziom płac brutto (im wyższy, tym lepiej)
    """
    powiaty = summary.get("powiaty_lista", []) or []
    cleaned = []
    for p in powiaty:
        bezr = p.get("bezr_razem") or 0
        if not bezr:
            continue
        stopa = p.get("stopa")
        oferty = p.get("oferty_pracy")
        do_30 = p.get("do_30")
        if do_30 is None:
            cats = p.get("kategorie") or []
            for c in cats:
                label = (c.get("label") or "").lower()
                if "do 30" in label:
                    do_30 = c.get("n")
                    break
        wyn = p.get("wyn_brutto")
        if stopa is None or oferty is None or do_30 is None or wyn is None:
            continue
        vu = float(oferty) / float(bezr)
        youth = float(do_30) / float(bezr)
        cleaned.append({
            "kod_teryt": p.get("wgm"),
            "nazwa": p.get("nazwa"),
            "stopa_pct": float(stopa),
            "vu_ratio": vu,
            "youth_share": youth,
            "avg_wage": float(wyn),
            "bezr_razem": int(bezr),
            "oferty_pracy": int(oferty),
        })

    if not cleaned:
        return {"okres": summary.get("meta", {}).get("okres"), "weights": {}, "items": []}

    n_stopa = _min_max([r["stopa_pct"] for r in cleaned], invert=True)
    n_vu = _min_max([r["vu_ratio"] for r in cleaned], invert=False)
    n_youth = _min_max([r["youth_share"] for r in cleaned], invert=True)
    n_wage = _min_max([r["avg_wage"] for r in cleaned], invert=False)

    weights = {"stopa": 0.4, "vu": 0.2, "youth": 0.1, "wage": 0.3}

    items = []
    for i, base in enumerate(cleaned):
        score = (
            n_stopa[i] * weights["stopa"]
            + n_vu[i] * weights["vu"]
            + n_youth[i] * weights["youth"]
            + n_wage[i] * weights["wage"]
        ) * 100.0
        tags = []
        if n_wage[i] >= 0.8:
            tags.append("Lider Płacowy")
        if n_vu[i] >= 0.8:
            tags.append("Rynek Pracownika")
        items.append({
            **base,
            "n_stopa": round(n_stopa[i], 4),
            "n_vu": round(n_vu[i], 4),
            "n_youth": round(n_youth[i], 4),
            "n_wage": round(n_wage[i], 4),
            "lmr_score": round(score, 1),
            "tags": tags,
        })

    items.sort(key=lambda x: x["lmr_score"], reverse=True)
    for idx, it in enumerate(items, start=1):
        it["rank"] = idx

    return {
        "okres": summary.get("meta", {}).get("okres"),
        "weights": weights,
        "items": items,
        "top5": items[:5],
    }
