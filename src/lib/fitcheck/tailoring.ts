import { FIELDS, fromIn, fmt, type FieldKey, type GarmentKey, type Unit } from "./fields";

/**
 * Tailoring Rule Engine + Delivery Feasibility. Allowances and production days
 * are editable starting values for Mehfil's master tailor — not promises.
 */

// Construction ease added to body measurements (inches, circumference)
const EASE: Record<GarmentKey, Partial<Record<FieldKey, number>>> = {
  lehenga: { bust: 1.5, underbust: 1, waist: 1, hip: 2, armhole: 1 },
  blouse: { bust: 1.5, underbust: 1, waist: 1, armhole: 1 },
  gown: { bust: 2, waist: 1.5, hip: 2.5, armhole: 1 },
  kurta: { bust: 3, waist: 2.5, hip: 3, armhole: 1.5 },
};
const SEAM = { side: 1, other: 0.5 }; // inches per seam (side seams keep an alteration margin)

export type SpecRow = { field: FieldKey; label: string; body: string; ease: string; cutting: string; seam: string };

export function buildSpec(garment: GarmentKey, inches: Partial<Record<FieldKey, number>>, unit: Unit): SpecRow[] {
  return (Object.keys(FIELDS) as FieldKey[])
    .filter((k) => inches[k] != null)
    .map((k) => {
      const b = inches[k] as number;
      const e = EASE[garment][k] ?? 0;
      const isCirc = ["bust", "underbust", "waist", "hip", "armhole"].includes(k);
      return {
        field: k,
        label: FIELDS[k].label,
        body: `${fmt(fromIn(b, unit), unit)} ${unit}`,
        ease: e ? `+${fmt(fromIn(e, unit), unit)}` : "—",
        cutting: `${fmt(fromIn(b + e, unit), unit)} ${unit}`,
        seam: isCirc ? `${fmt(fromIn(SEAM.side, unit), unit)} ${unit} per side seam` : `${fmt(fromIn(SEAM.other, unit), unit)} ${unit} hem / seam`,
      };
    });
}

export type Embroidery = "none" | "light" | "medium" | "heavy";
export const EMBROIDERY: Record<Embroidery, { label: string; days: number }> = {
  none: { label: "No embroidery", days: 0 },
  light: { label: "Light (borders, buttis)", days: 4 },
  medium: { label: "Medium (all-over resham)", days: 8 },
  heavy: { label: "Heavy (bridal zardozi)", days: 15 },
};
const STITCH_DAYS: Record<GarmentKey, number> = { lehenga: 7, blouse: 4, gown: 6, kurta: 4 };

export type Feasibility = {
  status: "on_track" | "tight" | "at_risk" | "no_date";
  needDays: number;
  haveDays: number | null;
  steps: { label: string; days: number }[];
  readyBy: string;
  advice: string;
};

export function feasibility(garment: GarmentKey, embroidery: Embroidery, eventDate: string | null, today = new Date()): Feasibility {
  const steps = [
    { label: "Measurement confirmation & tailor review", days: 1 },
    { label: "Embroidery", days: EMBROIDERY[embroidery].days },
    { label: "Stitching", days: STITCH_DAYS[garment] },
    { label: "Finishing & quality check", days: 2 },
    { label: "Shipping / pickup", days: 3 },
  ].filter((s) => s.days > 0);
  const needDays = steps.reduce((s, x) => s + x.days, 0);
  const ready = new Date(today.getTime() + needDays * 86400000);
  const readyBy = ready.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (!eventDate) return { status: "no_date", needDays, haveDays: null, steps, readyBy, advice: "Add your event date to check delivery." };
  const haveDays = Math.floor((new Date(eventDate + "T12:00:00").getTime() - today.getTime()) / 86400000);
  const buffer = 3; // room for one alteration
  if (haveDays >= needDays + buffer) return { status: "on_track", needDays, haveDays, steps, readyBy, advice: `On track — about ${haveDays - needDays} spare days, including time for one alteration.` };
  if (haveDays >= needDays) return { status: "tight", needDays, haveDays, steps, readyBy, advice: "Possible but tight — little room for alterations. The studio may suggest lighter embroidery." };
  return {
    status: "at_risk", needDays, haveDays, steps, readyBy,
    advice: embroidery === "heavy" || embroidery === "medium"
      ? "At risk for this date. Lighter embroidery or an express slot could make it — ask the studio."
      : "At risk for this date. Ask the studio about an express slot.",
  };
}
