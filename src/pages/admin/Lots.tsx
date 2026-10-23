import { useEffect, useMemo, useState } from "react";
import { Boxes, Eye, Plus, Trash2, X } from "lucide-react";
import { api, type Design } from "../../lib/api";
import { toast } from "../../lib/toast";
import { passportUrl, qrBase } from "./qr";
import { LabelSheet } from "./LabelSheet";
import type { AdminCtx } from "./Admin";

type Lot = { id: string; designId: string; designName: string; note: string; quantity: number; inStock?: number; createdAt: string };
type Piece = { code: string; colour: string; size: string; status: string };
type Line = { colour: string; size: string; qty: string };

export function Lots({ ctx }: { ctx: AdminCtx }) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [lots, setLots] = useState<Lot[] | null>(null);
  const [designId, setDesignId] = useState(ctx.preset || "");
  const [lines, setLines] = useState<Line[]>([{ colour: "", size: "", qty: "1" }]);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<{ lot: Lot; pieces: Piece[] } | null>(null);
  const [base, setBase] = useState(qrBase.get());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const design = designs.find((d) => d.id === designId);

  const loadLots = () =>
    api<{ lots: Lot[] }>("/api/admin/lots", { admin: true })
      .then((r) => setLots(r.lots))
      .catch((e) => (ctx.onAuthError(e), setErr(e.message)));
  useEffect(() => {
    api<{ designs: Design[] }>("/api/admin/designs", { admin: true })
      .then((r) => {
        setDesigns(r.designs);
        if (!designId && r.designs[0]) setDesignId(r.designs[0].id);
      })
      .catch(ctx.onAuthError);
    loadLots();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (design) setLines([{ colour: design.colours[0] || "", size: design.sizes[0] || "", qty: "1" }]);
  }, [designId]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = lines.reduce((s, l) => s + (parseInt(l.qty) || 0), 0);
  const labels = useMemo(() => sheet && sheet.pieces.map((p) => ({ ...p, designName: sheet.lot.designName })), [sheet]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await api<{ lot: Lot; pieces: Piece[] }>("/api/admin/lots", {
        method: "POST", admin: true,
        body: { designId, note, lines: lines.map((l) => ({ colour: l.colour, size: l.size, qty: parseInt(l.qty) || 0 })) },
      });
      toast(`${r.pieces.length} QR codes generated in ${r.lot.id}.`);
      setSheet({ lot: r.lot, pieces: r.pieces.map((p) => ({ ...p, status: "in_stock" })) });
      setNote("");
      loadLots();
    } catch (e2) {
      ctx.onAuthError(e2);
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openSheet(id: string) {
    try {
      setSheet(await api<{ lot: Lot; pieces: Piece[] }>(`/api/admin/lots/${id}`, { admin: true }));
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  async function delLot(id: string) {
    try {
      await api(`/api/admin/lots/${id}`, { method: "DELETE", admin: true });
      toast("Lot and its QR codes deleted.");
      setConfirmDel(null);
      if (sheet?.lot.id === id) setSheet(null);
      loadLots();
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  return (
    <div className="ad__stack">
      <div className="ad__head">
        <div>
          <p className="label">QR generator</p>
          <h1 className="ad__h1">Generate QR tags in lots</h1>
        </div>
      </div>

      <section className="ad__card">
        <h2 className="ad__h2">How a QR tag is generated</h2>
        <ol className="ad__how">
          <li><b>Pick a design.</b> Its story, fabric, colours and sizes are what the customer sees after scanning.</li>
          <li><b>Add lines to the lot</b> — colour × size × how many pieces you're tagging.</li>
          <li><b>Each piece gets a unique code</b> like <code>{designId || "MC-BR-001"}-4F2A9C</code>, saved as “in stock”.</li>
          <li><b>The QR encodes</b> <code>{passportUrl("CODE")}</code> — scanning opens the digital passport.</li>
          <li><b>The passport</b> shows the embroidery story, live sizes &amp; colours, and asks for the 5 details — only with an unticked consent box.</li>
          <li><b>Print the label sheet</b> (A4, hang tags or stickers), stitch or hang a tag on each piece.</li>
          <li><b>As pieces move</b>, scan the tag in <b>Scan tags</b> to mark it sold or reserved — the passport then shows the customer it's a genuine piece and when it was sold.</li>
        </ol>
        <label className="field ad__base">
          <span>QR links point to</span>
          <input className="input" value={base} onChange={(e) => setBase(e.target.value)} onBlur={() => (qrBase.set(base), setBase(qrBase.get()))} />
        </label>
        <p className="note">Set this to the live website address before printing real tags. Codes already printed keep working as long as the domain stays the same.</p>
      </section>

      <form className="ad__card ad__form" onSubmit={generate}>
        <h2 className="ad__h2">New lot</h2>
        <div className="ad__fgrid">
          <label className="field">
            <span>Design</span>
            <select className="input" value={designId} onChange={(e) => setDesignId(e.target.value)} required>
              {designs.map((d) => <option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Lot note (optional)</span>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Wedding season drop · rack 3" />
          </label>
        </div>
        <div className="ad__lines">
          {lines.map((l, i) => (
            <div key={i} className="ad__line ad__enter">
              <label className="field">
                <span>Colour</span>
                <select className="input" value={l.colour} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, colour: e.target.value } : x)))}>
                  {(design?.colours || []).map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Size</span>
                <select className="input" value={l.size} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))}>
                  {(design?.sizes || []).map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Pieces</span>
                <input className="input" inputMode="numeric" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: e.target.value.replace(/\D/g, "") } : x)))} />
              </label>
              <button type="button" className="ad__icon" aria-label={`Remove line ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, j) => j !== i))}><X size={18} /></button>
            </div>
          ))}
        </div>
        <div className="fc__actions">
          <button type="button" className="ad__btn" onClick={() => setLines([...lines, { colour: design?.colours[0] || "", size: design?.sizes[0] || "", qty: "1" }])}><Plus size={15} /> Add colour / size line</button>
          <span className="note">Total: <b>{total}</b> unique QR codes</span>
        </div>
        {err && <p className="field-error" role="alert">{err}</p>}
        <button type="submit" className="btn" disabled={busy || !designId || total < 1}>{busy ? "Generating…" : `Generate ${total} QR codes`}</button>
      </form>

      {sheet && labels && <LabelSheet title={`${sheet.lot.id} · ${sheet.lot.designName}`} pieces={labels} onClose={() => setSheet(null)} ctx={ctx} />}

      <section className="ad__card">
        <h2 className="ad__h2">Lots</h2>
        {!lots ? (
          <p className="ad__empty">Loading lots…</p>
        ) : lots.length === 0 ? (
          <p className="ad__empty">No lots yet. Generate your first batch of QR tags above.</p>
        ) : (
          <div className="ad__table-wrap">
            <table className="ad__table">
              <thead><tr><th>Lot</th><th>Design</th><th className="num">Pieces</th><th className="num">In stock</th><th>Created</th><th /></tr></thead>
              <tbody>
                {lots.map((l) => (
                  <tr key={l.id}>
                    <td><b>{l.id}</b>{l.note && <small>{l.note}</small>}</td>
                    <td>{l.designName}<small>{l.designId}</small></td>
                    <td className="num">{l.quantity}</td>
                    <td className="num">{l.inStock}</td>
                    <td>{new Date(l.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                    <td className="ad__acts">
                      <button type="button" className="ad__btn" onClick={() => openSheet(l.id)}><Eye size={15} /> Label sheet</button>
                      <button type="button" className="ad__btn" onClick={() => ctx.go("pieces", `lot:${l.id}`)}><Boxes size={15} /> Pieces</button>
                      {confirmDel === l.id ? (
                        <>
                          <button type="button" className="ad__btn ad__btn--danger" onClick={() => delLot(l.id)}>Delete {l.quantity} codes</button>
                          <button type="button" className="ad__btn" onClick={() => setConfirmDel(null)}>Keep</button>
                        </>
                      ) : (
                        <button type="button" className="ad__btn" onClick={() => setConfirmDel(l.id)}><Trash2 size={15} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
