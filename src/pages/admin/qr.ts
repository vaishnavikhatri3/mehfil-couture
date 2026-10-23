import QRCode from "qrcode";

const BASE_KEY = "mehfil-qr-base";

/** Base URL the QR codes point to (the live site's domain). Defaults to this site. */
export const qrBase = {
  get: () => {
    try {
      return localStorage.getItem(BASE_KEY) || location.origin;
    } catch {
      return location.origin;
    }
  },
  set: (v: string) => {
    try {
      localStorage.setItem(BASE_KEY, v.replace(/\/+$/, ""));
    } catch {
      /* ignore */
    }
  },
};

export const passportUrl = (code: string) => `${qrBase.get()}/p/${encodeURIComponent(code)}`;

/** QR as a PNG data URL. Error correction M survives a slightly creased fabric tag. */
export const qrDataUrl = (code: string, width = 360) =>
  QRCode.toDataURL(passportUrl(code), { errorCorrectionLevel: "M", margin: 1, width, color: { dark: "#1f1612", light: "#ffffff" } });

/** A scanned QR holds the passport URL; a typed or USB-scanned value may be the bare code. */
export function codeFromScan(text: string) {
  const t = text.trim();
  const m = t.match(/\/p\/([^/?#\s]+)/i);
  return (m ? decodeURIComponent(m[1]) : t).toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export const STATUS_LABEL: Record<string, string> = { in_stock: "In stock", reserved: "Reserved", sold: "Sold", void: "Retired" };

export const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
export function downloadCsv(rows: unknown[][], filename: string) {
  const blob = new Blob(["﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
