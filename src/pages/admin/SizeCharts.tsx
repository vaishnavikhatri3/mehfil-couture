import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";
import { guessUnit, parseChart, type SizeChart } from "../../lib/fitcheck/sizechart";
import type { AdminCtx } from "./Admin";

const EXAMPLE = "Size,Bust,Waist,Hip\nXS,32,26,35\nS,34,28,37\nM,36,30,39\nL,38,32,41";

export function SizeCharts({ ctx }: { ctx: AdminCtx }) {
  const [charts, setCharts] = useState<SizeChart[] | null>(null);
  const [name, setName] = useState("");
  const [region, setRegion] = useState<"IN" | "UK" | "US">("IN");
  const [text, setText] = useState("");
  const [unit, setUnit] = useState<"in" | "cm" | "">("");
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const parsed = useMemo(() => (text.trim() ? parseChart(text) : null), [text]);
  const detected = parsed?.rows.length ? guessUnit(parsed.rows) : "in";

  const load = () => api<{ charts: SizeChart[] }>("/api/size-charts").then((r) => setCharts(r.charts)).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed?.rows.length) return;
    setErr("");
    try {
      await api("/api/admin/size-charts", { method: "POST", admin: true, body: { name: name || `${region} size chart`, region, unit: unit || detected, rows: parsed.rows } });
      toast("Size chart saved — FitCheck can benchmark against it now.");
      setName("");
      setText("");
      setUnit("");
      load();
    } catch (e2) {
      ctx.onAuthError(e2);
      setErr((e2 as Error).message);
    }
  }

  async function del(id: string) {
    try {
      await api(`/api/admin/size-charts/${id}`, { method: "DELETE", admin: true });
      setConfirmDel(null);
      load();
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  return (
    <div className="ad__stack">
      <div className="ad__head">
        <div>
          <p className="label">Size charts</p>
          <h1 className="ad__h1">Benchmarks for spotting outliers</h1>
        </div>
      </div>
      <form className="ad__card ad__form" onSubmit={save}>
        <h2 className="ad__h2">Add a chart</h2>
        <p className="note">Copy a brand's public size chart (Indian, UK or US) and paste it — a header row, then one row per size. “Chest” and “Hips” headers and ranges like 34–35 are understood.</p>
        <div className="ad__fgrid">
          <label className="field"><span>Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mehfil standard sizes" /></label>
          <label className="field"><span>Standard</span>
            <select className="input" value={region} onChange={(e) => setRegion(e.target.value as "IN" | "UK" | "US")}><option value="IN">Indian</option><option value="UK">UK</option><option value="US">US</option></select>
          </label>
          <label className="field"><span>Unit</span>
            <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as "in" | "cm" | "")}>
              <option value="">Detect ({detected === "cm" ? "centimetres" : "inches"})</option><option value="in">Inches</option><option value="cm">Centimetres</option>
            </select>
          </label>
          <label className="field ad__span2"><span>Paste the chart</span><textarea className="input ad__mono" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} /></label>
        </div>
        {parsed && (
          <div className="ad__preview">
            {parsed.rows.length > 0 && (
              <table className="ad__table">
                <thead><tr><th>Size</th><th className="num">Bust</th><th className="num">Waist</th><th className="num">Hip</th></tr></thead>
                <tbody>{parsed.rows.map((r) => <tr key={r.size}><td>{r.size}</td><td className="num">{r.bust}</td><td className="num">{r.waist}</td><td className="num">{r.hip}</td></tr>)}</tbody>
              </table>
            )}
            {parsed.errors.map((e) => <p key={e} className="field-error">{e}</p>)}
          </div>
        )}
        {err && <p className="field-error" role="alert">{err}</p>}
        <button className="btn" type="submit" disabled={!parsed?.rows.length || (parsed?.rows.length || 0) < 2}>Save chart</button>
      </form>

      <section className="ad__designs">
        {(charts || []).map((c) => (
          <article key={c.id} className="ad__card">
            <div className="ad__row">
              <div>
                <span className="label">{c.region} · {c.unit === "cm" ? "centimetres" : "inches"}{c.isSample ? " · sample" : ""}</span>
                <h2 className="ad__h2">{c.name}</h2>
              </div>
              {confirmDel === c.id ? (
                <span className="ad__confirm">
                  <button type="button" className="ad__btn ad__btn--danger" onClick={() => del(c.id)}>Delete</button>
                  <button type="button" className="ad__btn" onClick={() => setConfirmDel(null)}>Keep</button>
                </span>
              ) : (
                <button type="button" className="ad__icon" aria-label={`Delete ${c.name}`} onClick={() => setConfirmDel(c.id)}><Trash2 size={16} /></button>
              )}
            </div>
            <table className="ad__table">
              <thead><tr><th>Size</th><th className="num">Bust</th><th className="num">Waist</th><th className="num">Hip</th></tr></thead>
              <tbody>{c.rows.map((r) => <tr key={r.size}><td>{r.size}</td><td className="num">{r.bust}</td><td className="num">{r.waist}</td><td className="num">{r.hip}</td></tr>)}</tbody>
            </table>
          </article>
        ))}
      </section>
    </div>
  );
}
