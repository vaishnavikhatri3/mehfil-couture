import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Printer, X } from "lucide-react";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";
import { downloadCsv, downloadDataUrl, passportUrl, qrDataUrl } from "./qr";
import type { AdminCtx } from "./Admin";

export type LabelPiece = { code: string; colour: string; size: string; status: string; designName: string };

// Physical sizes so a printed tag matches the stock it's printed on (print at 100% / "actual size")
const SIZES = {
  sheet: "A4 sheet · 3 across",
  hang: "Hang tag · 50 × 70 mm",
  sticker: "Sticker · 50 × 25 mm",
} as const;
type Size = keyof typeof SIZES;
const SIZE_KEY = "mehfil-label-size";

export function LabelSheet({ title, pieces: initial, onClose, ctx }: { title: string; pieces: LabelPiece[]; onClose: () => void; ctx: AdminCtx }) {
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [pieces, setPieces] = useState(initial);
  const [size, setSize] = useState<Size>(() => {
    try {
      const s = localStorage.getItem(SIZE_KEY) as Size;
      return s in SIZES ? s : "sheet";
    } catch {
      return "sheet";
    }
  });
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    root.current?.scrollIntoView({ block: "start" });
  }, [title]);
  useEffect(() => {
    setPieces(initial);
    let alive = true;
    Promise.all(initial.map(async (p) => [p.code, await qrDataUrl(p.code, 300)] as const)).then((all) => alive && setQrs(Object.fromEntries(all)));
    return () => {
      alive = false;
    };
  }, [initial]);

  function pickSize(s: Size) {
    setSize(s);
    try {
      localStorage.setItem(SIZE_KEY, s);
    } catch {
      /* ignore */
    }
  }

  async function setStatus(code: string, status: string) {
    try {
      await api(`/api/admin/pieces/${code}`, { method: "PATCH", admin: true, body: { status } });
      setPieces((ps) => ps.map((p) => (p.code === code ? { ...p, status } : p)));
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  function exportCsv() {
    downloadCsv(
      [["code", "url", "design", "colour", "size", "status"], ...pieces.map((p) => [p.code, passportUrl(p.code), p.designName, p.colour, p.size, p.status])],
      `mehfil-labels-${title.replace(/[^A-Za-z0-9-]+/g, "-")}.csv`,
    );
  }

  return (
    <section className="ad__card lotsheet" ref={root} data-size={size}>
      <div className="ad__row no-print">
        <div>
          <span className="label">Label sheet · {pieces.length} tags</span>
          <h2 className="ad__h2">{title}</h2>
        </div>
        <div className="ad__acts">
          <select className="input ad__sel" value={size} onChange={(e) => pickSize(e.target.value as Size)} aria-label="Label size">
            {(Object.keys(SIZES) as Size[]).map((s) => <option key={s} value={s}>{SIZES[s]}</option>)}
          </select>
          <button type="button" className="ad__btn" onClick={exportCsv}><FileSpreadsheet size={15} /> CSV for label printer</button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              document.body.classList.add("printing-labels");
              window.print();
              window.setTimeout(() => document.body.classList.remove("printing-labels"), 500);
            }}
          >
            <Printer /> Print labels
          </button>
          <button type="button" className="ad__icon" aria-label="Close label sheet" onClick={onClose}><X size={18} /></button>
        </div>
      </div>
      <p className="note no-print">Print at 100% (“actual size”) so the tags come out at {SIZES[size].split("·")[1]?.trim() || "full size"}. Retired tags are left off.</p>
      <div className="lotsheet__grid">
        {pieces.filter((p) => p.status !== "void").map((p, i) => (
          <div key={p.code} className="tag" data-status={p.status} style={{ "--i": i } as React.CSSProperties}>
            <span className="tag__qr">{qrs[p.code] ? <img src={qrs[p.code]} alt={`QR ${p.code}`} /> : <span className="tag__ph" />}</span>
            <div className="tag__txt">
              <b>Mehfil Couture</b>
              <span>{p.designName}</span>
              <span>{p.colour} · {p.size}</span>
              <code>{p.code}</code>
              <small>Scan to verify &amp; see the story</small>
            </div>
            <div className="tag__ctl no-print">
              <select className="input" value={p.status} onChange={(e) => setStatus(p.code, e.target.value)} aria-label={`Status of ${p.code}`}>
                <option value="in_stock">In stock</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
              {qrs[p.code] && (
                <button type="button" className="ad__icon" aria-label={`Download QR ${p.code}`} onClick={() => downloadDataUrl(qrs[p.code], `${p.code}.png`)}><Download size={16} /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
