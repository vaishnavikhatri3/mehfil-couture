/**
 * The Trousseau Concierge & Ceremony Wardrobe System for Mehfil Couture.
 *
 * Enables brides to curate, harmonize, and time their 5-6 ceremony wedding
 * wardrobe alongside Indore master karigars.
 */

export type CeremonyId = "haldi" | "mehendi" | "sangeet" | "pheras" | "reception" | "brunch";

export type PaletteSwatch = {
  key: string;
  label: string;
  hex: string;
  family: "warm" | "cool" | "neutral" | "jewel" | "pastel";
  tone: "light" | "deep" | "vibrant";
};

export const TROUSSEAU_SWATCHES: readonly PaletteSwatch[] = [
  // Warm & Solar
  { key: "marigold", label: "Marigold Yellow", hex: "#f5a623", family: "warm", tone: "vibrant" },
  { key: "mustard", label: "Haldi Ochre", hex: "#d49e35", family: "warm", tone: "warm" as unknown as "vibrant" },
  { key: "burnt-orange", label: "Terracotta Rust", hex: "#c65d3b", family: "warm", tone: "deep" },
  { key: "coral-peach", label: "Blush Peach", hex: "#e89f88", family: "warm", tone: "light" },

  // Greens & Florals
  { key: "sage-green", label: "Mehendi Sage", hex: "#7a8861", family: "cool", tone: "light" },
  { key: "mint-leaf", label: "Pistachio Mint", hex: "#9bb390", family: "cool", tone: "light" },
  { key: "emerald", label: "Royal Emerald", hex: "#1f563e", family: "jewel", tone: "deep" },
  { key: "forest", label: "Peacock Green", hex: "#174744", family: "jewel", tone: "deep" },

  // Reds, Pinks & Royal Hues
  { key: "crimson-red", label: "Heritage Bridal Red", hex: "#8c1d1d", family: "warm", tone: "deep" },
  { key: "deep-maroon", label: "South Tukoganj Maroon", hex: "#541212", family: "warm", tone: "deep" },
  { key: "rani-pink", label: "Gulabi Rani Pink", hex: "#c22b64", family: "warm", tone: "vibrant" },
  { key: "dusty-rose", label: "Vintage Rose", hex: "#b87070", family: "warm", tone: "light" },

  // Night Jewels & Drapes
  { key: "midnight-navy", label: "Midnight Starlight", hex: "#19243e", family: "jewel", tone: "deep" },
  { key: "wine-burgundy", label: "Mulled Wine", hex: "#4b1e2e", family: "jewel", tone: "deep" },
  { key: "plum-mauve", label: "Dusty Mauve", hex: "#6c4d5c", family: "cool", tone: "deep" },

  // Metallics & Pastels
  { key: "ivory-gold", label: "Heirloom Ivory & Zari", hex: "#e8ddcc", family: "neutral", tone: "light" },
  { key: "champagne", label: "Shimmer Champagne", hex: "#dfcbb5", family: "neutral", tone: "light" },
  { key: "powder-blue", label: "Morning Sky Blue", hex: "#9ebcd3", family: "cool", tone: "light" },
  { key: "lavender", label: "Silver Lavender", hex: "#b4a7d6", family: "cool", tone: "light" },
];

export type CeremonyDefinition = {
  id: CeremonyId;
  order: string;
  name: string;
  timeVibe: string;
  icon: string;
  description: string;
  silhouetteDefault: string;
  silhouetteOptions: string[];
  embroideryDefault: string;
  embroideryOptions: string[];
  recommendedSwatches: string[];
  typicalWeeksToCraft: number;
};

export const CEREMONIES: readonly CeremonyDefinition[] = [
  {
    id: "haldi",
    order: "01",
    name: "Haldi & Chooda",
    timeVibe: "Morning · Sunlit Courtyard",
    icon: "☀️",
    description: "Joyful, tactile, and ceremonial. Light breathable fabrics that catch natural daylight without feeling delicate.",
    silhouetteDefault: "Tiered Anarkali / Light Ghera Skirt",
    silhouetteOptions: ["Tiered Anarkali / Light Ghera Skirt", "Short Kurti with Sharara", "Draped Crop & Palazzo", "Minimalist Kali Lehenga"],
    embroideryDefault: "Gota Patti & Resham Floral Accents",
    embroideryOptions: ["Gota Patti & Resham Floral Accents", "Mirrorwork Border", "Delicate Pitta Work", "Chintz Handblock & Sequins"],
    recommendedSwatches: ["marigold", "mustard", "ivory-gold", "coral-peach"],
    typicalWeeksToCraft: 5,
  },
  {
    id: "mehendi",
    order: "02",
    name: "Mehendi Sundowner",
    timeVibe: "Late Afternoon · Garden Pavilion",
    icon: "🌿",
    description: "Comfort meets artistry. Sleeves cut short or three-quarter for mehendi application, paired with botanical palettes.",
    silhouetteDefault: "Flared Kalidar with Cropped Choli",
    silhouetteOptions: ["Flared Kalidar with Cropped Choli", "Jacket Lehenga Set", "Cape Blouse & Skirt", "Pre-Draped Concept Saree"],
    embroideryDefault: "Botanical Threadwork with Seed Pearls",
    embroideryOptions: ["Botanical Threadwork with Seed Pearls", "Aari Threadwork & Foil", "Kashmiri Kashida Motifs", "Gota Border Appliqué"],
    recommendedSwatches: ["sage-green", "mint-leaf", "burnt-orange", "dusty-rose"],
    typicalWeeksToCraft: 6,
  },
  {
    id: "sangeet",
    order: "03",
    name: "Sangeet & Dance Night",
    timeVibe: "Night · Stage & Moving Lights",
    icon: "💃",
    description: "Engineered for 360° choreography. Maximum flare ghera, lightweight movement, and metallic shimmer under nightclub spotlights.",
    silhouetteDefault: "Royal 6m Ghera Kalidar with Sweetheart Neck",
    silhouetteOptions: ["Royal 6m Ghera Kalidar with Sweetheart Neck", "Indo-Western Structured Bustier Lehenga", "Cape Dupatta Twirl Skirt", "Draped Metallic Gown"],
    embroideryDefault: "Hand-Cut Mirror Work & Micro-Sequins",
    embroideryOptions: ["Hand-Cut Mirror Work & Micro-Sequins", "Dual-Tone Metallic Zari", "Chevron Cutdana Shimmer", "High-Contrast Glass Beading"],
    recommendedSwatches: ["midnight-navy", "emerald", "rani-pink", "wine-burgundy"],
    typicalWeeksToCraft: 8,
  },
  {
    id: "pheras",
    order: "04",
    name: "The Pheras (Sacred Vows)",
    timeVibe: "Ceremony · Mandap & Diya Light",
    icon: "💍",
    description: "The heirloom centerpiece. Heavy with hand zardozi, sacred borders, personalized embroidery, and double dupatta veil draping.",
    silhouetteDefault: "Signature Indore Heritage Bridal Lehenga",
    silhouetteOptions: ["Signature Indore Heritage Bridal Lehenga", "Traditional High-Waist 16-Kali Cut", "Peplum Choli with Flared Skirt", "Regal Velvet Silhouette"],
    embroideryDefault: "Authentic Zardozi, Pitta & Dabka Needlework",
    embroideryOptions: ["Authentic Zardozi, Pitta & Dabka Needlework", "Gold Wire Mukaish & Precious Stones", "Royal Marwar Heritage Zardozi", "Antique Real-Silver Zari"],
    recommendedSwatches: ["crimson-red", "deep-maroon", "ivory-gold", "dusty-rose"],
    typicalWeeksToCraft: 12,
  },
  {
    id: "reception",
    order: "05",
    name: "The Grand Reception",
    timeVibe: "Formal Evening · Grand Ballroom",
    icon: "🥂",
    description: "Modern royalty. Contemporary silhouettes, trailing veils, and sophisticated deep jewel tones for mingling and red-carpet portraits.",
    silhouetteDefault: "Sculpted Indo-Western Trailing Gown",
    silhouetteOptions: ["Sculpted Indo-Western Trailing Gown", "Corset Choli with Fishtail Kalis", "Feather-Accented Evening Lehenga", "Structured Draped Saree"],
    embroideryDefault: "Architectural Cutdana & Bugle Beads",
    embroideryOptions: ["Architectural Cutdana & Bugle Beads", "Degrade Sequin Sheen", "Filigree Threadwork", "Monochromatic Velvet Relief"],
    recommendedSwatches: ["wine-burgundy", "plum-mauve", "midnight-navy", "champagne"],
    typicalWeeksToCraft: 8,
  },
  {
    id: "brunch",
    order: "06",
    name: "Farewell Brunch",
    timeVibe: "Next Morning · Open Sunroom",
    icon: "✨",
    description: "Effortless, relaxed luxury. Light pastel tones, flowing drapes, and easy elegance to bid farewell to family and friends.",
    silhouetteDefault: "Printed Silk Organza Lehenga",
    silhouetteOptions: ["Printed Silk Organza Lehenga", "Crepe Draped Kaftan Set", "Pastel Sharara Suit", "Chiffon Saree with Embroidered Blouse"],
    embroideryDefault: "Minimalist Scalloped Pearl Borders",
    embroideryOptions: ["Minimalist Scalloped Pearl Borders", "Shadow Work Chikankari", "Hand-Painted Floral Accents", "Delicate Resham Highlights"],
    recommendedSwatches: ["powder-blue", "lavender", "coral-peach", "mint-leaf"],
    typicalWeeksToCraft: 4,
  },
] as const;

export type CeremonyLookPlan = {
  ceremonyId: CeremonyId;
  included: boolean;
  colorKey: string;
  silhouette: string;
  embroidery: string;
  notes: string;
};

export type TrousseauPlan = {
  weddingDate: string; // YYYY-MM-DD
  brideName: string;
  partnerName: string;
  location: string;
  ceremonies: Record<CeremonyId, CeremonyLookPlan>;
  lastSaved: string;
};

export const DEFAULT_TROUSSEAU: TrousseauPlan = {
  weddingDate: "",
  brideName: "",
  partnerName: "",
  location: "Indore / Destination",
  ceremonies: {
    haldi: {
      ceremonyId: "haldi",
      included: true,
      colorKey: "marigold",
      silhouette: "Tiered Anarkali / Light Ghera Skirt",
      embroidery: "Gota Patti & Resham Floral Accents",
      notes: "Lightweight and easy for haldi turmeric paste.",
    },
    mehendi: {
      ceremonyId: "mehendi",
      included: true,
      colorKey: "sage-green",
      silhouette: "Flared Kalidar with Cropped Choli",
      embroidery: "Botanical Threadwork with Seed Pearls",
      notes: "Sleeves cropped above elbow for henna application.",
    },
    sangeet: {
      ceremonyId: "sangeet",
      included: true,
      colorKey: "midnight-navy",
      silhouette: "Royal 6m Ghera Kalidar with Sweetheart Neck",
      embroidery: "Hand-Cut Mirror Work & Micro-Sequins",
      notes: "Maximum twirl volume for couple dance performance.",
    },
    pheras: {
      ceremonyId: "pheras",
      included: true,
      colorKey: "deep-maroon",
      silhouette: "Signature Indore Heritage Bridal Lehenga",
      embroidery: "Authentic Zardozi, Pitta & Dabka Needlework",
      notes: "Double dupatta: one pinned on shoulder, one lightweight sheer veil.",
    },
    reception: {
      ceremonyId: "reception",
      included: true,
      colorKey: "wine-burgundy",
      silhouette: "Sculpted Indo-Western Trailing Gown",
      embroidery: "Architectural Cutdana & Bugle Beads",
      notes: "Evening glamour with trail for cocktail hour.",
    },
    brunch: {
      ceremonyId: "brunch",
      included: false,
      colorKey: "powder-blue",
      silhouette: "Printed Silk Organza Lehenga",
      embroidery: "Minimalist Scalloped Pearl Borders",
      notes: "Relaxed daytime drape.",
    },
  },
  lastSaved: "",
};

const STORAGE_KEY = "mehfil-trousseau-planner";

export function loadTrousseau(): TrousseauPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TROUSSEAU;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_TROUSSEAU,
      ...parsed,
      ceremonies: {
        ...DEFAULT_TROUSSEAU.ceremonies,
        ...(parsed.ceremonies || {}),
      },
    };
  } catch {
    return DEFAULT_TROUSSEAU;
  }
}

export function saveTrousseau(plan: TrousseauPlan): void {
  try {
    const toSave: TrousseauPlan = {
      ...plan,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    /* ignore storage errors */
  }
}

export function hasSavedTrousseau(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw);
    return Boolean(p && p.lastSaved);
  } catch {
    return false;
  }
}

/**
 * PALETTE HARMONY INSPECTOR
 * Evaluates whether colors between ceremonies provide aesthetic balance,
 * warns of duplicate shades, and scores palette diversity.
 */
export type HarmonyInspection = {
  score: number; // 0 to 100
  verdict: "Flawless Spectrum" | "Harmonious" | "Tone Collisions Detected";
  activeCount: number;
  warnings: string[];
  praises: string[];
};

export function inspectPaletteHarmony(plan: TrousseauPlan): HarmonyInspection {
  const activeCeremonies = CEREMONIES.filter((c) => plan.ceremonies[c.id]?.included);
  if (activeCeremonies.length <= 1) {
    return {
      score: 100,
      verdict: "Harmonious",
      activeCount: activeCeremonies.length,
      warnings: [],
      praises: ["Select multiple ceremonies to inspect palette flow across your wedding week."],
    };
  }

  const selectedSwatches = activeCeremonies.map((c) => {
    const look = plan.ceremonies[c.id];
    return {
      ceremony: c,
      swatch: TROUSSEAU_SWATCHES.find((s) => s.key === look.colorKey) || TROUSSEAU_SWATCHES[0],
    };
  });

  const warnings: string[] = [];
  const praises: string[] = [];
  let score = 96;

  // 1. Check for duplicate exact swatches
  const swatchKeys = selectedSwatches.map((s) => s.swatch.key);
  const duplicates = swatchKeys.filter((item, index) => swatchKeys.indexOf(item) !== index);
  if (duplicates.length > 0) {
    const dupNames = Array.from(new Set(duplicates)).map(
      (k) => TROUSSEAU_SWATCHES.find((s) => s.key === k)?.label || k,
    );
    warnings.push(`Repeated Palette: ${dupNames.join(", ")} is chosen for multiple events. Consider distinguishing each event.`);
    score -= 15 * duplicates.length;
  }

  // 2. Check Haldi vs Pheras
  const haldi = selectedSwatches.find((s) => s.ceremony.id === "haldi");
  const pheras = selectedSwatches.find((s) => s.ceremony.id === "pheras");
  if (haldi && pheras) {
    if (haldi.swatch.key === pheras.swatch.key) {
      warnings.push("Haldi & Pheras share identical hues. Bridal tradition shines best when Haldi is bright solar and Pheras is regal deep crimson/maroon.");
      score -= 20;
    } else {
      praises.push("Clear distinction between daytime Haldi glow and sacred Pheras heirloom presence.");
    }
  }

  // 3. Check Day vs Night Balance
  const dayEvents = selectedSwatches.filter((s) => s.ceremony.id === "haldi" || s.ceremony.id === "brunch");
  const nightEvents = selectedSwatches.filter((s) => s.ceremony.id === "sangeet" || s.ceremony.id === "reception");

  const nightDeepCount = nightEvents.filter((s) => s.swatch.tone === "deep" || s.swatch.family === "jewel").length;
  if (nightEvents.length > 0 && nightDeepCount >= 1) {
    praises.push("Night ceremonies feature striking jewel tones engineered for stage lighting and ballroom photography.");
  }

  const dayLightCount = dayEvents.filter((s) => s.swatch.tone === "light" || s.swatch.tone === "vibrant").length;
  if (dayEvents.length > 0 && dayLightCount >= 1) {
    praises.push("Daytime functions capture airy, sunshine-friendly illumination.");
  }

  score = Math.max(30, Math.min(100, score));

  let verdict: HarmonyInspection["verdict"] = "Harmonious";
  if (score >= 90) verdict = "Flawless Spectrum";
  else if (score < 75) verdict = "Tone Collisions Detected";

  return {
    score,
    verdict,
    activeCount: activeCeremonies.length,
    warnings,
    praises,
  };
}

/**
 * KARIGARI PRODUCTION TIMELINE CALCULATOR
 * Calculates exact atelier milestones based on target wedding date.
 */
export type ProductionTimeline = {
  weddingDateFormatted: string;
  daysRemaining: number;
  urgency: "Optimal Atelier Window" | "Tight Production Track" | "Critical Rush Commission";
  urgencyDesc: string;
  milestones: {
    phase: string;
    date: string;
    detail: string;
  }[];
};

export function calculateProductionTimeline(weddingDateStr: string): ProductionTimeline | null {
  if (!weddingDateStr) return null;
  const wedding = new Date(`${weddingDateStr}T12:00:00`);
  if (isNaN(wedding.getTime())) return null;

  const now = new Date();
  const diffMs = wedding.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // Calculate milestone offsets before wedding
  const orderDate = new Date(wedding);
  orderDate.setDate(orderDate.getDate() - 84); // 12 weeks before

  const loomZardoziDate = new Date(wedding);
  loomZardoziDate.setDate(loomZardoziDate.getDate() - 56); // 8 weeks before

  const trialFittingDate = new Date(wedding);
  trialFittingDate.setDate(trialFittingDate.getDate() - 21); // 3 weeks before

  const dispatchDate = new Date(wedding);
  dispatchDate.setDate(dispatchDate.getDate() - 7); // 1 week before

  let urgency: ProductionTimeline["urgency"] = "Optimal Atelier Window";
  let urgencyDesc = "Sufficient window for handcrafted loom zardozi, hand-dyed silks, and two in-studio fitting iterations in Indore.";

  if (daysRemaining < 45) {
    urgency = "Critical Rush Commission";
    urgencyDesc = "Under 6 weeks remaining. Requires accelerated master cutting and priority embroidery loom allocation.";
  } else if (daysRemaining < 80) {
    urgency = "Tight Production Track";
    urgencyDesc = "Approx 8-11 weeks remaining. Standard couture lead times require commissioning without delay.";
  }

  return {
    weddingDateFormatted: formatDate(wedding),
    daysRemaining,
    urgency,
    urgencyDesc,
    milestones: [
      {
        phase: "01. Silhouette Blueprint & Silk Dyeing",
        date: formatDate(orderDate),
        detail: "Pattern drafting to your 14-point passport measurements; custom vat-dyeing of heritage silk & organza.",
      },
      {
        phase: "02. Khaka Tracing & Zardozi Loom Weaving",
        date: formatDate(loomZardoziDate),
        detail: "Indore karigars mount panels on wooden addas for bullion metallic threadwork and crystal setting.",
      },
      {
        phase: "03. First Fitting & Canvas Structure Trial",
        date: formatDate(trialFittingDate),
        detail: "Flagship studio trial (or video-guided remote review) to calibrate choli darts and skirt cancan flare.",
      },
      {
        phase: "04. Hand-Finished Latkans & Delivery",
        date: formatDate(dispatchDate),
        detail: "Final steam drape press, custom tassel attachment, and white-glove delivery in breathable heirloom trunks.",
      },
    ],
  };
}

/** Formats Trousseau Wardrobe into WhatsApp consultation text */
export function formatTrousseauForEnquiry(plan: TrousseauPlan): string {
  const activeCeremonies = CEREMONIES.filter((c) => plan.ceremonies[c.id]?.included);
  const bride = plan.brideName.trim() ? `Bride: ${plan.brideName.trim()}` : "Bride: Bespoke Client";
  const partner = plan.partnerName.trim() ? ` & ${plan.partnerName.trim()}` : "";
  const dateStr = plan.weddingDate ? `Wedding Date: ${plan.weddingDate}` : "Wedding Date: Upcoming Season";

  const lines = [
    `👑 MEHFIL BESPOKE TROUSSEAU WARDROBE DOSSIER 👑`,
    `${bride}${partner} · ${plan.location}`,
    `${dateStr}`,
    `--------------------------------------------`,
    `CEREMONIES CURATED (${activeCeremonies.length} Functions):`,
    ``,
  ];

  activeCeremonies.forEach((c) => {
    const look = plan.ceremonies[c.id];
    const swatch = TROUSSEAU_SWATCHES.find((s) => s.key === look.colorKey);
    lines.push(
      `[${c.name.toUpperCase()} · ${c.timeVibe}]`,
      `• Palette: ${swatch?.label || look.colorKey}`,
      `• Silhouette: ${look.silhouette}`,
      `• Karigari Work: ${look.embroidery}`,
      look.notes ? `• Styling Notes: ${look.notes}` : "",
      ``,
    );
  });

  lines.push(
    `--------------------------------------------`,
    `(Curated for Mehfil Couture Flagship Studio, South Tukoganj, Indore)`,
  );

  return lines.filter(Boolean).join("\n");
}
