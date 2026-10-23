import { FIELDS, GARMENTS, fmt, fromIn, toIn, type FieldKey, type GarmentKey, type Unit } from "./fields";
import { benchmarkRow, type SizeChart } from "./sizechart";

export type Severity = "red" | "yellow";
export type Fix =
  | { kind: "set"; field: FieldKey; value: number; label: string } // value in the entry unit
  | { kind: "switchUnit"; unit: Unit; label: string }
  | { kind: "remeasure"; field: FieldKey; label: string }
  | { kind: "confirm"; label: string };

export type Issue = {
  id: string;
  field: FieldKey | null;
  severity: Severity;
  rule: "missing" | "hard" | "unit" | "typo" | "ratio" | "chart";
  message: string;
  fixes: Fix[];
};

export type Result = {
  verdict: "green" | "yellow" | "red";
  confidence: number;
  issues: Issue[];
  inches: Partial<Record<FieldKey, number>>;
  missing: FieldKey[];
  chartSize: string | null;
};

type Input = {
  values: Partial<Record<FieldKey, number>>; // as entered, in `unit`
  unit: Unit;
  garment: GarmentKey;
  chart?: SizeChart | null;
  confirmed?: string[]; // issue ids the customer confirmed as correct
};

const swapDigits = (v: number) => {
  if (!Number.isInteger(v) || v < 10 || v > 99) return null;
  const s = String(v);
  return Number(s[1] + s[0]);
};

/** Layered validation: missing → hard limits → unit detection → typos → ratio rules → size-chart benchmark. */
export function validate({ values, unit, garment, chart, confirmed = [] }: Input): Result {
  const issues: Issue[] = [];
  const g = GARMENTS[garment];
  const inches: Partial<Record<FieldKey, number>> = {};
  const other: Unit = unit === "in" ? "cm" : "in";
  const missing = g.required.filter((k) => !(Number.isFinite(values[k]) && (values[k] as number) > 0));

  // 1–3 · per-field: hard limits, unit slips, typos
  let looksOther = 0;
  let entered = 0;
  for (const [k, raw] of Object.entries(values) as [FieldKey, number][]) {
    if (!Number.isFinite(raw) || raw <= 0) continue;
    entered++;
    const f = FIELDS[k];
    const v = toIn(raw, unit);
    inches[k] = v;
    const inHard = v >= f.hard[0] && v <= f.hard[1];
    const asOther = toIn(raw, other);
    const otherTypical = asOther >= f.typical[0] && asOther <= f.typical[1];
    if (!inHard && otherTypical) looksOther++;
    if (inHard && v >= f.typical[0] && v <= f.typical[1]) continue;

    if (!inHard && otherTypical) {
      issues.push({
        id: `unit:${k}`, field: k, severity: "red", rule: "unit",
        message: `${f.label} ${raw} ${unit} isn't possible for an adult, but ${raw} ${other} is normal. Did you measure in ${other === "in" ? "inches" : "centimetres"}?`,
        fixes: [
          { kind: "set", field: k, value: Number(fmt(fromIn(asOther, unit), unit)), label: `Use ${fmt(fromIn(asOther, unit), unit)} ${unit}` },
          { kind: "remeasure", field: k, label: "Re-measure" },
        ],
      });
      continue;
    }
    // typo / decimal slip
    const sw = swapDigits(raw);
    const candidates = [sw, raw / 10, raw * 10].filter((c): c is number => c != null);
    const typo = candidates.find((c) => {
      const ci = toIn(c, unit);
      return ci >= f.typical[0] && ci <= f.typical[1];
    });
    if (!inHard) {
      issues.push({
        id: `hard:${k}`, field: k, severity: "red", rule: typo ? "typo" : "hard",
        message: typo
          ? `${f.label} ${raw} ${unit} looks like a typing slip — did you mean ${fmt(typo, unit)}?`
          : `${f.label} ${raw} ${unit} is outside what's humanly possible (${fmt(fromIn(f.hard[0], unit), unit)}–${fmt(fromIn(f.hard[1], unit), unit)} ${unit}).`,
        fixes: [
          ...(typo ? [{ kind: "set", field: k, value: typo, label: `Use ${fmt(typo, unit)} ${unit}` } as Fix] : []),
          { kind: "remeasure", field: k, label: "Re-measure" },
        ],
      });
    } else {
      issues.push({
        id: `typical:${k}`, field: k, severity: "yellow", rule: typo ? "typo" : "hard",
        message: typo
          ? `${f.label} ${raw} ${unit} is unusual — did you mean ${fmt(typo, unit)}?`
          : `${f.label} ${raw} ${unit} is outside the usual range. Please double-check.`,
        fixes: [
          ...(typo ? [{ kind: "set", field: k, value: typo, label: `Use ${fmt(typo, unit)} ${unit}` } as Fix] : []),
          { kind: "remeasure", field: k, label: "Re-measure" },
          { kind: "confirm", label: "It's correct" },
        ],
      });
    }
  }
  // Most values look like the other unit → one-click switch
  if (entered >= 3 && looksOther >= Math.ceil(entered / 2)) {
    issues.unshift({
      id: "unit:all", field: null, severity: "red", rule: "unit",
      message: `Most of these numbers look like ${other === "in" ? "inches" : "centimetres"}, but the form is set to ${unit === "in" ? "inches" : "centimetres"}.`,
      fixes: [{ kind: "switchUnit", unit: other, label: `Switch the form to ${other === "in" ? "inches" : "cm"}` }],
    });
  }

  // 4 · anatomical ratio rules (only on values inside hard limits)
  const ok = (k: FieldKey) => {
    const v = inches[k];
    const f = FIELDS[k];
    return v != null && v >= f.hard[0] && v <= f.hard[1] ? v : null;
  };
  const b = ok("bust"), ub = ok("underbust"), w = ok("waist"), h = ok("hip"), sh = ok("shoulder"), ah = ok("armhole");
  const wf = ok("waistToFloor"), ht = ok("height");
  const ratio = (id: string, field: FieldKey, severity: Severity, message: string) =>
    issues.push({
      id, field, severity, rule: "ratio", message,
      fixes: [{ kind: "remeasure", field, label: `Re-measure ${FIELDS[field].label.toLowerCase()}` }, ...(severity === "yellow" ? [{ kind: "confirm", label: "It's correct" } as Fix] : [])],
    });
  if (b && ub && ub >= b) ratio("ratio:underbust", "underbust", "red", "Under-bust can't be bigger than the bust. One of the two was probably measured at the wrong place.");
  if (w && h) {
    if (w > h * 1.15) ratio("ratio:waist-hip", "waist", "red", "Waist is much larger than hips — the tape was probably not at your natural waist, or the hip was measured too high.");
    else if (w > h) ratio("ratio:waist-hip", "waist", "yellow", "Waist is larger than hips. That's possible, but please check you measured the natural waist and the fullest part of the hips.");
    if (h - w > 22) ratio("ratio:hip-waist", "hip", "yellow", "The hip-to-waist difference is unusually large. Please re-check both.");
  }
  if (b && w) {
    if (w > b * 1.2) ratio("ratio:waist-bust", "waist", "yellow", "Waist is much larger than bust. Please check the waist was measured at the narrowest point.");
    if (b - w > 18) ratio("ratio:bust-waist", "bust", "yellow", "Bust-to-waist difference is unusually large. Please re-check both.");
  }
  if (b && sh && (sh / b < 0.3 || sh / b > 0.52)) ratio("ratio:shoulder", "shoulder", "yellow", "Shoulder width looks out of proportion with the bust. Measure across the back, shoulder tip to shoulder tip.");
  if (b && ah && (ah / b < 0.33 || ah / b > 0.62)) ratio("ratio:armhole", "armhole", "yellow", "Armhole looks out of proportion with the bust. Loop the tape under the arm and over the shoulder tip.");
  if (wf && ht && (wf / ht < 0.55 || wf / ht > 0.7)) ratio("ratio:height", "waistToFloor", "yellow", "Waist-to-floor doesn't match your height. Measure barefoot from the natural waist.");

  // 5 · size-chart benchmark
  let chartSize: string | null = null;
  if (chart && b) {
    const row = benchmarkRow(chart, b);
    if (row) {
      chartSize = row.size;
      const tol = 4;
      for (const k of ["waist", "hip"] as const) {
        const v = ok(k);
        if (v != null && Math.abs(v - row[k]) > tol && !issues.some((i) => i.field === k && i.severity === "red")) {
          issues.push({
            id: `chart:${k}`, field: k, severity: "yellow", rule: "chart",
            message: `${FIELDS[k].label} is ${fmt(fromIn(Math.abs(v - row[k]), unit), unit)} ${unit} away from size ${row.size} on the ${chart.name} (${fmt(fromIn(row[k], unit), unit)} ${unit}). Bodies vary — just check it.`,
            fixes: [{ kind: "remeasure", field: k, label: "Re-measure" }, { kind: "confirm", label: "It's correct" }],
          });
        }
      }
    }
  }

  // Confidence
  let score = 100;
  for (const i of issues) {
    const done = confirmed.includes(i.id);
    if (i.severity === "red") score -= 34;
    else score -= done ? 3 : 11;
  }
  score -= missing.length * 6;
  const open = issues.filter((i) => !(i.severity === "yellow" && confirmed.includes(i.id)));
  const verdict: Result["verdict"] = open.some((i) => i.severity === "red") ? "red" : open.length ? "yellow" : "green";
  return { verdict, confidence: Math.max(0, Math.min(100, Math.round(score))), issues, inches, missing, chartSize };
}
