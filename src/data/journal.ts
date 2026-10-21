import { photos, type Photo } from "./images";

export type Block =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "pull"; text: string }
  | { t: "list"; items: string[] };

export type Article = {
  slug: string;
  kicker: string;
  title: string;
  accent: string; // italic part of title
  dek: string;
  image: Photo;
  body: Block[];
};

export const articles: Article[] = [
  {
    slug: "sangeet-lehenga-styling",
    kicker: "Styling notes",
    title: "How to style a lehenga for the",
    accent: "sangeet",
    dek: "The one night you'll dance in it. Dress for the twirl, the floor and the photographs that come after.",
    image: photos.festiveDuo,
    body: [
      { t: "p", text: "The sangeet is the most kinetic night of an Indian wedding. You'll sit cross-legged for the performances, stand for the dhol, and spend at least an hour on the dance floor. Your lehenga needs to look extraordinary — and move with you while it does." },
      { t: "h", text: "Choose flare over weight" },
      { t: "p", text: "Look for a skirt with plenty of kalis (panels) and a lighter base fabric — georgette, organza or a fine silk. A full circle catches the air when you spin; a heavy velvet will look regal but tire you by the second song." },
      { t: "h", text: "Let the light do the work" },
      { t: "p", text: "Sangeets usually happen at night under coloured lighting. Mirror work, sequins and metallic threadwork come alive here in a way they never do at a daytime function. If you've been saving something that sparkles, this is the night." },
      { t: "pull", text: "Dress for the twirl, then dress for the photograph of the twirl." },
      { t: "h", text: "Practical, but pretty" },
      { t: "list", items: ["Pin the dupatta at the shoulder and the waist — or wear it as a cape so both hands are free.", "Keep the hem just off the floor so you never step on it mid-step.", "Swap stilettos for embellished juttis or block heels.", "Choose earrings that won't catch in your hair when you turn."] },
      { t: "p", text: "Finally: wear it for one full song at home before the night. If it moves the way you want it to, you're ready." },
    ],
  },
  {
    slug: "wedding-guest-inspiration",
    kicker: "The guest list",
    title: "The wedding guest's",
    accent: "rulebook",
    dek: "Look unforgettable without stepping on the bride's moment. It's easier than it sounds.",
    image: photos.blushPret,
    body: [
      { t: "p", text: "Being a wedding guest in India is a multi-day commitment, and every function deserves its own look. The art is in looking celebratory while leaving the main-character energy to the couple." },
      { t: "h", text: "Read the invite" },
      { t: "p", text: "Daytime functions — haldi, mehendi, a morning pheras — call for lighter fabrics and brighter or softer colours. Evening receptions and cocktails can carry deeper tones, more structure and more shine." },
      { t: "h", text: "The colours to think twice about" },
      { t: "p", text: "Families differ, so ask if you're unsure — but traditional bridal red is usually best left to the bride on the main day. Rich jewel tones, pastels and metallics all give you room to shine without overlapping." },
      { t: "pull", text: "The best guest outfit is the one that makes the bride say, “Wait — where is that from?”" },
      { t: "h", text: "One statement, not five" },
      { t: "list", items: ["A beautifully embroidered lehenga? Keep jewellery restrained.", "A simpler silhouette? Let the earrings or a cape dupatta be the moment.", "Indo-western is welcome at most cocktails and sangeets — and photographs beautifully."] },
    ],
  },
  {
    slug: "colours-for-every-celebration",
    kicker: "Colour theory",
    title: "Choosing colours for every",
    accent: "celebration",
    dek: "Marigold for the haldi, midnight for the cocktail — a palette guide to a whole wedding week.",
    image: photos.textiles,
    body: [
      { t: "p", text: "A wedding week is a sequence of moods, and colour is the fastest way to match them. Use these as starting points, not rules." },
      { t: "h", text: "Haldi & mehendi" },
      { t: "p", text: "Sunshine yellows, marigold, parrot green, fresh mint. These functions are relaxed and joyful, often outdoors — your outfit should feel the same." },
      { t: "h", text: "Sangeet" },
      { t: "p", text: "Fuchsia, emerald, electric blue, anything with mirror work. Colours that hold their own under stage lights and look good in motion." },
      { t: "h", text: "The wedding" },
      { t: "p", text: "For the bride: reds, maroons, rani pink, and increasingly ivory and gold. For guests: jewel tones, rose, champagne, deep teal." },
      { t: "h", text: "Reception & cocktail" },
      { t: "p", text: "Midnight blue, wine, black with gold, silver, dusty mauve. This is where modern silhouettes and indo-western cuts truly shine." },
      { t: "pull", text: "Match the mood of the room, then add one colour that's entirely you." },
      { t: "p", text: "Not sure where you land? The Style Studio on our homepage will help you put your mood into words." },
    ],
  },
  {
    slug: "the-art-of-the-dupatta",
    kicker: "Drape study",
    title: "The art of the",
    accent: "dupatta",
    dek: "Six metres of possibility. Five ways to wear it — from heirloom-classic to cape.",
    image: photos.netBride,
    body: [
      { t: "p", text: "The dupatta is the most versatile piece of any lehenga set. The same outfit can look traditional, romantic or completely modern depending on how you drape it." },
      { t: "h", text: "Five drapes worth knowing" },
      { t: "list", items: ["The classic: pleated over the left shoulder, falling freely behind. Timeless, and shows off a heavy border.", "The bridal veil: over the head and pinned at the shoulders, or a second dupatta for the ceremony.", "The saree drape: tucked at the waist and pleated over the shoulder for a sari-like line.", "The cape: both ends over the shoulders, falling behind — hands free, very contemporary.", "The belted drape: across the body, cinched at the waist with an embroidered belt or kamarbandh."] },
      { t: "pull", text: "Same outfit, five different entrances." },
      { t: "h", text: "Pin smart" },
      { t: "p", text: "Use small safety pins on the inside of the blouse at the shoulder and a second at the waist. For sheer nets and organzas, a tiny dab of fashion tape holds a pleat without marking the fabric." },
    ],
  },
  {
    slug: "jewellery-pairings",
    kicker: "Finishing touches",
    title: "Jewellery pairings for",
    accent: "ethnicwear",
    dek: "Necklines decide necklaces. A short guide to getting the proportions right.",
    image: photos.redGold,
    body: [
      { t: "p", text: "The quickest way to make an outfit look considered is to match the jewellery to the neckline. Everything else is personal taste." },
      { t: "h", text: "Neckline by neckline" },
      { t: "list", items: ["Sweetheart & deep V: a choker plus a longer layered haar fills the space beautifully.", "Boat neck & high neck: skip the necklace. Go big on earrings and stack the wrists.", "Off-shoulder: a single statement choker, or nothing at all and dramatic jhumkas.", "Square neck: a structured collar necklace echoes the line."] },
      { t: "h", text: "Match the metal to the work" },
      { t: "p", text: "Gold zari and zardozi sit best with yellow gold, polki and kundan. Silver threadwork, mirror work and cooler pastels open the door to silver, oxidised pieces and diamonds." },
      { t: "pull", text: "If the outfit is loud, let the jewellery whisper. If it whispers, let the jewellery sing." },
    ],
  },
  {
    slug: "restyle-your-occasionwear",
    kicker: "Wear it again",
    title: "The art of re-wearing",
    accent: "occasionwear",
    dek: "A beautiful outfit deserves more than one evening. How to restyle it so it feels new every time.",
    image: photos.ivoryGold,
    body: [
      { t: "p", text: "Handcrafted occasionwear is an investment, and the most stylish thing you can do with it is wear it again — differently." },
      { t: "h", text: "Break up the set" },
      { t: "list", items: ["Wear the lehenga skirt with a crisp shirt or a fitted crop top for a cocktail.", "Pair the blouse with a silk saree for an entirely new look.", "Throw the dupatta over a plain anarkali or even a simple kurta-palazzo set."] },
      { t: "h", text: "Change the styling, change the outfit" },
      { t: "p", text: "A new drape, different jewellery, a swap from loose waves to a sleek bun — guests remember the overall impression, not the skirt." },
      { t: "pull", text: "The second time you wear it, it already has a story." },
      { t: "h", text: "Care between wears" },
      { t: "p", text: "Store heavy pieces folded in muslin rather than on hangers, keep embroidery away from direct sunlight, and air them out every few months." },
    ],
  },
];

export const getArticle = (slug: string | undefined) => articles.find((a) => a.slug === slug);

export function readingMinutes(a: Article) {
  const words = a.body
    .map((b) => (b.t === "list" ? b.items.join(" ") : b.text))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}
