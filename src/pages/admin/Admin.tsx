import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Boxes, ClipboardList, LogOut, QrCode, Ruler, ScanLine, Shirt, Users } from "lucide-react";
import { adminToken, api, ApiError } from "../../lib/api";
import { usePageMeta } from "../../hooks/usePageMeta";
import { Dashboard } from "./Dashboard";
import { Designs } from "./Designs";
import { Lots } from "./Lots";
import { Pieces } from "./Pieces";
import { Scan } from "./Scan";
import { Leads } from "./Leads";
import { Orders } from "./Orders";
import { SizeCharts } from "./SizeCharts";
import "./admin.css";

export type Tab = "dashboard" | "designs" | "lots" | "pieces" | "scan" | "leads" | "orders" | "charts";
/** preset: what the next tab opens with — a design id for the QR generator, a piece code or "lot:<id>" for Pieces. */
export type AdminCtx = { go: (t: Tab, preset?: string) => void; onAuthError: (e: unknown) => void; preset: string | null };

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
  { key: "designs", label: "Designs", icon: <Shirt size={18} /> },
  { key: "lots", label: "QR generator", icon: <QrCode size={18} /> },
  { key: "pieces", label: "Pieces", icon: <Boxes size={18} /> },
  { key: "scan", label: "Scan tags", icon: <ScanLine size={18} /> },
  { key: "leads", label: "Leads", icon: <Users size={18} /> },
  { key: "orders", label: "FitCheck orders", icon: <ClipboardList size={18} /> },
  { key: "charts", label: "Size charts", icon: <Ruler size={18} /> },
];

export default function Admin() {
  usePageMeta("Studio portal — Mehfil Couture", "Mehfil Couture studio portal.");
  const [authed, setAuthed] = useState(!!adminToken.get());
  const [tab, setTab] = useState<Tab>(() => {
    const h = location.hash.slice(1) as Tab;
    return TABS.some((t) => t.key === h) ? h : "dashboard";
  });
  const [preset, setPreset] = useState<string | null>(null);

  useEffect(() => {
    history.replaceState(null, "", `#${tab}`);
  }, [tab]);

  // Active-tab pill: a styled copy of the tab row, clipped to the active tab.
  // Animating the clip moves background and text colour together, in sync.
  const track = useRef<HTMLDivElement>(null);
  const [clip, setClip] = useState<string>();
  const [pillReady, setPillReady] = useState(false);
  useLayoutEffect(() => {
    const row = track.current;
    if (!row) return;
    const measure = () => {
      const el = row.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
      if (!el) return;
      const right = row.offsetWidth - el.offsetLeft - el.offsetWidth;
      setClip(`inset(0 ${right}px 0 ${el.offsetLeft}px round 6px)`);
      // Keep the active tab visible when the row scrolls sideways on phones
      const nav = row.parentElement;
      if (nav && el.offsetLeft < nav.scrollLeft) nav.scrollLeft = el.offsetLeft;
      else if (nav && el.offsetLeft + el.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = el.offsetLeft + el.offsetWidth - nav.clientWidth;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [tab, authed]);
  // Skip the transition on first placement so the pill doesn't sweep in from the edge
  useEffect(() => {
    if (clip && !pillReady) requestAnimationFrame(() => setPillReady(true));
  }, [clip, pillReady]);

  const ctx: AdminCtx = {
    go: (t, p) => {
      setPreset(p ?? null);
      setTab(t);
      window.scrollTo(0, 0);
    },
    onAuthError: (e) => {
      if (e instanceof ApiError && e.status === 401) setAuthed(false);
    },
    preset,
  };

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="ad">
      <header className="ad__top">
        <Link to="/" className="ad__brand">
          <b>Mehfil</b> <span>Studio portal</span>
        </Link>
        <nav className="ad__tabs" aria-label="Portal sections">
          <div className="ad__tabs-track" ref={track}>
            {TABS.map((t) => (
              <button key={t.key} type="button" className="ad__tab" data-tab={t.key} aria-current={tab === t.key ? "page" : undefined} onClick={() => ctx.go(t.key)}>
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
            <div className="ad__tabs-pill" aria-hidden="true" data-ready={pillReady || undefined} style={{ clipPath: clip }}>
              {TABS.map((t) => (
                <span key={t.key} className="ad__tab" aria-current={tab === t.key ? "page" : undefined}>
                  {t.icon}
                  <span>{t.label}</span>
                </span>
              ))}
            </div>
          </div>
        </nav>
        <button type="button" className="ad__logout" onClick={() => (adminToken.set(null), setAuthed(false))}>
          <LogOut size={16} /> Sign out
        </button>
      </header>
      <main id="main" className="ad__main" key={`${tab}-${preset ?? ""}`}>
        {tab === "dashboard" && <Dashboard ctx={ctx} />}
        {tab === "designs" && <Designs ctx={ctx} />}
        {tab === "lots" && <Lots ctx={ctx} />}
        {tab === "pieces" && <Pieces ctx={ctx} />}
        {tab === "scan" && <Scan ctx={ctx} />}
        {tab === "leads" && <Leads ctx={ctx} />}
        {tab === "orders" && <Orders ctx={ctx} />}
        {tab === "charts" && <SizeCharts ctx={ctx} />}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const card = useRef<HTMLFormElement>(null);
  return (
    <main id="main" className="ad-login">
      <form
        ref={card}
        className="ad-login__card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          try {
            const r = await api<{ token: string }>("/api/admin/login", { method: "POST", body: { passcode: pass } });
            adminToken.set(r.token);
            onDone();
          } catch (e2) {
            setErr((e2 as Error).message);
            if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
              card.current?.animate(
                [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }],
                { duration: 340, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
              );
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="label label--gold">Mehfil Couture</p>
        <h1 className="h3">
          Studio <em>portal</em>
        </h1>
        <p className="note">For the Mehfil team: QR tags and pieces, scanning, leads, FitCheck orders and size charts.</p>
        <label className="field">
          <span>Passcode</span>
          <input className="input" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
        </label>
        {err && <p className="field-error" role="alert">{err}</p>}
        <button className="btn btn--block" type="submit" disabled={busy || !pass}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <Link to="/" className="link-arrow">← Back to the website</Link>
      </form>
    </main>
  );
}
