import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Minus, Plus, X } from "lucide-react";
import { onZoom, type ZoomItem } from "../lib/zoomBus";
import { useMedia } from "../hooks/useMedia";
import "./ZoomViewer.css";

const MAX = 4;
const TAP_ZOOM = 2.5;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * Full-screen inspection view for any zoomable image.
 * Touch: pinch or double-tap to zoom, drag to explore, tap outside to close.
 * Desktop: scroll / double-click to zoom, drag to explore. Keys: + − 0, arrows, Esc.
 */
export function ZoomViewer() {
  const [item, setItem] = useState<ZoomItem | null>(null);
  const [src, setSrc] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [atMax, setAtMax] = useState(false);
  const coarse = useMedia("(pointer: coarse)");
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const view = useRef({ s: 1, x: 0, y: 0 });
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const g = useRef({ dist: 0, s: 1, x: 0, y: 0, mx: 0, my: 0, downX: 0, downY: 0, t: 0, moved: false, lastTap: 0, tapX: 0, tapY: 0, closeTap: false });

  useEffect(
    () =>
      onZoom((next) => {
        trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        view.current = { s: 1, x: 0, y: 0 };
        setZoomed(false);
        setAtMax(false);
        setSrc(next.src);
        setItem(next);
      }),
    [],
  );

  const close = useCallback(() => setItem(null), []);

  // Write the view to the image, keeping it from drifting past its own edges
  const apply = useCallback((animate = false) => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return;
    const v = view.current;
    const mx = Math.max(0, (img.offsetWidth * v.s - stage.clientWidth) / 2);
    const my = Math.max(0, (img.offsetHeight * v.s - stage.clientHeight) / 2);
    v.x = clamp(v.x, -mx, mx);
    v.y = clamp(v.y, -my, my);
    img.classList.toggle("is-anim", animate);
    img.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.s})`;
    setZoomed(v.s > 1.01);
    setAtMax(v.s > MAX - 0.01);
  }, []);

  /** Zoom to `next`, keeping the point (cx, cy) — relative to the stage centre — where it is */
  const zoomAt = useCallback(
    (next: number, cx = 0, cy = 0, animate = false) => {
      const v = view.current;
      const s = clamp(next, 1, MAX);
      v.x = cx - ((cx - v.x) * s) / v.s;
      v.y = cy - ((cy - v.y) * s) / v.s;
      v.s = s;
      apply(animate);
    },
    [apply],
  );

  // Size the photo to fit the stage (contain) as a real box, so panning limits are exact
  const fit = useCallback(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img?.naturalWidth) return;
    const pad = stage.clientWidth < 600 ? 12 : 40;
    const c = Math.min((stage.clientWidth - pad * 2) / img.naturalWidth, (stage.clientHeight - pad * 2) / img.naturalHeight);
    img.style.width = `${img.naturalWidth * c}px`;
    img.style.height = `${img.naturalHeight * c}px`;
    apply();
  }, [apply]);

  // Sharper rendition: show the cached image at once, swap when the larger one is ready
  useEffect(() => {
    const hi = item?.hiSrc;
    if (!hi || hi === item.src) return;
    let live = true;
    const pre = new Image();
    pre.src = hi;
    pre
      .decode()
      .then(() => live && setSrc(hi))
      .catch(() => {
        /* keep the current rendition */
      });
    return () => {
      live = false;
    };
  }, [item]);

  // Dialog: lock scroll, keys, wheel, focus trap, restore focus
  useEffect(() => {
    if (!item) return;
    const dialog = dialogRef.current;
    const stage = stageRef.current;
    if (!dialog || !stage) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      // ctrlKey = trackpad pinch
      zoomAt(view.current.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    };
    const onKey = (e: KeyboardEvent) => {
      const v = view.current;
      if (e.key === "Escape") return close();
      if (e.key === "Tab") {
        const f = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled])"));
        if (!f.length) return;
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (i === -1 || (e.shiftKey && i === 0) || (!e.shiftKey && i === f.length - 1)) {
          e.preventDefault();
          f[e.shiftKey ? f.length - 1 : 0].focus();
        }
        return;
      }
      if (e.key === "+" || e.key === "=") zoomAt(v.s * 1.5, 0, 0, true);
      else if (e.key === "-" || e.key === "_") zoomAt(v.s / 1.5, 0, 0, true);
      else if (e.key === "0") zoomAt(1, 0, 0, true);
      else if (e.key.startsWith("Arrow") && v.s > 1.01) {
        v.x += e.key === "ArrowLeft" ? 80 : e.key === "ArrowRight" ? -80 : 0;
        v.y += e.key === "ArrowUp" ? 80 : e.key === "ArrowDown" ? -80 : 0;
        apply(true);
      } else return;
      e.preventDefault();
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", fit);
    return () => {
      root.style.overflow = "";
      stage.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", fit);
      pts.current.clear();
      trigger.current?.focus({ preventScroll: true });
    };
  }, [item, close, zoomAt, apply, fit]);

  // ── Touch & mouse gestures: one pointer pans, two pinch; both anchored where they started ──
  const anchor = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const p = Array.from(pts.current.values());
    const r = stage.getBoundingClientRect();
    const v = view.current;
    Object.assign(g.current, {
      dist: p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0,
      s: v.s,
      x: v.x,
      y: v.y,
      mx: p.reduce((a, q) => a + q.x, 0) / p.length - r.left - r.width / 2,
      my: p.reduce((a, q) => a + q.y, 0) / p.length - r.top - r.height / 2,
    });
  };

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 1) Object.assign(g.current, { moved: false, closeTap: false, t: e.timeStamp, downX: e.clientX, downY: e.clientY });
    else g.current.moved = true; // a second finger is never a tap
    anchor();
  };

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage || !pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const st = g.current;
    if (Math.hypot(e.clientX - st.downX, e.clientY - st.downY) > 6) st.moved = true;
    const p = Array.from(pts.current.values());
    const r = stage.getBoundingClientRect();
    const mx = p.reduce((a, q) => a + q.x, 0) / p.length - r.left - r.width / 2;
    const my = p.reduce((a, q) => a + q.y, 0) / p.length - r.top - r.height / 2;
    const s = p.length > 1 && st.dist ? clamp((st.s * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)) / st.dist, 1, MAX) : st.s;
    if (s <= 1.01 && p.length < 2) return; // nothing to pan at fit size
    const v = view.current;
    v.s = s;
    v.x = mx - (s * (st.mx - st.x)) / st.s;
    v.y = my - (s * (st.my - st.y)) / st.s;
    apply();
  };

  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pts.current.delete(e.pointerId)) return;
    if (pts.current.size) return anchor();
    const st = g.current;
    if (e.type === "pointercancel" || st.moved || e.timeStamp - st.t > 350) return void (st.closeTap = false);

    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return;
    const ir = img.getBoundingClientRect();
    const onImage = e.clientX >= ir.left && e.clientX <= ir.right && e.clientY >= ir.top && e.clientY <= ir.bottom;
    const isDouble = e.timeStamp - st.lastTap < 320 && Math.hypot(e.clientX - st.tapX, e.clientY - st.tapY) < 30;
    if (onImage && isDouble) {
      st.lastTap = 0;
      const r = stage.getBoundingClientRect();
      zoomAt(view.current.s > 1.01 ? 1 : TAP_ZOOM, e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2, true);
      return;
    }
    // Tap outside the photo closes — on the click that follows, so it can't fall through to the page
    Object.assign(st, { lastTap: e.timeStamp, tapX: e.clientX, tapY: e.clientY, closeTap: !onImage && view.current.s <= 1.01 });
  };

  const onClick = () => {
    if (g.current.closeTap) close();
  };

  if (!item) return null;

  return (
    <div className="zv" role="dialog" aria-modal="true" aria-label="Image viewer" aria-describedby="zv-cap" ref={dialogRef}>
      <div
        className={`zv__stage ${zoomed ? "is-zoomed" : ""}`}
        ref={stageRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={onClick}
      >
        <img ref={imgRef} className="zv__img" src={src} alt={item.alt} draggable={false} onLoad={fit} />
      </div>

      <div className="zv__tools">
        <button type="button" className="zv__btn" onClick={() => zoomAt(view.current.s / 1.5, 0, 0, true)} disabled={!zoomed} aria-label="Zoom out">
          <Minus />
        </button>
        <button type="button" className="zv__btn" onClick={() => zoomAt(view.current.s * 1.5, 0, 0, true)} disabled={atMax} aria-label="Zoom in">
          <Plus />
        </button>
        <button type="button" className="zv__btn zv__close" onClick={close} aria-label="Close image viewer" data-autofocus>
          <X />
        </button>
      </div>

      <p className="zv__cap" id="zv-cap">
        <span className="zv__alt">{item.alt}</span>
        <span className="label zv__hint">
          {coarse ? "Pinch or double-tap to zoom · drag to explore" : "Scroll or double-click to zoom · drag to explore"}
        </span>
      </p>
    </div>
  );
}
