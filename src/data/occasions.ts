import { photos, type Photo } from "./images";
import type { OccasionKey } from "./studio";

export type Occasion = {
  slug: string;
  role: string;
  hook: string;
  copy: string;
  image: Photo;
  /** preset for the Style Studio */
  studio: OccasionKey;
  collection: string;
};

export const occasions: Occasion[] = [
  {
    slug: "the-bride",
    role: "The Bride",
    hook: "Here for the vows?",
    copy: "Make an entrance. Handcrafted, heavy with detail, and entirely yours.",
    image: photos.mirrorBride,
    studio: "wedding",
    collection: "Handcrafted Bridal",
  },
  {
    slug: "the-best-friend",
    role: "The Best Friend",
    hook: "Here for your bestie?",
    copy: "Steal the spotlight — just a little. Coordinated, never matching.",
    image: photos.squad,
    studio: "sangeet",
    collection: "Luxury Prêt",
  },
  {
    slug: "the-wedding-guest",
    role: "The Wedding Guest",
    hook: "Here for the baraat?",
    copy: "Dress like you were the reason the photographer stayed late.",
    image: photos.blushPret,
    studio: "wedding",
    collection: "Luxury Prêt",
  },
  {
    slug: "the-engagement-look",
    role: "The Engagement Look",
    hook: "Here for the ring?",
    copy: "Soft colour, fine detail — the first photograph of forever.",
    image: photos.sage,
    studio: "engagement",
    collection: "Luxury Prêt",
  },
  {
    slug: "the-sangeet-night",
    role: "The Sangeet Night",
    hook: "Here for the dhol?",
    copy: "Built for the twirl, the choreography and the encore nobody planned.",
    image: photos.mustard,
    studio: "sangeet",
    collection: "Indo-Western",
  },
  {
    slug: "the-festive-main-character",
    role: "The Festive Main Character",
    hook: "Here for yourself?",
    copy: "Always the right reason. Diya-light, good company, a better outfit.",
    image: photos.marigold,
    studio: "festive",
    collection: "Luxury Prêt",
  },
];
