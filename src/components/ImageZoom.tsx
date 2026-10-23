import { useEffect, useRef, type ReactNode } from "react";
import { openZoom } from "../lib/zoomBus";
import { REDUCED } from "../hooks/useMedia";
import "./ImageZoom.css";

export type ZoomMode = "zoom" | "lens";

type Props = {
  children: ReactNode; // a single <img>
  alt: string;
  /** "zoom" magnifies the photo in place; "lens" shows a magnifier under the cursor */
  mode?: ZoomMode;
  /** Magnification at full zoom, or inside the lens */
  scale?: number;
  /** A larger rendition of the same photo — loaded only when someone inspects it */
  hiSrc?: string;
};

const MIN_SIZE = 120; // px — thumbnails keep their existing hover
const FINE = "(hover: hover) and (pointer: fine)";
const CONTROL = "a, button, input, select, textarea, label, [role='button']";

// Several images can share one frame (crossfading slides) — count who made it clickable
const zones = new WeakMap<Element, number>();

/**
 * Desktop: hover to magnify the photo around the cursor (or show a lens).
 * Everywhere: click / tap / Enter opens the full-screen viewer — unless the
 * image already sits inside a link or button, which keeps its own behaviour.
 *
 * The zoom transform lives on a wrapper, never on the <img>, so GSAP reveals
 * and existing CSS hovers on the image keep working untouched.
 */
export function ImageZoom({ children, alt, mode = "zoom", scale, hiSrc }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const paneRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const zoomBy = scale ?? (mode === "lens" ? 2.4 : 2);

  useEffect(() => {
    const el = ref.current;
    const pane = paneRef.current;
    const img = pane?.querySelector("img");
    if (!el || !pane || !img) return;
    const lens = lensRef.current;
    const zone = el.closest<HTMLElement>(".frame") ?? el; // captions over the photo still count as "on it"
    const inControl = !!el.parentElement?.closest(CONTROL);
    const fine = window.matchMedia(FINE);
    const reduced = window.matchMedia(REDUCED);

    // Of the images sharing a frame, only the visible top one responds
    const isTop = () => {
      if (zone === el) return true;
      const shown = Array.from(zone.querySelectorAll<HTMLElement>(".zoom")).filter(
        (z) => z.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? true,
      );
      return shown[shown.length - 1] === el;
    };

    // ── Full-screen viewer ──
    let hi = ""; // hiSrc once it has loaded
    const open = () => openZoom({ src: hi || img.currentSrc || img.src, hiSrc, alt });
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || !isTop()) return;
      // Ignore real controls over the photo — but another image wrapper in this frame is fine
      const hit = (e.target as Element).closest(CONTROL);
      if ((hit && !(hit.classList.contains("zoom") && zone.contains(hit))) || String(window.getSelection() ?? "")) return;
      open();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      open();
    };
    if (!inControl) {
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", `${alt} (view full screen)`);
      if (!el.closest("[aria-hidden='true']")) el.tabIndex = 0;
      zones.set(zone, (zones.get(zone) ?? 0) + 1);
      zone.classList.add("zoom-zone");
      zone.addEventListener("click", onClick);
      el.addEventListener("keydown", onKey);
    }

    // ── Hover magnification ──
    let raf = 0;
    let last = 0;
    let on = false;
    let box = { left: 0, top: 0, w: 1, h: 1 };
    let px = 0;
    let py = 0;
    const cur = { s: 1, x: 0.5, y: 0.5 };
    const goal = { s: 1, x: 0.5, y: 0.5 };
    let fit = { ox: 0, oy: 0, cw: 1, ch: 1 };
    let lensD = 160;

    // Untransformed box: the host fills its parent's content box
    const measure = () => {
      const host = el.parentElement ?? el;
      const r = host.getBoundingClientRect();
      box = { left: r.left + host.clientLeft, top: r.top + host.clientTop, w: el.offsetWidth || 1, h: el.offsetHeight || 1 };
    };
    const follow = (e: PointerEvent) => {
      px = Math.min(Math.max(e.clientX - box.left, 0), box.w);
      py = Math.min(Math.max(e.clientY - box.top, 0), box.h);
      goal.x = px / box.w;
      goal.y = py / box.h;
    };

    // Where the photo actually sits inside the box (object-fit + object-position)
    const fitContent = () => {
      const cs = getComputedStyle(img);
      const nw = img.naturalWidth || box.w;
      const nh = img.naturalHeight || box.h;
      const c = (cs.objectFit === "contain" ? Math.min : Math.max)(box.w / nw, box.h / nh);
      const cw = nw * c;
      const ch = nh * c;
      const [fx, fy] = cs.objectPosition.split(" ");
      const off = (v: string | undefined, free: number) =>
        v?.endsWith("%") ? (free * parseFloat(v)) / 100 : v?.endsWith("px") ? parseFloat(v) : free / 2;
      fit = { ox: off(fx, box.w - cw), oy: off(fy, box.h - ch), cw, ch };
    };
    const lensImage = () => {
      if (lens) lens.style.backgroundImage = `url(${JSON.stringify(hi || img.currentSrc || img.src)})`;
    };

    const frame = (t: number) => {
      raf = 0;
      if (mode === "lens") {
        if (!lens) return;
        const r = lensD / 2;
        lens.style.transform = `translate3d(${px - r}px, ${py - r}px, 0)`;
        lens.style.backgroundPosition = `${r - (px - fit.ox) * zoomBy}px ${r - (py - fit.oy) * zoomBy}px`;
        return;
      }
      // Ease towards the cursor, frame-rate independent
      const k = 1 - Math.pow(0.82, Math.min(t - last, 64) / 16.7);
      last = t;
      cur.s += (goal.s - cur.s) * k;
      cur.x += (goal.x - cur.x) * k;
      cur.y += (goal.y - cur.y) * k;
      const settled =
        Math.abs(goal.s - cur.s) < 0.002 && Math.abs(goal.x - cur.x) < 0.0005 && Math.abs(goal.y - cur.y) < 0.0005;
      if (settled) Object.assign(cur, goal);
      if (cur.s === 1) {
        pane.style.transform = "";
        el.classList.remove("is-zooming");
        return;
      }
      // Scale about the cursor: the point under it stays put, so the zoom never leaves the frame
      pane.style.transform = `translate3d(${-(cur.s - 1) * cur.x * 100}%, ${-(cur.s - 1) * cur.y * 100}%, 0) scale(${cur.s})`;
      if (!settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    // Swap in the larger rendition only if the one on screen would look soft at this magnification
    let loading = false;
    const upgrade = () => {
      if (loading || !hiSrc) return;
      loading = true;
      let shown = img.naturalWidth;
      try {
        shown = Number(new URL(img.currentSrc || img.src, location.href).searchParams.get("w")) || shown;
      } catch {
        /* keep naturalWidth */
      }
      if (box.w * zoomBy * window.devicePixelRatio <= shown * 1.15) return;
      const pre = new Image();
      pre.src = hiSrc;
      pre
        .decode()
        .then(() => {
          if (!el.isConnected) return;
          hi = hiSrc;
          if (mode === "lens") return lensImage();
          img.removeAttribute("srcset");
          img.src = hiSrc;
        })
        .catch(() => {
          /* keep the current rendition */
        });
    };

    let declined = false; // already decided not to zoom for this visit
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !fine.matches) return;
      if (mode === "zoom" && reduced.matches) return; // the click-to-view stays; the motion doesn't
      measure();
      if (Math.min(box.w, box.h) < MIN_SIZE || !isTop()) return void (declined = true);
      on = true;
      follow(e);
      if (mode === "lens" && lens) {
        fitContent();
        lensD = Math.round(Math.min(Math.max(Math.min(box.w, box.h) * 0.36, 120), 220));
        lens.style.width = lens.style.height = `${lensD}px`;
        lens.style.backgroundSize = `${fit.cw * zoomBy}px ${fit.ch * zoomBy}px`;
        lensImage();
        lens.classList.add("is-on");
        zone.classList.add("is-lensing");
      } else {
        if (cur.s === 1) Object.assign(cur, { x: goal.x, y: goal.y }); // grow from the cursor, not the centre
        goal.s = zoomBy;
        el.classList.add("is-zooming");
      }
      window.addEventListener("scroll", measure, { passive: true });
      upgrade();
      kick();
    };
    const onMove = (e: PointerEvent) => {
      // The photo can appear under a resting cursor (route change, slide swap) — no enter event then
      if (!on) return void (!declined && onEnter(e));
      follow(e);
      kick();
    };
    const onLeave = () => {
      declined = false;
      if (!on) return;
      on = false;
      window.removeEventListener("scroll", measure);
      if (mode === "lens") {
        lens?.classList.remove("is-on");
        zone.classList.remove("is-lensing");
      } else {
        goal.s = 1;
        kick();
      }
    };
    zone.addEventListener("pointerenter", onEnter);
    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      zone.removeEventListener("pointerenter", onEnter);
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
      zone.removeEventListener("click", onClick);
      el.removeEventListener("keydown", onKey);
      pane.style.transform = "";
      el.classList.remove("is-zooming");
      zone.classList.remove("is-lensing");
      if (!inControl) {
        el.removeAttribute("role");
        el.removeAttribute("aria-label");
        el.removeAttribute("tabindex");
        const n = (zones.get(zone) ?? 1) - 1;
        zones.set(zone, n);
        if (!n) zone.classList.remove("zoom-zone");
      }
    };
  }, [mode, zoomBy, hiSrc, alt]);

  return (
    <span className="zoom" ref={ref}>
      <span className="zoom__pane" ref={paneRef}>
        {children}
      </span>
      {mode === "lens" && <span className="zoom__lens" ref={lensRef} aria-hidden="true" />}
    </span>
  );
}
