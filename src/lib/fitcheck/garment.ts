import type { FieldKey } from "./fields";

/**
 * Garment Dimension Inference: the customer lays a well-fitting garment flat
 * and measures it. Body ≈ (flat width × 2) − garment ease + fabric stretch.
 * Ease and stretch values are starting points for the master tailor to tune.
 */

export type FlatGarment = "blouse" | "kurti" | "dress";
export type Fabric = "cotton" | "silk" | "georgette" | "velvet" | "knit";

export const FLAT_GARMENTS: Record<FlatGarment, { label: string; ease: { bust: number; waist: number; hip: number } }> = {
  blouse: { label: "Blouse / choli", ease: { bust: 1.5, waist: 1, hip: 0 } },
  kurti: { label: "Kurti / kurta", ease: { bust: 3, waist: 2.5, hip: 3 } },
  dress: { label: "Dress / gown", ease: { bust: 2.5, waist: 2, hip: 3 } },
};

export const FABRICS: Record<Fabric, { label: string; stretch: number }> = {
  cotton: { label: "Cotton / linen (no stretch)", stretch: 0 },
  silk: { label: "Silk / brocade (no stretch)", stretch: 0 },
  georgette: { label: "Georgette / crepe (slight give)", stretch: 0.01 },
  velvet: { label: "Stretch velvet", stretch: 0.03 },
  knit: { label: "Knit / lycra blend", stretch: 0.05 },
};

export type FlatKey = "chestFlat" | "waistFlat" | "hipFlat" | "shoulderSeam" | "sleeveLen" | "garmentLen";
export const FLAT_FIELDS: Record<FlatKey, { label: string; how: string; doubled: boolean }> = {
  chestFlat: { label: "Chest, flat (pit to pit)", how: "Lay the garment flat, buttoned up. Measure straight across, armpit to armpit.", doubled: true },
  waistFlat: { label: "Waist, flat", how: "Across the narrowest part of the garment, edge to edge.", doubled: true },
  hipFlat: { label: "Hip, flat", how: "Across the widest part below the waist, edge to edge.", doubled: true },
  shoulderSeam: { label: "Shoulder, seam to seam", how: "Across the back, from one shoulder seam to the other.", doubled: false },
  sleeveLen: { label: "Sleeve length", how: "From the shoulder seam to the sleeve hem.", doubled: false },
  garmentLen: { label: "Garment length", how: "From the highest shoulder point straight down to the hem.", doubled: false },
};

export const FLAT_REQUIRED: Record<FlatGarment, FlatKey[]> = {
  blouse: ["chestFlat", "waistFlat", "shoulderSeam", "sleeveLen", "garmentLen"],
  kurti: ["chestFlat", "waistFlat", "hipFlat", "shoulderSeam", "sleeveLen"],
  dress: ["chestFlat", "waistFlat", "hipFlat", "shoulderSeam", "sleeveLen"],
};

/** Returns body measurements in the same unit as the inputs, plus the working for each. */
export function inferBody(garment: FlatGarment, fabric: Fabric, flat: Partial<Record<FlatKey, number>>, unit: "in" | "cm") {
  const k = unit === "cm" ? 2.54 : 1;
  const ease = FLAT_GARMENTS[garment].ease;
  const st = FABRICS[fabric].stretch;
  const out: Partial<Record<FieldKey, number>> = {};
  const working: { field: FieldKey; text: string }[] = [];
  const circ = (field: FieldKey, flatV: number | undefined, e: number) => {
    if (!flatV) return;
    const doubled = flatV * 2;
    const body = doubled - e * k + doubled * st;
    out[field] = Math.round(body * 4) / 4;
    working.push({ field, text: `${flatV} × 2 = ${round(doubled)} − ease ${round(e * k)}${st ? ` + stretch ${round(doubled * st)}` : ""} = ${round(body)}` });
  };
  circ("bust", flat.chestFlat, ease.bust);
  circ("waist", flat.waistFlat, ease.waist);
  if (garment !== "blouse") circ("hip", flat.hipFlat, ease.hip);
  if (flat.shoulderSeam) {
    out.shoulder = flat.shoulderSeam;
    working.push({ field: "shoulder", text: `seam to seam = ${flat.shoulderSeam}` });
  }
  if (flat.sleeveLen) {
    out.sleeve = flat.sleeveLen;
    working.push({ field: "sleeve", text: `measured directly = ${flat.sleeveLen}` });
  }
  if (garment === "blouse" && flat.garmentLen) {
    out.blouseLength = flat.garmentLen;
    working.push({ field: "blouseLength", text: `garment length = ${flat.garmentLen}` });
  }
  return { body: out, working };
}

const round = (v: number) => Math.round(v * 10) / 10;
