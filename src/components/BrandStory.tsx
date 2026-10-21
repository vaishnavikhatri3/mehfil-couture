import { useRef } from "react";
import { photos } from "../data/images";
import { gsap, useGSAP } from "../lib/gsap";
import { Img } from "./Img";
import { Motif } from "./Icons";
import "./BrandStory.css";

const STATEMENT =
  "A mehfil is a gathering — music, people you love, a room full of light. We make clothes for exactly that: the entrance, the first dance, the photograph your family will keep for years.";

const PRINCIPLES = [
  { no: "i.", title: "Handcrafted, first", text: "Bridal wear made by hand, because occasionwear deserves the time it takes." },
  { no: "ii.", title: "Made for the moment", text: "Every silhouette is designed around a real celebration — how it moves, sits and photographs." },
  { no: "iii.", title: "Yours, every time", text: "Tradition when you want it, a modern cut when you don't. Always unmistakably you." },
];

export function BrandStory() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Statement lights up word by word as you read
        gsap.fromTo(
          ".story__word",
          { opacity: 0.16 },
          {
            opacity: 1,
            stagger: 0.08,
            ease: "none",
            scrollTrigger: { trigger: ".story__statement", start: "top 78%", end: "bottom 45%", scrub: true },
          },
        );
        gsap.fromTo(
          ".story__img--a .story__par",
          { yPercent: -8 },
          { yPercent: 8, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
        gsap.fromTo(
          ".story__img--b",
          { y: 80 },
          { y: -60, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
        gsap.to(".story__motif", {
          rotate: 90,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="story" className="story" ref={root} aria-labelledby="story-title">
      <div className="wrap story__grid">
        <div className="story__head">
          <p className="label label-row story__label" data-reveal>
            Our story
          </p>
          <h2 id="story-title" className="story__title" data-reveal>
            An outfit is just the beginning. <em>The feeling is everything.</em>
          </h2>
        </div>

        <div className="story__visuals">
          <div className="story__img story__img--a frame">
            <div className="story__par">
              <Img photo={photos.veilFrame} sizes="(min-width: 900px) 34vw, 80vw" />
            </div>
          </div>
          <div className="story__img story__img--b frame">
            <Img photo={photos.textiles} sizes="(min-width: 900px) 18vw, 45vw" />
          </div>
          <Motif size={180} className="story__motif" />
        </div>

        <div className="story__text">
          <p className="story__statement">
            <span className="sr-only">{STATEMENT}</span>
            <span aria-hidden="true">
              {STATEMENT.split(" ").map((w, i) => (
                <span className="story__word" key={i}>
                  {w}{" "}
                </span>
              ))}
            </span>
          </p>
          <ol className="story__principles">
            {PRINCIPLES.map((p) => (
              <li key={p.no} data-reveal>
                <span className="story__no">{p.no}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
