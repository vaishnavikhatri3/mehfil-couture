import { useEffect, useState } from "react";
import { AlertTriangle, Download, ExternalLink, QrCode, ScanLine } from "lucide-react";
import { api, type Piece, type PieceDetail, type PieceStatus } from "../../lib/api";
import { toast } from "../../lib/toast";
import { downloadDataUrl, passportUrl, qrDataUrl, STATUS_LABEL } from "./qr";
import type { AdminCtx } from "./Admin";

const EVENT_LABEL: Record<string, string> = {
  created: "Tag created", in_stock: "Back in stock", reserved: "Reserved", sold: "Sold", returned: "Returned to stock", void: "Tag retired", note: "Note",
};

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** One QR-tagged piece: status, history and scans. Used by the Pieces drawer and the scanner. */
export function PieceCard({ code, ctx, onChange }: { code: string; ctx: AdminCtx; onChange?: (p: Piece) => void }) {
  const [d, setD] = useState<PieceDetail | null>(null);
  const [err, setErr] = useState("");
  const [qr, setQr] = useState("");
  const [note, setNote] = useState("");
  const [retiring, setRetiring] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api<PieceDetail>(`/api/admin/pieces/${encodeURIComponent(code)}`, { admin: true })
      .then((r) => (setD(r), setNote(r.piece.note), setErr("")))
      .catch((e) => (ctx.onAuthError(e), setErr(e.message)));
  useEffect(() => {
    setD(null);
    setRetiring(false);
    load();
    qrDataUrl(code, 360).then(setQr);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(body: { status?: PieceStatus; note?: string; reason?: string }, msg: string) {
    setBusy(true);
    try {
      const r = await api<{ piece: Piece }>(`/api/admin/pieces/${encodeURIComponent(code)}`, { method: "PATCH", admin: true, body });
      toast(msg);
      onChange?.(r.piece);
      setRetiring(false);
      await load();
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (err) return <p className="fc__err" role="alert">{err}</p>;
  if (!d) return <p className="ad__empty">Loading {code}…</p>;
  const p = d.piece;
  // Events and scans on one timeline, newest first
  const timeline = [
    ...d.events.map((e) => ({ at: e.at, kind: e.action, text: EVENT_LABEL[e.action] || e.action, detail: e.action === "created" ? `Lot ${e.detail}` : e.detail })),
    ...d.scans.map((s) => ({ at: s.at, kind: "scan", text: "Scanned", detail: s.device ? `phone ${s.device}` : null })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="pc">
      <div className="pc__head">
        <div>
          <span className="label">{p.designName}</span>
          <h3 className="pc__code">{p.code}</h3>
          <p className="pc__meta">
            {p.colour} · size {p.size} <span className={`pc__status is-${p.status}`}>{STATUS_LABEL[p.status]}</span>
          </p>
        </div>
        {qr && <img className="pc__qr" src={qr} alt={`QR for ${p.code}`} />}
      </div>

      {p.flag && (
        <p className="pc__flag" role="alert">
          <AlertTriangle size={16} /> {p.flag}
        </p>
      )}

      <dl className="ad__mini">
        <div><dt>Scans</dt><dd>{p.scans}</dd></div>
        <div><dt>Phones</dt><dd>{p.devices}</dd></div>
        <div><dt>Leads</dt><dd>{p.leads}</dd></div>
        <div><dt>Last scan</dt><dd className="pc__small">{p.lastScanAt ? new Date(p.lastScanAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</dd></div>
      </dl>

      {p.status === "void" ? (
        <div className="pc__acts">
          <button type="button" className="ad__btn" disabled={busy} onClick={() => patch({ status: "in_stock" }, `${p.code} is active again.`)}>Reactivate tag</button>
        </div>
      ) : (
        <div className="pc__acts" role="group" aria-label="Set status">
          {(["in_stock", "reserved", "sold"] as const).map((s) => (
            <button key={s} type="button" className="ad__btn pc__set" aria-pressed={p.status === s} disabled={busy || p.status === s} onClick={() => patch({ status: s }, `${p.code} marked ${STATUS_LABEL[s].toLowerCase()}.`)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
          {p.status !== "sold" && (
            <button type="button" className="ad__btn" aria-expanded={retiring} onClick={() => setRetiring(!retiring)}>Retire tag…</button>
          )}
        </div>
      )}
      {retiring && (
        <form className="pc__retire ad__enter" onSubmit={(e) => (e.preventDefault(), patch({ status: "void", reason: reason.trim() || undefined }, `${p.code} retired.`))}>
          <p className="note">A retired tag's passport tells the customer it's no longer in use. Use it for damaged, lost or replaced tags.</p>
          <input className="input" placeholder="Reason (e.g. tag torn, reprinted)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button type="submit" className="ad__btn ad__btn--danger" disabled={busy}>Retire {p.code}</button>
        </form>
      )}

      <form className="pc__note" onSubmit={(e) => (e.preventDefault(), patch({ note }, "Note saved."))}>
        <label className="field">
          <span>Studio note</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Invoice no., rack, alteration…" maxLength={300} />
        </label>
        <button type="submit" className="ad__btn" disabled={busy || note === p.note}>Save note</button>
      </form>

      <div className="pc__acts">
        <a className="ad__btn" href={passportUrl(p.code)} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open passport</a>
        {qr && <button type="button" className="ad__btn" onClick={() => downloadDataUrl(qr, `${p.code}.png`)}><Download size={15} /> QR image</button>}
        {p.leads > 0 && <button type="button" className="ad__btn" onClick={() => ctx.go("leads")}>See {p.leads} lead{p.leads > 1 ? "s" : ""}</button>}
      </div>

      <div>
        <h4 className="pc__h">History</h4>
        <ol className="pc__tl">
          {timeline.map((t, i) => (
            <li key={i} data-kind={t.kind}>
              {t.kind === "scan" ? <ScanLine size={14} /> : <QrCode size={14} />}
              <span>
                <b>{t.text}</b>
                {t.detail && <> · {t.detail}</>}
              </span>
              <time dateTime={t.at}>{when(t.at)}</time>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
