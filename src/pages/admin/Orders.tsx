import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ExternalLink, MessageCircle } from "lucide-react";
import { api, type Order } from "../../lib/api";
import { toast } from "../../lib/toast";
import { FIELDS, type FieldKey } from "../../lib/fitcheck/fields";
import type { AdminCtx } from "./Admin";

const STATUS: { key: string; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "stylist_review", label: "Stylist review" },
  { key: "tailor_review", label: "Tailor review" },
  { key: "in_production", label: "In production" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
  { key: "needs_remeasure", label: "Needs re-measure" },
];

type SpecRow = { field: string; label: string; body: string; ease: string; cutting: string; seam: string };

export function Orders({ ctx }: { ctx: AdminCtx }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    api<{ orders: Order[] }>("/api/admin/orders", { admin: true })
      .then((r) => setOrders(r.orders))
      .catch((e) => (ctx.onAuthError(e), setErr(e.message)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function setStatus(o: Order, status: string) {
    try {
      const r = await api<{ order: Order }>(`/api/admin/orders/${o.id}`, { method: "PATCH", admin: true, body: { status } });
      setOrders((os) => os && os.map((x) => (x.id === o.id ? r.order : x)));
      toast(`${o.id} → ${STATUS.find((s) => s.key === status)?.label}. The customer's timeline is updated.`);
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  return (
    <div className="ad__stack">
      <div className="ad__head">
        <div>
          <p className="label">FitCheck orders</p>
          <h1 className="ad__h1">Measurements waiting for review</h1>
        </div>
      </div>
      <p className="note">Move each order along its timeline — the customer sees every step on their order page. Use “Needs re-measure” to send them back to FitCheck.</p>
      {!orders ? (
        <p className="ad__empty">{err || "Loading orders…"}</p>
      ) : !orders.length ? (
        <p className="ad__empty">No FitCheck orders yet. They arrive when a customer confirms measurements at /fitcheck.</p>
      ) : (
        <div className="ad__table-wrap">
          <table className="ad__table">
            <thead><tr><th>Order</th><th>Garment</th><th className="num">Confidence</th><th>Event</th><th>Delivery</th><th>Stylist</th><th>Status</th><th /></tr></thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr>
                    <td><b>{o.id}</b><small>{new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {o.mode}</small></td>
                    <td>{o.garment}</td>
                    <td className="num"><span className={`ad__verdict is-${o.verdict}`}>{o.confidence}</span></td>
                    <td>{o.eventDate || "—"}</td>
                    <td>{o.feasibility ? o.feasibility.status.replace("_", " ") : "—"}</td>
                    <td>{o.stylistRequested ? "Requested" : "—"}</td>
                    <td>
                      <select className="input ad__sel" value={o.status} onChange={(e) => setStatus(o, e.target.value)} aria-label={`Status of ${o.id}`}>
                        {STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="ad__acts">
                      <button type="button" className="ad__btn" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}><ChevronDown size={15} /> Spec</button>
                      <a className="ad__icon" href={`/order/${o.id}`} target="_blank" rel="noreferrer" aria-label="Open customer timeline"><ExternalLink size={16} /></a>
                      {o.contact && (
                        <a className="ad__icon" href={`https://wa.me/${o.contact.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(`Hi! This is Mehfil Couture about your FitCheck order ${o.id}.`)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp the customer"><MessageCircle size={16} /></a>
                      )}
                    </td>
                  </tr>
                  {open === o.id && (
                    <tr className="ad__detail">
                      <td colSpan={8}>
                        <div className="ad__detail-grid">
                          <div>
                            <p className="label">Entered ({o.unit})</p>
                            <ul className="ad__kv">
                              {Object.entries(o.measurements).map(([k, v]) => <li key={k}><span>{FIELDS[k as FieldKey]?.label || k}</span><b>{Math.round(v * 100) / 100}</b></li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="label">Tailor spec</p>
                            <table className="spec__table">
                              <thead><tr><th>Measurement</th><th>Body</th><th>Ease</th><th>Cutting</th></tr></thead>
                              <tbody>
                                {((o.spec as SpecRow[]) || []).map((r) => <tr key={r.field}><td>{r.label}</td><td>{r.body}</td><td>{r.ease}</td><td><b>{r.cutting}</b></td></tr>)}
                              </tbody>
                            </table>
                            {o.notes && <p className="note">Notes: {o.notes}</p>}
                            {o.feasibility && <p className="note">{o.feasibility.advice} Ready ~{o.feasibility.readyBy}.</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
