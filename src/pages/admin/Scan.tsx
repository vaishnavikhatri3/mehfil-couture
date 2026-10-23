import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Check, Download, ImageUp, Keyboard, X } from "lucide-react";
import { api, type Design, type Piece, type PieceStatus } from "../../lib/api";
import { codeFromScan, downloadCsv, STATUS_LABEL } from "./qr";
import { PieceCard } from "./PieceCard";
import type { AdminCtx } from "./Admin";

type Mode = "lookup" | "sold" | "reserved" | "in_stock" | "stock";
const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "lookup", label: "Look up", hint: "Scan a tag to see its status, history and scans." },
  { key: "sold", label: "Mark sold", hint: "Every tag you scan is marked sold — use it at the counter." },
  { key: "reserved", label: "Mark reserved", hint: "Every tag you scan is held for a customer." },
  { key: "in_stock", label: "Back in stock", hint: "Returns, trials and unreserved pieces go back on the rack." },
  { key: "stock", label: "Stock check", hint: "Scan everything on the rack; the list shows in-stock pieces you haven't found." },
];
type Logged = { code: string; at: number; ok: boolean; text: string };

type Decode = (img: CanvasImageSource, w: number, h: number) => Promise<string | null>;

/** Native BarcodeDetector where it exists (Chrome, Android); jsQR elsewhere (iPhone Safari). */
async function makeDecoder(): Promise<Decode> {
  const BD = (window as unknown as { BarcodeDetector?: { new (o: object): { detect: (i: CanvasImageSource) => Promise<{ rawValue: string }[]> }; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
  if (BD && (await BD.getSupportedFormats?.().catch((): string[] => []))?.includes("qr_code")) {
    const det = new BD({ formats: ["qr_code"] });
    return async (img) => (await det.detect(img).catch(() => []))[0]?.rawValue ?? null;
  }
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const cx = canvas.getContext("2d", { willReadFrequently: true })!;
  return async (img, w, h) => {
    const k = Math.min(1, 800 / Math.max(w, h));
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(h * k);
    cx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const px = cx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(px.data, px.width, px.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
  };
}

export function Scan({ ctx }: { ctx: AdminCtx }) {
  const [mode, setMode] = useState<Mode>("lookup");
  const [current, setCurrent] = useState<string | null>(null);
  const [log, setLog] = useState<Logged[]>([]);
  const [typed, setTyped] = useState("");
  const [camOn, setCamOn] = useState(false);
  const [camMsg, setCamMsg] = useState("");
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  // stock check
  const [stockDesign, setStockDesign] = useState("");
  const [designs, setDesigns] = useState<Design[]>([]);
  const [inStock, setInStock] = useState<Piece[] | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const video = useRef<HTMLVideoElement>(null);
  const decoder = useRef<Promise<Decode> | null>(null);
  const last = useRef({ code: "", at: 0 });
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const stockRef = useRef(inStock);
  stockRef.current = inStock;
  const stockDesignRef = useRef(stockDesign);
  stockDesignRef.current = stockDesign;

  const getDecoder = () => (decoder.current ??= makeDecoder());

  useEffect(() => {
    api<{ designs: Design[] }>("/api/admin/designs", { admin: true }).then((r) => setDesigns(r.designs)).catch(ctx.onAuthError);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== "stock") return;
    setInStock(null);
    setSeen(new Set());
    api<{ pieces: Piece[] }>(`/api/admin/pieces?status=in_stock${stockDesign ? `&design=${encodeURIComponent(stockDesign)}` : ""}`, { admin: true })
      .then((r) => setInStock(r.pieces))
      .catch(ctx.onAuthError);
  }, [mode, stockDesign]); // eslint-disable-line react-hooks/exhaustive-deps

  function feedback(ok: boolean) {
    setFlash(ok ? "ok" : "bad");
    window.setTimeout(() => setFlash(null), 450);
    try {
      navigator.vibrate?.(ok ? 40 : [60, 60, 60]);
    } catch {
      /* not supported */
    }
  }

  async function handle(raw: string) {
    const code = codeFromScan(raw);
    if (!code) return;
    // Cameras read the same tag many times a second — act once per tag
    const t = Date.now();
    if (last.current.code === code && t - last.current.at < 3000) return;
    last.current = { code, at: t };
    const m = modeRef.current;
    const push = (ok: boolean, text: string) => (setLog((l) => [{ code, at: t, ok, text }, ...l].slice(0, 200)), feedback(ok));

    if (m === "stock") {
      const hit = stockRef.current?.find((p) => p.code === code);
      setSeen((s) => new Set(s).add(code));
      if (hit) return push(true, `${hit.designName} · ${hit.colour} · ${hit.size}`);
      try {
        const r = await api<{ piece: Piece }>(`/api/admin/pieces/${encodeURIComponent(code)}`, { admin: true });
        return push(false, `On the rack but marked ${STATUS_LABEL[r.piece.status].toLowerCase()}${stockDesignRef.current && r.piece.designId !== stockDesignRef.current ? " (other design)" : ""}`);
      } catch (e) {
        ctx.onAuthError(e);
        return push(false, (e as Error).message);
      }
    }

    setCurrent(code);
    if (m === "lookup") {
      try {
        const r = await api<{ piece: Piece }>(`/api/admin/pieces/${encodeURIComponent(code)}`, { admin: true });
        return push(true, `${r.piece.designName} · ${STATUS_LABEL[r.piece.status]}`);
      } catch (e) {
        ctx.onAuthError(e);
        return push(false, (e as Error).message);
      }
    }
    try {
      const r = await api<{ piece: Piece }>(`/api/admin/pieces/${encodeURIComponent(code)}`, { method: "PATCH", admin: true, body: { status: m as PieceStatus } });
      push(true, `${r.piece.designName} · ${r.piece.colour} · ${r.piece.size} → ${STATUS_LABEL[m]}`);
    } catch (e) {
      ctx.onAuthError(e);
      push(false, (e as Error).message);
    }
  }

  // Camera loop
  useEffect(() => {
    if (!camOn) return;
    let stream: MediaStream | null = null;
    let timer = 0;
    let alive = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false });
        if (!alive) return stream.getTracks().forEach((t) => t.stop());
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const decode = await getDecoder();
        setCamMsg("Point the camera at a tag.");
        const tick = async () => {
          if (!alive) return;
          if (v.readyState >= 2 && v.videoWidth) {
            const text = await decode(v, v.videoWidth, v.videoHeight);
            if (text && alive) await handle(text);
          }
          timer = window.setTimeout(tick, 180);
        };
        tick();
      } catch (e) {
        setCamOn(false);
        setCamMsg(
          (e as Error).name === "NotAllowedError"
            ? "Camera permission was declined. Allow it in the browser's site settings, or use “Photo of a tag”."
            : "Couldn't start the camera on this device. Use “Photo of a tag” or type the code.",
        );
      }
    })();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camOn]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fromPhoto(file: File) {
    try {
      const bmp = await createImageBitmap(file);
      const text = await (await getDecoder())(bmp, bmp.width, bmp.height);
      bmp.close();
      if (text) {
        last.current = { code: "", at: 0 };
        await handle(text);
      } else {
        feedback(false);
        setCamMsg("No QR code found in that photo. Fill the frame with the tag and try again.");
      }
    } catch {
      setCamMsg("Couldn't read that photo.");
    }
  }

  const secure = typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
  const missing = useMemo(() => (inStock || []).filter((p) => !seen.has(p.code)), [inStock, seen]);
  const found = (inStock || []).length - missing.length;
  const hint = MODES.find((x) => x.key === mode)!.hint;

  return (
    <div className="ad__stack">
      <div className="ad__head">
        <div>
          <p className="label">Scan tags</p>
          <h1 className="ad__h1">Scan at the counter or the rack</h1>
        </div>
      </div>

      <div className="pcs__status" role="group" aria-label="What a scan does">
        {MODES.map((x) => (
          <button key={x.key} type="button" className="pcs__seg" aria-pressed={mode === x.key} onClick={() => (setMode(x.key), (last.current = { code: "", at: 0 }))}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="note">{hint} Scans here are not counted as customer scans.</p>

      <div className="sc">
        <section className="ad__card sc__cam">
          <div className="sc__view" data-on={camOn || undefined} data-flash={flash || undefined}>
            <video ref={video} muted playsInline aria-label="Camera preview" />
            {!camOn && <span className="sc__idle"><Camera size={36} strokeWidth={1.25} /></span>}
            <i className="sc__frame" aria-hidden="true" />
          </div>
          <div className="ad__acts">
            {secure ? (
              <button type="button" className={camOn ? "ad__btn" : "btn"} onClick={() => (setCamMsg(""), setCamOn(!camOn))}>
                {camOn ? <><CameraOff size={16} /> Stop camera</> : <><Camera /> Start camera</>}
              </button>
            ) : null}
            <label className="ad__btn sc__file">
              <ImageUp size={15} /> Photo of a tag
              <input type="file" accept="image/*" capture="environment" onChange={(e) => (e.target.files?.[0] && fromPhoto(e.target.files[0]), (e.target.value = ""))} />
            </label>
          </div>
          {!secure && <p className="note">The live camera needs the portal on https:// (or localhost). “Photo of a tag” works everywhere.</p>}
          {camMsg && <p className="note" role="status">{camMsg}</p>}
          <form className="sc__type" onSubmit={(e) => (e.preventDefault(), (last.current = { code: "", at: 0 }), handle(typed), setTyped(""))}>
            <Keyboard size={16} aria-hidden="true" />
            <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type a code, or use a USB / Bluetooth scanner" aria-label="Tag code" autoCapitalize="characters" />
            <button type="submit" className="ad__btn" disabled={!typed.trim()}>Go</button>
          </form>
        </section>

        <section className="ad__card sc__side">
          {mode === "stock" ? (
            <>
              <div className="ad__row">
                <h2 className="ad__h2">Stock check</h2>
                <select className="input ad__sel" value={stockDesign} onChange={(e) => setStockDesign(e.target.value)} aria-label="Design to check">
                  <option value="">All designs</option>
                  {designs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {!inStock ? (
                <p className="ad__empty">Loading in-stock pieces…</p>
              ) : (
                <>
                  <div className="sc__meter" aria-label={`${found} of ${inStock.length} found`}>
                    <span><i style={{ transform: `scaleX(${inStock.length ? found / inStock.length : 0})` }} /></span>
                    <b>{found} / {inStock.length}</b> found
                  </div>
                  <div className="ad__row">
                    <h3 className="pc__h">Not scanned yet · {missing.length}</h3>
                    <span className="ad__acts">
                      <button type="button" className="ad__btn" disabled={!missing.length} onClick={() => downloadCsv([["code", "design", "colour", "size", "lot"], ...missing.map((p) => [p.code, p.designName, p.colour, p.size, p.lotId])], `mehfil-stock-missing-${new Date().toISOString().slice(0, 10)}.csv`)}>
                        <Download size={15} /> CSV
                      </button>
                      <button type="button" className="ad__btn" disabled={!seen.size} onClick={() => (setSeen(new Set()), setLog([]))}>Start over</button>
                    </span>
                  </div>
                  <ul className="sc__list">
                    {missing.slice(0, 300).map((p) => (
                      <li key={p.code}><code>{p.code}</code> {p.designName} · {p.colour} · {p.size}</li>
                    ))}
                    {!missing.length && <li className="is-ok"><Check size={14} /> Every in-stock piece is accounted for.</li>}
                  </ul>
                </>
              )}
            </>
          ) : current ? (
            <PieceCard code={current} ctx={ctx} key={`${current}-${log[0]?.at ?? 0}`} />
          ) : (
            <p className="ad__empty">Scan a tag and its details appear here.</p>
          )}
        </section>
      </div>

      {log.length > 0 && (
        <section className="ad__card">
          <div className="ad__row">
            <h2 className="ad__h2">This session · {log.length} scan{log.length > 1 ? "s" : ""}</h2>
            <button type="button" className="ad__icon" aria-label="Clear session list" onClick={() => setLog([])}><X size={16} /></button>
          </div>
          <ol className="sc__log">
            {log.map((l) => (
              <li key={`${l.code}-${l.at}`} data-ok={l.ok || undefined}>
                {l.ok ? <Check size={14} /> : <X size={14} />}
                <button type="button" className="pcs__code" onClick={() => (setMode("lookup"), setCurrent(l.code))}>{l.code}</button>
                <span>{l.text}</span>
                <time>{new Date(l.at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" })}</time>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
