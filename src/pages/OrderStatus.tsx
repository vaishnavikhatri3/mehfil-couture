import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { api, type Order } from "../lib/api";
import { usePageMeta } from "../hooks/usePageMeta";
import "./FitCheck.css";
import "./OrderStatus.css";

export const STEPS: { key: string; label: string; detail: string }[] = [
  { key: "submitted", label: "Measurements confirmed", detail: "You confirmed your checked measurements." },
  { key: "stylist_review", label: "Stylist review", detail: "A Mehfil stylist reviews your measurements with you remotely." },
  { key: "tailor_review", label: "Tailor review", detail: "Mehfil's in-house tailor approves the spec and allowances." },
  { key: "in_production", label: "In production", detail: "Embroidery, stitching and finishing are under way." },
  { key: "ready", label: "Ready", detail: "Your outfit has passed its final quality check." },
  { key: "delivered", label: "Delivered", detail: "Picked up or delivered. Enjoy the mehfil!" },
];

export default function OrderStatus() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  usePageMeta(`Order ${id} — Mehfil FitCheck`);

  useEffect(() => {
    api<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`).then((r) => setOrder(r.order)).catch((e) => setErr(e.message));
  }, [id]);

  if (err)
    return (
      <main id="main" className="wrap os">
        <p className="label label-row">Order timeline</p>
        <h1 className="fc__title">We couldn't find <em>that order.</em></h1>
        <p className="lede">{err}</p>
        <Link className="btn" to="/fitcheck">Start FitCheck <ArrowRight /></Link>
      </main>
    );
  if (!order) return <main id="main" className="wrap os" aria-busy="true"><p className="lede">Loading your order…</p></main>;

  const reached = new Set(order.timeline.map((t) => t.step));
  const remeasure = order.status === "needs_remeasure";
  const visible = STEPS.filter((s) => s.key !== "stylist_review" || order.stylistRequested);
  const currentIdx = visible.findIndex((s) => s.key === order.status);

  return (
    <main id="main" className="wrap os">
      <p className="label label-row">Order timeline · {order.id}</p>
      <h1 className="fc__title">
        Your outfit, <em>step by step.</em>
      </h1>
      <p className="lede">
        Measurement confidence {order.confidence}/100 · event {order.eventDate || "date not given"}
        {order.feasibility ? ` · ${order.feasibility.advice}` : ""}
      </p>

      {remeasure && (
        <div className="fc__err" role="alert">
          The tailor asked for a re-measure. <Link to="/fitcheck">Open FitCheck</Link> and check the highlighted measurement — your draft is saved on this device.
        </div>
      )}

      <ol className="os__steps">
        {visible.map((s, i) => {
          const done = reached.has(s.key) || (currentIdx > -1 && i < currentIdx);
          const now = s.key === order.status;
          const at = order.timeline.filter((t) => t.step === s.key).pop()?.at;
          return (
            <li key={s.key} className={`${done ? "is-done" : ""} ${now ? "is-now" : ""}`}>
              <span className="os__dot" aria-hidden="true" />
              <div>
                <b>{s.label}</b>
                <p>{s.detail}</p>
                {at && <small>{new Date(at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>}
                {s.key === "in_production" && order.feasibility && <small>Estimated ready: {order.feasibility.readyBy}</small>}
              </div>
            </li>
          );
        })}
      </ol>

      {!order.stylistRequested && !["ready", "delivered"].includes(order.status) && (
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await api<{ order: Order }>(`/api/orders/${order.id}/stylist`, { method: "POST" });
              setOrder(r.order);
            } catch (e) {
              setErr((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <MessageCircle /> Request a stylist-assisted review
        </button>
      )}
      <p className="note">Save this page's link to come back any time. Your spec isn't final until the tailor review step is complete.</p>
    </main>
  );
}
