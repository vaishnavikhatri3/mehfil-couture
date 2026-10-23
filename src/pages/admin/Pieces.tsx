import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Printer, ScanLine, X } from "lucide-react";
import { api, type Design, type Piece, type PieceStatus } from "../../lib/api";
import { toast } from "../../lib/toast";
import { downloadCsv, passportUrl, STATUS_LABEL } from "./qr";
import { LabelSheet, type LabelPiece } from "./LabelSheet";
import { PieceCard } from "./PieceCard";
import type { AdminCtx } from "./Admin";

/** ctx.preset: "lot:<id>" filters to a lot; any other value opens that piece. */
export function Pieces({ ctx }: { ctx: AdminCtx }) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [err, setErr] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fDesign, setFDesign] = useState("");
  const [fLot, setFLot] = useState(ctx.preset?.startsWith("lot:") ? ctx.preset.slice(4) : "");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(ctx.preset && !ctx.preset.startsWith("lot:") ? ctx.preset : null);
  const [sheet, setSheet] = useState<LabelPiece[] | null>(null);
  const [bulk, setBulk] = useState<PieceStatus | "">("");

  const load = () =>
    api<{ pieces: Piece[] }>("/api/admin/pieces", { admin: true })
      .then((r) => (setPieces(r.pieces), setErr("")))
      .catch((e) => (ctx.onAuthError(e), setErr(e.message)));
  useEffect(() => {
    load();
    api<{ designs: Design[] }>("/api/admin/designs", { admin: true }).then((r) => setDesigns(r.designs)).catch(ctx.onAuthError);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lots = useMemo(() => Array.from(new Set((pieces || []).map((p) => p.lotId).filter(Boolean) as string[])), [pieces]);
  const shown = useMemo(
    () =>
      (pieces || []).filter(
        (p) =>
          (!fStatus || p.status === fStatus) &&
          (!fDesign || p.designId === fDesign) &&
          (!fLot || p.lotId === fLot) &&
          (!flaggedOnly || p.flag) &&
          (!q || `${p.code} ${p.designName} ${p.colour} ${p.size} ${p.note}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [pieces, fStatus, fDesign, fLot, flaggedOnly, q],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { in_stock: 0, reserved: 0, sold: 0, void: 0 };
    for (const p of pieces || []) c[p.status]++;
    return c;
  }, [pieces]);
  const flagged = (pieces || []).filter((p) => p.flag).length;
  const selected = shown.filter((p) => sel.has(p.code));
  const allOn = shown.length > 0 && selected.length === shown.length;

  const toggle = (code: string) => setSel((s) => {
    const n = new Set(s);
    if (n.has(code)) n.delete(code);
    else n.add(code);
    return n;
  });

  async function applyBulk() {
    if (!bulk || !selected.length) return;
    try {
      const r = await api<{ changed: number }>("/api/admin/pieces/bulk", { method: "POST", admin: true, body: { codes: selected.map((p) => p.code), status: bulk } });
      toast(`${r.changed} piece${r.changed === 1 ? "" : "s"} marked ${STATUS_LABEL[bulk].toLowerCase()}.`);
      setSel(new Set());
      setBulk("");
      load();
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  function exportCsv() {
    const rows = (selected.length ? selected : shown).map((p) => [
      p.code, passportUrl(p.code), p.designId, p.designName, p.lotId, p.colour, p.size, p.status, p.soldAt, p.scans, p.devices, p.lastScanAt, p.leads, p.note, p.flag,
    ]);
    downloadCsv(
      [["code", "url", "design_id", "design", "lot", "colour", "size", "status", "sold_at", "scans", "phones", "last_scan", "leads", "note", "flag"], ...rows],
      `mehfil-pieces-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  return (
    <div className="ad__stack">
      <div className="ad__head">
        <div>
          <p className="label">Pieces</p>
          <h1 className="ad__h1">Every QR-tagged piece</h1>
        </div>
        <div className="ad__head-actions">
          <button type="button" className="ad__btn" onClick={() => ctx.go("scan")}><ScanLine size={15} /> Scan tags</button>
          <button type="button" className="ad__btn" onClick={exportCsv} disabled={!shown.length}><Download size={15} /> Export CSV{selected.length ? ` (${selected.length})` : ""}</button>
        </div>
      </div>

      <div className="pcs__status" role="group" aria-label="Filter by status">
        {[["", "All", pieces?.length ?? 0], ...Object.entries(counts).map(([k, v]) => [k, STATUS_LABEL[k], v])].map(([k, label, n]) => (
          <button key={k} type="button" className="pcs__seg" aria-pressed={fStatus === k && !flaggedOnly} onClick={() => (setFStatus(k as string), setFlaggedOnly(false))}>
            {label} <b>{n}</b>
          </button>
        ))}
        {flagged > 0 && (
          <button type="button" className="pcs__seg is-flag" aria-pressed={flaggedOnly} onClick={() => (setFlaggedOnly(!flaggedOnly), setFStatus(""))}>
            <AlertTriangle size={14} /> Needs a look <b>{flagged}</b>
          </button>
        )}
      </div>

      <div className="ad__filters">
        <input className="input" placeholder="Search code, design, colour, note" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search pieces" />
        <select className="input" value={fDesign} onChange={(e) => setFDesign(e.target.value)} aria-label="Filter by design">
          <option value="">All designs</option>
          {designs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input" value={fLot} onChange={(e) => setFLot(e.target.value)} aria-label="Filter by lot">
          <option value="">All lots</option>
          {lots.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="pcs__bulk ad__enter" role="region" aria-label="Bulk actions">
          <b>{selected.length} selected</b>
          <select className="input ad__sel" value={bulk} onChange={(e) => setBulk(e.target.value as PieceStatus)} aria-label="New status">
            <option value="">Change status to…</option>
            <option value="in_stock">In stock</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="void">Retired (tag no longer used)</option>
          </select>
          <button type="button" className="ad__btn" disabled={!bulk} onClick={applyBulk}>Apply</button>
          <button type="button" className="ad__btn" onClick={() => setSheet(selected.map((p) => ({ code: p.code, colour: p.colour, size: p.size, status: p.status, designName: p.designName })))}>
            <Printer size={15} /> Print labels
          </button>
          <button type="button" className="ad__icon" aria-label="Clear selection" onClick={() => setSel(new Set())}><X size={16} /></button>
        </div>
      )}

      {sheet && <LabelSheet title={`${sheet.length} selected pieces`} pieces={sheet} onClose={() => setSheet(null)} ctx={ctx} />}

      {!pieces ? (
        <p className="ad__empty">{err || "Loading pieces…"}</p>
      ) : !shown.length ? (
        <p className="ad__empty">{pieces.length ? "No pieces match these filters." : "No QR-tagged pieces yet. Generate a lot in the QR generator."}</p>
      ) : (
        <div className="ad__table-wrap">
          <table className="ad__table pcs__table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(shown.map((p) => p.code)))} aria-label="Select all shown" /></th>
                <th>Code</th><th>Design</th><th>Colour · size</th><th>Status</th><th className="num">Scans</th><th className="num">Phones</th><th>Last scan</th><th className="num">Leads</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 1000).map((p) => (
                <tr key={p.code} className={p.flag ? "is-flag" : ""} aria-selected={sel.has(p.code)}>
                  <td><input type="checkbox" checked={sel.has(p.code)} onChange={() => toggle(p.code)} aria-label={`Select ${p.code}`} /></td>
                  <td>
                    <button type="button" className="pcs__code" onClick={() => setOpen(p.code)}>{p.code}</button>
                    {p.flag && <small className="pcs__flag"><AlertTriangle size={12} /> {p.flag}</small>}
                    {p.note && <small>{p.note}</small>}
                  </td>
                  <td>{p.designName}<small>{p.lotId}</small></td>
                  <td>{p.colour} · {p.size}</td>
                  <td><span className={`pc__status is-${p.status}`}>{STATUS_LABEL[p.status]}</span>{p.soldAt && <small>{new Date(p.soldAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small>}</td>
                  <td className="num">{p.scans}</td>
                  <td className="num">{p.devices}</td>
                  <td>{p.lastScanAt ? new Date(p.lastScanAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                  <td className="num">{p.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length > 1000 && <p className="note">Showing the first 1,000 of {shown.length}. Narrow the filters or export CSV for the full list.</p>}
        </div>
      )}

      {open && (
        <div className="ad__drawer" role="dialog" aria-modal="true" aria-label={`Piece ${open}`} onClick={(e) => e.target === e.currentTarget && setOpen(null)} onKeyDown={(e) => e.key === "Escape" && setOpen(null)}>
          <div className="ad__drawer-card">
            <button type="button" className="ad__icon ad__drawer-x" aria-label="Close" onClick={() => setOpen(null)} autoFocus><X size={18} /></button>
            <PieceCard code={open} ctx={ctx} onChange={(np) => setPieces((ps) => ps && ps.map((x) => (x.code === np.code ? np : x)))} />
          </div>
        </div>
      )}
    </div>
  );
}
