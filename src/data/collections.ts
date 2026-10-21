import { photos, type Photo } from "./images";

export type Collection = {
  slug: string;
  no: string;
  name: string;
  /** italic second half of the display title */
  accent: string;
  label: string;
  description: string;
  image: Photo;
  detail: Photo;
  /** Instagram bio lists these three lines — verified categories */
  verified: boolean;
};

export const collections: Collection[] = [
  {
    slug: "handcrafted-bridal",
    no: "01",
    name: "Handcrafted",
    accent: "Bridal",
    label: "The main event",
    description:
      "Lehengas worked by hand, heavy with embroidery and meaning — made for the moment the whole room turns to look.",
    image: photos.velvetBride,
    detail: photos.zariClose,
    verified: true,
  },
  {
    slug: "luxury-pret",
    no: "02",
    name: "Luxury",
    accent: "Prêt",
    label: "Ready when the invite is",
    description:
      "Occasion-ready ensembles with couture detailing — for the mehendi, the cocktail, the festive dinner and every function in between.",
    image: photos.lilac,
    detail: photos.blushPret,
    verified: true,
  },
  {
    slug: "indo-western",
    no: "03",
    name: "Indo-",
    accent: "Western",
    label: "Tradition, re-cut",
    description:
      "Gowns, drapes and new silhouettes with an Indian heart — for the guest who likes to arrive as the conversation.",
    image: photos.gowns,
    detail: photos.navyGown,
    verified: true,
  },
];

export const collectionNames = collections.map((c) => `${c.name}${c.name.endsWith("-") ? "" : " "}${c.accent}`);
