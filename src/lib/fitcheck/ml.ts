import { api } from "../api";
import { FIELDS, toIn, type FieldKey, type Unit } from "./fields";

/**
 * Client for the FitCheck ML service (ml/app.py via /api/fitcheck/*):
 * an Isolation Forest that judges the measurements as a set, and PaddleOCR for
 * tailor cards. Both are optional — callers fall back when the service is down.
 */

export type Anomaly =
  | { checked: false; reason: string }
  | {
      checked: true; fields: FieldKey[]; score: number; anomalous: boolean;
      suspect?: { field: FieldKey; value: number; expectedLow: number; expectedHigh: number }; // inches
    };

const BODY: FieldKey[] = ["bust", "underbust", "waist", "hip", "shoulder", "armhole", "waistToFloor", "height"];

/** Body measurements in inches, keeping only values inside the hard limits (the rule engine owns the rest). */
export function bodyInches(values: Partial<Record<FieldKey, number>>, unit: Unit) {
  const out: Partial<Record<FieldKey, number>> = {};
  for (const k of BODY) {
    const raw = values[k];
    if (raw == null || !Number.isFinite(raw)) continue;
    const v = toIn(raw, unit);
    if (v >= FIELDS[k].hard[0] && v <= FIELDS[k].hard[1]) out[k] = Math.round(v * 100) / 100;
  }
  return out;
}

export const checkAnomaly = (inches: Partial<Record<FieldKey, number>>) =>
  api<Anomaly>("/api/fitcheck/anomaly", { method: "POST", body: { inches } });

/** Downscales the photo before upload — enough for OCR, far smaller than a phone original. */
async function toDataUrl(blob: Blob, maxSide = 1800): Promise<string> {
  const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.88);
}

export async function readCardOnServer(blob: Blob): Promise<string> {
  const image = await toDataUrl(blob);
  const r = await api<{ text: string }>("/api/fitcheck/ocr", { method: "POST", body: { image } });
  return r.text;
}
