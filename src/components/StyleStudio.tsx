import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, RotateCcw, Share2 } from "lucide-react";
import {
  composeMood,
  emptySelection,
  moodMessage,
  studioAesthetics,
  studioColours,
  studioOccasions,
  studioSilhouettes,
  type AestheticKey,
  type StudioSelection,
} from "../data/studio";
import type { Photo } from "../data/images";
import { openEnquiry, enquiryChannel } from "../lib/enquiry";
import { shareText } from "../lib/share";
import { track } from "../lib/analytics";
import { STUDIO_PRESET } from "../lib/studioBus";
import { Img } from "./Img";
import "./StyleStudio.css";

const STORE = "mehfil-studio";

function load(): StudioSelection {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return { ...emptySelection, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return emptySelection;
}

export function StyleStudio() {
  const [sel, setSel] = useState<StudioSelection>(load);
  const mood = useMemo(() => composeMood(sel), [sel]);
  const [layers, setLayers] = useState<{ photo: Photo; n: number }[]>(() => [{ photo: mood.photo, n: 0 }]);
  const tracked = useRef(false);
  const [flash, setFlash] = useState(false);
  const moodRef = useRef<HTMLDivElement>(null);

  // Keep the last two images so the new one can wipe in over the old one
  useEffect(() => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top.photo.src === mood.photo.src) return prev;
      return [top, { photo: mood.photo, n: top.n + 1 }];
    });
  }, [mood.photo]);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(sel));
    } catch {
      /* ignore */
    }
    if (mood.complete === mood.total && !tracked.current) {
      tracked.current = true;
      track("studio_complete", { mood: mood.title });
    }
  }, [sel, mood.complete, mood.total, mood.title]);

  // Presets from other sections ("Style this occasion", lehenga reveal)
  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<Partial<StudioSelection>>).detail;
      setSel((s) => ({ ...s, ...detail }));
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1200);
    };
    window.addEventListener(STUDIO_PRESET, on);
    return () => window.removeEventListener(STUDIO_PRESET, on);
  }, []);

  const toggleAesthetic = (k: AestheticKey) =>
    setSel((s) => {
      if (s.aesthetics.includes(k)) return { ...s, aesthetics: s.aesthetics.filter((a) => a !== k) };
      const next = [...s.aesthetics, k];
      return { ...s, aesthetics: next.slice(-2) }; // max two — the oldest makes way
    });

  const share = async () => {
    const res = await shareText(
      "My Mehfil mood",
      `My Mehfil mood is “${mood.title}” — ${mood.description} Find yours at Mehfil Couture:`,
    );
    track("studio_share", { result: res });
  };

  const top = layers[layers.length - 1];

  return (
    <section id="studio" className="studio" aria-labelledby="studio-title">
      <div className="wrap">
        <header className="studio__head">
          <p className="label label-row" data-reveal>
            The Mehfil Style Studio
          </p>
          <h2 id="studio-title" className="h2" data-reveal>
            Find your <em>celebration mood.</em>
          </h2>
          <p className="lede" data-reveal>
            Four quick choices. We'll put your mood into words, match it to an inspiration image and help you take it to
            the studio.
          </p>
        </header>

        <div className="studio__grid">
          <form className="studio__controls" onSubmit={(e) => e.preventDefault()} aria-describedby="studio-note">
            <fieldset className="step">
              <legend>
                <span className="step__no">01</span> The occasion
              </legend>
              <div className="step__opts">
                {studioOccasions.map((o) => (
                  <label key={o.key} className="opt">
                    <input
                      type="radio"
                      name="occasion"
                      value={o.key}
                      checked={sel.occasion === o.key}
                      onChange={() => setSel((s) => ({ ...s, occasion: o.key }))}
                    />
                    <span className="chip">{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="step">
              <legend>
                <span className="step__no">02</span> Your colour
              </legend>
              <div className="step__opts step__opts--swatches">
                {studioColours.map((c) => (
                  <label key={c.key} className="opt opt--swatch">
                    <input
                      type="radio"
                      name="colour"
                      value={c.key}
                      checked={sel.colour === c.key}
                      onChange={() => setSel((s) => ({ ...s, colour: c.key }))}
                    />
                    <span className="swatch" style={{ "--sw": c.hex } as React.CSSProperties} />
                    <span className="swatch__label">{c.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="step">
              <legend>
                <span className="step__no">03</span> The aesthetic <span className="step__hint">pick up to two</span>
              </legend>
              <div className="step__opts">
                {studioAesthetics.map((a) => (
                  <label key={a.key} className="opt">
                    <input
                      type="checkbox"
                      name="aesthetic"
                      value={a.key}
                      checked={sel.aesthetics.includes(a.key)}
                      onChange={() => toggleAesthetic(a.key)}
                    />
                    <span className="chip">{a.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="step">
              <legend>
                <span className="step__no">04</span> The silhouette
              </legend>
              <div className="step__opts">
                {studioSilhouettes.map((s) => (
                  <label key={s.key} className="opt">
                    <input
                      type="radio"
                      name="silhouette"
                      value={s.key}
                      checked={sel.silhouette === s.key}
                      onChange={() => setSel((v) => ({ ...v, silhouette: s.key }))}
                    />
                    <span className="chip">{s.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <p id="studio-note" className="note studio__note">
              A styling inspiration tool: your mood is composed from your choices and matched to editorial imagery. It isn't a
              virtual try-on, and images aren't specific products — the studio will suggest real pieces.
            </p>

            {mood.complete > 0 && (
              <div className="studio__mini">
                <span className="mood__swatch" style={{ background: mood.swatch }} aria-hidden="true" />
                <span className="studio__mini-title">{mood.title}</span>
                <button
                  type="button"
                  className="studio__mini-btn"
                  onClick={() => moodRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  See my mood ↓
                </button>
              </div>
            )}
          </form>

          <div className={`mood ${flash ? "is-flash" : ""}`} aria-live="polite" ref={moodRef}>
            <div className="mood__media frame">
              {layers.map((l) => (
                <div key={l.n} className={`mood__layer ${l === top && l.n > 0 ? "is-entering" : ""}`}>
                  <Img photo={l.photo} sizes="(min-width: 1000px) 38vw, 92vw" />
                </div>
              ))}
              <div className="mood__progress" aria-hidden="true">
                {Array.from({ length: mood.total }, (_, i) => (
                  <span key={i} className={i < mood.complete ? "on" : ""} />
                ))}
              </div>
            </div>

            <div className="mood__card">
              <div className="mood__kicker">
                <span className="mood__swatch" style={{ background: mood.swatch }} aria-hidden="true" />
                <span className="label">Your mood</span>
                <span className="label mood__count">
                  {mood.complete}/{mood.total} chosen
                </span>
              </div>
              <h3 className="mood__title">{mood.title}</h3>
              <p className="mood__desc">{mood.description}</p>

              {mood.notes.length > 0 && (
                <dl className="mood__notes">
                  {mood.notes.map((n) => (
                    <div key={n.label}>
                      <dt className="label">{n.label}</dt>
                      <dd>{n.text}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mood__actions">
                <button
                  type="button"
                  className="btn btn--block"
                  onClick={() => openEnquiry(moodMessage(sel), "style_studio")}
                  disabled={mood.complete === 0}
                >
                  Request a personalised recommendation <ArrowRight />
                </button>
                <div className="mood__row">
                  <button type="button" className="link-arrow" onClick={share} disabled={mood.complete === 0}>
                    <Share2 /> Share your Mehfil mood
                  </button>
                  <button
                    type="button"
                    className="link-arrow mood__reset"
                    onClick={() => {
                      setSel(emptySelection);
                      tracked.current = false;
                    }}
                  >
                    <RotateCcw /> Start over
                  </button>
                </div>
                <p className="note">Opens {enquiryChannel()} with your choices filled in — nothing is sent until you press send.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
