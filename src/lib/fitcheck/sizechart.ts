export type ChartRow = { size: string; bust: number; waist: number; hip: number };
export type SizeChart = { id: string; name: string; region: "IN" | "UK" | "US"; unit: "in" | "cm"; rows: ChartRow[]; isSample?: boolean };

const toIn = (v: number, u: "in" | "cm") => (u === "cm" ? v / 2.54 : v);

/** Nearest chart row by bust, with values converted to inches. */
export function benchmarkRow(chart: SizeChart, bustIn: number): ChartRow | null {
  if (!chart.rows.length) return null;
  const rows = chart.rows.map((r) => ({ size: r.size, bust: toIn(r.bust, chart.unit), waist: toIn(r.waist, chart.unit), hip: toIn(r.hip, chart.unit) }));
  return rows.reduce((best, r) => (Math.abs(r.bust - bustIn) < Math.abs(best.bust - bustIn) ? r : best), rows[0]);
}

const HEADER: Record<string, keyof ChartRow> = {
  size: "size", label: "size", "size label": "size",
  bust: "bust", chest: "bust", chhati: "bust",
  waist: "waist", kamar: "waist",
  hip: "hip", hips: "hip", seat: "hip",
};

/**
 * Parses a pasted size chart (CSV or tab-separated, first row = headers).
 * Accepts "Chest"/"Bust", "Hips"/"Seat" etc. and ranges like "34-35" (uses the midpoint).
 */
export function parseChart(text: string): { rows: ChartRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const errors: string[] = [];
  if (lines.length < 2) return { rows: [], errors: ["Paste a header row and at least two size rows."] };
  const split = (l: string) => l.split(/\t|,|;/).map((c) => c.trim());
  const head = split(lines[0]).map((h) => HEADER[h.toLowerCase().replace(/\(.*\)/, "").trim()]);
  for (const need of ["size", "bust", "waist", "hip"] as const) if (!head.includes(need)) errors.push(`Couldn't find a "${need}" column in the header row.`);
  if (errors.length) return { rows: [], errors };
  const num = (c: string) => {
    const r = c.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
    if (r) return (parseFloat(r[1]) + parseFloat(r[2])) / 2;
    return parseFloat(c);
  };
  const rows: ChartRow[] = [];
  lines.slice(1).forEach((l, i) => {
    const cells = split(l);
    const row: Partial<ChartRow> = {};
    head.forEach((k, ci) => {
      if (!k) return;
      if (k === "size") row.size = cells[ci];
      else row[k] = num(cells[ci] ?? "");
    });
    if (row.size && [row.bust, row.waist, row.hip].every((v) => Number.isFinite(v) && (v as number) > 0)) rows.push(row as ChartRow);
    else errors.push(`Row ${i + 2} skipped — it needs a size and numeric bust, waist and hip.`);
  });
  return { rows, errors };
}

/** Guess whether a parsed chart is in cm (bust values well above any inch bust). */
export const guessUnit = (rows: ChartRow[]): "in" | "cm" => (rows.length && rows.reduce((s, r) => s + r.bust, 0) / rows.length > 60 ? "cm" : "in");
