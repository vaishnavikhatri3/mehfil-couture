"""
Training population for the measurement anomaly model. All values in INCHES.

There is no public body-measurement dataset for Mehfil's customers yet, so the
base population is synthetic: adult women's measurements generated from a shared
"size" factor plus height, with spreads tuned to the `typical` ranges in
src/lib/fitcheck/fields.ts. Real orders that passed every check (verdict
"green") are added on top, so the model learns the studio's own customers as
orders come in. Tune the constants with the master tailor.
"""

import json
import sqlite3
from pathlib import Path

import numpy as np

# Body measurements only. Sleeve and blouse length are style choices, not body shape.
BODY_FIELDS = ["bust", "underbust", "waist", "hip", "shoulder", "armhole", "waistToFloor", "height"]


def synthetic(n: int = 6000, seed: int = 7) -> np.ndarray:
    rng = np.random.default_rng(seed)
    height = rng.normal(61.5, 2.7, n)
    size = rng.normal(0, 1, n)  # one factor drives every circumference, so they move together
    bust = 35.5 + 4.2 * size + rng.normal(0, 1.3, n)
    underbust = bust - np.clip(rng.normal(4.0, 1.4, n), 1, 9)
    waist = 30 + 4.6 * size + rng.normal(0, 1.8, n)
    hip = 38.5 + 4.3 * size + rng.normal(0, 1.7, n)
    shoulder = 14.2 + 0.7 * size + 0.09 * (height - 61.5) + rng.normal(0, 0.55, n)
    armhole = 15.8 + 1.5 * size + rng.normal(0, 0.8, n)
    waist_to_floor = 0.625 * height + rng.normal(0, 0.9, n)
    cols = {"bust": bust, "underbust": underbust, "waist": waist, "hip": hip, "shoulder": shoulder,
            "armhole": armhole, "waistToFloor": waist_to_floor, "height": height}
    return np.column_stack([cols[f] for f in BODY_FIELDS])


def from_orders(db_path: str | None) -> np.ndarray:
    """Green orders as rows; fields an order didn't record are NaN."""
    if not db_path or not Path(db_path).exists():
        return np.empty((0, len(BODY_FIELDS)))
    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        rows = con.execute("SELECT unit, measurements FROM orders WHERE verdict = 'green'").fetchall()
    except sqlite3.Error:
        return np.empty((0, len(BODY_FIELDS)))
    finally:
        con.close()
    out = []
    for unit, raw in rows:
        try:
            m = json.loads(raw or "{}")
        except ValueError:
            continue
        k = 1 / 2.54 if unit == "cm" else 1.0
        out.append([float(m[f]) * k if isinstance(m.get(f), (int, float)) else np.nan for f in BODY_FIELDS])
    return np.array(out, dtype=float).reshape(-1, len(BODY_FIELDS))
