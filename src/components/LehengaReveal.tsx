import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { photos } from "../data/images";
import { gsap, useGSAP } from "../lib/gsap";
import { openEnquiry } from "../lib/enquiry";
import { track } from "../lib/analytics";
import { useSectionLink } from "../hooks/useSectionLink";
import { presetStudio } from "../lib/studioBus";
import { Img } from "./Img";
import { Motif } from "./Icons";
import "./LehengaReveal.css";

const NOTES = [
  { no: "01", term: "The choli", text: "Where the embroidery begins — fitted, framed, close to the heart." },
  { no: "02", term: "The kalis", text: "Panels cut on the bias so the skirt catches air as you move." },
  { no: "03", term: "The ghera", text: "The full flare of the hem. The reason for the twirl." },
];

/**
 * Signature scroll sequence. A cropped editorial photograph is progressively
 * unmasked top-to-bottom while anatomy notes and embroidery details enter.
 * It's a choreographed reveal of a still photograph — not a 3D garment.
 */
export function LehengaReveal() {
  const root = useRef<HTMLElement>(null);
  const go = useSectionLink();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop — pinned, scrubbed sequence (~1.8 screens of scroll)
      mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ".reveal__pin",
            start: "top top",
            end: "+=180%",
            pin: true,
            scrub: 0.9,
            anticipatePin: 1,
          },
        });

        tl.from(".reveal__mask", { clipPath: "inset(0% 0% 56% 0%)", duration: 6, ease: "power1.inOut" }, 0)
          .from(".reveal__img", { scale: 1.32, yPercent: 9, duration: 7, ease: "power1.out" }, 0)
          .from(".reveal__frame-line", { scaleY: 0, duration: 4 }, 0)
          .from(".reveal__ring", { rotate: -140, scale: 0.8, autoAlpha: 0, duration: 9 }, 0)
          .from(".reveal__bgword", { xPercent: 18, duration: 10 }, 0)
          .from(".reveal__note--1", { autoAlpha: 0, x: 24, duration: 1.2 }, 0.6)
          .from(".reveal__note--2", { autoAlpha: 0, x: 24, duration: 1.2 }, 2.6)
          .from(".reveal__note--3", { autoAlpha: 0, x: 24, duration: 1.2 }, 4.6)
          .from(".reveal__note .reveal__rule", { scaleX: 0, duration: 1.2, stagger: 2 }, 0.8)
          .from(".reveal__detail--a", { clipPath: "inset(100% 0% 0% 0%)", y: 60, duration: 2.4, ease: "power2.out" }, 2.2)
          .from(".reveal__detail--b", { clipPath: "inset(0% 0% 100% 0%)", y: -60, duration: 2.4, ease: "power2.out" }, 4)
          .from(".reveal__twirl .ch", { yPercent: 110, rotate: 8, duration: 1.4, stagger: 0.12, ease: "power3.out" }, 6.2)
          .from("[data-rv='end']", { autoAlpha: 0, y: 20, duration: 1.4, stagger: 0.3, ease: "power2.out" }, 7)
          .to({}, { duration: 1.6 }); // a brief hold on the finished look
      });

      // Mobile — lighter, unpinned scrub through the viewport
      mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from(".reveal__mask", {
          clipPath: "inset(0% 0% 62% 0%)",
          ease: "none",
          scrollTrigger: { trigger: ".reveal__mask", start: "top 85%", end: "bottom 75%", scrub: 0.6 },
        });
        gsap.from(".reveal__img", {
          scale: 1.25,
          ease: "none",
          scrollTrigger: { trigger: ".reveal__mask", start: "top bottom", end: "bottom 60%", scrub: 0.6 },
        });
        gsap.from(".reveal__twirl .ch", {
          yPercent: 110,
          stagger: 0.08,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".reveal__twirl", start: "top 90%", once: true },
        });
      });
    },
    { scope: root },
  );

  const twirl = "twirl.".split("");

  return (
    <section id="lehenga-edit" className="reveal" ref={root} aria-labelledby="reveal-title">
      <div className="reveal__pin">
        <span className="reveal__bgword" aria-hidden="true">
          Twirl
        </span>

        <div className="reveal__grid wrap">
          <div className="reveal__copy">
            <p className="label reveal__label">The Lehenga Edit · Signature</p>
            <h2 id="reveal-title" className="reveal__title">
              <span className="reveal__wait">Wait for the</span>
              <span className="sr-only">twirl.</span>
              <span className="reveal__twirl" aria-hidden="true">
                {twirl.map((c, i) => (
                  <span className="ch-wrap" key={i}>
                    <span className="ch">{c}</span>
                  </span>
                ))}
              </span>
            </h2>
            <p className="reveal__sub" data-rv="end">
              Some outfits deserve their own entrance.
            </p>
            <div className="reveal__ctas" data-rv="end">
              <button
                type="button"
                className="btn btn--light"
                onClick={() => {
                  track("campaign_click", { campaign: "lehenga_edit" });
                  openEnquiry("Hi Mehfil Couture! I'd love to discover your lehengas — what's in the studio right now?", "lehenga_edit");
                }}
              >
                Discover the lehenga edit <ArrowRight />
              </button>
              <a
                href="#studio"
                className="link-arrow reveal__link"
                onClick={(e) => {
                  presetStudio({ silhouette: "lehenga" });
                  go("studio")(e);
                }}
              >
                Find your lehenga mood <ArrowRight />
              </a>
            </div>
          </div>

          <div className="reveal__stage">
            <div className="reveal__frame">
              <Motif size={620} className="reveal__ring" />
              <span className="reveal__frame-line" aria-hidden="true" />
              <div className="reveal__mask">
                <Img photo={photos.trail} q={80} className="img-cover reveal__img" sizes="(min-width: 900px) 34vw, 90vw" />
              </div>

              <div className="reveal__detail reveal__detail--a frame">
                <Img photo={photos.zariClose} sizes="(min-width: 900px) 14vw, 40vw" />
              </div>
              <div className="reveal__detail reveal__detail--b frame">
                <Img photo={photos.zariSoft} sizes="(min-width: 900px) 12vw, 40vw" />
              </div>

              <ol className="reveal__notes">
                {NOTES.map((n, i) => (
                  <li key={n.no} className={`reveal__note reveal__note--${i + 1}`}>
                    <span className="reveal__rule" aria-hidden="true" />
                    <span className="label reveal__no">{n.no}</span>
                    <strong>{n.term}</strong>
                    <span>{n.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
