import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { api, swatch, type Piece } from "../../lib/api";
import { toast } from "../../lib/toast";
import { DailyChart, HBars } from "./charts";
import { STATUS_LABEL } from "./qr";
import type { AdminCtx } from "./Admin";

type Summary = {
  qr: { tagged: number; scanned: number; inStock: number; reserved: number; sold: number; void: number; topPieces: Piece[]; flagged: Piece[] };
  totals: { scans: number; leads: number; conversion: number; designs: number; pieces: number; inStock: number; orders: number; demoLeads: number };
  colours: { label: string; value: number }[];
  sizes: { label: string; value: number }[];
  occasions: { label: string; value: number }[];
  locations: { label: string; value: number }[];
  byDesign: { id: string; name: string; scans: number; leads: number }[];
  daily: { day: string; scans: number; leads: number }[];
};

export function Dashboard({ ctx }: { ctx: AdminCtx }) {
  const [s, setS] = useState<Summary | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    api<Summary>("/api/admin/summary", { admin: true })
      .then((r) => (setS(r), setErr("")))
      .catch((e) => (ctx.onAuthError(e), setErr(e.message)));
  }, [ctx]);
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function demo(action: "load" | "clear") {
    try {
      await api("/api/admin/demo", { method: "POST", admin: true, body: { action } });
      toast(action === "load" ? "Sample leads added — they're flagged DEMO everywhere." : "Sample leads removed.");
      load();
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  if (err) return <p className="fc__err">{err}</p>;
  if (!s) return <p className="ad__empty">Loading the dashboard…</p>;
  const t = s.totals;
  return (
    <div className="ad__stack">
      <div className="ad__head">
        <div>
          <p className="label">Dashboard</p>
          <h1 className="ad__h1">What your QR tags are telling you</h1>
        </div>
        <div className="ad__head-actions">
          <button
            type="button"
            className="ad__btn"
            onClick={(e) => {
              if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
                e.currentTarget.querySelector("svg")?.animate([{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], { duration: 600, easing: "cubic-bezier(0.77, 0, 0.175, 1)" });
              load();
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          {t.demoLeads > 0 ? (
            <button type="button" className="ad__btn" onClick={() => demo("clear")}>Remove {t.demoLeads} sample leads</button>
          ) : (
            <button type="button" className="ad__btn" onClick={() => demo("load")}>Load sample leads (for demo)</button>
          )}
        </div>
      </div>
      {t.demoLeads > 0 && <p className="ad__demo">Includes {t.demoLeads} sample leads marked DEMO — remove them before real use.</p>}

      <section className="ad__kpis" aria-label="Totals">
        <Kpi label="QR scans" value={t.scans} />
        <Kpi label="Leads (opted in)" value={t.leads} />
        <Kpi label="Scan → lead" value={`${t.conversion}%`} />
        <Kpi label="Pieces in stock" value={`${t.inStock} / ${t.pieces}`} sub="QR-tagged" />
        <Kpi label="FitCheck orders" value={t.orders} />
      </section>

      {s.qr.flagged.length > 0 && (
        <section className="ad__card db__flags" aria-labelledby="flags-title">
          <div className="ad__row">
            <h2 id="flags-title" className="ad__h2"><AlertTriangle size={16} /> Tags that need a look · {s.qr.flagged.length}</h2>
            <button type="button" className="ad__btn" onClick={() => ctx.go("pieces")}>Open Pieces</button>
          </div>
          <ul className="db__list">
            {s.qr.flagged.slice(0, 5).map((p) => (
              <li key={p.code}>
                <button type="button" className="pcs__code" onClick={() => ctx.go("pieces", p.code)}>{p.code}</button>
                <span>{p.flag}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ad__card">
        <div className="ad__row">
          <h2 className="ad__h2">QR tags</h2>
          <button type="button" className="ad__btn" onClick={() => ctx.go("pieces")}>All pieces</button>
        </div>
        {s.qr.tagged === 0 ? (
          <p className="ad__empty">No tags yet. Generate a lot in the QR generator, print the labels, and the numbers start here.</p>
        ) : (
          <>
            <div className="db__stock" role="img" aria-label={`${s.qr.inStock} in stock, ${s.qr.reserved} reserved, ${s.qr.sold} sold, ${s.qr.void} retired`}>
              {(["inStock", "reserved", "sold", "void"] as const).map((k) =>
                s.qr[k] ? <i key={k} className={`is-${k}`} style={{ flexGrow: s.qr[k] }} /> : null,
              )}
            </div>
            <dl className="ad__mini db__mini">
              <div><dt>Tagged</dt><dd>{s.qr.tagged}</dd></div>
              <div><dt>Scanned once+</dt><dd>{Math.round((s.qr.scanned / s.qr.tagged) * 100)}%</dd></div>
              <div><dt><i className="db__key is-inStock" />In stock</dt><dd>{s.qr.inStock}</dd></div>
              <div><dt><i className="db__key is-reserved" />Reserved</dt><dd>{s.qr.reserved}</dd></div>
              <div><dt><i className="db__key is-sold" />Sold</dt><dd>{s.qr.sold}</dd></div>
              <div><dt><i className="db__key is-void" />Retired</dt><dd>{s.qr.void}</dd></div>
            </dl>
            {s.qr.topPieces.length > 0 && (
              <div className="ad__table-wrap">
                <table className="ad__table">
                  <thead><tr><th>Most-scanned pieces</th><th>Status</th><th className="num">Scans</th><th className="num">Phones</th><th className="num">Leads</th></tr></thead>
                  <tbody>
                    {s.qr.topPieces.map((p) => (
                      <tr key={p.code}>
                        <td><button type="button" className="pcs__code" onClick={() => ctx.go("pieces", p.code)}>{p.code}</button><small>{p.designName} · {p.colour} · {p.size}</small></td>
                        <td><span className={`pc__status is-${p.status}`}>{STATUS_LABEL[p.status]}</span></td>
                        <td className="num">{p.scans}</td>
                        <td className="num">{p.devices}</td>
                        <td className="num">{p.leads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="note">A piece scanned by many phones but still on the rack is being looked at, not bought. Try it on a mannequin or move it near the trial room.</p>
          </>
        )}
      </section>

      <section className="ad__card">
        <h2 className="ad__h2">Scans and leads, last 14 days</h2>
        <DailyChart data={s.daily} />
      </section>

      <div className="ad__grid2">
        <section className="ad__card">
          <h2 className="ad__h2">Colour choices</h2>
          <HBars data={s.colours.slice(0, 10)} swatches={swatch} empty="No leads yet — colour choices appear here." />
        </section>
        <section className="ad__card">
          <h2 className="ad__h2">Sizes</h2>
          <HBars data={s.sizes} empty="No sizes yet." />
        </section>
        <section className="ad__card">
          <h2 className="ad__h2">Occasions</h2>
          <HBars data={s.occasions} empty="No occasions yet." />
        </section>
        <section className="ad__card">
          <h2 className="ad__h2">Locations</h2>
          <HBars data={s.locations} empty="No locations yet." />
        </section>
      </div>

      <section className="ad__card">
        <div className="ad__row">
          <h2 className="ad__h2">Designs by interest</h2>
          <button type="button" className="ad__btn" onClick={() => ctx.go("designs")}>Manage designs</button>
        </div>
        <div className="ad__table-wrap">
          <table className="ad__table">
            <thead><tr><th>Design</th><th className="num">Scans</th><th className="num">Leads</th><th className="num">Scan → lead</th></tr></thead>
            <tbody>
              {s.byDesign.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.name}</b><small>{d.id}</small></td>
                  <td className="num">{d.scans}</td>
                  <td className="num">{d.leads}</td>
                  <td className="num">{d.scans ? Math.round((d.leads / d.scans) * 100) + "%" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">High scans with low leads = people love the piece but something stops them. High leads with low stock = make more.</p>
      </section>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="ad__kpi">
      <span className="label">{label}</span>
      {/* Keyed so a changed number softly swaps in after Refresh */}
      <b key={value}>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}
