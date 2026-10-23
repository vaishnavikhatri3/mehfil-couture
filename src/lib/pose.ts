import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import wasmLoaderPath from "@mediapipe/tasks-vision/vision_wasm_internal.js?url";
import wasmBinaryPath from "@mediapipe/tasks-vision/vision_wasm_internal.wasm?url";

/**
 * In-browser body scan for the try-on lens. The photo is analysed locally by
 * MediaPipe Pose (WebAssembly) — only the model file is downloaded; the photo
 * itself never leaves the device.
 */

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

export type Fit = { x: number; y: number; scale: number; rotate: number; opacity: number; stretch: number };
type Pt = { x: number; y: number };

// Anchor points in the bare lehenga sketch (viewBox "20 80 360 630")
const SK = {
  originY: 80,
  w: 360,
  h: 630,
  centreY: 80 + 630 / 2,
  neckY: 104, // blouse shoulder line
  hemY: 679, // centre of the curved hem
  shoulderW: 124, // blouse width across the shoulders
};

let landmarker: Promise<PoseLandmarker> | null = null;

function load() {
  landmarker ??= import("@mediapipe/tasks-vision")
    .then(({ PoseLandmarker }) =>
      PoseLandmarker.createFromOptions(
        { wasmLoaderPath, wasmBinaryPath },
        { baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" }, runningMode: "IMAGE", numPoses: 1 },
      ),
    )
    .catch((e) => {
      landmarker = null; // let the next photo retry
      throw e;
    });
  return landmarker;
}

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Scans the photo from neck to toe and returns an overlay fit that puts the
 * blouse on the shoulders and the lehenga hem at the feet. Null when no
 * standing person is found.
 */
export async function scanBody(img: HTMLImageElement): Promise<Fit | null> {
  const pose = await load();
  const lm = pose.detect(img).landmarks[0];
  if (!lm) return null;

  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const p = (i: number): Pt & { v: number } => ({ x: lm[i].x * W, y: lm[i].y * H, v: lm[i].visibility ?? 1 });
  const [ls, rs, lh, rh] = [p(11), p(12), p(23), p(24)];
  if (Math.min(ls.v, rs.v) < 0.5 || Math.min(lh.v, rh.v) < 0.3) return null;

  const shoulders = mid(ls, rs);
  const hips = mid(lh, rh);
  const torso = dist(shoulders, hips);
  if (torso < H * 0.05) return null;

  // Turned-sideways shoulders read narrow — don't let the garment collapse
  const shoulderW = Math.max(dist(ls, rs), dist(lh, rh) * 1.2, torso * 0.55);

  // Toe: the lowest visible foot point; if the feet are cropped out, estimate the floor from body proportions
  const feet = [27, 28, 29, 30, 31, 32].map(p).filter((f) => f.v > 0.5);
  const floor: Pt = feet.length
    ? { x: (p(27).x + p(28).x) / 2, y: Math.max(...feet.map((f) => f.y)) + torso * 0.03 }
    : { x: hips.x + (hips.x - shoulders.x) * 1.6, y: hips.y + (hips.y - shoulders.y) * 1.6 };

  // Neck: the shoulder joints sit slightly below the top of the shoulder line
  const axisLen = dist(shoulders, floor);
  const up = { x: (shoulders.x - floor.x) / axisLen, y: (shoulders.y - floor.y) / axisLen };
  const neck = { x: shoulders.x + up.x * shoulderW * 0.05, y: shoulders.y + up.y * shoulderW * 0.05 };

  const length = dist(neck, floor);
  const sy = length / (SK.hemY - SK.neckY);
  const sx = (shoulderW * 1.22) / SK.shoulderW; // joints sit inside the outer shoulder line
  const t = (SK.centreY - SK.neckY) / (SK.hemY - SK.neckY);
  const centre = { x: neck.x + (floor.x - neck.x) * t, y: neck.y + (floor.y - neck.y) * t };
  const rotate = (Math.atan2(-(floor.x - neck.x), floor.y - neck.y) * 180) / Math.PI;

  return {
    x: centre.x / W,
    y: centre.y / H,
    scale: clamp((sx * SK.w) / W, 0.15, 1.6),
    rotate: Math.round(clamp(rotate, -20, 20)),
    opacity: 0.94,
    stretch: clamp(sy / sx, 0.6, 1.8),
  };
}
