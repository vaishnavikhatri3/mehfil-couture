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

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
