/**
 * Mehfil Couture — single source of truth for business details.
 *
 * VERIFIED (public sources, Oct 2026):
 *   - Name, Instagram handle and bio ("Dress your Dream ✨ Handcrafted Bridal |
 *     Luxury Pret | Indo-Western 📍 Flagship") — instagram.com/mehfil.couture
 *   - Flagship address — the Google Maps link in that Instagram bio
 *
 * NOT VERIFIED — supply these via `.env.local` or edit below:
 *   - WhatsApp / phone / email, opening hours, prices, policies, reviews.
 *   Until a WhatsApp number is set, enquiries open an Instagram DM instead.
 */

const env = import.meta.env;
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const brand = {
  name: "Mehfil Couture",
  tagline: "Dress your Dream", // verified (Instagram bio)
  categories: ["Handcrafted Bridal", "Luxury Prêt", "Indo-Western"], // verified (Instagram bio)
  siteUrl: clean(env.VITE_SITE_URL) || "https://www.example.com",

  instagram: {
    handle: "@mehfil.couture",
    url: "https://www.instagram.com/mehfil.couture/",
    dm: "https://ig.me/m/mehfil.couture",
  },

  studio: {
    label: "The Flagship Studio",
    lines: ["Samavsharan Apartment, 16/1-B", "South Tukoganj, Indore", "Madhya Pradesh 452001"],
    mapUrl: "https://maps.app.goo.gl/5cRJxcc8UKFCNscJ9",
    /** Not publicly listed — set when confirmed, e.g. "Mon–Sat · 11am–8pm" */
    hours: "",
  },

  /** Digits only incl. country code, e.g. "919876543210". Empty = Instagram DM fallback. */
  whatsapp: clean(env.VITE_WHATSAPP_NUMBER).replace(/\D/g, ""),
  phone: clean(env.VITE_PUBLIC_PHONE),
  email: clean(env.VITE_PUBLIC_EMAIL),

  endpoints: {
    appointment: clean(env.VITE_APPOINTMENT_ENDPOINT),
    newsletter: clean(env.VITE_NEWSLETTER_ENDPOINT),
  },

  analyticsEnabled: clean(env.VITE_ANALYTICS_ENABLED) === "true",
} as const;

/**
 * Services & policies. Only entries with `verified: true` are shown as facts on
 * the site. Flip the flag (and edit the copy) once the studio confirms each one.
 */
export const services = [
  {
    key: "studio",
    title: "A flagship studio in Indore",
    body: "Visit us in South Tukoganj to see the pieces in person — the embroidery, the fall of the fabric, the colour in real light.",
    verified: true,
  },
  {
    key: "handcrafted",
    title: "Handcrafted bridal",
    body: "Bridal wear made by hand, the way occasionwear deserves to be made.",
    verified: true,
  },
  {
    key: "styling",
    title: "Personal styling assistance",
    body: "One-to-one help choosing silhouette, colour and styling for your occasion.",
    verified: false,
  },
  {
    key: "alterations",
    title: "Fittings & alterations",
    body: "In-studio fittings and alterations so the outfit fits like it was always yours.",
    verified: false,
  },
  {
    key: "shipping",
    title: "Shipping across India",
    body: "Delivery options for out-of-town clients.",
    verified: false,
  },
] as const;

/**
 * Seasonal campaign strip & banner. Keep `offer` empty unless a real, dated
 * promotion is confirmed — no fake discounts or countdowns.
 */
export const campaign = {
  enabled: true,
  kicker: "Wedding season",
  title: "The season of mehfils is here.",
  body: "Sangeets, haldis, receptions, the late-night dance-offs — plan your looks early and come see them in person at the flagship.",
  cta: "Plan my wedding-season looks",
  offer: "", // e.g. "Complimentary styling session · until 30 Nov" — only when verified
};

export const announcements = [
  "Handcrafted bridal · Luxury prêt · Indo-western",
  "Visit the flagship studio — South Tukoganj, Indore",
  "New looks every week on Instagram @mehfil.couture",
];
