import type { Line } from "tesseract.js";
import type { FieldKey } from "./fields";
import { FIELDS, parseMeasure } from "./fields";

/**
 * OCR Handwritten Card Parser. Runs Tesseract.js in the browser — the photo never
 * leaves the device. Handwriting OCR is imperfect, so the card is read several ways
 * and the values are voted on, and every value still goes to a review screen before
 * it's used.
 */

// Tailor vocabulary → field (Hinglish + Hindi + English)
const DICT: [RegExp, FieldKey][] = [
  [/under\s*-?\s*bust|chhati\s*ke\s*neeche|niche/i, "underbust"],
  [/bust|chest|chhati|chati|chaati|छाती|seena|sina/i, "bust"],
  [/waist\s*to\s*floor|f[uv][l1i|]{2}\s*length|lehenga\s*(?:length|lambai)|ghagra|skirt\s*length/i, "waistToFloor"],
  [/waist|kamar|kmr|कमर/i, "waist"],
  [/hip|seat|kulha|kolha|कूल्हा/i, "hip"],
  [/shoulder|teera|tira|tera|kandha|कंधा|sh\b/i, "shoulder"],
  [/arm\s*hole|armhole|mudda|moda/i, "armhole"],
  [/sleeve|baazu|bazu|baju|bahu|aasteen|asteen|आस्तीन/i, "sleeve"],
  [/blouse\s*(?:length|lambai)|length|lambai|लंबाई|lmb/i, "blouseLength"],
  [/height|kad|कद/i, "height"],
];

// Single-word labels, matched with a one-letter tolerance (OCR often reads "chhati" as "chhoti")
const WORDS: [string[], FieldKey][] = [
  [["bust", "chest", "chhati", "chati", "chaati", "seena"], "bust"],
  [["waist", "kamar", "kamr"], "waist"],
  [["hip", "hips", "seat", "kulha", "kolha"], "hip"],
  [["shoulder", "teera", "tira", "tera", "kandha"], "shoulder"],
  [["sleeve", "baazu", "bazu", "baju", "bahu", "aasteen", "asteen"], "sleeve"],
  [["armhole", "mudda"], "armhole"],
  [["length", "lambai"], "blouseLength"],
  [["height", "kad"], "height"],
];

const NUMBER = /\d{1,3}(?:[.,]\d{1,2})?\s*(?:½|¼|¾|1\/2|1\/4|3\/4)?/g;

function near(a: string, b: string) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false;
  // Levenshtein distance ≤ 1
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) (i++, j++);
    else {
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else (i++, j++);
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * The label that comes first on the line, and where it ends. Earliest wins so a stray
 * word further along — a diagram label, a note — can't take over the row.
 */
function labelOf(line: string): { field: FieldKey; end: number } | null {
  let best: { field: FieldKey; start: number; end: number } | null = null;
  for (const [re, field] of DICT) {
    const m = re.exec(line);
    if (m && (!best || m.index < best.start)) best = { field, start: m.index, end: m.index + m[0].length };
  }
  // A misread label ("Cleeve Length") still counts if it comes before an exact one ("Length")
  for (const m of line.toLowerCase().matchAll(/[a-z]+/g)) {
    if (best && m.index >= best.start) break;
    const hit = WORDS.find(([words]) => words.some((w) => near(m[0], w)));
    if (hit) {
      best = { field: hit[1], start: m.index, end: m.index + m[0].length };
      break;
    }
  }
  return best;
}

export type OcrField = { field: FieldKey; value: number; line: string };
export type CardRead = { fields: OcrField[]; unit: "in" | "cm" | null; unmatched: string[] };

export function parseCardText(text: string): CardRead {
  const fields: OcrField[] = [];
  const unmatched: string[] = [];
  let cm = 0;
  let inch = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[|“”"']/g, (c) => (c === '"' ? '"' : " ")).replace(/·/g, ".").trim();
    if (!line) continue;
    if (/\bcm\b/i.test(line)) cm++;
    if (/\b(in|inch|inches)\b|"/i.test(line)) inch++;
    const label = labelOf(line);
    const nums = label && line.slice(label.end).match(NUMBER);
    if (!label || !nums) {
      if (/\d/.test(line) || /[a-z]{3,}/i.test(line)) unmatched.push(line);
      continue;
    }
    const value = parseMeasure(nums[0].replace(/\s+(?=[½¼¾])/, ""));
    if (!Number.isFinite(value)) {
      unmatched.push(line);
      continue;
    }
    if (!fields.some((f) => f.field === label.field)) fields.push({ field: label.field, value, line });
  }
  return { fields, unit: cm > inch ? "cm" : inch > cm ? "in" : null, unmatched };
}

function cardUnit(reads: CardRead[]): "in" | "cm" | null {
  const units = reads.map((r) => r.unit).filter(Boolean);
  return units.length ? (units.filter((u) => u === "cm").length > units.length / 2 ? "cm" : "in") : null;
}

/** Inside human limits — in the card's unit, or in either when the card doesn't say. */
function plausible(f: OcrField, unit: "in" | "cm" | null) {
  const [lo, hi] = FIELDS[f.field].hard;
  const ok = (u: "in" | "cm") => {
    const v = u === "cm" ? f.value / 2.54 : f.value;
    return v >= lo && v <= hi;
  };
  return unit ? ok(unit) : ok("in") || ok("cm");
}

/** value → how many reads saw it */
function tally(fields: OcrField[]) {
  const votes = new Map<number, number>();
  for (const f of fields) votes.set(f.value, (votes.get(f.value) ?? 0) + 1);
  return votes;
}

/**
 * Combines several reads of the same card. Per field, values outside human limits are
 * dropped and the one most reads agree on wins (ties go to the earlier read).
 * `extra` are single-value re-reads that only vote.
 */
export function mergeReads(reads: CardRead[], extra: OcrField[] = []): CardRead {
  const unit = cardUnit(reads);
  const seen = [...reads.flatMap((r) => r.fields), ...extra];
  const fields: OcrField[] = [];
  const unmatched = [...(reads[0]?.unmatched ?? [])];
  for (const key of [...new Set(seen.map((f) => f.field))]) {
    const all = seen.filter((f) => f.field === key);
    const ok = all.filter((f) => plausible(f, unit));
    if (!ok.length) {
      unmatched.push(all[0].line);
      continue;
    }
    const votes = tally(ok);
    const top = Math.max(...votes.values());
    const winner = ok.find((f) => votes.get(f.value) === top)!;
    // show the row as one of the full reads saw it, not a digits-only re-read
    const shown = reads.flatMap((r) => r.fields).find((f) => f.field === key && f.value === winner.value) ?? all[0];
    fields.push({ field: key, value: winner.value, line: shown.line });
  }
  const order = Object.keys(FIELDS);
  fields.sort((a, b) => order.indexOf(a.field) - order.indexOf(b.field));
  // a row one read garbled ("Hip 3g"") isn't worth showing once another read got it
  const done = (line: string) => fields.some((f) => f.field === labelOf(line)?.field);
  return { fields, unit, unmatched: [...new Set(unmatched)].filter((l) => !done(l)) };
}

/** The handwritten value on a card row: from the end of the label up to the end of the first word after it. */
function valueBox(line: Line, width: number, height: number) {
  const label = labelOf(line.text);
  if (!label) return null;
  const words = line.words;
  let last = -1;
  words.slice(0, 4).forEach((w, i) => labelOf(w.text) && (last = i));
  const value = last >= 0 ? words.slice(last + 1).find((w) => /[a-z0-9]/i.test(w.text)) : undefined;
  if (!value) return null;
  const h = line.bbox.y1 - line.bbox.y0;
  const left = Math.max(0, words[last].bbox.x1 + 2);
  const top = Math.max(0, Math.round(line.bbox.y0 - h * 0.2));
  return {
    field: label.field,
    line: line.text.trim(),
    rect: { left, top, width: Math.min(width, Math.round(value.bbox.x1 + h * 0.3)) - left, height: Math.min(height - top, Math.round(h * 1.4)) },
  };
}

/**
 * Evens out shadows and paper texture so the pen strokes stand out: each pixel's grey
 * is divided by a blurred copy of the photo (the paper). `side` is the long side to draw
 * the photo at; `ink` turns the result black-and-white. Returns a PNG plus its size.
 */
async function prepare(bmp: ImageBitmap, side: number, ink: boolean): Promise<{ img: Blob; width: number; height: number }> {
  const k = Math.min(3, side / Math.max(bmp.width, bmp.height));
  const width = Math.round(bmp.width * k);
  const height = Math.round(bmp.height * k);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, width, height);
  const photo = ctx.getImageData(0, 0, width, height);

  // The paper: shrink 32× and stretch back — a cheap, very wide blur
  const small = document.createElement("canvas");
  small.width = Math.max(1, width >> 5);
  small.height = Math.max(1, height >> 5);
  small.getContext("2d")!.drawImage(canvas, 0, 0, small.width, small.height);
  ctx.drawImage(small, 0, 0, width, height);
  const paper = ctx.getImageData(0, 0, width, height).data;

  const p = photo.data;
  for (let i = 0; i < p.length; i += 4) {
    const g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    const bg = 0.299 * paper[i] + 0.587 * paper[i + 1] + 0.114 * paper[i + 2];
    const v = Math.min(255, (g / (bg + 1)) * 255);
    p[i] = p[i + 1] = p[i + 2] = ink ? (v > 200 ? 255 : 0) : v;
  }
  ctx.putImageData(photo, 0, 0);
  const img = await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("Couldn't prepare the photo"))), "image/png"));
  return { img, width, height };
}

// Each full read sees the card at a different size: a stroke one size misreads ("38" → "3g")
// another usually gets right, and the vote settles it. The first read breaks ties.
const PASSES = [
  { side: 1200, ink: false },
  { side: 900, ink: false },
  { side: 1500, ink: false },
  { side: 1200, ink: true },
];

export async function recognise(image: Blob, onProgress?: (p: number) => void): Promise<CardRead> {
  const { createWorker, PSM } = await import("tesseract.js");
  // Going through a canvas applies the phone's EXIF rotation and turns any format the
  // browser can show (HEIC on Safari, AVIF, WebP…) into a PNG Tesseract can read.
  const bmp = await createImageBitmap(image, { imageOrientation: "from-image" });
  // progress = base + this job's progress × span: the full reads fill 80%, the re-reads the rest
  let base = 0;
  let span = 0.8 / PASSES.length;
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(base + m.progress * span);
    },
  });
  try {
    const reads: CardRead[] = [];
    const boxes: (NonNullable<ReturnType<typeof valueBox>> & { img: Blob })[] = [];
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN, preserve_interword_spaces: "1" });
    for (const pass of PASSES) {
      const { img, width, height } = await prepare(bmp, pass.side, pass.ink);
      const { data } = await worker.recognize(img, {}, { text: true, blocks: true });
      reads.push(parseCardText(data.text));
      for (const line of (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines))) {
        const box = valueBox(line, width, height);
        if (box && box.rect.width > 4 && box.rect.height > 4) boxes.push({ ...box, img });
      }
      base += span;
    }

    // Where the full reads don't agree, re-read just the handwritten number with a
    // digits-only alphabet: ": 42"" read as "cog"" comes back as "42"
    const unit = cardUnit(reads);
    const settled = (field: FieldKey) => {
      const votes = tally(reads.flatMap((r) => r.fields).filter((f) => f.field === field && plausible(f, unit)));
      return votes.size > 0 && Math.max(...votes.values()) >= 2;
    };
    const todo = boxes.filter((b) => !settled(b.field));
    span = 0;
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE, tessedit_char_whitelist: "0123456789." });
    const extra: OcrField[] = [];
    for (const [i, box] of todo.entries()) {
      const { data } = await worker.recognize(box.img, { rectangle: box.rect });
      const groups = data.text.match(/\d{1,3}(?:\.\d{1,2})?/g) ?? [];
      const best = groups.reduce<string | null>((a, g) => (!a || g.replace(".", "").length > a.replace(".", "").length ? g : a), null);
      if (best) extra.push({ field: box.field, value: parseFloat(best), line: box.line });
      onProgress?.(0.8 + (0.2 * (i + 1)) / todo.length);
    }
    return mergeReads(reads, extra);
  } finally {
    bmp.close();
    await worker.terminate();
  }
}
