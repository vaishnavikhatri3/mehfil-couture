"""
Tailor measurement-card reader on PaddleOCR (pretrained detection + recognition).

PaddleOCR returns one box per text fragment; a card row like "Kamar   28½" often
comes back as two boxes. Boxes are grouped into rows by vertical overlap and
joined left to right, so the browser's existing parser (src/lib/fitcheck/ocr.ts)
can map labels to fields exactly as it does for Tesseract output.
"""

import base64
import io
from threading import Lock

import numpy as np
from PIL import Image, ImageOps

MAX_SIDE = 2000

_engine = None
_lock = Lock()  # one PaddleOCR predictor isn't safe to call from two threads at once


def _get_engine():
    global _engine
    if _engine is None:
        from paddleocr import PaddleOCR  # heavy import; models download on first use

        _engine = PaddleOCR(
            lang="en",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )
    return _engine


def decode_image(data_url: str) -> np.ndarray:
    b64 = data_url.split(",", 1)[1] if data_url.startswith("data:") else data_url
    img = Image.open(io.BytesIO(base64.b64decode(b64)))
    img = ImageOps.exif_transpose(img).convert("RGB")  # phone photos carry rotation in EXIF
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    return np.asarray(img)[:, :, ::-1].copy()  # RGB → BGR, as PaddleOCR expects


def _rows(boxes: list[dict]) -> list[dict]:
    boxes.sort(key=lambda b: b["cy"])
    rows: list[list[dict]] = []
    for b in boxes:
        row = rows[-1] if rows else None
        if row and abs(b["cy"] - np.mean([x["cy"] for x in row])) < 0.5 * max(b["h"], np.median([x["h"] for x in row])):
            row.append(b)
        else:
            rows.append([b])
    out = []
    for row in rows:
        row.sort(key=lambda b: b["x"])
        out.append({"text": " ".join(b["text"] for b in row), "confidence": round(float(min(b["score"] for b in row)), 3)})
    return out


def read_card(image: np.ndarray) -> dict:
    with _lock:
        results = _get_engine().predict(image)
    boxes = []
    for res in results:
        for text, score, poly in zip(res["rec_texts"], res["rec_scores"], res["rec_polys"]):
            if not text.strip():
                continue
            p = np.asarray(poly, dtype=float)
            boxes.append({"text": text.strip(), "score": score, "x": p[:, 0].min(), "cy": p[:, 1].mean(), "h": np.ptp(p[:, 1])})
    lines = _rows(boxes)
    return {"engine": "paddleocr", "text": "\n".join(l["text"] for l in lines), "lines": lines}
