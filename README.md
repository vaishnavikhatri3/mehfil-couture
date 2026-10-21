# Mehfil Couture — website

Editorial, animated website for **Mehfil Couture** — handcrafted bridal, luxury prêt and indo-western occasionwear from a flagship studio in Indore.

React 19 · TypeScript · Vite · GSAP + ScrollTrigger · plain CSS (design tokens in `src/styles/base.css`) · React Router · lucide-react.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build
```

It's a single-page app with real routes (`/journal/:slug`, `/privacy`), so unknown paths must serve `index.html`.

**Deploy to Cloudflare:** `npm run build && npx wrangler deploy` (config in `wrangler.jsonc`, SPA fallback included). `vercel.json` covers Vercel; on other hosts add an equivalent rewrite.

## Configuration

Copy `.env.example` → `.env.local`:

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Live domain (also update `public/robots.txt` + `public/sitemap.xml`) |
| `VITE_WHATSAPP_NUMBER` | Verified WhatsApp Business number, digits with country code. **Empty = every enquiry opens the Instagram DM instead and copies the message to the clipboard.** |
| `VITE_PUBLIC_PHONE`, `VITE_PUBLIC_EMAIL` | Shown in the footer when set |
| `VITE_APPOINTMENT_ENDPOINT` | Optional POST-JSON endpoint (Formspree, a serverless function…). Without it, the form prepares a WhatsApp/Instagram message. |
| `VITE_NEWSLETTER_ENDPOINT` | Optional POST-JSON `{ email, consent }` endpoint (Mailchimp/Brevo/Klaviyo via a function). Without it the form tells visitors nothing was saved. |
| `VITE_ANALYTICS_ENABLED` | `true` only once a consent-aware provider (e.g. GA4 via GTM) is installed. Enables the consent banner; events go to `window.dataLayer` after consent. |

Only public business details belong in `VITE_*` variables — they are bundled into the site.

## Where to edit content

| What | File |
| --- | --- |
| Address, Instagram, hours, verified services, campaign banner, announcement strip | `src/config/brand.ts` |
| Photography (swap Unsplash for real product shots) | `src/data/images.ts` |
| Collections / occasions / journal / FAQ | `src/data/*.ts` |
| Style Studio options + matching rules | `src/data/studio.ts` |
| Atelier Sketchbook options | `src/data/mixmatch.ts` |

Services in `brand.ts` show on the site only when `verified: true`. The campaign `offer` field stays empty unless a real, dated promotion is confirmed.

## What's verified vs. placeholder

**Verified (Instagram @mehfil.couture + its Google Maps link, Oct 2026):** name; bio "Dress your Dream · Handcrafted Bridal | Luxury Pret | Indo-Western"; flagship at Samavsharan Apartment, 16/1-B, South Tukoganj, Indore 452001.

**Still needed from the studio:** WhatsApp/phone/email, opening hours, prices, policies (alterations, shipping, payments, returns), real product photography, customer reviews (with permission), any brand history. No testimonials, prices, offers or founding story appear on the site until they're supplied.

**Photography:** all current images are Unsplash (Unsplash License) editorial inspiration, credited in the footer — not Mehfil Couture products.

## Analytics events

`collection_click`, `enquiry_open`, `appointment_submit`, `studio_complete`, `studio_share`, `newsletter_submit`, `campaign_click`, `look_saved`, `journal_open`, `lens_open`, `lens_photo_added`, `lens_download`, `lens_share` — dispatched as a `mehfil:track` DOM event and, with consent + `VITE_ANALYTICS_ENABLED=true`, pushed to `dataLayer`. No form contents are ever included.

## Try-on lens

The floating **Try-on lens** button (bottom-left on every page, and “Try it on” in the Atelier Sketchbook) lets visitors add a photo and position an illustrated lehenga over it — drag, pinch/scroll to resize, tilt, blend — then save/share the composite or enquire. It is deliberately labelled a *styling overlay*, not a realistic virtual try-on.

Privacy: the photo is read with an object URL and composited on a canvas **entirely in the browser**; nothing is uploaded or stored, and the URL is revoked when the lens closes.

A realistic AI try-on would need a paid virtual try-on API (e.g. FASHN, fal.ai IDM-VTON) called from a server-side Worker so the API key stays secret, plus real Mehfil product photos as the garment input.

## Motion & accessibility notes

- Signature **Lehenga Reveal** is pinned and scroll-scrubbed on desktop (~1.8 screens), a lighter unpinned scrub on phones, and fully static under `prefers-reduced-motion`.
- All scroll reveals live in `src/hooks/useScrollReveal.ts` (GSAP `matchMedia`, cleaned up automatically by `useGSAP`).
- Hover effects are gated behind `(hover: hover) and (pointer: fine)`; buttons give `:active` press feedback; inputs are 16px to avoid iOS zoom.
- Skip link, focus-visible rings, native radio/checkbox controls in the studio tools, accessible accordions and a focus-trapped mobile menu.
