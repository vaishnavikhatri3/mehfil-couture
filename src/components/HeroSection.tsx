import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { photos } from "../data/images";
import { brand } from "../config/brand";
import { gsap, useGSAP } from "../lib/gsap";
import { useSectionLink } from "../hooks/useSectionLink";
import { Img } from "./Img";
import { Stamp, Dinkus } from "./Icons";
import "./HeroSection.css";

export function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const go = useSectionLink();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Runs in a layout effect (before first paint), so `from` states never flash.
        const nav = document.querySelector(".nav");
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        if (nav) tl.from(nav, { autoAlpha: 0, y: -12, duration: 1 }, 0);
        tl.from("[data-hero='label']", { autoAlpha: 0, y: 14, duration: 0.9 }, 0.15)
          .from(".hero__title .ln > span", { yPercent: 112, duration: 1.25, stagger: 0.11 }, 0.25)
          .from("[data-hero='frame']", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, 0.3)
          .from(".hero__img", { scale: 1.28, duration: 2.2 }, 0.45)
          .from("[data-hero='line']", { scaleY: 0, duration: 1.4 }, 1.0)
          .from("[data-hero='pop']", { autoAlpha: 0, scale: 0.92, rotate: -8, duration: 1.1, stagger: 0.12 }, 1.1)
          .from("[data-hero='fade']", { autoAlpha: 0, y: 18, duration: 1, stagger: 0.1 }, 0.95);

        // Gentle parallax as the hero scrolls away
        gsap.to(".hero__parallax", {
          yPercent: 10,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero__stamp-wrap", {
          y: -60,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section className="hero" ref={root} aria-labelledby="hero-title">
      <div className="hero__grid wrap">
        <div className="hero__copy">
          <p className="label label-row hero__kicker" data-hero="label">
            The art of arriving · Indian occasionwear
          </p>
          <h1 id="hero-title" className="display hero__title">
            <span className="ln">
              <span>Not just</span>
            </span>
            <span className="ln">
              <span>an outfit.</span>
            </span>
            <span className="ln">
              <span>
                A whole <em>mehfil.</em>
              </span>
            </span>
          </h1>
          <p className="lede hero__lede" data-hero="fade">
            Statement silhouettes, celebration-ready looks, and the outfit you’ll remember long after the last song.
          </p>
          <div className="hero__ctas" data-hero="fade">
            <a href="#collections" className="btn" onClick={go("collections")}>
              Explore the collection <ArrowRight />
            </a>
            <a href="#studio" className="link-arrow" onClick={go("studio")}>
              Find your look <ArrowRight />
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <span className="hero__frame-line" data-hero="line" aria-hidden="true" />
          <figure className="hero__frame frame" data-hero="frame">
            <div className="hero__parallax">
              <Img
                photo={photos.heroRed}
                eager
                q={78}
                className="img-cover hero__img"
                sizes="(min-width: 1100px) 42vw, (min-width: 700px) 60vw, 100vw"
              />
            </div>
            <figcaption className="hero__fig label">
              <span>Fig. 01</span>
              <span>The arrival</span>
            </figcaption>
          </figure>
          <div className="hero__stamp-wrap">
            <div data-hero="pop" className="hero__stamp">
              <Stamp text="MEHFIL COUTURE · INDORE · DRESS YOUR DREAM · " />
            </div>
          </div>
          <p className="hero__vert label" data-hero="pop" aria-hidden="true">
            {brand.categories.join("  —  ")}
          </p>
        </div>
      </div>

      <div className="hero__foot wrap" data-hero="fade">
        <span className="label">
          <Dinkus size={8} className="hero__dink" /> Flagship studio · South Tukoganj, Indore
        </span>
        <a href="#collections" className="hero__scroll label" onClick={go("collections")}>
          Scroll to unveil
          <span className="hero__scroll-line" aria-hidden="true" />
        </a>
        <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="label hero__ig">
          {brand.instagram.handle}
        </a>
      </div>
    </section>
  );
}
