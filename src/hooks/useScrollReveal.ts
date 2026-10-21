import type { RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";

/**
 * Site-wide scroll choreography for elements marked with:
 *   data-reveal  → fade + rise as it enters (batched, staggered)
 *   data-clip    → clip-path wipe upward, inner image settles from 1.15×
 *   data-speed   → subtle parallax drift (desktop only)
 * Everything is skipped under prefers-reduced-motion.
 */
export function useScrollReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const reveals = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        gsap.set(reveals, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(reveals, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, overwrite: true }),
        });

        gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((el) => {
          const img = el.querySelector("img");
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } });
          tl.from(el, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.35, ease: "expo.inOut" });
          if (img) tl.from(img, { scale: 1.15, duration: 1.8, ease: "expo.out" }, 0.1);
        });
      });

      mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
          const speed = parseFloat(el.dataset.speed || "1");
          gsap.fromTo(
            el,
            { y: 40 * speed },
            {
              y: -40 * speed,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });

      // Fonts and late images can shift layout — recompute trigger positions.
      const refresh = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refresh);
      window.addEventListener("load", refresh);
      return () => window.removeEventListener("load", refresh);
    },
    { scope },
  );
}
