import type { FieldKey } from "./fields";
import { parseMeasure } from "./fields";

/**
 * OCR Handwritten Card Parser. Runs Tesseract.js in the browser — the photo never
 * leaves the device. Handwriting OCR is imperfect, so every value goes to a
 * review screen before it's used.
 */

// Tailor vocabulary → field (Hinglish + Hindi + English)
const DICT: [RegExp, FieldKey][] = [
  [/under\s*-?\s*bust|chhati\s*ke\s*neeche|niche/i, "underbust"],
  [/bust|chest|chhati|chati|chaati|छाती|seena|sina/i, "bust"],
  [/waist\s*to\s*floor|lehenga\s*(?:length|lambai)|ghagra|skirt\s*length/i, "waistToFloor"],
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

function fuzzyField(line: string): FieldKey | null {
  const tokens = line.toLowerCase().match(/[a-z]+/g) || [];
  for (const [words, field] of WORDS) if (tokens.some((t) => words.some((w) => near(t, w)))) return field;
  return null;
}

export type OcrField = { field: FieldKey; value: number; line: string };

export function parseCardText(text: string): { fields: OcrField[]; unit: "in" | "cm" | null; unmatched: string[] } {
  const fields: OcrField[] = [];
  const unmatched: string[] = [];
  let cm = 0;
  let inch = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[|“”"']/g, (c) => (c === '"' ? '"' : " ")).trim();
    if (!line) continue;
    if (/\bcm\b/i.test(line)) cm++;
    if (/\b(in|inch|inches)\b|"/i.test(line)) inch++;
    const exact = DICT.find(([re]) => re.test(line));
    const fuzzy = exact ? null : fuzzyField(line);
    const hit: [RegExp, FieldKey] | undefined = exact || (fuzzy ? [/./, fuzzy] : undefined);
    const nums = line.match(/\d{1,3}(?:[.,]\d{1,2})?\s*(?:½|¼|¾|1\/2|1\/4|3\/4)?/g);
    if (!hit || !nums) {
      if (nums || /[a-z]{3,}/i.test(line)) unmatched.push(line);
      continue;
    }
    const value = parseMeasure(nums[0].replace(/\s+(?=[½¼¾])/, ""));
    if (!Number.isFinite(value)) {
      unmatched.push(line);
      continue;
    }
    if (!fields.some((f) => f.field === hit[1])) fields.push({ field: hit[1], value, line });
  }
  return { fields, unit: cm > inch ? "cm" : inch > cm ? "in" : null, unmatched };
}

export async function recognise(image: Blob, onProgress?: (p: number) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
