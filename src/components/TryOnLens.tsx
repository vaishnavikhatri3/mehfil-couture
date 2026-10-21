import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Download, ImagePlus, Move, RotateCcw, ScanFace, Share2, ShieldCheck, X } from "lucide-react";
import { blouseStyles, defaultLook, dupattaColours, embroideryMoods, lehengaColours, type Look } from "../data/mixmatch";
import { OPEN_LENS } from "../lib/lensBus";
import { openEnquiry } from "../lib/enquiry";
import { toast } from "../lib/toast";
import { track } from "../lib/analytics";
import { LehengaSketch } from "./LehengaSketch";
import "./TryOnLens.css";

/**
 * Try-on Lens — a playful styling OVERLAY, not a realistic virtual try-on.
 * The visitor's photo is read locally via an object URL: it is never uploaded,
 * stored or sent anywhere, and is released when the lens closes.
 */

type Photo = { url: string; w: number; h: number };
type Fit = { x: number; y: number; scale: number; rotate: number; opacity: number };

const DEFAULT_FIT: Fit = { x: 0.5, y: 0.6, scale: 0.6, rotate: 0, opacity: 0.92 };
const VB = { w: 360, h: 630 }; // bare sketch viewBox
const MAX_BYTES = 15 * 1024 * 1024;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const label = <T extends { key: string; label: string }>(list: readonly T[], k: string) => list.find((x) => x.key === k)?.label ?? "";

export function TryOnLens() {
  const [open, setOpen] = useState(false);
  const [look, setLook] = useState<Look>(defaultLook);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [fit, setFit] = useState<Fit>(DEFAULT_FIT);
  const [error, setError] = useState("");
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  const set = <K extends keyof Look>(k: K, v: Look[K]) => setLook((l) => ({ ...l, [k]: v }));

  // Open from elsewhere (e.g. the Sketchbook's current look)
  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<Look | undefined>).detail;
      if (detail) setLook(detail);
      setOpen(true);
    };
    window.addEventListener(OPEN_LENS, on);
    return () => window.removeEventListener(OPEN_LENS, on);
  }, []);

  useEffect(() => {
    if (open) track("lens_open");
  }, [open]);

  // Release the photo from memory on close — nothing persists
  const clearPhoto = useCallback(() => {
    setPhoto((p) => {
      if (p) URL.revokeObjectURL(p.url);
      return null;
    });
    setFit(DEFAULT_FIT);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    clearPhoto();
    setError("");
  }, [clearPhoto]);

  // Dialog: lock scroll, Esc, focus trap, restore focus
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const panel = dialogRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panel) {
        const f = Array.from(panel.querySelectorAll<HTMLElement>("button:not([disabled]), input, [tabindex='0']")).filter(
          (el) => el.offsetParent !== null,
        );
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open, close]);

  // Fit the photo inside the stage (object-fit: contain, but as a real box so the overlay can use %)
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el || !photo) return;
    const measure = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const s = Math.min(W / photo.w, H / photo.h);
      setBox({ w: Math.round(photo.w * s), h: Math.round(photo.h * s) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [photo, open]);

  const onFile = (file?: File) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image — please choose a JPG, PNG or HEIC photo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That photo is over 15 MB — please choose a smaller one.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhoto((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url, w: img.naturalWidth, h: img.naturalHeight };
      });
      setFit(DEFAULT_FIT);
      track("lens_photo_added");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("We couldn't read that photo. Please try another one.");
    };
    img.src = url;
  };

  // ── Drag & pinch the overlay ──
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: fit.scale };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !box.w) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const start = pinch.current;
      setFit((f) => ({ ...f, scale: clamp((start.scale * d) / start.dist, 0.15, 1.6) }));
      return;
    }
    const dx = (e.clientX - prev.x) / box.w;
    const dy = (e.clientY - prev.y) / box.h;
    setFit((f) => ({ ...f, x: clamp(f.x + dx, -0.2, 1.2), y: clamp(f.y + dy, -0.2, 1.2) }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!photo) return;
    setFit((f) => ({ ...f, scale: clamp(f.scale * (e.deltaY < 0 ? 1.05 : 0.95), 0.15, 1.6) }));
  };
  const onOverlayKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const map: Record<string, Partial<Fit>> = {
      ArrowLeft: { x: fit.x - step },
      ArrowRight: { x: fit.x + step },
      ArrowUp: { y: fit.y - step },
      ArrowDown: { y: fit.y + step },
      "+": { scale: clamp(fit.scale * 1.05, 0.15, 1.6) },
      "=": { scale: clamp(fit.scale * 1.05, 0.15, 1.6) },
      "-": { scale: clamp(fit.scale * 0.95, 0.15, 1.6) },
    };
    if (map[e.key]) {
      e.preventDefault();
      setFit((f) => ({ ...f, ...map[e.key] }));
    }
  };

  // ── Compose photo + overlay into an image (all in-browser) ──
  const compose = async (): Promise<Blob | null> => {
    if (!photo || !svgRef.current) return null;
    const k = Math.min(1, 1800 / Math.max(photo.w, photo.h));
    const cw = Math.round(photo.w * k);
    const ch = Math.round(photo.h * k);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const load = (src: string) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      });

    ctx.drawImage(await load(photo.url), 0, 0, cw, ch);

    const svgText = new XMLSerializer().serializeToString(svgRef.current);
    const svgUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const overlay = await load(svgUrl);
      const ow = fit.scale * cw;
      const oh = (ow * VB.h) / VB.w;
      ctx.save();
      ctx.globalAlpha = fit.opacity;
      ctx.translate(fit.x * cw, fit.y * ch);
      ctx.rotate((fit.rotate * Math.PI) / 180);
      ctx.drawImage(overlay, -ow / 2, -oh / 2, ow, oh);
      ctx.restore();
    } finally {
      URL.revokeObjectURL(svgUrl);
    }

    // Small signature
    const fs = Math.max(14, Math.round(cw * 0.026));
    ctx.font = `italic ${fs}px Fraunces, Georgia, serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(251,246,238,.92)";
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = fs / 2;
    ctx.fillText("Mehfil Couture · styling lens", cw - fs, ch - fs);

    return new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.9));
  };

  const save = async () => {
    setBusy(true);
    try {
      const blob = await compose();
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "my-mehfil-look.jpg";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      track("lens_download");
    } catch {
      toast("Couldn't create the image — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await compose();
      if (!blob) return;
      const file = new File([blob], "my-mehfil-look.jpg", { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Mehfil look", text: "Trying on a look with the Mehfil Couture lens" });
        track("lens_share");
      } else {
        await save();
        toast("Sharing isn't supported here, so we saved the image instead.");
      }
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") toast("Couldn't share — try saving the image instead.");
    } finally {
      setBusy(false);
    }
  };

  const enquire = () =>
    openEnquiry(
      [
        "Hi Mehfil Couture! I tried a look in the styling lens on your website:",
        `Lehenga: ${label(lehengaColours, look.lehenga)}`,
        `Blouse: ${label(blouseStyles, look.blouse)}`,
        `Dupatta: ${label(dupattaColours, look.dupatta)}`,
        `Embroidery: ${label(embroideryMoods, look.embroidery)}`,
        "Could something like this be made for me?",
      ].join("\n"),
      "try_on_lens",
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="lens-fab"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <ScanFace size={20} strokeWidth={1.6} />
        <span className="lens-fab__label">Try-on lens</span>
      </button>

      {open && (
        <div className="lens" role="dialog" aria-modal="true" aria-labelledby="lens-title" ref={dialogRef}>
          <div className="lens__backdrop" onClick={close} />
          <div className="lens__panel">
            <header className="lens__head">
              <div>
                <p className="label label--gold">Try-on lens · beta</p>
                <h2 id="lens-title" className="lens__title">
                  See the <em>mood</em> on you.
                </h2>
              </div>
              <button type="button" className="lens__close" onClick={close} aria-label="Close try-on lens" data-autofocus>
                <X size={22} strokeWidth={1.5} />
              </button>
            </header>

            <div className="lens__body">
              {/* Stage */}
              <div className="lens__stage" ref={stageRef} onWheel={onWheel}>
                {photo ? (
                  <div className="lens__photo" style={{ width: box.w, height: box.h }}>
                    <img src={photo.url} alt="Your photo" draggable={false} />
                    <div
                      className="lens__overlay"
                      role="slider"
                      tabIndex={0}
                      aria-label="Lehenga overlay — drag to position, arrow keys to move, plus and minus to resize"
                      aria-valuenow={Math.round(fit.scale * 100)}
                      aria-valuemin={15}
                      aria-valuemax={160}
                      style={{
                        left: `${fit.x * 100}%`,
                        top: `${fit.y * 100}%`,
                        width: `${fit.scale * 100}%`,
                        opacity: fit.opacity,
                        transform: `translate(-50%, -50%) rotate(${fit.rotate}deg)`,
                      }}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                      onKeyDown={onOverlayKey}
                    >
                      <LehengaSketch look={look} bare svgRef={svgRef} className="lens__svg" />
                    </div>
                    <span className="lens__hint label">
                      <Move size={12} /> Drag · pinch or scroll to resize
                    </span>
                  </div>
                ) : (
                  <div className="lens__empty">
                    <div className="lens__ghost" aria-hidden="true">
                      <LehengaSketch look={look} bare className="lens__svg" />
                    </div>
                    <p className="lens__empty-title">Add a photo of yourself</p>
                    <p className="lens__empty-tip">Full-length works best — standing straight, facing the camera, in good light.</p>
                    <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
                      <ImagePlus /> Choose a photo
                    </button>
                    {error && (
                      <p className="field-error" role="alert">
                        {error}
                      </p>
                    )}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    onFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>

              {/* Controls */}
              <div className="lens__controls">
                <p className="lens__privacy">
                  <ShieldCheck size={16} /> Your photo stays on your device. It's never uploaded or stored, and it's cleared when you
                  close the lens.
                </p>

                <fieldset className="lens__group">
                  <legend className="label">Lehenga</legend>
                  <div className="lens__swatches">
                    {lehengaColours.map((c) => (
                      <label key={c.key} className="opt opt--swatch" title={c.label}>
                        <input type="radio" name="lens-lehenga" checked={look.lehenga === c.key} onChange={() => set("lehenga", c.key)} />
                        <span className="swatch" style={{ "--sw": c.base } as React.CSSProperties} />
                        <span className="sr-only">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="lens__group">
                  <legend className="label">Dupatta</legend>
                  <div className="lens__swatches">
                    {dupattaColours.map((c) => (
                      <label key={c.key} className="opt opt--swatch" title={c.label}>
                        <input type="radio" name="lens-dupatta" checked={look.dupatta === c.key} onChange={() => set("dupatta", c.key)} />
                        <span
                          className={`swatch ${"base" in c ? "swatch--sheer" : "swatch--none"}`}
                          style={{ "--sw": "base" in c ? c.base : "transparent" } as React.CSSProperties}
                        />
                        <span className="sr-only">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="lens__group">
                  <legend className="label">Blouse</legend>
                  <div className="lens__chips">
                    {blouseStyles.map((b) => (
                      <label key={b.key} className="opt">
                        <input type="radio" name="lens-blouse" checked={look.blouse === b.key} onChange={() => set("blouse", b.key)} />
                        <span className="chip">{b.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="lens__group">
                  <legend className="label">Embroidery</legend>
                  <div className="lens__chips">
                    {embroideryMoods.map((m) => (
                      <label key={m.key} className="opt">
                        <input type="radio" name="lens-emb" checked={look.embroidery === m.key} onChange={() => set("embroidery", m.key)} />
                        <span className="chip">{m.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {photo && (
                  <fieldset className="lens__group lens__fit">
                    <legend className="label">Fit</legend>
                    <label>
                      <span>Size</span>
                      <input
                        type="range"
                        min={15}
                        max={160}
                        value={Math.round(fit.scale * 100)}
                        onChange={(e) => setFit((f) => ({ ...f, scale: +e.target.value / 100 }))}
                      />
                    </label>
                    <label>
                      <span>Tilt</span>
                      <input type="range" min={-20} max={20} value={fit.rotate} onChange={(e) => setFit((f) => ({ ...f, rotate: +e.target.value }))} />
                    </label>
                    <label>
                      <span>Blend</span>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={Math.round(fit.opacity * 100)}
                        onChange={(e) => setFit((f) => ({ ...f, opacity: +e.target.value / 100 }))}
                      />
                    </label>
                    <div className="lens__row">
                      <button type="button" className="mm__tool" onClick={() => setFit(DEFAULT_FIT)}>
                        <RotateCcw size={16} /> Reset fit
                      </button>
                      <button type="button" className="mm__tool" onClick={() => fileRef.current?.click()}>
                        <ImagePlus size={16} /> Change photo
                      </button>
                    </div>
                  </fieldset>
                )}

                <div className="lens__actions">
                  {photo && (
                    <div className="lens__row">
                      <button type="button" className="btn btn--ghost" onClick={save} disabled={busy}>
                        <Download /> Save image
                      </button>
                      <button type="button" className="btn btn--ghost" onClick={share} disabled={busy}>
                        <Share2 /> Share
                      </button>
                    </div>
                  )}
                  <button type="button" className="btn btn--block" onClick={enquire}>
                    Enquire about this look <ArrowRight />
                  </button>
                  <p className="note">
                    A playful styling overlay to explore colours and proportions — not a realistic virtual try-on. The illustration
                    isn't a specific Mehfil Couture piece.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
