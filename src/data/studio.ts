import { photos, type Photo } from "./images";

/**
 * The Mehfil Style Studio is a rule-based inspiration simulator — no AI model,
 * no virtual try-on. A mood is composed from the visitor's choices and matched
 * to tagged editorial imagery. Swap/extend `looks` with real products later.
 */

export const studioOccasions = [
  { key: "wedding", label: "Wedding", line: "a silhouette made for the spotlight" },
  { key: "engagement", label: "Engagement", line: "a look made for the first photograph of forever" },
  { key: "sangeet", label: "Sangeet", line: "enough flare to own the dance floor" },
  { key: "festive", label: "Festive", line: "a glow that holds its own in diya-light" },
  { key: "party", label: "Party", line: "an entrance the whole room will clock" },
] as const;

export const studioColours = [
  { key: "maroon", label: "Maroon", hex: "#6e1b1b", line: "Deep maroon" },
  { key: "red", label: "Red", hex: "#a8222b", line: "Classic bridal red" },
  { key: "pink", label: "Pink", hex: "#d58a97", line: "Rose and blush" },
  { key: "ivory", label: "Ivory", hex: "#efe5d0", line: "Soft ivory" },
  { key: "gold", label: "Gold", hex: "#c39a4c", line: "Burnished gold" },
  { key: "sage", label: "Sage", hex: "#97a685", line: "Cool sage" },
  { key: "midnight", label: "Midnight", hex: "#25304d", line: "Inky midnight blue" },
] as const;

export const studioAesthetics = [
  { key: "royal", label: "Royal", detail: "intricate zari detailing", jewel: "A polki choker and a single statement maang tikka." },
  { key: "romantic", label: "Romantic", detail: "delicate florals and sheer layers", jewel: "Pearl drops, soft curls and fresh flowers in the hair." },
  { key: "minimal", label: "Minimal", detail: "clean lines with one perfect detail", jewel: "Let one piece speak — a pair of oversized jhumkas, nothing else." },
  { key: "dramatic", label: "Dramatic", detail: "a sweeping, voluminous drape", jewel: "Stack it: layered haar, cuff, and a bold lip to finish." },
  { key: "contemporary", label: "Contemporary", detail: "an unexpected cut", jewel: "Sculptural metal, a sleek bun and statement rings." },
] as const;

export const studioSilhouettes = [
  { key: "lehenga", label: "Lehenga", note: "Let the kalis do the work — a full flare that moves when you do." },
  { key: "gown", label: "Indo-western gown", note: "One clean line from shoulder to hem; carry the dupatta as a cape or skip it." },
  { key: "drape", label: "Draped & sari-inspired", note: "Pleats at the waist, pallu over the shoulder — fluid, easy, elegant." },
  { key: "any", label: "Surprise me", note: "Keep an open mind — the right silhouette usually finds you in the trial room." },
] as const;

export type OccasionKey = (typeof studioOccasions)[number]["key"];
export type ColourKey = (typeof studioColours)[number]["key"];
export type AestheticKey = (typeof studioAesthetics)[number]["key"];
export type SilhouetteKey = (typeof studioSilhouettes)[number]["key"];

type Look = {
  photo: Photo;
  colours: ColourKey[];
  aesthetics: AestheticKey[];
  occasions: OccasionKey[];
  silhouette: Exclude<SilhouetteKey, "any">;
};

const looks: Look[] = [
  { photo: photos.velvetBride, colours: ["maroon", "red"], aesthetics: ["royal", "dramatic"], occasions: ["wedding"], silhouette: "lehenga" },
  { photo: photos.redGold, colours: ["red", "gold"], aesthetics: ["royal"], occasions: ["wedding"], silhouette: "lehenga" },
  { photo: photos.mirrorBride, colours: ["red", "maroon"], aesthetics: ["royal", "romantic"], occasions: ["wedding"], silhouette: "lehenga" },
  { photo: photos.redVeil, colours: ["red"], aesthetics: ["dramatic", "romantic"], occasions: ["wedding", "engagement"], silhouette: "lehenga" },
  { photo: photos.blushBride, colours: ["pink"], aesthetics: ["romantic", "royal"], occasions: ["wedding", "engagement"], silhouette: "lehenga" },
  { photo: photos.blushPret, colours: ["pink", "sage"], aesthetics: ["romantic", "contemporary"], occasions: ["engagement", "festive", "sangeet"], silhouette: "lehenga" },
  { photo: photos.lilac, colours: ["pink", "ivory"], aesthetics: ["romantic", "minimal"], occasions: ["engagement", "party"], silhouette: "lehenga" },
  { photo: photos.goldBride, colours: ["gold", "ivory"], aesthetics: ["royal", "minimal"], occasions: ["wedding", "engagement"], silhouette: "lehenga" },
  { photo: photos.ivory, colours: ["ivory"], aesthetics: ["minimal", "romantic"], occasions: ["festive", "engagement"], silhouette: "drape" },
  { photo: photos.ivoryGold, colours: ["ivory", "gold"], aesthetics: ["minimal", "contemporary"], occasions: ["party", "festive"], silhouette: "drape" },
  { photo: photos.sage, colours: ["sage"], aesthetics: ["minimal", "romantic"], occasions: ["engagement", "festive"], silhouette: "gown" },
  { photo: photos.teal, colours: ["sage", "midnight"], aesthetics: ["contemporary", "dramatic"], occasions: ["party", "sangeet"], silhouette: "lehenga" },
  { photo: photos.marigold, colours: ["gold", "maroon"], aesthetics: ["royal", "contemporary"], occasions: ["festive", "sangeet"], silhouette: "lehenga" },
  { photo: photos.mustard, colours: ["gold"], aesthetics: ["contemporary"], occasions: ["sangeet", "party"], silhouette: "lehenga" },
  { photo: photos.gowns, colours: ["maroon", "midnight"], aesthetics: ["contemporary", "dramatic"], occasions: ["party", "sangeet"], silhouette: "gown" },
  { photo: photos.navyGown, colours: ["midnight", "gold"], aesthetics: ["dramatic", "contemporary"], occasions: ["party", "engagement"], silhouette: "gown" },
  { photo: photos.festiveDuo, colours: ["red", "maroon"], aesthetics: ["dramatic", "contemporary"], occasions: ["festive", "party"], silhouette: "drape" },
  { photo: photos.heroRed, colours: ["red", "maroon"], aesthetics: ["dramatic", "romantic"], occasions: ["sangeet", "party"], silhouette: "lehenga" },
  { photo: photos.silkSaree, colours: ["pink", "red"], aesthetics: ["royal", "romantic"], occasions: ["festive"], silhouette: "drape" },
  { photo: photos.lightsBride, colours: ["red"], aesthetics: ["royal"], occasions: ["wedding", "sangeet"], silhouette: "lehenga" },
];

export type StudioSelection = {
  occasion: OccasionKey | null;
  colour: ColourKey | null;
  aesthetics: AestheticKey[];
  silhouette: SilhouetteKey | null;
};

export const emptySelection: StudioSelection = { occasion: null, colour: null, aesthetics: [], silhouette: null };

const find = <T extends { key: string }>(list: readonly T[], key: string | null) => list.find((x) => x.key === key);

export function composeMood(sel: StudioSelection) {
  const occ = find(studioOccasions, sel.occasion);
  const col = find(studioColours, sel.colour);
  const aes = sel.aesthetics.map((k) => find(studioAesthetics, k)!).filter(Boolean);
  const sil = find(studioSilhouettes, sel.silhouette);

  // Best-matching inspiration image
  let best = looks[0];
  let bestScore = -1;
  for (const look of looks) {
    let s = 0;
    if (sel.colour && look.colours.includes(sel.colour)) s += look.colours[0] === sel.colour ? 4 : 3;
    for (const a of sel.aesthetics) if (look.aesthetics.includes(a)) s += 2;
    if (sel.occasion && look.occasions.includes(sel.occasion)) s += 1.5;
    if (sel.silhouette && sel.silhouette !== "any" && look.silhouette === sel.silhouette) s += 2.5;
    if (s > bestScore) {
      bestScore = s;
      best = look;
    }
  }

  const title =
    aes.length === 2
      ? `${aes[0].label} & ${aes[1].label}`
      : aes.length === 1
        ? col
          ? `${aes[0].label} in ${col.label}`
          : aes[0].label
        : col
          ? `${col.label}, made to be seen`
          : "Yours to discover";

  const parts: string[] = [];
  parts.push(col ? col.line : "Your colour");
  parts.push(aes.length ? aes.map((a) => a.detail).join(", ") : "detail chosen with intention");
  const description = `${parts.join(", ")}, and ${occ ? occ.line : "a look that feels like the occasion"}.`;

  const notes = [
    aes[0] ? { label: "Jewellery", text: aes[0].jewel } : null,
    sil ? { label: "Silhouette", text: sil.note } : null,
    col ? { label: "Palette", text: paletteNote(col.key) } : null,
  ].filter(Boolean) as { label: string; text: string }[];

  const steps = [sel.occasion, sel.colour, sel.aesthetics.length ? "y" : null, sel.silhouette];
  const complete = steps.filter(Boolean).length;

  return { title, description, photo: best.photo, notes, swatch: col?.hex ?? "#b98a3d", complete, total: steps.length, occ, col, aes, sil };
}

function paletteNote(c: ColourKey) {
  switch (c) {
    case "maroon":
      return "Pair with antique gold and a dusty rose dupatta for depth.";
    case "red":
      return "Keep the metals warm — yellow gold, never silver.";
    case "pink":
      return "Try a contrast in sage or mint for something unexpected.";
    case "ivory":
      return "Pearls, polki and a whisper of blush on the cheeks.";
    case "gold":
      return "Ground it with a deep maroon or bottle-green dupatta.";
    case "sage":
      return "Champagne gold and soft pink lips keep it fresh.";
    case "midnight":
      return "Silver, crystal or antique gold — all three love midnight.";
  }
}

export function moodMessage(sel: StudioSelection) {
  const m = composeMood(sel);
  const lines = [
    `Hi Mehfil Couture! I tried the Style Studio on your website.`,
    `My mood: ${m.title}`,
    m.occ ? `Occasion: ${m.occ.label}` : null,
    m.col ? `Colour: ${m.col.label}` : null,
    m.aes.length ? `Aesthetic: ${m.aes.map((a) => a.label).join(", ")}` : null,
    m.sil ? `Silhouette: ${m.sil.label}` : null,
    `Could you suggest pieces from the studio that match?`,
  ];
  return lines.filter(Boolean).join("\n");
}
