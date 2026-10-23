import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, swatch } from "../../lib/api";
import { toast } from "../../lib/toast";
import { DailyChart, HBars } from "./charts";
import type { AdminCtx } from "./Admin";

type Summary = {
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
          <button type="button" className="ad__btn" onClick={load}><RefreshCw size={15} /> Refresh</button>
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
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}
