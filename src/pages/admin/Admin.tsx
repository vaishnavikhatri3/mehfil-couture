import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ClipboardList, LogOut, QrCode, Ruler, Shirt, Users } from "lucide-react";
import { adminToken, api, ApiError } from "../../lib/api";
import { usePageMeta } from "../../hooks/usePageMeta";
import { Dashboard } from "./Dashboard";
import { Designs } from "./Designs";
import { Lots } from "./Lots";
import { Leads } from "./Leads";
import { Orders } from "./Orders";
import { SizeCharts } from "./SizeCharts";
import "./admin.css";

export type Tab = "dashboard" | "designs" | "lots" | "leads" | "orders" | "charts";
export type AdminCtx = { go: (t: Tab, designId?: string) => void; onAuthError: (e: unknown) => void; presetDesign: string | null };

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
  { key: "designs", label: "Designs", icon: <Shirt size={18} /> },
  { key: "lots", label: "QR generator", icon: <QrCode size={18} /> },
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
  const [presetDesign, setPresetDesign] = useState<string | null>(null);

  useEffect(() => {
    history.replaceState(null, "", `#${tab}`);
  }, [tab]);

  const ctx: AdminCtx = {
    go: (t, designId) => {
      setPresetDesign(designId ?? null);
      setTab(t);
      window.scrollTo(0, 0);
    },
    onAuthError: (e) => {
      if (e instanceof ApiError && e.status === 401) setAuthed(false);
    },
    presetDesign,
  };

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="ad">
      <header className="ad__top">
        <Link to="/" className="ad__brand">
          <b>Mehfil</b> <span>Studio portal</span>
        </Link>
        <nav className="ad__tabs" aria-label="Portal sections">
          {TABS.map((t) => (
            <button key={t.key} type="button" className="ad__tab" aria-current={tab === t.key ? "page" : undefined} onClick={() => ctx.go(t.key)}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="ad__logout" onClick={() => (adminToken.set(null), setAuthed(false))}>
          <LogOut size={16} /> Sign out
        </button>
      </header>
      <main id="main" className="ad__main">
        {tab === "dashboard" && <Dashboard ctx={ctx} />}
        {tab === "designs" && <Designs ctx={ctx} />}
        {tab === "lots" && <Lots ctx={ctx} />}
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
  return (
    <main id="main" className="ad-login">
      <form
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
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="label label--gold">Mehfil Couture</p>
        <h1 className="h3">
          Studio <em>portal</em>
        </h1>
        <p className="note">For the Mehfil team: QR tags, scan leads, FitCheck orders and size charts.</p>
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
