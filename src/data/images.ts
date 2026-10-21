/**
 * Editorial imagery. All photos are from Unsplash (free under the Unsplash
 * License) and are INSPIRATION ONLY — they are not Mehfil Couture products.
 * Swap `src` for the studio's own photography when available; everything on the
 * site reads from this file.
 */

export type Photo = {
  src: string; // base URL without query
  alt: string;
  credit: string;
  /** CSS object-position for good crops */
  focus?: string;
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

const ph = (id: string, alt: string, credit: string, focus?: string): Photo => ({ src: u(id), alt, credit, focus });

export const photos = {
  heroRed: ph("1668371679302-a8ec781e876e", "A woman in a flowing deep-red lehenga stands on a pebbled ridge beneath a stormy sky", "Ardy Arjun", "50% 30%"),
  trail: ph("1629118477133-b8b1499f2b8a", "Full-length maroon velvet lehenga with heavy zari embroidery and a long trailing dupatta", "Bulbul Ahmed", "50% 40%"),
  zariClose: ph("1724856605022-106d6dd6e842", "Close-up of red lehenga fabric with gold zari embroidery of elephants and florals", "Abhishek Sharma", "50% 50%"),
  zariSoft: ph("1724856604254-f7cf4e9c8f72", "Soft-focus detail of a red and gold embroidered bridal lehenga", "Abhishek Sharma", "30% 50%"),
  zariWide: ph("1724856604403-60304b28906c", "Gold embroidered motifs along the hem of a red lehenga", "Abhishek Sharma", "30% 50%"),
  bridalGold: ph("1721324807083-e9ddaa99310e", "A bride in a coral and gold embroidered lehenga with a sheer dupatta over her head", "Naeem Ad", "50% 25%"),
  velvetBride: ph("1740674570259-a47d713a2976", "A bride in a maroon velvet blouse with silver embroidery, pearl jewellery and a red dupatta", "Aman Malik", "50% 20%"),
  mirrorBride: ph("1610047614256-023d7c028d0b", "A bride in a red and gold lehenga seated beside an ornate gilded mirror", "Bulbul Ahmed", "50% 35%"),
  blushBride: ph("1662714802102-9825504458ca", "A bride in a blush pink embroidered lehenga with a magenta dupatta in a garden", "Talha Hadi", "50% 25%"),
  redVeil: ph("1677691257363-eebd2abeafec", "A bride in red holds the border of her embroidered dupatta against a black backdrop", "dras koli", "50% 25%"),
  veilFrame: ph("1677691256999-45d69a11b197", "A bride lifts a sheer red embroidered dupatta over her face", "dras koli", "50% 30%"),
  goldBride: ph("1610047881689-fc68ff7b2a89", "A woman in an all-gold embroidered lehenga with a sheer ivory dupatta", "Bulbul Ahmed", "50% 25%"),
  netBride: ph("1610047520958-b42ebcd2f6cb", "A woman in a red lehenga holds up a sheer embroidered net dupatta", "Bulbul Ahmed", "50% 30%"),
  blushPret: ph("1746372283841-dbb3838f9935", "A woman in a blush pink and teal embroidered lehenga poses in a stone archway", "SAREE GHAR", "50% 40%"),
  lilac: ph("1649930055986-ca57250a7fd4", "A woman in a pale lilac embellished lehenga stands among purple flowers", "Ardy Arjun", "50% 40%"),
  marigold: ph("1767955694884-d4bf352c23c2", "A woman in a marigold and maroon lehenga with an embroidered dupatta over one shoulder", "Morni Saree", "50% 30%"),
  sage: ph("1610048869310-d889ff25c374", "A woman in a mint-sage embroidered anarkali with a sheer dupatta beside a carved door", "Bulbul Ahmed", "50% 30%"),
  teal: ph("1619715613791-89d35b51ff81", "A woman in a teal lehenga seated in an old stone window", "Sabesh Photography LTD", "60% 50%"),
  ivory: ph("1729146768775-3662af38016e", "A woman in an ivory embroidered blouse and drape with a pearl necklace", "The Behruz Theory", "50% 30%"),
  ivoryGold: ph("1601432093209-8af1fd74b054", "A woman in an ivory and gold outfit adjusts her maang tikka", "Bernie Almanzar", "40% 30%"),
  mustard: ph("1574847872646-abff244bbd87", "A woman in a mustard skirt and white blouse with a blush dupatta against a cobalt wall", "Kunal Goswami", "50% 40%"),
  gowns: ph("1756483509254-3cc48a5a15b2", "Two women in embroidered navy and wine indo-western gowns", "iKshana Productions", "50% 35%"),
  navyGown: ph("1610202631408-fa6ba0f39ca3", "A woman in a navy and gold embroidered indo-western gown", "Bulbul Ahmed", "50% 40%"),
  festiveDuo: ph("1713296008556-29c7fae52234", "Two women in black, red and mirror-work festive outfits lounge among diyas", "Ardy Arjun", "50% 45%"),
  squad: ph("1569810020669-aa9d38003ea7", "Five friends in pink, red and coral lehengas twirl together outdoors", "Pranav Kumar Jain", "50% 50%"),
  textiles: ph("1717585679395-bbe39b5fb6bc", "Folded textiles in lime, magenta and red with tassels", "Jainica Dhingra", "50% 50%"),
  silkSaree: ph("1619516388835-2b60acc4049e", "A woman in a coral and magenta silk saree among trees", "Sabesh Photography LTD", "50% 30%"),
  nightBride: ph("1759906760638-eeffcb471e53", "A bride in red at night with fairground lights behind her", "Royal Photography", "50% 35%"),
  lightsBride: ph("1722952908681-944d47e45853", "A bride in red beneath a canopy of fairy lights", "ARTO SURAJ", "50% 30%"),
  stepsBride: ph("1762201698238-bf412e297016", "A bride in an ornate red lehenga on the steps of a white mansion", "Tasnim Chowdhury", "50% 60%"),
  redGold: ph("1610047614301-13c63f00c032", "A woman in a red and gold bridal lehenga with heavy jewellery against a gold backdrop", "Bulbul Ahmed", "50% 25%"),
  palace: ph("1654764746225-e63f5e90facd", "A bride in a red lehenga framed by a scalloped arch", "Harsh Gupta", "50% 30%"),
  redPose: ph("1707576618343-26a1b377ca7a", "A bride in a red lehenga with a long dupatta on a striped courtyard", "Talha Hadi", "50% 40%"),
  redStudio: ph("1677691257005-9d69ab23f485", "A bride in a red embroidered lehenga with chooda bangles", "dras koli", "50% 25%"),
  maroonKurta: ph("1708534246055-d7b149acb731", "A woman in a maroon embroidered kurta seated on grass", "Dhruv vishwakarma", "50% 40%"),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;

const WIDTHS = [480, 720, 960, 1280, 1700];

export function imgUrl(photo: Photo, w: number, q = 72) {
  return `${photo.src}?w=${w}&q=${q}&auto=format&fit=crop`;
}

export function srcSet(photo: Photo, q = 72) {
  return WIDTHS.map((w) => `${imgUrl(photo, w, q)} ${w}w`).join(", ");
}

export const photoCredits = Array.from(new Set(Object.values(photos).map((x) => x.credit))).sort();
