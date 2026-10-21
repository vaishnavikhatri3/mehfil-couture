import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, Copy, RotateCcw } from "lucide-react";
import {
  blouseStyles,
  defaultLook,
  dupattaColours,
  embroideryMoods,
  jewelleryMoods,
  lehengaColours,
  type Look,
} from "../data/mixmatch";
import { copyText, openEnquiry } from "../lib/enquiry";
import { toast } from "../lib/toast";
import { track } from "../lib/analytics";
import { LehengaSketch } from "./LehengaSketch";
import "./MixAndMatch.css";

const SAVED = "mehfil-saved-looks";
const label = <T extends { key: string; label: string }>(list: readonly T[], k: string) => list.find((x) => x.key === k)?.label ?? "";

function describe(l: Look) {
  return {
    lehenga: label(lehengaColours, l.lehenga),
    blouse: label(blouseStyles, l.blouse),
    dupatta: label(dupattaColours, l.dupatta),
    embroidery: label(embroideryMoods, l.embroidery),
    jewellery: label(jewelleryMoods, l.jewellery),
  };
}

function lookText(l: Look) {
  const d = describe(l);
  return [
    `Lehenga: ${d.lehenga}`,
    `Blouse: ${d.blouse}`,
    `Dupatta: ${d.dupatta}`,
    `Embroidery: ${d.embroidery}`,
    `Jewellery inspiration: ${d.jewellery}`,
  ].join("\n");
}

function readSaved(): Look[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED) || "[]");
  } catch {
    return [];
  }
}

export function MixAndMatch() {
  const [look, setLook] = useState<Look>(defaultLook);
  const [saved, setSaved] = useState<Look[]>(readSaved);
  const d = describe(look);
  const set = <K extends keyof Look>(k: K, v: Look[K]) => setLook((l) => ({ ...l, [k]: v }));

  useEffect(() => {
    try {
      localStorage.setItem(SAVED, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [saved]);

  const save = () => {
    const key = JSON.stringify(look);
    if (saved.some((s) => JSON.stringify(s) === key)) {
      toast("This look is already in your saved looks.");
      return;
    }
    setSaved((s) => [look, ...s].slice(0, 4));
    track("look_saved");
    toast("Saved on this device — find it under “Saved looks”.");
  };

  const copy = async () => {
    const ok = await copyText(`My Mehfil look\n${lookText(look)}`);
    toast(ok ? "Look copied to your clipboard." : "Couldn't copy automatically — please try again.");
  };

  const groups: { title: string; no: string; node: React.ReactNode }[] = [
    {
      no: "A",
      title: "Lehenga colour",
      node: (
        <div className="mm__swatches">
          {lehengaColours.map((c) => (
            <label key={c.key} className="opt opt--swatch">
              <input type="radio" name="mm-lehenga" checked={look.lehenga === c.key} onChange={() => set("lehenga", c.key)} />
              <span className="swatch" style={{ "--sw": c.base } as React.CSSProperties} />
              <span className="swatch__label">{c.label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      no: "B",
      title: "Blouse",
      node: (
        <div className="step__opts">
          {blouseStyles.map((b) => (
            <label key={b.key} className="opt">
              <input type="radio" name="mm-blouse" checked={look.blouse === b.key} onChange={() => set("blouse", b.key)} />
              <span className="chip">{b.label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      no: "C",
      title: "Dupatta",
      node: (
        <div className="mm__swatches">
          {dupattaColours.map((c) => (
            <label key={c.key} className="opt opt--swatch">
              <input type="radio" name="mm-dupatta" checked={look.dupatta === c.key} onChange={() => set("dupatta", c.key)} />
              <span
                className={`swatch ${"base" in c ? "swatch--sheer" : "swatch--none"}`}
                style={{ "--sw": "base" in c ? c.base : "transparent" } as React.CSSProperties}
              />
              <span className="swatch__label">{c.label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      no: "D",
      title: "Embroidery mood",
      node: (
        <div className="step__opts">
          {embroideryMoods.map((e) => (
            <label key={e.key} className="opt" title={e.note}>
              <input type="radio" name="mm-emb" checked={look.embroidery === e.key} onChange={() => set("embroidery", e.key)} />
              <span className="chip">{e.label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      no: "E",
      title: "Jewellery inspiration",
      node: (
        <div className="step__opts">
          {jewelleryMoods.map((j) => (
            <label key={j.key} className="opt">
              <input type="radio" name="mm-jewel" checked={look.jewellery === j.key} onChange={() => set("jewellery", j.key)} />
              <span className="chip">{j.label}</span>
            </label>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section id="sketchbook" className="mm" aria-labelledby="mm-title">
      <div className="wrap">
        <header className="mm__head">
          <p className="label label-row" data-reveal>
            The Atelier Sketchbook · Mix &amp; match
          </p>
          <h2 id="mm-title" className="h2" data-reveal>
            Sketch your <em>own</em> lehenga.
          </h2>
        </header>

        <div className="mm__grid">
          <div className="mm__canvas">
            <div className="mm__paper">
              <LehengaSketch look={look} />
              <ul className="mm__annot" aria-hidden="true">
                <li className="mm__a mm__a--1">
                  <span className="label">Choli</span>
                  {d.blouse}
                </li>
                <li className="mm__a mm__a--2">
                  <span className="label">Dupatta</span>
                  {d.dupatta}
                </li>
                <li className="mm__a mm__a--3">
                  <span className="label">Lehenga</span>
                  {d.lehenga} · {d.embroidery}
                </li>
                <li className="mm__a mm__a--4">
                  <span className="label">Jewellery</span>
                  {d.jewellery}
                </li>
              </ul>
              <span className="mm__sig" aria-hidden="true">
                Mehfil — atelier study
              </span>
            </div>
          </div>

          <div className="mm__controls">
            {groups.map((g) => (
              <fieldset key={g.no} className="step mm__step">
                <legend>
                  <span className="step__no">{g.no}</span> {g.title}
                </legend>
                {g.node}
              </fieldset>
            ))}

            <div className="mm__summary">
              <p className="label">Your look</p>
              <p className="mm__line">
                A <em>{d.lehenga.toLowerCase()}</em> lehenga in {d.embroidery.toLowerCase()}, a {d.blouse.toLowerCase()} blouse,{" "}
                {look.dupatta === "none" ? "no dupatta" : `a ${d.dupatta.toLowerCase()} dupatta`} and {d.jewellery.toLowerCase()}{" "}
                jewellery.
              </p>
              <div className="mm__actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    openEnquiry(
                      `Hi Mehfil Couture! I sketched this look on your website — could something like it be possible?\n${lookText(look)}`,
                      "mix_and_match",
                    )
                  }
                >
                  Enquire about this look <ArrowRight />
                </button>
                <div className="mm__tools">
                  <button type="button" className="mm__tool" onClick={save}>
                    <Bookmark size={16} /> Save
                  </button>
                  <button type="button" className="mm__tool" onClick={copy}>
                    <Copy size={16} /> Copy
                  </button>
                  <button type="button" className="mm__tool" onClick={() => setLook(defaultLook)}>
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>
              </div>

              {saved.length > 0 && (
                <div className="mm__saved">
                  <p className="label">Saved looks · on this device</p>
                  <ul>
                    {saved.map((s, i) => {
                      const sd = describe(s);
                      const c = lehengaColours.find((x) => x.key === s.lehenga);
                      return (
                        <li key={i}>
                          <button type="button" onClick={() => setLook(s)} className="mm__saved-btn">
                            <span className="mm__dot" style={{ background: c?.base }} aria-hidden="true" />
                            {sd.lehenga} · {sd.embroidery}
                          </button>
                          <button
                            type="button"
                            className="mm__remove"
                            aria-label={`Remove saved look ${i + 1}`}
                            onClick={() => setSaved((all) => all.filter((_, j) => j !== i))}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <p className="note">
                An illustration for inspiration — not a catalogue of confirmed options. Share it with the studio and they'll tell
                you what's possible for your piece.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
