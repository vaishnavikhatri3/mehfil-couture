import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, BadgeCheck, Check, LocateFixed, MapPin, QrCode, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { api, COLOUR_OPTIONS, swatch, type Design, type Verification } from "../lib/api";
import { openEnquiry } from "../lib/enquiry";
import { photos, type Photo } from "../data/images";
import { Img } from "../components/Img";
import { ImageZoom } from "../components/ImageZoom";
import { brand } from "../config/brand";
import { usePageMeta } from "../hooks/usePageMeta";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "./Passport.css";

type Passport = {
  design: Design;
  piece: { code: string; colour: string; size: string; status: string } | null;
  verification: Verification;
  availability: { tracked: boolean; inStock: { colour: string; size: string; count: number }[] };
};

const PIECE_STATE: Record<string, string> = { in_stock: "available", reserved: "reserved", sold: "sold", void: "retired tag" };

/** Random, anonymous id kept on this phone so the studio can count distinct phones per tag. Never linked to a person. */
function deviceId() {
  try {
    let id = localStorage.getItem("mehfil-device");
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem("mehfil-device", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

const CONSENT =
  "Yes, I agree to share these details so Mehfil Couture can send me outfit recommendations on WhatsApp. I can reply STOP to opt out, and ask for my details to be deleted at any time.";
const OCCASIONS = ["Wedding", "Engagement", "Sangeet", "Mehendi / Haldi", "Reception", "Festive", "Party"];
const STYLES = ["Royal", "Romantic", "Minimal", "Contemporary", "Dramatic"];
const BUDGETS = ["Under ₹50k", "₹50k–1L", "₹1L–2L", "Above ₹2L", "Not sure yet"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom (I'll measure)"];

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
        const body = { code, device: deviceId() };
        try {
          const k = "mehfil-scan-" + code.toUpperCase();
          if (!sessionStorage.getItem(k)) {
            sessionStorage.setItem(k, "1");
            api("/api/scan", { method: "POST", body }).catch(() => {});
          }
        } catch {
          api("/api/scan", { method: "POST", body }).catch(() => {});
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
      <main id="main" className="wrap pp pp--empty pp--loading" aria-busy="true">
        <span className="pp__scan" aria-hidden="true">
          <QrCode size={44} strokeWidth={1.25} />
          <i />
        </span>
        <p className="label label-row">Digital passport</p>
        <p className="lede">Opening the outfit's story…</p>
      </main>
    );

  return <PassportView data={data} />;
}

/** Mounted once the passport has loaded, so scroll reveals find their targets. */
function PassportView({ data }: { data: Passport }) {
  const main = useRef<HTMLElement>(null);
  useScrollReveal(main);
  const { design, piece, availability, verification } = data;
  const retired = verification.kind === "void";
  const owned = verification.kind === "genuine" && !!verification.soldAt;
  return (
    <main id="main" className="pp" ref={main}>
      <section className="wrap pp__hero">
        <div className="pp__media frame">
          {design.imageUrl ? (
            <ImageZoom mode="lens" alt={design.name}>
              <img className="img-cover" src={design.imageUrl} alt={design.name} />
            </ImageZoom>
          ) : (
            <Img photo={fallbackPhoto(design.category)} zoom="lens" sizes="(min-width: 900px) 40vw, 100vw" eager alt={`Mood image for ${design.category} — illustrative, not this exact piece`} />
          )}
          {!design.imageUrl && <span className="pp__mood">Mood image</span>}
        </div>
        <div className="pp__intro">
          <p className="label label-row">
            Digital passport · {piece ? piece.code : design.id}
          </p>
          <h1 className="pp__title">{design.name}</h1>
          <p className="pp__cat">{design.category}</p>
          <Authenticity v={verification} code={piece?.code ?? design.id} />
          {piece && (
            <p className="pp__piece">
              This tag: <b>{piece.colour}</b> · size <b>{piece.size}</b> · {PIECE_STATE[piece.status] ?? piece.status}
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

      <section className="wrap pp__avail" aria-labelledby="avail-title" data-reveal>
        <h2 id="avail-title" className="h3">
          Colours &amp; sizes <em>available</em>
        </h2>
        <Availability design={design} availability={availability} />
      </section>

      <section className="wrap pp__cta">
        {!retired && (
          <div data-reveal>
            <LeadForm code={piece ? piece.code : design.id} design={design} />
          </div>
        )}
        <div className="pp__side">
          {owned && piece && (
            <aside className="pp__measure pp__owner" data-reveal>
              <Sparkles size={22} />
              <div>
                <b>Yours to keep beautiful</b>
                <p>{design.care || "Dry clean only. Store folded in muslin, away from direct sunlight."}</p>
                <button
                  type="button"
                  className="link-arrow"
                  onClick={() =>
                    openEnquiry(`Hi Mehfil Couture! I own the ${design.name} (tag ${piece.code}, ${piece.colour}, size ${piece.size}) and would like help with an alteration or care.`, "passport_owner")
                  }
                >
                  Alterations &amp; care <ArrowRight />
                </button>
              </div>
            </aside>
          )}
          <aside className="pp__measure" data-reveal>
            <Ruler size={22} />
            <div>
              <b>Ordering it made-to-measure?</b>
              <p>Check your measurements with Mehfil FitCheck before the fabric is cut.</p>
              <Link className="link-arrow" to={`/fitcheck?design=${encodeURIComponent(design.id)}`}>
                Measure with FitCheck <ArrowRight />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Authenticity({ v, code }: { v: Verification; code: string }) {
  if (v.kind === "design")
    return <p className="pp__auth is-design"><QrCode size={18} /> <span>This is a design code. Each piece's own tag also confirms it's genuine.</span></p>;
  if (v.kind === "void")
    return (
      <div className="pp__auth is-void" role="alert">
        <AlertTriangle size={18} />
        <span>
          <b>This tag has been retired by the studio.</b> If you bought this piece, message us with the code <code>{code}</code> and we'll check it for you.
          <button type="button" className="link-arrow" onClick={() => openEnquiry(`Hi Mehfil Couture! I scanned tag ${code} and it says the tag was retired. Can you check it for me?`, "passport_void")}>
            Ask the studio <ArrowRight />
          </button>
        </span>
      </div>
    );
  const sold = v.soldAt ? new Date(v.soldAt + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <p className="pp__auth is-genuine">
      <BadgeCheck size={18} />
      <span>
        <b>Genuine Mehfil Couture.</b>{" "}
        {sold ? <>Sold by the studio on {sold}. If you bought it new on a different date, please let us know.</> : <>This tag is registered to this exact piece.</>}
      </span>
    </p>
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
  const doneRef = useRef<HTMLDivElement>(null);
  const palette = Array.from(new Set([...design.colours, ...COLOUR_OPTIONS])).slice(0, 14);
  const filled = [
    !!occasion,
    /^\+?\d{10,13}$/.test(mobile.replace(/[\s-]/g, "")),
    !!size,
    loc.method === "gps" || !!loc.text.trim(),
    colours.length > 0,
  ];
  const count = filled.filter(Boolean).length;

  // The thank-you card is much shorter than the form — bring it into view
  useEffect(() => {
    if (state === "done") doneRef.current?.scrollIntoView({ block: "center" });
  }, [state]);

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
      const first = document.querySelector<HTMLElement>(`[data-err="${Object.keys(err)[0]}"]`);
      first?.focus();
      // A short nudge on the first thing that needs fixing
      if (!reduceMotion())
        first?.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }],
          { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        );
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
      <div className="pp__form pp__done" role="status" ref={doneRef}>
        <span className="pp__ok" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27l7 7 15-15" />
          </svg>
        </span>
        <h2 className="h3">Thank you — <em>we'll be in touch.</em></h2>
        <p>
          Mehfil Couture will WhatsApp you picks that match your occasion, size and colours from {brand.name}'s business account. Reply STOP any
          time to opt out.
        </p>
      </div>
    );

  const chip = (on: boolean) => ({ "aria-pressed": on, className: "chip" });
  const step = (n: number) => (
    <span className="pp__n" data-done={filled[n - 1] || undefined}>
      <b>{n}</b>
      <Check size={14} strokeWidth={3} aria-hidden="true" />
    </span>
  );
  return (
    <form className="pp__form" onSubmit={submit} noValidate aria-labelledby="lead-title">
      <p className="label label--gold">Personal picks on WhatsApp</p>
      <h2 id="lead-title" className="h3">
        Tell us 5 things. <em>We'll do the searching.</em>
      </h2>
      <p className="pp__why">
        <ShieldCheck size={16} /> We only ask for these five details and use them only to send you recommendations. Never sold or shared.
      </p>
      <div className="pp__progress" data-complete={count === 5 || undefined}>
        <span className="pp__meter" aria-hidden="true">
          <i style={{ transform: `scaleX(${count / 5})` }} />
        </span>
        <span className="pp__count">{count === 5 ? "All 5 done" : `${count} of 5`}</span>
      </div>

      <fieldset className="pp__fs">
        <legend>{step(1)} Your preferences</legend>
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
        <legend>{step(2)} Mobile number</legend>
        <input className="input" data-err="mobile" inputMode="tel" autoComplete="tel" placeholder="+91 98xxx xxxxx" value={mobile} onChange={(e) => setMobile(e.target.value)} aria-invalid={!!errors.mobile || undefined} aria-label="WhatsApp mobile number" />
        {errors.mobile && <p className="field-error">{errors.mobile}</p>}
      </fieldset>

      <fieldset className="pp__fs">
        <legend>{step(3)} Your size</legend>
        <div className="pp__chips" data-err="size" tabIndex={-1} aria-label="Size">
          {SIZES.map((s) => <button key={s} type="button" {...chip(size === s)} onClick={() => setSize(s)}>{s}</button>)}
        </div>
        {errors.size && <p className="field-error">{errors.size}</p>}
      </fieldset>

      <fieldset className="pp__fs">
        <legend>{step(4)} Your location</legend>
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
        <legend>{step(5)} Colours you love</legend>
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
