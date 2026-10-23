/**
 * Measurement fields for Mehfil FitCheck. All ranges are in INCHES (internal unit).
 * `hard` = humanly impossible outside this range (adult women) → red.
 * `typical` = usual range → outside it we ask the customer to double-check.
 * These are starting rules for the master tailor to tune — not medical norms.
 */

export type Unit = "in" | "cm";
export type FieldKey =
  | "bust" | "underbust" | "waist" | "hip" | "shoulder" | "sleeve"
  | "armhole" | "blouseLength" | "waistToFloor" | "height";

export type FieldDef = {
  key: FieldKey;
  label: string;
  hindi: string;
  hard: [number, number];
  typical: [number, number];
  how: string;
  tip: string;
};

export const FIELDS: Record<FieldKey, FieldDef> = {
  bust: { key: "bust", label: "Bust", hindi: "chhati", hard: [24, 70], typical: [28, 52], how: "Around the fullest part of the bust.", tip: "Keep the tape parallel to the floor and snug, not tight. Wear the bra you'll wear with the outfit." },
  underbust: { key: "underbust", label: "Under-bust", hindi: "chhati ke neeche", hard: [20, 60], typical: [24, 46], how: "Right under the bust, around the rib cage.", tip: "Breathe out normally before you read the tape." },
  waist: { key: "waist", label: "Waist", hindi: "kamar", hard: [18, 66], typical: [22, 48], how: "Around your natural waist — the narrowest part, above the navel.", tip: "Bend sideways: the crease that forms is your natural waist. Don't suck in." },
  hip: { key: "hip", label: "Hips", hindi: "kulha", hard: [26, 72], typical: [30, 56], how: "Around the fullest part of the hips.", tip: "Stand with feet together; the tape should go over the widest point of the seat." },
  shoulder: { key: "shoulder", label: "Shoulder", hindi: "teera", hard: [10, 22], typical: [12, 18], how: "Across the back, from one shoulder tip to the other.", tip: "Ask someone to help — measure from bone to bone across the back." },
  sleeve: { key: "sleeve", label: "Sleeve length", hindi: "baazu", hard: [2, 30], typical: [4, 24], how: "From the shoulder tip down to where you want the sleeve to end.", tip: "Keep the arm relaxed and slightly bent." },
  armhole: { key: "armhole", label: "Armhole", hindi: "armhole", hard: [10, 28], typical: [13, 22], how: "Around the arm where it joins the shoulder.", tip: "Loop the tape under the armpit and over the shoulder tip." },
  blouseLength: { key: "blouseLength", label: "Blouse length", hindi: "blouse lambai", hard: [10, 24], typical: [12, 17], how: "From the shoulder (near the neck) down to where the blouse should end.", tip: "Measure over the bust point, down the front." },
  waistToFloor: { key: "waistToFloor", label: "Waist to floor", hindi: "lehenga lambai", hard: [28, 50], typical: [34, 44], how: "From the natural waist straight down to the floor.", tip: "Measure barefoot, or in the heels you'll wear, and say which." },
  height: { key: "height", label: "Height", hindi: "kad", hard: [48, 84], typical: [56, 74], how: "Standing straight against a wall, barefoot.", tip: "Mark the top of your head on the wall and measure to the floor." },
};

export type GarmentKey = "lehenga" | "blouse" | "gown" | "kurta";
export const GARMENTS: Record<GarmentKey, { label: string; required: FieldKey[]; optional: FieldKey[] }> = {
  lehenga: { label: "Lehenga set", required: ["bust", "waist", "hip", "shoulder", "sleeve", "blouseLength", "waistToFloor"], optional: ["underbust", "armhole", "height"] },
  blouse: { label: "Blouse", required: ["bust", "waist", "shoulder", "sleeve", "blouseLength"], optional: ["underbust", "armhole"] },
  gown: { label: "Gown / Indo-western", required: ["bust", "waist", "hip", "shoulder", "sleeve", "height"], optional: ["armhole", "underbust"] },
  kurta: { label: "Kurta / suit", required: ["bust", "waist", "hip", "shoulder", "sleeve", "height"], optional: ["armhole"] },
};

export const toIn = (v: number, u: Unit) => (u === "cm" ? v / 2.54 : v);
export const fromIn = (v: number, u: Unit) => (u === "cm" ? v * 2.54 : v);
export const fmt = (v: number, u: Unit) => (u === "cm" ? (Math.round(v * 10) / 10).toFixed(1) : (Math.round(v * 4) / 4).toString());

/** Accepts "34", "34.5", "34,5", "34½", "34 1/2", "34-1/2". Returns NaN when unreadable. */
export function parseMeasure(raw: string): number {
  const s = String(raw).trim().replace(",", ".");
  if (!s) return NaN;
  const frac: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
  const m = s.match(/^(\d{1,3}(?:\.\d{1,2})?)\s*(?:[-\s]?(½|¼|¾|1\/2|1\/4|3\/4))?$/);
  if (!m) return NaN;
  let v = parseFloat(m[1]);
  if (m[2]) v += frac[m[2]] ?? ({ "1/2": 0.5, "1/4": 0.25, "3/4": 0.75 } as Record<string, number>)[m[2]] ?? 0;
  return v;
}
