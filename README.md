# Mehfil Couture — website

Editorial, animated website for **Mehfil Couture** — handcrafted bridal, luxury prêt and indo-western occasionwear from a flagship studio in Indore.

React 19 · TypeScript · Vite · GSAP + ScrollTrigger · plain CSS (design tokens in `src/styles/base.css`) · React Router · lucide-react.

## Run it

```bash
npm install
npm run dev        # site + API on http://localhost:5173 (data in data/mehfil.db)
npm run build      # type-check + production build → dist/
npm start          # production: dist/ + API on one port (PORT, default 8080)
```

Requires **Node 22.13+** (the API uses Node's built-in SQLite — no database to install). Put `ADMIN_PASSCODE` in `.env.local` for `npm run dev`; for `npm start` set it as an environment variable.

As a Single-Page Application (SPA) handling dynamic client-side routing (`/journal/:slug`, `/privacy`), all fallback and unmapped server paths must rewrite upstream to `index.html` to allow React Router to gracefully resolve deep links.

### What's in it

| Route | What it is |
| --- | --- |
| `/` | The Mehfil Couture editorial site |
| `/fitcheck` | **Mehfil FitCheck** — remote measurement validator & tailoring spec engine (Problem Statement) |
| `/p/:code` | **QR digital passport** — what a customer sees after scanning a tag |
| `/order/:id` | Customer order timeline (also the save / resume link) |
| `/admin` | **Studio portal** — dashboard, designs, QR generator (lots), pieces, scan tags, leads, FitCheck orders, size charts |

**Studio portal passcode:** `mehfil-admin-2026` by default — set `ADMIN_PASSCODE` before going live.

#### FitCheck (problem-statement modules)
1. **Core validation & spec** — `src/lib/fitcheck/validate.ts`: missing fields → hard human limits → inch/cm detection (per field and whole form) → typo & decimal-slip detection → anatomical ratio rules (e.g. waist vs hip, under-bust vs bust, shoulder vs bust) → size-chart benchmark → 0–100 confidence, green / yellow / red. Red blocks the spec; yellow can be confirmed. `tailoring.ts` adds ease + seam allowances and checks delivery feasibility (embroidery + stitching + finishing + shipping vs event date).
2. **Garment dimension inference** — `garment.ts`: body = flat width × 2 − garment ease + fabric stretch (blouse / kurti / dress; cotton … knit).
3. **Visual measurement helper** — `components/fitcheck/MeasureGuide.tsx`: animated SVG body & flat-garment guides with tips per measurement.
4. **Public size chart ingestion** — Studio portal → Size charts: paste a CSV / table (Indian, UK, US; cm or in, ranges OK) → used as the benchmark baseline.
5. **OCR handwritten card parser** — **PaddleOCR** (pretrained, in `ml/card_ocr.py`) reads the card on the server; the photo is downscaled in the browser, read in memory and never stored. If the ML service is down, Tesseract.js reads it in the browser instead. Either way `ocr.ts` maps the text with a Hinglish tailor dictionary and fuzzy matching (chhati, kamar, teera, baazu, lambai…), then a review screen. Try it with “Try a sample card”.
6. **Measurement anomaly detection (ML)** — `ml/anomaly.py`: a scikit-learn **Isolation Forest** looks at bust, under-bust, waist, hip, shoulder, armhole, waist-to-floor and height *together* and flags sets where each value is plausible alone but the combination isn't one body. It names the field that stands out most and the range expected from the others. It runs after the rule engine (layer 6 in `validate.ts`), only on values inside the hard limits, and only ever raises a yellow “please check”. Training data: a synthetic population (`ml/population.py`, tuned to the `typical` ranges in `fields.ts` — replace with real data when you have it) plus every **green** order in `data/mehfil.db`, reloaded each time the service starts.

**Which part is ML:** the Isolation Forest is a trained model; PaddleOCR is a pretrained model used as-is; `validate.ts` (hard limits, unit and typo detection, ratios, size chart) is a deterministic rule engine.

**Running the ML service** (optional — the site works without it). Python 3.10–3.12:

```bash
python -m venv D:/mehfil-ml/venv                     # anywhere with ~3 GB free; keep it out of OneDrive
D:/mehfil-ml/venv/Scripts/python -m pip install -r ml/requirements.txt     # macOS / Linux: <venv>/bin/python
cd ml
PADDLE_PDX_CACHE_HOME=D:/mehfil-ml/models D:/mehfil-ml/venv/Scripts/python -m uvicorn app:app --port 8001
```

`PADDLE_PDX_CACHE_HOME` is where PaddleOCR keeps its downloaded models (default: `~/.paddlex` on the system drive).

The Node API proxies `/api/fitcheck/anomaly` and `/api/fitcheck/ocr` to `ML_SERVICE_URL` (default `http://127.0.0.1:8001`). The first card read downloads PaddleOCR's models (~100 MB) and takes longer.

Crisis-brief adaptations: garment fast path, transparent order timeline (confirmed → stylist review → tailor review → production → ready → delivered), stylist-assisted review request, and save & resume (draft autosaves on the device; the order link resumes tracking).

#### QR system
- **Designs** hold what the passport shows: embroidery story, fabric, care, colours, sizes, occasions.
- **QR generator → lots**: pick a design, add colour × size × quantity lines; each piece gets a unique code (`MC-LP-014-4F2A9C`) stored as *in stock*, and a QR that opens `<site>/p/<code>`. Print labels as an A4 sheet, 50 × 70 mm hang tags or 50 × 25 mm stickers (print at 100%), or export a CSV for a label printer. A lot with sold pieces can't be deleted.
- **Pieces**: every tagged piece with status (in stock / reserved / sold / retired), scans, distinct phones, last scan and leads. Filter, search, bulk-change status, print selected labels, export CSV. Each piece opens a drawer with its QR, a studio note and full history (created → reserved → sold → returned, plus every scan).
- **Scan tags**: the portal's own scanner — phone camera (native `BarcodeDetector`, or jsQR on iPhone), a photo of a tag, or a USB/Bluetooth scanner typing into the code box. Modes: look up, mark sold (counter), mark reserved, back in stock, and **stock check** (scan the rack; it lists in-stock pieces not found and tags that are on the rack but marked sold). Portal scans are not counted as customer scans. The live camera needs https or localhost; the photo option works anywhere.
- **Authenticity**: the passport tells the customer the tag is a **genuine** Mehfil piece, shows the studio's sale date once sold, and warns when a tag has been **retired** (damaged / lost / replaced). The portal flags a sold tag scanned on more than 6 phones in 30 days (possibly copied) and a retired tag that's still being scanned. Phones are counted with a random id the passport keeps in the browser — not linked to anyone.
- **Passport**: story, fabric, live colour × size availability, then the **5 details** — preferences, mobile, size, location (GPS with permission *or* typed), colours — saved **only** with an unticked-by-default consent box (text + time stored). Owners of sold pieces also get care instructions and an alterations / care enquiry button.
- **Leads**: filter, export CSV, **Send picks** (opens WhatsApp Business with recommendations matched on colour, occasion and size — you press send), mark contacted, delete on request.
- **Dashboard**: tags that need a look; QR tags (tagged, % scanned, stock split, most-scanned pieces); scans, leads, scan → lead %, stock, orders; 14-day scans vs leads; colour, size, occasion and location breakdowns; designs by interest. “Load sample leads” adds DEMO-flagged rows for presentations and removes them in one click.

**Deploying with the API:** the API needs a Node host (Render, Railway, a VPS…): `npm run build && npm start`, with a persistent disk for `data/`. A static-only host (Cloudflare Pages / Workers assets) serves the website but not `/fitcheck` saving, passports or the portal. Run the ML service alongside it on the same machine (or set `ML_SERVICE_URL`); it needs ~2 GB RAM for PaddleOCR.

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

A realistic AI try-on woul
d need a paid virtual try-on API (e.g. FASHN, fal.ai IDM-VTON) called from a server-side Worker so the API key stays secret, plus real Mehfil product photos as the garment input.

## Motion & accessibility notes

- Signature **Lehenga Reveal** is pinned and scroll-scrubbed on desktop (~1.8 screens), a lighter unpinned scrub on phones, and fully static under `prefers-reduced-motion`.
- All scroll reveals live in `src/hooks/useScrollReveal.ts` (GSAP `matchMedia`, cleaned up automatically by `useGSAP`).
- Hover effects are gated behind `(hover: hover) and (pointer: fine)`; buttons give `:active` press feedback; inputs are 16px to avoid iOS zoom.
- Skip link, focus-visible rings, native radio/checkbox controls in the studio tools, accessible accordions and a focus-trapped mobile menu.
