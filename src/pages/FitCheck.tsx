import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Camera, Check, Copy, FileText, Printer, RotateCcw, Ruler, Shirt } from "lucide-react";
import { FIELDS, GARMENTS, fmt, fromIn, parseMeasure, toIn, type FieldKey, type GarmentKey, type Unit } from "../lib/fitcheck/fields";
import { validate, type Fix, type Issue } from "../lib/fitcheck/validate";
import { FABRICS, FLAT_FIELDS, FLAT_GARMENTS, FLAT_REQUIRED, inferBody, type Fabric, type FlatGarment, type FlatKey } from "../lib/fitcheck/garment";
import { buildSpec, EMBROIDERY, feasibility, type Embroidery } from "../lib/fitcheck/tailoring";
import { mergeReads, parseCardText, recognise } from "../lib/fitcheck/ocr";
import { bodyInches, checkAnomaly, readCardOnServer, type Anomaly } from "../lib/fitcheck/ml";
import type { SizeChart } from "../lib/fitcheck/sizechart";
import { api, ApiError } from "../lib/api";
import { copyText } from "../lib/enquiry";
import { toast } from "../lib/toast";
import { usePageMeta } from "../hooks/usePageMeta";
import { BodyGuide, FlatGuide } from "../components/fitcheck/MeasureGuide";
import { MeasureWalkthrough } from "../components/fitcheck/MeasureWalkthrough";
import "./FitCheck.css";

type Method = "body" | "garment" | "card";
type Step = "guide" | "measure" | "order" | "done";
type Draft = {
  method: Method; garment: GarmentKey; unit: Unit; raw: Partial<Record<FieldKey, string>>;
  flatType: FlatGarment; fabric: Fabric; flatRaw: Partial<Record<FlatKey, string>>; confirmed: string[];
  eventDate: string; embroidery: Embroidery; notes: string; stylist: boolean;
};

const DRAFT_KEY = "mehfil-fitcheck-draft";
const LAST_ORDER = "mehfil-fitcheck-last-order";
const store = {
  get<T>(k: string): T | null {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  set(k: string, v: unknown) {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* storage blocked: draft lives for this visit only */
    }
  },
};

const EMPTY: Draft = {
  method: "body", garment: "lehenga", unit: "in", raw: {}, flatType: "blouse", fabric: "cotton", flatRaw: {}, confirmed: [],
  eventDate: "", embroidery: "medium", notes: "", stylist: false,
};

export default function FitCheck() {
  usePageMeta("Mehfil FitCheck — measure right, the first time", "Guided remote measurements with instant checks, a garment fast path and a tailor-ready spec sheet from Mehfil Couture.");
  const [params] = useSearchParams();
  const designCode = params.get("design");
  const [d, setD] = useState<Draft>(EMPTY);
  const [resume, setResume] = useState<Draft | null>(null);
  // Every visit opens on the visual measuring guide before the form
  const [step, setStep] = useState<Step>("guide");
  const [active, setActive] = useState<FieldKey | null>("bust");
  const [activeFlat, setActiveFlat] = useState<FlatKey | null>("chestFlat");
  const [charts, setCharts] = useState<SizeChart[]>([]);
  const [chartId, setChartId] = useState<string>("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [designName, setDesignName] = useState<string | null>(null);
  const [lastOrder] = useState<string | null>(() => store.get<string>(LAST_ORDER));
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  // Load size charts, design context and any saved draft
  useEffect(() => {
    api<{ charts: SizeChart[] }>("/api/size-charts")
      .then(({ charts }) => {
        setCharts(charts);
        const pick = charts.find((c) => !c.isSample) || charts[0];
        if (pick) setChartId(pick.id);
      })
      .catch(() => setCharts([]));
    if (designCode) api<{ design: { name: string } }>(`/api/p/${encodeURIComponent(designCode)}`).then((r) => setDesignName(r.design.name)).catch(() => {});
    const saved = store.get<Draft>(DRAFT_KEY);
    if (saved && (Object.values(saved.raw || {}).some(Boolean) || Object.values(saved.flatRaw || {}).some(Boolean))) setResume(saved);
  }, [designCode]);

  // Autosave (save & resume — reduces abandoned custom orders)
  useEffect(() => {
    if (resume || step === "done") return;
    const t = window.setTimeout(() => store.set(DRAFT_KEY, d), 400);
    return () => window.clearTimeout(t);
  }, [d, resume, step]);

  const chart = charts.find((c) => c.id === chartId) || null;

  // Values to validate (in the entry unit)
  const inferred = useMemo(() => {
    if (d.method !== "garment") return null;
    const flat = Object.fromEntries(Object.entries(d.flatRaw).map(([k, v]) => [k, parseMeasure(v || "")]).filter(([, v]) => Number.isFinite(v as number))) as Partial<Record<FlatKey, number>>;
    return inferBody(d.flatType, d.fabric, flat, d.unit);
  }, [d.method, d.flatRaw, d.flatType, d.fabric, d.unit]);

  const values = useMemo(() => {
    const v: Partial<Record<FieldKey, number>> = {};
    for (const [k, s] of Object.entries(d.raw) as [FieldKey, string][]) {
      const n = parseMeasure(s || "");
      if (Number.isFinite(n)) v[k] = n;
    }
    return inferred ? { ...v, ...inferred.body } : v;
  }, [d.raw, inferred]);

  // Isolation Forest check on the whole set (optional: skipped while the ML service is down)
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
  const bodyKey = JSON.stringify(bodyInches(values, d.unit));
  useEffect(() => {
    let live = true;
    const t = window.setTimeout(() => {
      checkAnomaly(JSON.parse(bodyKey))
        .then((a) => live && setAnomaly(a))
        .catch(() => live && setAnomaly(null));
    }, 500);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [bodyKey]);

  const result = useMemo(
    () => validate({ values, unit: d.unit, garment: d.garment, chart, confirmed: d.confirmed, anomaly }),
    [values, d.unit, d.garment, chart, d.confirmed, anomaly],
  );
  const feas = useMemo(() => feasibility(d.garment, d.embroidery, d.eventDate || null), [d.garment, d.embroidery, d.eventDate]);
  const spec = useMemo(() => buildSpec(d.garment, result.inches, d.unit), [d.garment, result.inches, d.unit]);
  const canContinue = result.verdict !== "red" && result.missing.length === 0;

  const inferredFields = new Set(Object.keys(inferred?.body || {}) as FieldKey[]);
  const g = GARMENTS[d.garment];
  const bodyFields: FieldKey[] = d.method === "garment" ? g.required.filter((k) => !inferredFields.has(k)) : [...g.required, ...g.optional];

  const issuesFor = (k: FieldKey) => result.issues.filter((i) => i.field === k && !(i.severity === "yellow" && d.confirmed.includes(i.id)));

  function applyFix(issue: Issue, fix: Fix) {
    if (fix.kind === "set") setD((x) => ({ ...x, raw: { ...x.raw, [fix.field]: String(fix.value) } }));
    else if (fix.kind === "switchUnit") set("unit", fix.unit);
    else if (fix.kind === "confirm") set("confirmed", [...d.confirmed, issue.id]);
    else if (fix.kind === "remeasure") {
      setActive(fix.field);
      setD((x) => ({ ...x, raw: { ...x.raw, [fix.field]: "" } }));
      window.setTimeout(() => document.getElementById(`fc-${fix.field}`)?.focus(), 30);
    }
  }

  function toggleUnit(u: Unit) {
    if (u === d.unit) return;
    // Convert what's typed so the numbers keep meaning the same length
    const conv = (s?: string) => {
      const n = parseMeasure(s || "");
      return Number.isFinite(n) ? fmt(fromIn(toIn(n, d.unit), u), u) : s || "";
    };
    setD((x) => ({
      ...x, unit: u,
      raw: Object.fromEntries(Object.entries(x.raw).map(([k, v]) => [k, conv(v)])),
      flatRaw: Object.fromEntries(Object.entries(x.flatRaw).map(([k, v]) => [k, conv(v)])),
    }));
  }

  async function submit() {
    setErr("");
    if (contact && !/^\+?\d{10,13}$/.test(contact.replace(/[\s-]/g, ""))) {
      setErr("That mobile number doesn't look right — use 10 digits, or add your country code.");
      return;
    }
    setSubmitting(true);
    try {
      const notes = [designName ? `Design: ${designName} (${designCode})` : "", d.notes].filter(Boolean).join(" · ");
      const r = await api<{ id: string }>("/api/orders", {
        method: "POST",
        body: {
          mode: d.method, garment: d.garment, unit: d.unit,
          measurements: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v])),
          spec, confidence: result.confidence, verdict: result.verdict, eventDate: d.eventDate || null, embroidery: d.embroidery,
          feasibility: feas, contact: contact.replace(/[\s-]/g, "") || null, notes, stylistRequested: d.stylist,
        },
      });
      setOrderId(r.id);
      store.set(LAST_ORDER, r.id);
      store.set(DRAFT_KEY, null);
      setStep("done");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const toStep = (s: Step) => {
    setStep(s);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const steps: { key: Step; label: string }[] = [
    { key: "guide", label: "How to measure" },
    { key: "measure", label: "Measure & check" },
    { key: "order", label: "Event & delivery" },
    { key: "done", label: "Spec sheet & tracking" },
  ];

  return (
    <main id="main" className="fc" ref={topRef}>
      <header className="fc__head wrap">
        <p className="label label-row">Mehfil FitCheck</p>
        <h1 className="fc__title">
          Measure right, <em>the first time.</em>
        </h1>
        <p className="lede">
          Every number is checked before it reaches the cutting table — then a stylist and Mehfil's in-house tailors confirm your spec. We never
          guess measurements from a photo, and we never promise fit without a tailor's review.
        </p>
        {designName && (
          <p className="fc__for">
            Measuring for <b>{designName}</b>
          </p>
        )}
        <ol className="fc__steps" aria-label="Progress">
          {steps.map((s, i) => (
            <li key={s.key} className={step === s.key ? "is-on" : steps.findIndex((x) => x.key === step) > i ? "is-done" : ""}>
              <span>{i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>
      </header>

      {resume && (
        <div className="wrap">
          <div className="fc__resume" role="status">
            <RotateCcw size={18} />
            <span>You have a saved measurement draft on this device.</span>
            <button type="button" className="btn btn--ghost fc__sm" onClick={() => (setD({ ...EMPTY, ...resume }), setResume(null), setStep((s) => (s === "guide" ? "measure" : s)))}>
              Resume
            </button>
            <button type="button" className="link-arrow" onClick={() => (store.set(DRAFT_KEY, null), setResume(null))}>
              Start fresh
            </button>
          </div>
        </div>
      )}
      {lastOrder && step !== "done" && (
        <div className="wrap">
          <p className="fc__track">
            Already submitted? <Link to={`/order/${lastOrder}`}>Track order {lastOrder}</Link>
          </p>
        </div>
      )}

      {step === "guide" && (
        <MeasureWalkthrough
          garment={d.garment}
          onGarment={(g) => set("garment", g)}
          onStart={(m) => (set("method", m), toStep("measure"))}
        />
      )}

      {step === "measure" && (
        <div className="wrap fc__grid">
          <section className="fc__form" aria-labelledby="fc-measure">
            <h2 id="fc-measure" className="sr-only">
              Measurements
            </h2>
            <div className="fc__row">
              <div className="fc__group" role="radiogroup" aria-label="How do you want to measure?">
                <span className="label">How to measure</span>
                <div className="fc__methods">
                  {([
                    ["body", <Ruler key="i" size={18} />, "My body", "with a tape, step by step"],
                    ["garment", <Shirt key="i" size={18} />, "A garment I own", "fast path — lay it flat"],
                    ["card", <Camera key="i" size={18} />, "Tailor's card", "photo of a handwritten card"],
                  ] as const).map(([k, icon, t, sub]) => (
                    <button key={k} type="button" role="radio" aria-checked={d.method === k} className="fc__method" onClick={() => set("method", k)}>
                      {icon}
                      <b>{t}</b>
                      <small>{sub}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="fc__row fc__row--split">
              <label className="field">
                <span>I'm ordering</span>
                <select className="input" value={d.garment} onChange={(e) => set("garment", e.target.value as GarmentKey)}>
                  {(Object.keys(GARMENTS) as GarmentKey[]).map((k) => (
                    <option key={k} value={k}>
                      {GARMENTS[k].label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field">
                <span>Unit</span>
                <div className="fc__seg" role="radiogroup" aria-label="Unit">
                  {(["in", "cm"] as Unit[]).map((u) => (
                    <button key={u} type="button" role="radio" aria-checked={d.unit === u} onClick={() => toggleUnit(u)}>
                      {u === "in" ? "Inches" : "Centimetres"}
                    </button>
                  ))}
                </div>
              </div>
              {charts.length > 0 && (
                <label className="field">
                  <span>Benchmark size chart</span>
                  <select className="input" value={chartId} onChange={(e) => setChartId(e.target.value)}>
                    {charts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.region})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {d.method === "card" && <CardReader unit={d.unit} onUse={(fields, unit) => {
              setD((x) => ({ ...x, method: "body", unit: unit || x.unit, raw: { ...x.raw, ...fields } }));
              toast("Filled from your tailor card — please check each value.");
            }} />}

            {d.method === "garment" && (
              <div className="fc__garment">
                <div className="fc__row fc__row--split">
                  <label className="field">
                    <span>Garment you'll measure</span>
                    <select className="input" value={d.flatType} onChange={(e) => set("flatType", e.target.value as FlatGarment)}>
                      {(Object.keys(FLAT_GARMENTS) as FlatGarment[]).map((k) => (
                        <option key={k} value={k}>
                          {FLAT_GARMENTS[k].label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Its fabric</span>
                    <select className="input" value={d.fabric} onChange={(e) => set("fabric", e.target.value as Fabric)}>
                      {(Object.keys(FABRICS) as Fabric[]).map((k) => (
                        <option key={k} value={k}>
                          {FABRICS[k].label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="note">Pick one that fits you well. Lay it flat on a table, buttoned or zipped, and smooth out wrinkles.</p>
                <div className="fc__fields">
                  {FLAT_REQUIRED[d.flatType].map((k) => (
                    <label key={k} className={`fc__f ${activeFlat === k ? "is-active" : ""}`}>
                      <span className="fc__f-l">
                        {FLAT_FIELDS[k].label}
                        <small>{FLAT_FIELDS[k].how}</small>
                      </span>
                      <span className="fc__f-in">
                        <input
                          id={`fcf-${k}`}
                          className="input"
                          inputMode="decimal"
                          value={d.flatRaw[k] || ""}
                          onFocus={() => setActiveFlat(k)}
                          onChange={(e) => set("flatRaw", { ...d.flatRaw, [k]: e.target.value })}
                          placeholder={d.unit}
                          aria-label={`${FLAT_FIELDS[k].label} in ${d.unit}`}
                        />
                        <em>{d.unit}</em>
                      </span>
                    </label>
                  ))}
                </div>
                {inferred && inferred.working.length > 0 && (
                  <div className="fc__working">
                    <p className="label">Body measurements we worked out</p>
                    <p className="fc__formula">Body = (flat width × 2) − garment ease ± fabric stretch</p>
                    <ul>
                      {inferred.working.map((w) => (
                        <li key={w.field}>
                          <b>{FIELDS[w.field].label}</b> <span>{w.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {bodyFields.length > 0 && <p className="label fc__also">Also needed for a {g.label.toLowerCase()}</p>}
              </div>
            )}

            {d.method !== "card" && (
              <div className="fc__fields">
                {bodyFields.map((k) => {
                  const f = FIELDS[k];
                  const iss = issuesFor(k);
                  const sev = iss.some((i) => i.severity === "red") ? "red" : iss.length ? "yellow" : "";
                  const optional = !g.required.includes(k);
                  return (
                    <label key={k} className={`fc__f ${active === k ? "is-active" : ""} ${sev ? "is-" + sev : ""}`}>
                      <span className="fc__f-l">
                        {f.label} <i>({f.hindi})</i> {optional && <small className="fc__opt">optional</small>}
                        <small>{f.how}</small>
                      </span>
                      <span className="fc__f-in">
                        <input
                          id={`fc-${k}`}
                          className="input"
                          inputMode="decimal"
                          value={d.raw[k] || ""}
                          onFocus={() => setActive(k)}
                          onChange={(e) => set("raw", { ...d.raw, [k]: e.target.value })}
                          aria-invalid={sev === "red" || undefined}
                          aria-describedby={iss.length ? `fc-${k}-msg` : undefined}
                          placeholder={d.unit}
                          aria-label={`${f.label} in ${d.unit}`}
                        />
                        <em>{d.unit}</em>
                      </span>
                      {iss[0] && (
                        <span id={`fc-${k}-msg`} className="fc__f-msg">
                          {iss[0].message}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="fc__side">
            <div className="fc__guide">
              {d.method === "garment" ? <FlatGuide active={activeFlat} garment={d.flatType} /> : <BodyGuide active={active} />}
              <div className="fc__guide-text">
                <p className="label">How to measure</p>
                {d.method === "garment" && activeFlat ? (
                  <>
                    <b>{FLAT_FIELDS[activeFlat].label}</b>
                    <p>{FLAT_FIELDS[activeFlat].how}</p>
                  </>
                ) : active ? (
                  <>
                    <b>
                      {FIELDS[active].label} <i>({FIELDS[active].hindi})</i>
                    </b>
                    <p>{FIELDS[active].how}</p>
                    <p className="fc__tip">Tip: {FIELDS[active].tip}</p>
                  </>
                ) : null}
                <button type="button" className="link-arrow fc__reguide" onClick={() => toStep("guide")}>
                  See the full measuring guide <ArrowRight />
                </button>
              </div>
            </div>
            <CheckPanel result={result} unit={d.unit} onFix={applyFix} garmentMode={d.method === "garment"} inferred={inferredFields} learned={!!anomaly?.checked} />
            <button type="button" className="btn btn--block" disabled={!canContinue} onClick={() => (setStep("order"), topRef.current?.scrollIntoView({ behavior: "smooth" }))}>
              Continue to event & delivery <ArrowRight />
            </button>
            {!canContinue && (
              <p className="note fc__why">
                {result.missing.length
                  ? `Still needed: ${result.missing.map((k) => FIELDS[k].label.toLowerCase()).join(", ")}.`
                  : "Fix the red items above to continue."}
              </p>
            )}
          </aside>
        </div>
      )}

      {step === "order" && (
        <div className="wrap fc__grid">
          <section className="fc__form">
            <div className="fc__row fc__row--split">
              <label className="field">
                <span>Event date</span>
                <input className="input" type="date" value={d.eventDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set("eventDate", e.target.value)} />
              </label>
              <label className="field">
                <span>Embroidery</span>
                <select className="input" value={d.embroidery} onChange={(e) => set("embroidery", e.target.value as Embroidery)}>
                  {(Object.keys(EMBROIDERY) as Embroidery[]).map((k) => (
                    <option key={k} value={k}>
                      {EMBROIDERY[k].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={`fc__feas is-${feas.status}`}>
              <p className="label">Delivery feasibility</p>
              <b>
                {feas.status === "on_track" ? "✓ On track" : feas.status === "tight" ? "⚠ Tight" : feas.status === "at_risk" ? "⚠ At risk" : "Add your event date"}
              </b>
              <p>{feas.advice}</p>
              <ol className="fc__timeline">
                {feas.steps.map((s) => (
                  <li key={s.label}>
                    <span>{s.label}</span>
                    <em>{s.days} days</em>
                  </li>
                ))}
              </ol>
              <p className="note">
                About {feas.needDays} days in total — ready around {feas.readyBy}. Estimates; the studio confirms your production slot.
              </p>
            </div>
            <label className="field">
              <span>WhatsApp number (optional — for updates from the studio)</span>
              <input className="input" inputMode="tel" autoComplete="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 98xxx xxxxx" />
            </label>
            <label className="field">
              <span>Notes for the stylist (optional)</span>
              <textarea className="input" rows={3} maxLength={600} value={d.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Fit you like, colours, anything we should know" />
            </label>
            <label className="fc__check">
              <input type="checkbox" checked={d.stylist} onChange={(e) => set("stylist", e.target.checked)} />
              <span>
                <b>Request a stylist-assisted review.</b> A Mehfil stylist looks over your measurements with you remotely before the tailor starts.
              </span>
            </label>
            {err && (
              <p className="fc__err" role="alert">
                {err}
              </p>
            )}
            <div className="fc__actions">
              <button type="button" className="link-arrow" onClick={() => setStep("measure")}>
                ← Back to measurements
              </button>
              <button type="button" className="btn" disabled={submitting} onClick={submit}>
                {submitting ? "Sending…" : "Confirm measurements & create my spec"} <ArrowRight />
              </button>
            </div>
          </section>
          <aside className="fc__side">
            <CheckPanel result={result} unit={d.unit} onFix={applyFix} compact />
          </aside>
        </div>
      )}

      {step === "done" && orderId && (
        <div className="wrap fc__done">
          <div className="fc__ok no-print">
            <span className="fc__ok-i">
              <Check size={22} />
            </span>
            <div>
              <h2 className="h3">
                Measurements <em>confirmed.</em>
              </h2>
              <p>
                Order <b>{orderId}</b> is with the studio. Your spec isn't final until Mehfil's tailor reviews it — follow every step on your order
                timeline.
              </p>
              <div className="fc__actions">
                <Link className="btn" to={`/order/${orderId}`}>
                  Open my order timeline <ArrowRight />
                </Link>
                <button
                  type="button"
                  className="link-arrow"
                  onClick={async () => toast((await copyText(`${location.origin}/order/${orderId}`)) ? "Link copied — save it to come back any time." : "Couldn't copy — note the order number instead.")}
                >
                  <Copy /> Copy my resume link
                </button>
                <button type="button" className="link-arrow" onClick={() => window.print()}>
                  <Printer /> Print spec sheet
                </button>
              </div>
            </div>
          </div>
          <SpecSheet orderId={orderId} garment={d.garment} unit={d.unit} spec={spec} result={result} feas={feas} eventDate={d.eventDate} embroidery={d.embroidery} notes={d.notes} stylist={d.stylist} />
        </div>
      )}
    </main>
  );
}

function ConfidenceRing({ value, verdict }: { value: number; verdict: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg className={`fc__ring is-${verdict}`} viewBox="0 0 84 84" role="img" aria-label={`Measurement confidence ${value} out of 100`}>
      <circle cx="42" cy="42" r={r} className="fc__ring-track" />
      <circle cx="42" cy="42" r={r} className="fc__ring-val" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle">
        {verdict === "empty" ? "—" : value}
      </text>
    </svg>
  );
}

function CheckPanel({ result, unit, onFix, compact, garmentMode, inferred, learned }: {
  result: ReturnType<typeof validate>; unit: Unit; onFix: (i: Issue, f: Fix) => void; compact?: boolean; garmentMode?: boolean; inferred?: Set<FieldKey>;
  learned?: boolean;
}) {
  const empty = Object.keys(result.inches).length === 0;
  const label = empty
    ? "Waiting for measurements"
    : result.verdict === "green" && result.missing.length
      ? "Looks right so far"
      : { green: "Looks right", yellow: "Please check", red: "Needs a correction" }[result.verdict];
  const shown = result.issues.filter((i) => !(i.severity === "yellow" && i.fixes.length === 0));
  return (
    <div className={`fc__check-panel is-${empty ? "empty" : result.verdict}`} aria-live="polite">
      <div className="fc__score">
        <ConfidenceRing value={empty ? 0 : result.confidence} verdict={empty ? "empty" : result.verdict} />
        <div>
          <p className="label">Measurement confidence</p>
          <b className="fc__verdict">{label}</b>
          {result.chartSize && <p className="note">Closest chart size: {result.chartSize}</p>}
        </div>
      </div>
      {!compact && (
        <ul className="fc__issues">
          {shown.length === 0 && (
            <li className={`fc__issue ${empty ? "" : "is-ok"}`}>
              {empty ? "Enter your first measurement — each one is checked as you type." : "No problems found in the values entered so far."}
            </li>
          )}
          {shown.map((i) => (
            <li key={i.id} className={`fc__issue is-${i.severity}`}>
              <p>{i.message}</p>
              <div className="fc__fixes">
                {i.fixes
                  .filter((f) => !(garmentMode && f.kind === "set" && inferred?.has(f.field)))
                  .map((f, n) => (
                    <button key={n} type="button" className="chip" onClick={() => onFix(i, f)}>
                      {f.label}
                    </button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!compact && (
        <p className="note">
          Checks: unit &amp; typo detection ({unit === "in" ? "inches" : "cm"} form), human limits, body proportions, the size-chart benchmark
          {learned ? ", and a learned check of how your measurements fit together" : ""}.
        </p>
      )}
    </div>
  );
}

function CardReader({ unit, onUse }: { unit: Unit; onUse: (fields: Partial<Record<FieldKey, string>>, unit: Unit | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "review" | "error">("idle");
  const [progress, setProgress] = useState<number | null>(0); // null → server reading, no progress to show
  const [rows, setRows] = useState<{ field: FieldKey; value: string; line: string }[]>([]);
  const [found, setFound] = useState<Unit | null>(null);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function run(blob: Blob) {
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return URL.createObjectURL(blob);
    });
    setStatus("reading");
    setProgress(null);
    try {
      // PaddleOCR on our server reads handwriting better; Tesseract in the browser is the fallback
      const parsed = await readCardOnServer(blob).then(
        (text) => mergeReads([parseCardText(text)]),
        (e: unknown) => {
          if (e instanceof ApiError && e.status === 400) throw e;
          setProgress(0);
          return recognise(blob, setProgress);
        },
      );
      setRows(parsed.fields.map((f) => ({ field: f.field, value: String(f.value), line: f.line })));
      setFound(parsed.unit);
      setUnmatched(parsed.unmatched.slice(0, 6));
      setStatus("review");
    } catch (e) {
      console.error("FitCheck: couldn't read the card", e);
      setStatus("error");
    }
  }

  return (
    <div className="fc__card">
      <p className="note">
        Take a clear, flat photo of the paper measurement card. The photo is sent to our server only to read it and is never stored (if the
        reader is offline, it's read on this device instead). Handwriting is tricky, so you'll check every value before it's used.
      </p>
      <div className="fc__actions">
        <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
          <Camera /> Upload or take a photo
        </button>
        <button
          type="button"
          className="link-arrow"
          onClick={async () => {
            const r = await fetch("/sample-tailor-card.png");
            run(await r.blob());
          }}
        >
          Try a sample card
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} />
      </div>
      {preview && (
        <div className="fc__card-grid">
          <img src={preview} alt="Tailor card photo" className="fc__card-img" />
          <div>
            {status === "reading" && (
              <p className="fc__reading">
                {progress == null ? (
                  <>
                    Reading the card…<span className="fc__bar is-busy"><i /></span>
                  </>
                ) : (
                  <>
                    Reading the card… {Math.round(progress * 100)}%<span className="fc__bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></span>
                  </>
                )}
              </p>
            )}
            {status === "error" && <p className="fc__err">Couldn't read this photo. Try a sharper, well-lit picture — or type the values in "My body".</p>}
            {status === "review" && (
              <>
                <p className="label">Check what we read {found && `· looks like ${found === "in" ? "inches" : "cm"}`}</p>
                {rows.length === 0 && <p className="fc__err">We couldn't match any measurements. Type them in "My body" instead.</p>}
                <div className="fc__ocr-rows">
                  {rows.map((r, i) => (
                    <label key={r.field} className="fc__ocr-row">
                      <span>
                        <b>{FIELDS[r.field].label}</b>
                        <small>read as “{r.line}”</small>
                      </span>
                      <input className="input" inputMode="decimal" value={r.value} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                      <button type="button" className="fc__x" aria-label={`Remove ${FIELDS[r.field].label}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                        ×
                      </button>
                    </label>
                  ))}
                </div>
                {unmatched.length > 0 && <p className="note">Not used: {unmatched.join(" · ")}</p>}
                {rows.length > 0 && (
                  <button type="button" className="btn" onClick={() => onUse(Object.fromEntries(rows.map((r) => [r.field, r.value])), found || unit)}>
                    Use these values <ArrowRight />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecSheet(p: {
  orderId: string; garment: GarmentKey; unit: Unit; spec: ReturnType<typeof buildSpec>; result: ReturnType<typeof validate>;
  feas: ReturnType<typeof feasibility>; eventDate: string; embroidery: Embroidery; notes: string; stylist: boolean;
}) {
  const warnings = p.result.issues.filter((i) => i.severity === "yellow");
  return (
    <article className="spec" aria-labelledby="spec-title">
      <header className="spec__head">
        <div>
          <p className="label">Mehfil Couture · Tailor production spec</p>
          <h2 id="spec-title">
            {GARMENTS[p.garment].label} <em>· {p.orderId}</em>
          </h2>
        </div>
        <FileText size={28} aria-hidden="true" />
      </header>
      <dl className="spec__meta">
        <div><dt>Confidence</dt><dd>{p.result.confidence}/100 · {p.result.verdict}</dd></div>
        <div><dt>Event date</dt><dd>{p.eventDate || "Not given"}</dd></div>
        <div><dt>Embroidery</dt><dd>{EMBROIDERY[p.embroidery].label}</dd></div>
        <div><dt>Delivery</dt><dd>{p.feas.status.replace("_", " ")} · ready ~{p.feas.readyBy}</dd></div>
        <div><dt>Stylist review</dt><dd>{p.stylist ? "Requested" : "Not requested"}</dd></div>
        <div><dt>Size chart</dt><dd>{p.result.chartSize ? `closest ${p.result.chartSize}` : "—"}</dd></div>
      </dl>
      <div className="spec__table-wrap">
        <table className="spec__table">
          <thead>
            <tr><th>Measurement</th><th>Body</th><th>Ease</th><th>Cutting</th><th>Seam allowance</th></tr>
          </thead>
          <tbody>
            {p.spec.map((r) => (
              <tr key={r.field}><td>{r.label}</td><td>{r.body}</td><td>{r.ease}</td><td><b>{r.cutting}</b></td><td>{r.seam}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="spec__notes">
        <p className="label">Warnings for the tailor</p>
        {warnings.length ? (
          <ul>{warnings.map((w) => <li key={w.id}>{w.message} <i>(customer confirmed)</i></li>)}</ul>
        ) : (
          <p>No warnings — all checks passed.</p>
        )}
        {p.notes && <p><b>Customer notes:</b> {p.notes}</p>}
        <p className="note">Ease and seam allowances are Mehfil's starting rules — the master tailor adjusts them for fabric and fit. Not a fit guarantee.</p>
      </div>
    </article>
  );
}
