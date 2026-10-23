import { useEffect, useState } from "react";
import { Download, ExternalLink, Pencil, Plus, QrCode, Trash2, X } from "lucide-react";
import { api, swatch, type Design } from "../../lib/api";
import { toast } from "../../lib/toast";
import { downloadDataUrl, passportUrl, qrDataUrl } from "./qr";
import type { AdminCtx } from "./Admin";

type Form = { id: string; name: string; category: string; story: string; fabric: string; embroidery: string; care: string; colours: string; sizes: string; occasions: string; imageUrl: string };
const BLANK: Form = { id: "", name: "", category: "Handcrafted Bridal", story: "", fabric: "", embroidery: "", care: "", colours: "", sizes: "XS, S, M, L, XL", occasions: "", imageUrl: "" };

export function Designs({ ctx }: { ctx: AdminCtx }) {
  const [list, setList] = useState<Design[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [qr, setQr] = useState<{ design: Design; url: string } | null>(null);
  const [qrClosing, setQrClosing] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // Exit is quicker than the entrance; Escape closes instantly (keyboard actions don't animate)
  const closeQr = () => {
    setQrClosing(true);
    window.setTimeout(() => (setQr(null), setQrClosing(false)), 160);
  };
  useEffect(() => {
    if (!qr) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setQr(null), setQrClosing(false));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qr]);

  const load = () =>
    api<{ designs: Design[] }>("/api/admin/designs", { admin: true })
      .then((r) => setList(r.designs))
      .catch((e) => (ctx.onAuthError(e), setErr(e.message)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (d: Design) => {
    setEditing(d.id);
    setForm({ id: d.id, name: d.name, category: d.category, story: d.story, fabric: d.fabric, embroidery: d.embroidery, care: d.care, colours: d.colours.join(", "), sizes: d.sizes.join(", "), occasions: d.occasions.join(", "), imageUrl: d.imageUrl });
    setErr("");
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErr("");
    try {
      await api(editing ? `/api/admin/designs/${encodeURIComponent(editing)}` : "/api/admin/designs", { method: editing ? "PUT" : "POST", admin: true, body: form });
      toast(editing ? "Design updated." : "Design created.");
      setForm(null);
      setEditing(null);
      load();
    } catch (e2) {
      ctx.onAuthError(e2);
      setErr((e2 as Error).message);
    }
  }

  async function del(id: string) {
    try {
      await api(`/api/admin/designs/${encodeURIComponent(id)}`, { method: "DELETE", admin: true });
      toast("Design deleted.");
      setConfirmDel(null);
      load();
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  const f = form;
  const up = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((x) => (x ? { ...x, [k]: e.target.value } : x));

  return (
    <div className="ad__stack">
      <div className="ad__head">
        <div>
          <p className="label">Designs</p>
          <h1 className="ad__h1">What each QR passport shows</h1>
        </div>
        <button type="button" className="btn" onClick={() => (setEditing(null), setForm({ ...BLANK }), setErr(""))}>
          <Plus /> New design
        </button>
      </div>

      {f && (
        <form className="ad__card ad__form ad__enter" onSubmit={save}>
          <div className="ad__row">
            <h2 className="ad__h2">{editing ? `Edit ${editing}` : "New design"}</h2>
            <button type="button" className="ad__icon" aria-label="Close" onClick={() => (setForm(null), setEditing(null))}><X size={18} /></button>
          </div>
          <div className="ad__fgrid">
            <label className="field"><span>Design code</span><input className="input" value={f.id} onChange={up("id")} disabled={!!editing} placeholder="e.g. MC-BR-002 (auto if empty)" /></label>
            <label className="field"><span>Name</span><input className="input" value={f.name} onChange={up("name")} required /></label>
            <label className="field"><span>Collection</span>
              <select className="input" value={f.category} onChange={up("category")}>
                <option>Handcrafted Bridal</option><option>Luxury Prêt</option><option>Indo-Western</option>
              </select>
            </label>
            <label className="field ad__span2"><span>Embroidery story (shown on scan)</span><textarea className="input" rows={3} value={f.story} onChange={up("story")} /></label>
            <label className="field"><span>Fabric</span><input className="input" value={f.fabric} onChange={up("fabric")} /></label>
            <label className="field"><span>Embroidery</span><input className="input" value={f.embroidery} onChange={up("embroidery")} /></label>
            <label className="field"><span>Care</span><input className="input" value={f.care} onChange={up("care")} /></label>
            <label className="field"><span>Colours (comma separated)</span><input className="input" value={f.colours} onChange={up("colours")} placeholder="Maroon, Ivory" /></label>
            <label className="field"><span>Sizes (comma separated)</span><input className="input" value={f.sizes} onChange={up("sizes")} /></label>
            <label className="field"><span>Occasions (for recommendations)</span><input className="input" value={f.occasions} onChange={up("occasions")} placeholder="Wedding, Sangeet" /></label>
            <label className="field ad__span2"><span>Photo URL (optional)</span><input className="input" value={f.imageUrl} onChange={up("imageUrl")} placeholder="https://… (a mood image is shown if empty)" /></label>
          </div>
          {err && <p className="field-error" role="alert">{err}</p>}
          <div className="fc__actions">
            <button type="submit" className="btn">{editing ? "Save changes" : "Create design"}</button>
            <button type="button" className="link-arrow" onClick={() => (setForm(null), setEditing(null))}>Cancel</button>
          </div>
        </form>
      )}

      {!list ? (
        <p className="ad__empty">{err || "Loading designs…"}</p>
      ) : list.length === 0 ? (
        <p className="ad__empty">No designs yet. Create one to start generating QR tags.</p>
      ) : (
        <div className="ad__designs">
          {list.map((d) => (
            <article key={d.id} className="ad__card ad__design">
              <div className="ad__row">
                <div>
                  <span className="label">{d.id} · {d.category}{d.isDemo ? " · sample" : ""}</span>
                  <h2 className="ad__h2">{d.name}</h2>
                </div>
              </div>
              <p className="ad__story">{d.story || "No story yet."}</p>
              <div className="ad__chips">
                {d.colours.map((c) => <span key={c} className="ad__pill"><i style={{ background: swatch(c) }} />{c}</span>)}
                <span className="ad__pill ad__pill--soft">{d.sizes.join(" · ")}</span>
              </div>
              {d.stats && (
                <dl className="ad__mini">
                  <div><dt>Tagged</dt><dd>{d.stats.pieces}</dd></div>
                  <div><dt>In stock</dt><dd>{d.stats.inStock}</dd></div>
                  <div><dt>Scans</dt><dd>{d.stats.scans}</dd></div>
                  <div><dt>Leads</dt><dd>{d.stats.leads}</dd></div>
                </dl>
              )}
              <div className="ad__acts">
                <button type="button" className="ad__btn" onClick={() => ctx.go("lots", d.id)}><QrCode size={15} /> New QR lot</button>
                <button type="button" className="ad__btn" onClick={async () => setQr({ design: d, url: await qrDataUrl(d.id, 480) })}><QrCode size={15} /> Design QR</button>
                <a className="ad__btn" href={`/p/${d.id}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Preview passport</a>
                <button type="button" className="ad__btn" onClick={() => edit(d)}><Pencil size={15} /> Edit</button>
                {confirmDel === d.id ? (
                  <span className="ad__confirm">
                    Delete {d.id}?
                    <button type="button" className="ad__btn ad__btn--danger" onClick={() => del(d.id)}>Yes, delete</button>
                    <button type="button" className="ad__btn" onClick={() => setConfirmDel(null)}>Keep</button>
                  </span>
                ) : (
                  <button type="button" className="ad__btn" onClick={() => setConfirmDel(d.id)}><Trash2 size={15} /> Delete</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {qr && (
        <div className="ad__modal" role="dialog" aria-modal="true" aria-label={`QR for ${qr.design.name}`} data-closing={qrClosing || undefined} onClick={(e) => e.target === e.currentTarget && closeQr()}>
          <div className="ad__modal-card">
            <div className="ad__row">
              <h2 className="ad__h2">Design QR · {qr.design.id}</h2>
              <button type="button" className="ad__icon" aria-label="Close" onClick={closeQr}><X size={18} /></button>
            </div>
            <span className="ad__qr-print">
              <img src={qr.url} alt={`QR code for ${qr.design.name}`} className="ad__qr-big" />
            </span>
            <p className="note">Opens <code>{passportUrl(qr.design.id)}</code>. Use it on posters, the studio counter or Instagram. For individual garments, generate a lot so each piece has its own code and stock status.</p>
            <button type="button" className="btn" onClick={() => downloadDataUrl(qr.url, `${qr.design.id}-qr.png`)}><Download /> Download PNG</button>
          </div>
        </div>
      )}
    </div>
  );
}
