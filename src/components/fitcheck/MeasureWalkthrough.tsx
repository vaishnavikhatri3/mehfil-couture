import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, Lightbulb, Ruler, Shirt, Users, X } from "lucide-react";
import { FIELDS, GARMENTS, type FieldKey, type GarmentKey } from "../../lib/fitcheck/fields";
import { BodyGuide } from "./MeasureGuide";

/**
 * Visual measuring guide shown before the FitCheck form: what to prepare, then
 * every measurement for the chosen outfit — where the tape goes, a tip, and
 * the mistake that most often makes a re-measure necessary.
 */

// Head-to-toe, the order a tailor measures in
const ORDER: FieldKey[] = ["shoulder", "bust", "underbust", "armhole", "sleeve", "blouseLength", "waist", "hip", "waistToFloor", "height"];

const MISTAKE: Record<FieldKey, string> = {
  bust: "The tape slipping down at the back — check it in a mirror.",
  underbust: "Measuring over a padded top, which adds an inch or more.",
  waist: "Measuring at the navel or at your jeans' waistband instead of the natural waist.",
  hip: "Measuring at the hip bones instead of the fullest part of the seat.",
  shoulder: "Running the tape over the front of the neck instead of across the back.",
  sleeve: "Holding the arm stiff and straight — keep it relaxed.",
  armhole: "Pulling the tape tight under the arm; it should rest, not squeeze.",
  blouseLength: "Starting at the shoulder tip instead of next to the neck.",
  waistToFloor: "Measuring in different heels from the ones you'll wear on the day.",
  height: "Measuring in shoes, or without standing against a wall.",
};

const PREP = [
  { icon: <Ruler size={18} />, b: "A soft measuring tape", t: "A tailor's tape, not a metal one. No tape? Use a string, then lay it on a ruler." },
  { icon: <Users size={18} />, b: "Someone to help", t: "Shoulder, back and sleeve measurements are hard to take on your own." },
  { icon: <Shirt size={18} />, b: "Fitted clothes", t: "A thin top, or the bra you'll wear with the outfit. Nothing bulky." },
  { icon: <Check size={18} />, b: "Stand naturally", t: "Feet together, arms relaxed, breathe normally — don't hold your breath or suck in." },
  { icon: <Check size={18} />, b: "Snug, not tight", t: "One finger should slide under the tape. Keep it level with the floor all the way round." },
];

type Props = {
  garment: GarmentKey;
  onGarment: (g: GarmentKey) => void;
  onStart: (method: "body" | "garment" | "card") => void;
};

export function MeasureWalkthrough({ garment, onGarment, onStart }: Props) {
  const g = GARMENTS[garment];
  const fields = ORDER.filter((k) => g.required.includes(k) || g.optional.includes(k));
  const total = fields.length + 2; // prep + fields + ready
  const [i, setI] = useState(0);
  const at = Math.min(i, total - 1);
  const field = at > 0 && at <= fields.length ? fields[at - 1] : null;
  const root = useRef<HTMLElement>(null);
  const first = useRef(true);

  // Bring the new slide's heading into focus for keyboard and screen-reader users
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    root.current?.querySelector<HTMLElement>(".mw__h")?.focus({ preventScroll: true });
    const top = root.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [at]);

  const go = (n: number) => setI(Math.max(0, Math.min(total - 1, n)));

  return (
    <section
      ref={root}
      className="wrap mw"
      aria-roledescription="carousel"
      aria-label="How to measure yourself"
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).matches("select, input")) return;
        if (e.key === "ArrowRight") go(at + 1);
        if (e.key === "ArrowLeft") go(at - 1);
      }}
    >
      <div className="mw__stage">
        <div className="mw__figure" aria-hidden={at === 0 || at === total - 1 || undefined}>
          <BodyGuide active={field} />
          {field && <span className="mw__count">{at} / {fields.length}</span>}
        </div>

        <div className="mw__copy" key={at} aria-live="polite">
          {at === 0 ? (
            <>
              <p className="label label--gold">Before you start · 2 minutes</p>
              <h2 className="mw__h" tabIndex={-1}>
                Measure right, <em>the first time.</em>
              </h2>
              <p className="mw__lede">
                Most re-stitching starts with one wrong number. This guide shows exactly where the tape goes for each measurement — follow it
                once, then fill in the form.
              </p>
              <label className="field mw__garment">
                <span>I'm ordering</span>
                <select className="input" value={garment} onChange={(e) => onGarment(e.target.value as GarmentKey)}>
                  {(Object.keys(GARMENTS) as GarmentKey[]).map((k) => (
                    <option key={k} value={k}>{GARMENTS[k].label}</option>
                  ))}
                </select>
              </label>
              <ul className="mw__prep">
                {PREP.map((p) => (
                  <li key={p.b}>
                    {p.icon}
                    <span><b>{p.b}</b> {p.t}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : field ? (
            <>
              <p className="label">
                Measurement {at} of {fields.length} · {g.required.includes(field) ? "needed" : "optional"} for a {g.label.toLowerCase()}
              </p>
              <h2 className="mw__h" tabIndex={-1}>
                {FIELDS[field].label} <i>({FIELDS[field].hindi})</i>
              </h2>
              <p className="mw__how">{FIELDS[field].how}</p>
              <p className="mw__tip"><Lightbulb size={17} /> <span>{FIELDS[field].tip}</span></p>
              <p className="mw__avoid"><X size={17} /> <span><b>Avoid:</b> {MISTAKE[field]}</span></p>
            </>
          ) : (
            <>
              <p className="label label--gold">You're ready</p>
              <h2 className="mw__h" tabIndex={-1}>
                Now take your <em>measurements.</em>
              </h2>
              <p className="mw__lede">
                You'll need {g.required.length} measurements for a {g.label.toLowerCase()}. The same guide stays beside each box in the form, and every
                number is checked as you type.
              </p>
              <div className="mw__start">
                <button type="button" className="btn" onClick={() => onStart("body")}>
                  <Ruler /> Start measuring with a tape
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => onStart("garment")}>
                  <Shirt /> Measure a garment that fits instead
                </button>
                <button type="button" className="link-arrow" onClick={() => onStart("card")}>
                  <Camera size={16} /> I have a tailor's measurement card
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mw__nav">
        <button type="button" className="btn btn--ghost mw__prev" onClick={() => go(at - 1)} disabled={at === 0}>
          <ArrowLeft /> Back
        </button>
        <ol className="mw__dots" aria-label="Guide steps">
          {Array.from({ length: total }, (_, n) => (
            <li key={n}>
              <button
                type="button"
                aria-label={n === 0 ? "Before you start" : n === total - 1 ? "You're ready" : FIELDS[fields[n - 1]].label}
                aria-current={n === at ? "step" : undefined}
                data-done={n < at || undefined}
                onClick={() => go(n)}
              />
            </li>
          ))}
        </ol>
        {at < total - 1 ? (
          <button type="button" className="btn mw__next" onClick={() => go(at + 1)}>
            {at === 0 ? "Show me how" : "Next"} <ArrowRight />
          </button>
        ) : (
          <span className="mw__next" aria-hidden="true" />
        )}
      </div>
      {at < total - 1 && (
        <p className="mw__skip">
          <button type="button" className="link-arrow" onClick={() => onStart("body")}>
            I know how to measure — skip to the form <ArrowRight />
          </button>
        </p>
      )}
    </section>
  );
}
