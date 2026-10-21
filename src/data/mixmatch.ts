/**
 * Options for the Atelier Sketchbook (mix-and-match). These drive an SVG
 * illustration — they are styling inspiration, not a confirmed made-to-order menu.
 */

export type Swatch = { key: string; label: string; base: string; shade: string; light: string };

export const lehengaColours: Swatch[] = [
  { key: "maroon", label: "Maroon", base: "#6e1b1b", shade: "#4a1010", light: "#8e2f2a" },
  { key: "red", label: "Sindoor red", base: "#a8222b", shade: "#7a1219", light: "#c43b3f" },
  { key: "blush", label: "Blush", base: "#e3a7ab", shade: "#c98088", light: "#f1c6c5" },
  { key: "ivory", label: "Ivory", base: "#efe5d0", shade: "#d6c7a6", light: "#faf4e6" },
  { key: "gold", label: "Antique gold", base: "#c39a4c", shade: "#9a7432", light: "#dcb877" },
  { key: "sage", label: "Sage", base: "#97a685", shade: "#738263", light: "#b6c2a7" },
  { key: "midnight", label: "Midnight", base: "#25304d", shade: "#161d33", light: "#3a4770" },
];

export const dupattaColours: (Swatch | { key: "none"; label: string })[] = [
  { key: "none", label: "No dupatta" },
  { key: "gold", label: "Gold tissue", base: "#d8b274", shade: "#b98a3d", light: "#f0e2c5" },
  { key: "ivory", label: "Ivory net", base: "#f5ecda", shade: "#ddcfb2", light: "#fffaf0" },
  { key: "blush", label: "Blush organza", base: "#eab3b3", shade: "#d18e92", light: "#f6d4d2" },
  { key: "maroon", label: "Maroon velvet", base: "#7a2222", shade: "#4a1010", light: "#9a3a33" },
  { key: "sage", label: "Sage chiffon", base: "#aab79a", shade: "#7a8861", light: "#cfd8c4" },
];

export const blouseStyles = [
  { key: "sweetheart", label: "Sweetheart, sleeveless" },
  { key: "elbow", label: "V-neck, elbow sleeve" },
  { key: "highneck", label: "High neck, full sleeve" },
  { key: "offshoulder", label: "Off-shoulder" },
] as const;

export const embroideryMoods = [
  { key: "zari", label: "Zari & zardozi", note: "Metallic gold work — the most traditional, most bridal." },
  { key: "resham", label: "Resham threadwork", note: "Tonal silk-thread florals — rich but quiet." },
  { key: "mirror", label: "Mirror work", note: "Catches every light at the sangeet." },
  { key: "minimal", label: "Clean border", note: "One fine border. Let the colour lead." },
] as const;

export const jewelleryMoods = [
  { key: "choker", label: "Polki choker" },
  { key: "haar", label: "Layered rani haar" },
  { key: "jhumka", label: "Statement jhumkas" },
  { key: "minimal", label: "Barely-there" },
] as const;

export type BlouseKey = (typeof blouseStyles)[number]["key"];
export type EmbroideryKey = (typeof embroideryMoods)[number]["key"];
export type JewelleryKey = (typeof jewelleryMoods)[number]["key"];

export type Look = {
  lehenga: string;
  blouse: BlouseKey;
  dupatta: string;
  embroidery: EmbroideryKey;
  jewellery: JewelleryKey;
};

export const defaultLook: Look = {
  lehenga: "maroon",
  blouse: "sweetheart",
  dupatta: "gold",
  embroidery: "zari",
  jewellery: "choker",
};
