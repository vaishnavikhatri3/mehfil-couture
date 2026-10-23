import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check, LocateFixed, MapPin, Ruler, ShieldCheck } from "lucide-react";
import { api, COLOUR_OPTIONS, swatch, type Design } from "../lib/api";
import { photos, type Photo } from "../data/images";
import { Img } from "../components/Img";
import { brand } from "../config/brand";
import { usePageMeta } from "../hooks/usePageMeta";
import "./Passport.css";

type Passport = {
  design: Design;
  piece: { code: string; colour: string; size: string; status: string } | null;
  availability: { tracked: boolean; inStock: { colour: string; size: string; count: number }[] };
};

const CONSENT =
  "Yes, I agree to share these details so Mehfil Couture can send me outfit recommendations on WhatsApp. I can reply STOP to opt out, and ask for my details to be deleted at any time.";
const OCCASIONS = ["Wedding", "Engagement", "Sangeet", "Mehendi / Haldi", "Reception", "Festive", "Party"];
const STYLES = ["Royal", "Romantic", "Minimal", "Contemporary", "Dramatic"];
const BUDGETS = ["Under ₹50k", "₹50k–1L", "₹1L–2L", "Above ₹2L", "Not sure yet"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom (I'll measure)"];

const fallbackPhoto = (category: string): Photo =>
  /bridal/i.test(category) ? photos.velvetBride : /indo/i.test(category) ? photos.gowns : photos.blushPret;

export default function PassportPage() {
  const { code = "" } = useParams();
  const [data, setData] = useState<Passport | null>(null);
  const [err, setErr] = useState("");
  usePageMeta(data ? `${data.design.name} — Mehfil Couture` : "Mehfil Couture digital passport", data?.design.story);

  useEffect(() => {
    let alive = true;
    api<Passport>(`/api/p/${encodeURIComponent(code)}`)
      .then((r) => {
        if (!alive) return;
        setData(r);
        // Count one scan per code per browser session (no personal data)
        try {
          const k = "mehfil-scan-" + code.toUpperCase();
          if (!sessionStorage.getItem(k)) {
            sessionStorage.setItem(k, "1");
            api("/api/scan", { method: "POST", body: { code } }).catch(() => {});
          }
        } catch {
          api("/api/scan", { method: "POST", body: { code } }).catch(() => {});
        }
      })
      .catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [code]);

  if (err)
    return (
      <main id="main" className="wrap pp pp--empty">
        <p className="label label-row">Digital passport</p>
        <h1 className="pp__title">
          We couldn't open <em>this tag.</em>
        </h1>
        <p className="lede">{err}</p>
        <Link to="/" className="btn">
          Visit Mehfil Couture <ArrowRight />
        </Link>
      </main>
    );
  if (!data)
    return (
      <main id="main" className="wrap pp pp--empty" aria-busy="true">
        <p className="label label-row">Digital passport</p>
        <p className="lede">Opening the outfit's story…</p>
      </main>
    );

  const { design, piece, availability } = data;
  return (
    <main id="main" className="pp">
      <section className="wrap pp__hero">
        <div className="pp__media frame">
          {design.imageUrl ? (
            <img className="img-cover" src={design.imageUrl} alt={design.name} />
          ) : (
            <Img photo={fallbackPhoto(design.category)} sizes="(min-width: 900px) 40vw, 100vw" eager alt={`Mood image for ${design.category} — illustrative, not this exact piece`} />
          )}
          {!design.imageUrl && <span className="pp__mood">Mood image</span>}
        </div>
        <div className="pp__intro">
          <p className="label label-row">
            Digital passport · {piece ? piece.code : design.id}
          </p>
          <h1 className="pp__title">{design.name}</h1>
          <p className="pp__cat">{design.category}</p>
          {piece && (
            <p className="pp__piece">
              This tag: <b>{piece.colour}</b> · size <b>{piece.size}</b> · {piece.status === "in_stock" ? "available" : piece.status}
            </p>
          )}
          <div className="pp__block">
            <p className="label">The embroidery story</p>
            <p className="pp__story">{design.story || "The studio will add this piece's story soon."}</p>
          </div>
          <dl className="pp__facts">
            {design.fabric && (<div><dt>Fabric</dt><dd>{design.fabric}</dd></div>)}
            {design.embroidery && (<div><dt>Embroidery</dt><dd>{design.embroidery}</dd></div>)}
            {design.care && (<div><dt>Care</dt><dd>{design.care}</dd></div>)}
          </dl>
        </div>
      </section>

      <section className="wrap pp__avail" aria-labelledby="avail-title">
        <h2 id="avail-title" className="h3">
          Colours &amp; sizes <em>available</em>
        </h2>
        <Availability design={design} availability={availability} />
      </section>

      <section className="wrap pp__cta">
        <LeadForm code={piece ? piece.code : design.id} design={design} />
        <aside className="pp__measure">
          <Ruler size={22} />
          <div>
            <b>Ordering it made-to-measure?</b>
            <p>Check your measurements with Mehfil FitCheck before the fabric is cut.</p>
            <Link className="link-arrow" to={`/fitcheck?design=${encodeURIComponent(design.id)}`}>
              Measure with FitCheck <ArrowRight />
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Availability({ design, availability }: { design: Design; availability: Passport["availability"] }) {
  const stock = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of availability.inStock) m.set(`${r.colour}|${r.size}`, r.count);
    return m;
  }, [availability]);
  const colours = Array.from(new Set([...design.colours, ...availability.inStock.map((r) => r.colour)]));
  const sizes = Array.from(new Set([...design.sizes, ...availability.inStock.map((r) => r.size)]));
  if (!availability.tracked)
    return (
      <div className="pp__avail-simple">
        <div className="pp__sw-row">
          {colours.map((c) => (
            <span key={c} className="pp__sw"><i style={{ background: swatch(c) }} />{c}</span>
          ))}
        </div>
        <p className="note">Sizes {sizes.join(" · ")} — made to order. Custom sizing available through FitCheck.</p>
      </div>
    );
  return (
    <div className="pp__table-wrap">
      <table className="pp__table">
        <thead>
          <tr>
            <th scope="col">Colour</th>
            {sizes.map((s) => <th key={s} scope="col">{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {colours.map((c) => (
            <tr key={c}>
              <th scope="row"><span className="pp__sw"><i style={{ background: swatch(c) }} />{c}</span></th>
              {sizes.map((s) => {
                const n = stock.get(`${c}|${s}`) || 0;
                return <td key={s} className={n ? "is-in" : ""}>{n ? (n > 2 ? "In stock" : `Only ${n}`) : "Made to order"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadForm({ code, design }: { code: string; design: Design }) {
  const [occasion, setOccasion] = useState("");
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [mobile, setMobile] = useState("");
  const [size, setSize] = useState("");
  const [colours, setColours] = useState<string[]>([]);
  const [loc, setLoc] = useState<{ method: "gps" | "manual" | null; lat?: number; lng?: number; accuracy?: number; text: string }>({ method: null, text: "" });
  const [locMsg, setLocMsg] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [apiErr, setApiErr] = useState("");
  const palette = Array.from(new Set([...design.colours, ...COLOUR_OPTIONS])).slice(0, 14);

  function useMyLocation() {
    setLocMsg("");
    if (!("geolocation" in navigator)) {
      setLocMsg("Location isn't available on this device — please type your city or area.");
      return;
    }
    setLocMsg("Asking your browser for permission…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ method: "gps", lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5), accuracy: Math.round(p.coords.accuracy), text: loc.text });
        setLocMsg(`Location shared (accurate to about ${Math.round(p.coords.accuracy)} m).`);
      },
      () => {
        setLoc((l) => ({ ...l, method: null }));
        setLocMsg("Location wasn't shared — that's fine. Type your city or area instead.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const m = mobile.replace(/[\s-]/g, "");
    if (!occasion) err.occasion = "Pick the occasion you're shopping for.";
    if (!/^\+?\d{10,13}$/.test(m)) err.mobile = "Enter a 10-digit mobile number, or include your country code.";
    if (!size) err.size = "Choose your size.";
    const method = loc.method === "gps" ? "gps" : loc.text.trim() ? "manual" : null;
    if (!method) err.location = "Share your location or type your city / area.";
    if (!colours.length) err.colours = "Pick at least one colour you love.";
    if (!consent) err.consent = "Please tick the box so we're allowed to save and use these details.";
    setErrors(err);
    if (Object.keys(err).length) {
      document.querySelector<HTMLElement>(`[data-err="${Object.keys(err)[0]}"]`)?.focus();
      return;
    }
    setState("sending");
    setApiErr("");
    try {
      await api("/api/leads", {
        method: "POST",
        body: {
          code, consent: true, consentText: CONSENT, mobile: m, size, colours,
          preferences: { occasion, style: style || null, budget: budget || null },
          location: method === "gps" ? { method, lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy } : { method, text: loc.text.trim() },
        },
      });
      setState("done");
    } catch (e2) {
      setApiErr((e2 as Error).message);
      setState("idle");
    }
  }

  if (state === "done")
    return (
      <div className="pp__form pp__done" role="status">
        <span className="pp__ok"><Check size={22} /></span>
        <h2 className="h3">Thank you — <em>we'll be in touch.</em></h2>
        <p>
          Mehfil Couture will WhatsApp you picks that match your occasion, size and colours from {brand.name}'s business account. Reply STOP any
          time to opt out.
        </p>
      </div>
    );

  const chip = (on: boolean) => ({ "aria-pressed": on, className: "chip" });
  return (
    <form className="pp__form" onSubmit={submit} noValidate aria-labelledby="lead-title">
      <p className="label label--gold">Personal picks on WhatsApp</p>
      <h2 id="lead-title" className="h3">
        Tell us 5 things. <em>We'll do the searching.</em>
      </h2>
      <p className="pp__why">
        <ShieldCheck size={16} /> We only ask for these five details and use them only to send you recommendations. Never sold or shared.
      </p>

      <fieldset className="pp__fs">
        <legend><span className="pp__n">1</span> Your preferences</legend>
        <div className="pp__chips" data-err="occasion" tabIndex={-1} aria-label="Occasion">
          {OCCASIONS.map((o) => <button key={o} type="button" {...chip(occasion === o)} onClick={() => setOccasion(o)}>{o}</button>)}
        </div>
        {errors.occasion && <p className="field-error">{errors.occasion}</p>}
        <div className="pp__two">
          <label className="field">
            <span>Style (optional)</span>
            <select className="input" value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="">Any</option>
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Budget (optional)</span>
            <select className="input" value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="">Prefer not to say</option>
              {BUDGETS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="pp__fs">
        <legend><span className="pp__n">2</span> Mobile number</legend>
        <input className="input" data-err="mobile" inputMode="tel" autoComplete="tel" placeholder="+91 98xxx xxxxx" value={mobile} onChange={(e) => setMobile(e.target.value)} aria-invalid={!!errors.mobile || undefined} aria-label="WhatsApp mobile number" />
        {errors.mobile && <p className="field-error">{errors.mobile}</p>}
      </fieldset>

      <fieldset className="pp__fs">
        <legend><span className="pp__n">3</span> Your size</legend>
        <div className="pp__chips" data-err="size" tabIndex={-1} aria-label="Size">
          {SIZES.map((s) => <button key={s} type="button" {...chip(size === s)} onClick={() => setSize(s)}>{s}</button>)}
        </div>
        {errors.size && <p className="field-error">{errors.size}</p>}
      </fieldset>

      <fieldset className="pp__fs">
        <legend><span className="pp__n">4</span> Your location</legend>
        <div className="pp__loc">
          <button type="button" className="btn btn--ghost" onClick={useMyLocation}><LocateFixed /> Use my exact location</button>
          <span className="pp__or">or</span>
          <label className="pp__loc-in">
            <MapPin size={16} />
            <input className="input" data-err="location" placeholder="Type city / area / pincode" value={loc.text} onChange={(e) => setLoc({ ...loc, text: e.target.value })} aria-label="City, area or pincode" />
          </label>
        </div>
        {locMsg && <p className="note">{locMsg}</p>}
        {errors.location && <p className="field-error">{errors.location}</p>}
      </fieldset>

      <fieldset className="pp__fs">
        <legend><span className="pp__n">5</span> Colours you love</legend>
        <div className="pp__chips" data-err="colours" tabIndex={-1} aria-label="Colours">
          {palette.map((c) => {
            const on = colours.includes(c);
            return (
              <button key={c} type="button" {...chip(on)} onClick={() => setColours(on ? colours.filter((x) => x !== c) : [...colours, c].slice(0, 6))}>
                <i className="pp__dot" style={{ background: swatch(c) }} />{c}
              </button>
            );
          })}
        </div>
        {errors.colours && <p className="field-error">{errors.colours}</p>}
      </fieldset>

      <label className="pp__consent">
        <input type="checkbox" data-err="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{CONSENT}</span>
      </label>
      {errors.consent && <p className="field-error">{errors.consent}</p>}
      {apiErr && <p className="fc__err" role="alert">{apiErr}</p>}
      <button type="submit" className="btn btn--block" disabled={state === "sending"}>
        {state === "sending" ? "Saving…" : "Send me personal picks"} <ArrowRight />
      </button>
      <p className="note">Nothing is saved unless you tick the box. Your location is only used to suggest the nearest studio or delivery option.</p>
    </form>
  );
}
