import { useId, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { brand } from "../config/brand";
import { collectionNames } from "../data/collections";
import { studioOccasions } from "../data/studio";
import { openEnquiry, enquiryChannel } from "../lib/enquiry";
import { track } from "../lib/analytics";
import "./AppointmentForm.css";

type Fields = {
  name: string;
  contact: string;
  occasion: string;
  date: string;
  collection: string;
  notes: string;
  consent: boolean;
};
type Errors = Partial<Record<keyof Fields, string>>;

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isPhone = (v: string) => v.replace(/[^\d]/g, "").length >= 10 && /^[+\d\s()-]+$/.test(v);

function validate(f: Fields, needsConsent: boolean): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please tell us your name.";
  if (!f.contact.trim()) e.contact = "Add a phone number or email so the studio can reply.";
  else if (!isEmail(f.contact.trim()) && !isPhone(f.contact.trim())) e.contact = "That doesn't look like a valid phone number or email.";
  if (!f.occasion) e.occasion = "Choose the occasion you're dressing for.";
  if (!f.date) e.date = "Pick a preferred date.";
  else if (f.date < today()) e.date = "Please choose a date from today onwards.";
  if (f.notes.length > 600) e.notes = "Please keep notes under 600 characters.";
  if (needsConsent && !f.consent) e.consent = "Please agree so the studio can contact you about this request.";
  return e;
}

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

export function AppointmentForm() {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const hasBackend = Boolean(brand.endpoints.appointment);
  const [f, setF] = useState<Fields>({ name: "", contact: "", occasion: "", date: "", collection: "", notes: "", consent: false });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "handoff" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  const set = <K extends keyof Fields>(k: K) => (v: Fields[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const message = () =>
    [
      "Hi Mehfil Couture! I'd like to request a styling appointment.",
      `Name: ${f.name.trim()}`,
      `Contact: ${f.contact.trim()}`,
      `Occasion: ${studioOccasions.find((o) => o.key === f.occasion)?.label ?? f.occasion}`,
      `Preferred date: ${formatDate(f.date)}`,
      f.collection ? `Interested in: ${f.collection}` : null,
      f.notes.trim() ? `Notes: ${f.notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(f, hasBackend);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    track("appointment_submit", { occasion: f.occasion, collection: f.collection || "none", channel: hasBackend ? "backend" : enquiryChannel() });

    if (!hasBackend) {
      await openEnquiry(message(), "appointment");
      setStatus("handoff");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(brand.endpoints.appointment, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...f, source: "website" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const err = (k: keyof Fields) =>
    errors[k] ? (
      <p className="field-error" id={id(`${k}-err`)}>
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: keyof Fields) => ({
    id: id(k),
    name: k,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? id(`${k}-err`) : undefined,
  });

  if (status === "sent" || status === "handoff") {
    return (
      <div className="appt appt--done" role="status">
        <span className="appt__check">
          <Check size={22} />
        </span>
        <h3 className="h3">
          {status === "sent" ? (
            <>
              Request <em>received.</em>
            </>
          ) : (
            <>
              Almost <em>there.</em>
            </>
          )}
        </h3>
        <p>
          {status === "sent"
            ? "The studio will be in touch to confirm a time. Your appointment isn't confirmed until they reply."
            : `Your request is ready in ${enquiryChannel()} — just press send. The studio will reply to confirm a time; your appointment isn't confirmed until they do.`}
        </p>
        <div className="appt__done-actions">
          {status === "handoff" && (
            <button type="button" className="btn" onClick={() => openEnquiry(message(), "appointment_retry")}>
              Open {enquiryChannel()} again <ArrowRight />
            </button>
          )}
          <button type="button" className="link-arrow" onClick={() => setStatus("idle")}>
            Edit my request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="appt" ref={formRef} onSubmit={submit} noValidate aria-labelledby={id("title")}>
      <div className="appt__head">
        <p className="label label--gold">Book a styling appointment</p>
        <h3 className="h3" id={id("title")}>
          Come see it <em>in person.</em>
        </h3>
      </div>

      <div className="field">
        <label htmlFor={id("name")}>Your name</label>
        <input className="input" autoComplete="name" value={f.name} onChange={(e) => set("name")(e.target.value)} {...a11y("name")} />
        {err("name")}
      </div>

      <div className="field">
        <label htmlFor={id("contact")}>Phone or email</label>
        <input
          className="input"
          autoComplete="tel"
          value={f.contact}
          onChange={(e) => set("contact")(e.target.value)}
          {...a11y("contact")}
        />
        {err("contact")}
      </div>

      <div className="appt__row">
        <div className="field">
          <label htmlFor={id("occasion")}>Occasion</label>
          <select className="input" value={f.occasion} onChange={(e) => set("occasion")(e.target.value)} {...a11y("occasion")}>
            <option value="">Choose…</option>
            {studioOccasions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          {err("occasion")}
        </div>
        <div className="field">
          <label htmlFor={id("date")}>Preferred date</label>
          <input className="input" type="date" min={today()} value={f.date} onChange={(e) => set("date")(e.target.value)} {...a11y("date")} />
          {err("date")}
        </div>
      </div>

      <div className="field">
        <label htmlFor={id("collection")}>Collection of interest (optional)</label>
        <select className="input" value={f.collection} onChange={(e) => set("collection")(e.target.value)} {...a11y("collection")}>
          <option value="">Not sure yet</option>
          {collectionNames.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={id("notes")}>Notes (optional)</label>
        <textarea
          className="input"
          rows={3}
          maxLength={600}
          placeholder="Colours you love, the vibe of the function, anything we should know"
          value={f.notes}
          onChange={(e) => set("notes")(e.target.value)}
          {...a11y("notes")}
        />
        {err("notes")}
      </div>

      {hasBackend && (
        <div className="field">
          <label className="appt__consent">
            <input type="checkbox" name="consent" checked={f.consent} onChange={(e) => set("consent")(e.target.checked)} />
            <span>I agree to Mehfil Couture contacting me about this request.</span>
          </label>
          {err("consent")}
        </div>
      )}

      {status === "error" && (
        <p className="appt__error" role="alert">
          Something went wrong sending your request. Please try again, or{" "}
          <button type="button" className="u" onClick={() => openEnquiry(message(), "appointment_fallback")}>
            send it via {enquiryChannel()}
          </button>
          .
        </p>
      )}

      <button type="submit" className="btn btn--block" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : hasBackend ? "Request appointment" : `Continue in ${enquiryChannel()}`} <ArrowRight />
      </button>
      <p className="note">
        {hasBackend
          ? "We'll only use your details to respond to this request."
          : `Nothing is stored on this website — we'll prepare your message and open ${enquiryChannel()}, and you choose whether to send it.`}
      </p>
    </form>
  );
}
