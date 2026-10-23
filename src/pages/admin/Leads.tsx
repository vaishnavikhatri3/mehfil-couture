import { useEffect, useMemo, useState } from "react";
import { Download, MapPin, MessageCircle, Trash2 } from "lucide-react";
import { api, swatch, type Design, type Lead } from "../../lib/api";
import { toast } from "../../lib/toast";
import { passportUrl } from "./qr";
import type { AdminCtx } from "./Admin";

/** Score designs for a lead: colour match, occasion match, size offered. */
function recommend(lead: Lead, designs: Design[]) {
  return designs
    .map((d) => {
      const lc = (s: string) => s.toLowerCase();
      const colour = d.colours.filter((c) => lead.colours.map(lc).includes(lc(c))).length;
      const occasion = lead.occasion && d.occasions.map(lc).some((o) => lc(lead.occasion!).includes(o) || o.includes(lc(lead.occasion!))) ? 1 : 0;
      const size = d.sizes.map(lc).includes(lc(lead.size)) || /custom/i.test(lead.size) ? 1 : 0;
      return { d, score: colour * 3 + occasion * 2 + size };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.d);
}

function message(lead: Lead, picks: Design[], scanned?: Design) {
  const likes = [lead.colours.join(" & ").toLowerCase(), lead.occasion ? `for a ${lead.occasion.toLowerCase()}` : ""].filter(Boolean).join(" ");
  return [
    "Hi! This is Mehfil Couture 🌸",
    scanned ? `Thank you for scanning our ${scanned.name}.` : "Thank you for scanning our tag.",
    `Since you love ${likes}, we picked these for you${lead.size && !/custom/i.test(lead.size) ? ` (size ${lead.size})` : ""}:`,
    ...picks.map((d) => `• ${d.name} — ${passportUrl(d.id)}`),
    "Reply to book a trial at our Indore studio. Reply STOP to opt out any time.",
  ].join("\n");
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function Leads({ ctx }: { ctx: AdminCtx }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [err, setErr] = useState("");
  const [fDesign, setFDesign] = useState("");
  const [fColour, setFColour] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = () =>
    Promise.all([api<{ leads: Lead[] }>("/api/admin/leads", { admin: true }), api<{ designs: Design[] }>("/api/admin/designs", { admin: true })])
      .then(([l, d]) => (setLeads(l.leads), setDesigns(d.designs)))
      .catch((e) => (ctx.onAuthError(e), setErr(e.message)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const name = (id: string) => designs.find((d) => d.id === id)?.name || id;
  const allColours = useMemo(() => Array.from(new Set((leads || []).flatMap((l) => l.colours))).sort(), [leads]);
  const shown = (leads || []).filter(
    (l) =>
      (!fDesign || l.designId === fDesign) &&
      (!fColour || l.colours.includes(fColour)) &&
      (!fStatus || l.status === fStatus) &&
      (!q || `${l.mobile} ${l.location.text || ""} ${l.size}`.toLowerCase().includes(q.toLowerCase())),
  );

  async function patch(id: string, status: "new" | "contacted") {
    try {
      await api(`/api/admin/leads/${id}`, { method: "PATCH", admin: true, body: { status } });
      setLeads((ls) => ls && ls.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/admin/leads/${id}`, { method: "DELETE", admin: true });
      setLeads((ls) => ls && ls.filter((l) => l.id !== id));
      setConfirmDel(null);
      toast("Lead deleted (data removed on request).");
    } catch (e) {
      ctx.onAuthError(e);
      toast((e as Error).message);
    }
  }

  function send(l: Lead) {
    const picks = recommend(l, designs);
    const scanned = designs.find((d) => d.id === l.designId);
    const text = message(l, picks.length ? picks : scanned ? [scanned] : [], scanned);
    const to = l.mobile.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1");
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    if (l.status === "new") patch(l.id, "contacted");
  }

  function exportCsv() {
    const head = ["created", "design", "piece", "occasion", "style", "budget", "mobile", "size", "location_method", "lat", "lng", "location_text", "colours", "consent_at", "status", "demo"];
    const rows = shown.map((l) => [l.createdAt, l.designId, l.pieceCode, l.occasion, l.style, l.budget, l.mobile, l.size, l.location.method, l.location.lat, l.location.lng, l.location.text, l.colours.join("; "), l.consentAt, l.status, l.isDemo ? "yes" : ""]);
    const blob = new Blob(["﻿" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mehfil-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="ad__stack">
      <div className="ad__head">
        <div>
          <p className="label">Leads</p>
          <h1 className="ad__h1">People who scanned and opted in</h1>
        </div>
        <button type="button" className="ad__btn" onClick={exportCsv} disabled={!shown.length}><Download size={15} /> Export CSV</button>
      </div>
      <p className="note">
        Every lead ticked the consent box (text and time stored). “Send picks” opens your WhatsApp Business app with a pre-filled message — you review
        and press send. Delete a lead whenever someone asks.
      </p>

      <div className="ad__filters">
        <select className="input" value={fDesign} onChange={(e) => setFDesign(e.target.value)} aria-label="Filter by design">
          <option value="">All designs</option>
          {designs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input" value={fColour} onChange={(e) => setFColour(e.target.value)} aria-label="Filter by colour">
          <option value="">All colours</option>
          {allColours.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter by status">
          <option value="">Any status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
        </select>
        <input className="input" placeholder="Search mobile, city, size" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leads" />
      </div>

      {!leads ? (
        <p className="ad__empty">{err || "Loading leads…"}</p>
      ) : !shown.length ? (
        <p className="ad__empty">{leads.length ? "No leads match these filters." : "No leads yet. They appear here when someone scans a tag and opts in."}</p>
      ) : (
        <div className="ad__table-wrap">
          <table className="ad__table ad__leads">
            <thead>
              <tr><th>When</th><th>Scanned</th><th>Preferences</th><th>Mobile</th><th>Size</th><th>Location</th><th>Colours</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.id} className={l.isDemo ? "is-demo" : ""}>
                  <td>{new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{l.isDemo && <small className="ad__demo-tag">DEMO</small>}</td>
                  <td>{name(l.designId)}{l.pieceCode && <small>{l.pieceCode}</small>}</td>
                  <td>{[l.occasion, l.style, l.budget].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="ad__mono">{l.mobile}</td>
                  <td>{l.size}</td>
                  <td>
                    {l.location.method === "gps" && l.location.lat != null ? (
                      <a className="ad__loc" href={`https://www.google.com/maps?q=${l.location.lat},${l.location.lng}`} target="_blank" rel="noreferrer">
                        <MapPin size={14} /> GPS ±{l.location.accuracy ?? "?"} m
                      </a>
                    ) : (
                      l.location.text
                    )}
                  </td>
                  <td>
                    <span className="ad__chips">
                      {l.colours.map((c) => <span key={c} className="ad__pill"><i style={{ background: swatch(c) }} />{c}</span>)}
                    </span>
                  </td>
                  <td>
                    <button type="button" className={`ad__status is-${l.status}`} onClick={() => patch(l.id, l.status === "new" ? "contacted" : "new")}>
                      {l.status === "new" ? "New" : "Contacted"}
                    </button>
                  </td>
                  <td className="ad__acts">
                    <button type="button" className="ad__btn ad__btn--wa" onClick={() => send(l)}><MessageCircle size={15} /> Send picks</button>
                    {confirmDel === l.id ? (
                      <>
                        <button type="button" className="ad__btn ad__btn--danger" onClick={() => remove(l.id)}>Delete data</button>
                        <button type="button" className="ad__btn" onClick={() => setConfirmDel(null)}>Keep</button>
                      </>
                    ) : (
                      <button type="button" className="ad__icon" aria-label="Delete lead" onClick={() => setConfirmDel(l.id)}><Trash2 size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
