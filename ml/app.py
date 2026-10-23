"""
Mehfil FitCheck ML service. Called only by the Node API (server/api.mjs), never
by the browser directly, so it listens on localhost.

  cd ml && <venv>/Scripts/python -m uvicorn app:app --port 8001     (Windows)
  cd ml && <venv>/bin/python -m uvicorn app:app --port 8001         (macOS / Linux)

See README.md → "Running the ML service" for setup.

DB_PATH (default ../data/mehfil.db) adds the studio's green orders to the
anomaly model's training population at start-up.
"""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from anomaly import AnomalyModel
from card_ocr import decode_image, read_card

DB_PATH = os.environ.get("DB_PATH") or str(Path(__file__).resolve().parent.parent / "data" / "mehfil.db")

app = FastAPI(title="Mehfil FitCheck ML", docs_url=None, redoc_url=None)
model = AnomalyModel(DB_PATH)


class AnomalyIn(BaseModel):
    inches: dict[str, float] = Field(default_factory=dict)


class OcrIn(BaseModel):
    image: str = Field(max_length=8_000_000)  # base64 / data URL


@app.get("/health")
def health():
    return {"ok": True, "trainingRows": len(model.data), "realOrders": model.real_orders}


@app.post("/anomaly")
def anomaly(body: AnomalyIn):
    return model.check(body.inches)


@app.post("/ocr")
def ocr(body: OcrIn):
    try:
        image = decode_image(body.image)
    except Exception:
        raise HTTPException(400, "That file isn't a readable image.")
    return read_card(image)
