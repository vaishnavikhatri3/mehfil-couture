/**
 * The Bespoke Atelier 14-Point Measurement System for Indian Haute Couture.
 *
 * Designed for out-of-town & global brides visiting or commissioning remotely
 * from Mehfil Couture's flagship studio in Indore.
 */

export type MeasurementCategory = "choli" | "necklines_arms" | "lehenga";

export type MeasurementPoint = {
  id: string;
  category: MeasurementCategory;
  number: string;
  name: string;
  shortName: string;
  description: string;
  instruction: string;
  artisanTip: string;
  defaultInches: number;
  minInches: number;
  maxInches: number;
  stepInches: number;
  view: "front" | "back" | "both";
};

export const MEASUREMENT_POINTS: readonly MeasurementPoint[] = [
  // --- CHOLI & TORSO ---
  {
    id: "bust",
    category: "choli",
    number: "01",
    name: "Bust Circumference",
    shortName: "Bust",
    description: "The fullest projection around the chest line.",
    instruction: "Measure around the fullest part of the bust wearing the bra or padded lingerie you plan to wear under your couture choli. Keep the tape parallel to the floor.",
    artisanTip: "Couture blouses are structured with built-in artisan cups. An accurate bust measure guarantees zero gaping or pinching across the front darts.",
    defaultInches: 36,
    minInches: 26,
    maxInches: 56,
    stepInches: 0.5,
    view: "front",
  },
  {
    id: "underbust",
    category: "choli",
    number: "02",
    name: "Underbust / Ribcage Band",
    shortName: "Underbust",
    description: "The firm anchor circumference right beneath the bust tissue.",
    instruction: "Wrap the tape snugly right beneath the bust around the ribcage where the choli lower waistband anchors. Inhale comfortably.",
    artisanTip: "This is the primary weight-bearing anchor of a choli. It must sit firm so the blouse never rides upward during dance or ceremony.",
    defaultInches: 30,
    minInches: 22,
    maxInches: 48,
    stepInches: 0.5,
    view: "front",
  },
  {
    id: "apexPoint",
    category: "choli",
    number: "03",
    name: "Shoulder to Apex (Bust Point)",
    shortName: "Apex Point",
    description: "Vertical drop from mid-shoulder to the bust apex.",
    instruction: "Measure vertically from the highest point of the shoulder seam straight down to the apex (bust point).",
    artisanTip: "Determines the exact vertical placement of padded cups and princess-seam darts for a sculpted silhouette.",
    defaultInches: 10,
    minInches: 7,
    maxInches: 15,
    stepInches: 0.25,
    view: "front",
  },
  {
    id: "choliLength",
    category: "choli",
    number: "04",
    name: "Total Choli Length",
    shortName: "Choli Length",
    description: "From top of shoulder down to preferred choli hemline.",
    instruction: "From the high shoulder point near the neck, measure straight down past the bust to where you want the blouse hem to end (e.g. 13\"-15\" for traditional cropped, 16\"-18\" for modest/longline).",
    artisanTip: "Leave a gap of 2 to 3.5 inches above your lehenga waistband for classic proportion, or meet the band for contemporary modest silhouettes.",
    defaultInches: 14.5,
    minInches: 11,
    maxInches: 22,
    stepInches: 0.5,
    view: "front",
  },
  {
    id: "shoulderWidth",
    category: "choli",
    number: "05",
    name: "Across Shoulder Width",
    shortName: "Shoulders",
    description: "Tip to tip across the back shoulders.",
    instruction: "Across the back, measure from the outer tip of the left shoulder bone horizontally across the base of the neck to the right shoulder bone.",
    artisanTip: "Prevents broad necklines from slipping off the shoulder during varmala and sangeet movements.",
    defaultInches: 14.5,
    minInches: 11,
    maxInches: 20,
    stepInches: 0.5,
    view: "back",
  },

  // --- NECKLINES & ARMS ---
  {
    id: "frontNeckDepth",
    category: "necklines_arms",
    number: "06",
    name: "Front Neckline Depth",
    shortName: "Front Neck",
    description: "Slant drop for the front necklace and neckline framing.",
    instruction: "Place the tape at the inner shoulder-neck corner and measure diagonally down along the chest to your desired neckline center depth (e.g. Sweetheart, V-neck, or Scoop).",
    artisanTip: "Frame this with your wedding bridal necklace (haar or choker) in mind so the jewellery and embroidery meet harmoniously.",
    defaultInches: 7.5,
    minInches: 5,
    maxInches: 12,
    stepInches: 0.25,
    view: "front",
  },
  {
    id: "backNeckDepth",
    category: "necklines_arms",
    number: "07",
    name: "Back Neckline Drop",
    shortName: "Back Neck",
    description: "Drop down the spine for back tie-up/dori.",
    instruction: "From the inner shoulder-neck corner, measure down the back spine to where you want the back opening to end (e.g. 9\"-13\" for open/dori back).",
    artisanTip: "Deep back cuts are balanced with handcrafted latkans (embellished tassels) and internal side-boning to keep the fit crisp.",
    defaultInches: 10.5,
    minInches: 4,
    maxInches: 15,
    stepInches: 0.5,
    view: "back",
  },
  {
    id: "armhole",
    category: "necklines_arms",
    number: "08",
    name: "Armhole Circumference",
    shortName: "Armhole",
    description: "Circumference around the shoulder-arm junction.",
    instruction: "Loop the tape gently around your armpit and over the top of the shoulder bone. Insert two fingers under the tape so it remains comfortable.",
    artisanTip: "Too tight restricts arm elevation for rituals; too loose wrinkles the choli chest panel.",
    defaultInches: 16,
    minInches: 12,
    maxInches: 24,
    stepInches: 0.5,
    view: "front",
  },
  {
    id: "bicep",
    category: "necklines_arms",
    number: "09",
    name: "Bicep Circumference",
    shortName: "Bicep",
    description: "Around the fullest part of the upper arm.",
    instruction: "Measure around the fullest point of your bicep with arm relaxed naturally by your side.",
    artisanTip: "Ensures fitted sleeves contour seamlessly over intricate zardozi embroidery without tension.",
    defaultInches: 11.5,
    minInches: 8,
    maxInches: 20,
    stepInches: 0.5,
    view: "front",
  },
  {
    id: "sleeveLength",
    category: "necklines_arms",
    number: "10",
    name: "Sleeve Length",
    shortName: "Sleeve",
    description: "From shoulder tip to chosen sleeve cuff hem.",
    instruction: "From the outer shoulder bone, measure along the outer arm down to your desired sleeve length (e.g. 5\" cap, 10\" elbow, 18\" 3/4th, or 22\" full wrist).",
    artisanTip: "Elbow and full sleeves provide prime canvas for heavy kalidar hand-embroidered border motifs.",
    defaultInches: 11,
    minInches: 4,
    maxInches: 26,
    stepInches: 0.5,
    view: "front",
  },

  // --- LEHENGA SKIRT & FLARE ---
  {
    id: "lehengaWaist",
    category: "lehenga",
    number: "11",
    name: "Lehenga Skirt Waist",
    shortName: "Lehenga Waist",
    description: "Exact waistband resting point (high waist or navel).",
    instruction: "Measure snugly around the exact line where you tie or fasten your lehenga waistband (typically 1 to 2 inches above the navel). Do not suck in your stomach.",
    artisanTip: "Mehfil lehengas feature internal canvas waistband stiffening and concealed drawstring hook-and-eye closures so the skirt never slips.",
    defaultInches: 29,
    minInches: 22,
    maxInches: 52,
    stepInches: 0.5,
    view: "front",
  },
  {
    id: "hip",
    category: "lehenga",
    number: "12",
    name: "Full Hip Circumference",
    shortName: "Full Hip",
    description: "Around the fullest part of the lower silhouette.",
    instruction: "Measure horizontally around the fullest part of your hips and buttocks, keeping the tape level all the way around.",
    artisanTip: "Calibrates the flare drape so the kalis drape smoothly over hips before opening up into a dramatic circular spin.",
    defaultInches: 39,
    minInches: 28,
    maxInches: 62,
    stepInches: 0.5,
    view: "both",
  },
  {
    id: "waistToFloor",
    category: "lehenga",
    number: "13",
    name: "Waist-to-Floor (with Footwear)",
    shortName: "Skirt Length",
    description: "From lehenga waist down to floor with wedding heels.",
    instruction: "IMPORTANT: Stand straight wearing the exact heel height of your wedding shoes. Measure from your lehenga waistband straight down to the floor at your outer side seam.",
    artisanTip: "Our master cutters tailor the hem to hover precisely 0.5 inches off the floor to prevent stepping on the border during walking.",
    defaultInches: 42.5,
    minInches: 34,
    maxInches: 52,
    stepInches: 0.5,
    view: "front",
  },
  {
    id: "gheraPreference",
    category: "lehenga",
    number: "14",
    name: "Ghera Flare & Volume Preference",
    shortName: "Ghera Flare",
    description: "Desired circular hem volume for the signature twirl.",
    instruction: "Select your desired flare circumference: Standard A-Line (3.5 - 4.5m), Signature Royal Kalidar (5 - 6.5m), or Grand Maharani Volume (7m+ with double cancan netting).",
    artisanTip: "Higher ghera meters require bias-cut kalis and dual cancan stiffener hoops for effortless 360-degree photography.",
    defaultInches: 6.0, // Used as flare meters / category index
    minInches: 3.5,
    maxInches: 8.5,
    stepInches: 0.5,
    view: "front",
  },
] as const;

export type MeasurementId = (typeof MEASUREMENT_POINTS)[number]["id"];

export type PassportData = {
  clientName: string;
  unit: "inches" | "cm";
  heelHeightInches: number;
  postureNotes: string;
  values: Record<MeasurementId, number>;
  lastUpdated: string;
};

export const GHERA_PRESETS = [
  { value: 4.0, label: "Contemporary A-Line (4.0m)", desc: "Lightweight, effortless movement for sangeet & cocktail" },
  { value: 5.5, label: "Signature Royal Kalidar (5.5m)", desc: "Mehfil's iconic bridal silhouette — full flare with graceful swing" },
  { value: 7.5, label: "Grand Maharani Ghera (7.5m+)", desc: "Maximum theatrical volume with layered cancan and broad borders" },
] as const;

export const DEFAULT_PASSPORT: PassportData = {
  clientName: "",
  unit: "inches",
  heelHeightInches: 3.0,
  postureNotes: "",
  values: {
    bust: 36,
    underbust: 30,
    apexPoint: 10,
    choliLength: 14.5,
    shoulderWidth: 14.5,
    frontNeckDepth: 7.5,
    backNeckDepth: 10.5,
    armhole: 16,
    bicep: 11.5,
    sleeveLength: 11,
    lehengaWaist: 29,
    hip: 39,
    waistToFloor: 42.5,
    gheraPreference: 5.5,
  },
  lastUpdated: "",
};

const STORAGE_KEY = "mehfil-measurement-passport";

export function loadPassport(): PassportData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PASSPORT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PASSPORT,
      ...parsed,
      values: { ...DEFAULT_PASSPORT.values, ...(parsed.values || {}) },
    };
  } catch {
    return DEFAULT_PASSPORT;
  }
}

export function savePassport(data: PassportData): void {
  try {
    const toSave: PassportData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    /* storage quota / private mode */
  }
}

export function clearPassport(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSavedPassport(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw);
    return Boolean(p && p.lastUpdated);
  } catch {
    return false;
  }
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function formatValueDisplay(valueInches: number, unit: "inches" | "cm", isGhera = false): string {
  if (isGhera) {
    return `${valueInches} meters`;
  }
  if (unit === "cm") {
    return `${inchesToCm(valueInches)} cm`;
  }
  return `${valueInches}"`;
}

/** Formats complete measurement summary for WhatsApp enquiry or clipboard */
export function formatPassportForEnquiry(data: PassportData): string {
  const u = data.unit;
  const v = data.values;
  const name = data.clientName.trim() ? `Client: ${data.clientName.trim()}\n` : "";
  const heel = `Shoe Heel Allowance: ${formatValueDisplay(data.heelHeightInches, u)}\n`;
  const gheraObj = GHERA_PRESETS.find((g) => Math.abs(g.value - v.gheraPreference) < 0.3) ?? {
    label: `${v.gheraPreference}m flare`,
  };

  const lines = [
    `✨ MEHFIL BESPOKE MEASUREMENT PASSPORT ✨`,
    name + heel,
    `[CHOLI & UPPER SILHOUETTE]`,
    `• Bust: ${formatValueDisplay(v.bust, u)}`,
    `• Underbust Band: ${formatValueDisplay(v.underbust, u)}`,
    `• Shoulder-to-Apex: ${formatValueDisplay(v.apexPoint, u)}`,
    `• Total Choli Length: ${formatValueDisplay(v.choliLength, u)}`,
    `• Across Shoulders: ${formatValueDisplay(v.shoulderWidth, u)}`,
    ``,
    `[NECKLINES & SLEEVES]`,
    `• Front Neckline Depth: ${formatValueDisplay(v.frontNeckDepth, u)}`,
    `• Back Neckline Drop: ${formatValueDisplay(v.backNeckDepth, u)}`,
    `• Armhole: ${formatValueDisplay(v.armhole, u)}`,
    `• Bicep: ${formatValueDisplay(v.bicep, u)}`,
    `• Sleeve Length: ${formatValueDisplay(v.sleeveLength, u)}`,
    ``,
    `[LEHENGA SKIRT & DRAPE]`,
    `• Lehenga Waist: ${formatValueDisplay(v.lehengaWaist, u)}`,
    `• Full Hip: ${formatValueDisplay(v.hip, u)}`,
    `• Waist to Floor (with heels): ${formatValueDisplay(v.waistToFloor, u)}`,
    `• Flare Volume: ${gheraObj.label}`,
  ];

  if (data.postureNotes.trim()) {
    lines.push(``, `[FIT & POSTURE NOTES]`, data.postureNotes.trim());
  }

  lines.push(``, `(Calibrated for Mehfil Couture Flagship Studio, Indore)`);
  return lines.join("\n");
}
