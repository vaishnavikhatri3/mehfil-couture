import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Check,
  Eye,
  Heart,
  Layers,
  MapPin,
  MessageCircle,
  Play,
  RotateCcw,
  Ruler,
  Share2,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Video,
} from "lucide-react";
import { heroProduct } from "../data/productData";
import { openEnquiry } from "../lib/enquiry";
import { openPassport } from "../lib/passportBus";
import { openLens } from "../lib/lensBus";
import { openTrousseau } from "../lib/trousseauBus";
import { toast } from "../lib/toast";
import { track } from "../lib/analytics";
import { usePageMeta } from "../hooks/usePageMeta";
import "./ProductDetail.css";

export default function ProductDetail() {
  const p = heroProduct;
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [orderType, setOrderType] = useState<"sample" | "bespoke">("sample");
  const [activeTab, setActiveTab] = useState<"specs" | "pieces" | "rationale" | "care">("specs");
  const [liked, setLiked] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  usePageMeta(
    `${p.name} (₹25,000) — Mehfil Couture`,
    `${p.tagline} · ${p.corePromise} Handcrafted at Mehfil Couture atelier, South Tukoganj, Indore.`,
  );

  const activeImage = p.gallery[activeImageIdx];

  const handleOrderWhatsApp = () => {
    track("product_whatsapp_click", { sku: p.sku, orderType });
    const message = [
      `Hi Mehfil Couture! I want to order / reserve *${p.name}* (Price: ₹25,000):`,
      `- SKU: ${p.sku}`,
      `- Option: ${orderType === "sample" ? "Ready Studio Sample Piece (Size M / Ships in 48h)" : "Custom Bespoke Made-to-Measure Alterations"}`,
      `- Studio: South Tukoganj, Indore Atelier`,
      "",
      "Could you please guide me through the booking and payment process? Thank you!",
    ].join("\n");
    openEnquiry(message, "product_hero_festive");
  };

  const handleBookVideoCall = () => {
    track("product_video_call_click", { sku: p.sku });
    const message = [
      `Hi Mehfil Couture! I would like to book a *1-on-1 Live Video Consultation* to view *${p.name}* (₹25,000) in real studio lighting from your Indore atelier.`,
      "Please let me know available slots for today or tomorrow. Thank you!",
    ].join("\n");
    openEnquiry(message, "product_video_consult");
  };

  const handleShare = async () => {
    track("product_share_click", { sku: p.sku });
    const shareData = {
      title: `${p.name} · Mehfil Couture`,
      text: `${p.name} (₹25,000) — ${p.tagline} Handcrafted at Mehfil Couture atelier Indore.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copied to clipboard! Share it with family & friends.");
    }
  };

  const handleTryOnLens = () => {
    track("product_tryon_click", { sku: p.sku });
    openLens({
      lehenga: "gold",
      blouse: "sweetheart",
      dupatta: "gold",
      embroidery: "zari",
      jewellery: "choker",
    });
  };

  return (
    <main id="main" className="product-page">
      {/* Editorial Breadcrumbs */}
      <nav className="product-page__nav wrap" aria-label="Breadcrumbs">
        <Link to="/">Home</Link>
        <span className="product-page__nav-sep">/</span>
        <Link to="/#occasions">Festive & Occasion Wear</Link>
        <span className="product-page__nav-sep">/</span>
        <span className="product-page__nav-curr">{p.name}</span>
      </nav>

      <div className="product-page__container wrap">
        {/* Left Column: Studio Gallery & Video Tour */}
        <div className="product-page__visuals">
          <div className="product-gallery">
            {/* Main Stage Image */}
            <div className="product-gallery__main">
              <span className="product-gallery__badge">
                <BadgeCheck size={14} /> Indore Atelier Verified
              </span>
              <img
                src={activeImage.src}
                alt={activeImage.alt}
                className="product-gallery__img"
                loading="eager"
              />
              <div className="product-gallery__caption-bar">
                <span className="product-gallery__view-pill">{activeImage.label}</span>
                <p className="product-gallery__caption-text">{activeImage.caption}</p>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="product-gallery__thumbs" role="tablist" aria-label="Studio Photos">
              {p.gallery.map((img, idx) => (
                <button
                  key={img.src}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeImageIdx}
                  className={`product-gallery__thumb ${idx === activeImageIdx ? "is-active" : ""}`}
                  onClick={() => setActiveImageIdx(idx)}
                >
                  <img src={img.src} alt={img.label} />
                  <span className="product-gallery__thumb-label">{img.label}</span>
                </button>
              ))}
            </div>

            {/* Video Showcase Card */}
            <div className="product-video-card">
              <div className="product-video-card__content">
                <div className="product-video-card__icon">
                  <Play size={20} />
                </div>
                <div>
                  <h4 className="product-video-card__title">Cinematic Studio Video Walkthrough</h4>
                  <p className="product-video-card__desc">
                    Inspect the bottle-green zardozi sweetheart blouse, 4.5m flare movement, and golden organza dupatta under real light.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--ghost product-video-card__btn"
                onClick={() => setShowVideoModal(true)}
              >
                <Video size={15} /> Watch Studio Reel
              </button>
            </div>

            {/* Target Audience: Who is it for? (Direct from PPT) */}
            <div className="product-audience-card">
              <div className="product-audience-card__head">
                <Users size={18} className="product-audience-card__icon" />
                <h4>Designed For (Target Audience)</h4>
                <span className="product-audience-card__age">{p.targetAudience.ageRange}</span>
              </div>
              <ul className="product-audience-card__list">
                {p.targetAudience.profiles.map((prof, i) => (
                  <li key={i}>
                    <Check size={14} className="product-audience-check" />
                    <span>{prof}</span>
                  </li>
                ))}
              </ul>
              <div className="product-audience-card__occasions">
                <span className="label label--gold">Occasions:</span>
                <div className="product-audience-card__chips">
                  {p.targetAudience.occasions.map((occ, i) => (
                    <span key={i} className="chip">{occ}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Purchase & Pricing Card */}
        <div className="product-page__details">
          <div className="product-card">
            {/* Header info */}
            <div className="product-card__header">
              <div className="product-card__tags">
                <span className="product-card__badge label">{p.badge}</span>
                <span className="product-card__sku label">SKU: {p.sku}</span>
              </div>
              <div className="product-card__actions-top">
                <button
                  type="button"
                  className={`product-card__icon-btn ${liked ? "is-liked" : ""}`}
                  onClick={() => {
                    setLiked(!liked);
                    toast(liked ? "Removed from wishlist" : "Saved to your Mehfil wishlist! ❤️");
                  }}
                  title="Save to Wishlist"
                  aria-label="Save to Wishlist"
                >
                  <Heart size={18} fill={liked ? "var(--maroon)" : "none"} />
                </button>
                <button
                  type="button"
                  className="product-card__icon-btn"
                  onClick={handleShare}
                  title="Share Piece"
                  aria-label="Share Piece"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <h1 className="product-card__title">{p.name}</h1>
            <p className="product-card__tagline">
              <em>"{p.tagline}"</em>
            </p>
            <p className="product-card__promise">{p.corePromise}</p>

            {/* Pricing Section (From PPT: The Price of Elegance ₹25,000) */}
            <div className="product-card__price-box">
              <div className="product-card__price-header">
                <span className="label label--gold">Proposed Retail Price</span>
                <span className="product-card__discount-tag">Designer Value · Save ₹13,000</span>
              </div>
              <div className="product-card__price-row">
                <span className="product-card__price">₹{p.price.toLocaleString("en-IN")}</span>
                <span className="product-card__orig-price">₹{p.originalPrice.toLocaleString("en-IN")}</span>
              </div>
              <blockquote className="product-card__quote">
                “Luxury is not just what you wear; it’s how you feel wearing it.”
              </blockquote>
              <p className="product-card__price-note">
                Includes full 3-piece coordinated ensemble, structured cancan flare, custom alterations & insured doorstep delivery.
              </p>
            </div>

            {/* Order Option Switcher */}
            <div className="product-card__options">
              <label className="label">Select Order & Fit Option</label>
              <div className="product-card__option-tabs">
                <button
                  type="button"
                  className={`product-card__opt-tab ${orderType === "sample" ? "is-active" : ""}`}
                  onClick={() => setOrderType("sample")}
                >
                  <span className="product-card__opt-title">Ready Studio Sample (Size M)</span>
                  <span className="product-card__opt-sub">Ships in 48 hours from Indore</span>
                </button>
                <button
                  type="button"
                  className={`product-card__opt-tab ${orderType === "bespoke" ? "is-active" : ""}`}
                  onClick={() => setOrderType("bespoke")}
                >
                  <span className="product-card__opt-title">Custom Bespoke Alterations</span>
                  <span className="product-card__opt-sub">Stitched to your 14 passport measurements</span>
                </button>
              </div>
            </div>

            {/* Primary Action Button: WhatsApp Order */}
            <div className="product-card__cta-stack">
              <button
                type="button"
                className="btn btn--block product-card__buy-btn"
                onClick={handleOrderWhatsApp}
              >
                <MessageCircle size={18} /> Reserve via WhatsApp (₹25,000)
              </button>

              <div className="product-card__secondary-ctas">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleBookVideoCall}
                  title="See the lehenga live on a video call"
                >
                  <Video size={16} /> Book Studio Video Tour
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => openPassport()}
                  title="Enter or view your bespoke measurements"
                >
                  <Ruler size={16} /> Measurement Passport
                </button>
              </div>
            </div>

            {/* Quick Interactive Features for Brides */}
            <div className="product-card__interactive-tray">
              <button
                type="button"
                className="product-card__tray-btn"
                onClick={handleTryOnLens}
              >
                <Eye size={15} />
                <span>Try On in Virtual Lens</span>
              </button>
              <button
                type="button"
                className="product-card__tray-btn"
                onClick={() => openTrousseau()}
              >
                <Sparkles size={15} />
                <span>Pair in Trousseau Planner</span>
              </button>
            </div>

            {/* Atelier Trust Highlights */}
            <div className="product-card__trust-grid">
              <div className="product-card__trust-item">
                <ShieldCheck size={18} className="product-card__trust-icon" />
                <div>
                  <strong>Authentic Indore Craftsmanship</strong>
                  <span>Traditional zardozi, gotapatti & pure silk with modern appeal</span>
                </div>
              </div>
              <div className="product-card__trust-item">
                <Truck size={18} className="product-card__trust-icon" />
                <div>
                  <strong>Insured Express Delivery</strong>
                  <span>Delivered in breathable cotton-muslin storage bag</span>
                </div>
              </div>
              <div className="product-card__trust-item">
                <RotateCcw size={18} className="product-card__trust-icon" />
                <div>
                  <strong>Pre-Dispatch Video Proof</strong>
                  <span>360° video inspection shared before dispatch</span>
                </div>
              </div>
            </div>

            {/* Indore Flagship Location */}
            <div className="product-card__studio-badge">
              <MapPin size={16} className="product-card__studio-pin" />
              <div>
                <strong>Visit Our Flagship Studio:</strong>
                <p>
                  Available for trials & fittings at <em>Mehfil Couture</em>, Samavsharan Apt, South Tukoganj, Indore.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep-Dive Tabs Section */}
      <section className="product-deepdive wrap">
        <div className="product-deepdive__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "specs"}
            className={`product-deepdive__tab ${activeTab === "specs" ? "is-active" : ""}`}
            onClick={() => setActiveTab("specs")}
          >
            What Exactly Are We Selling?
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pieces"}
            className={`product-deepdive__tab ${activeTab === "pieces" ? "is-active" : ""}`}
            onClick={() => setActiveTab("pieces")}
          >
            3-Piece Coordinated Ensemble
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "rationale"}
            className={`product-deepdive__tab ${activeTab === "rationale" ? "is-active" : ""}`}
            onClick={() => setActiveTab("rationale")}
          >
            Pricing Rationale & Value
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "care"}
            className={`product-deepdive__tab ${activeTab === "care" ? "is-active" : ""}`}
            onClick={() => setActiveTab("care")}
          >
            Care & Alterations
          </button>
        </div>

        <div className="product-deepdive__content">
          {activeTab === "specs" && (
            <div className="product-deepdive__pane">
              <div className="product-craft-grid">
                <div>
                  <h3 className="product-deepdive__heading">Traditional Craftsmanship with Contemporary Appeal</h3>
                  <p className="product-deepdive__p">{p.description.intro}</p>
                  <p className="product-deepdive__p">{p.description.artisanStory}</p>
                </div>
                <div className="product-craft-highlights">
                  <div className="product-stat-card">
                    <span className="product-stat-card__num">₹25,000</span>
                    <span className="product-stat-card__lbl">All-Inclusive Retail</span>
                  </div>
                  <div className="product-stat-card">
                    <span className="product-stat-card__num">4.5m</span>
                    <span className="product-stat-card__lbl">Circumference Flare</span>
                  </div>
                  <div className="product-stat-card">
                    <span className="product-stat-card__num">3-Piece</span>
                    <span className="product-stat-card__lbl">Coordinated Set</span>
                  </div>
                  <div className="product-stat-card">
                    <span className="product-stat-card__num">Indore</span>
                    <span className="product-stat-card__lbl">Handcrafted Origin</span>
                  </div>
                </div>
              </div>

              {/* Specifications Table */}
              <div className="product-specs-table" style={{ marginTop: "32px" }}>
                {p.specifications.map((s) => (
                  <div key={s.label} className="product-specs-row">
                    <span className="product-specs-key">{s.label}</span>
                    <span className="product-specs-val">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pieces" && (
            <div className="product-deepdive__pane">
              <div className="product-pieces-grid">
                {p.includedPieces.map((item) => (
                  <div key={item.piece} className="product-piece-card">
                    <div className="product-piece-card__head">
                      <Layers size={18} className="product-piece-card__icon" />
                      <h4>{item.piece}</h4>
                    </div>
                    <dl className="product-piece-card__meta">
                      <div>
                        <dt>Fabric:</dt>
                        <dd>{item.fabric}</dd>
                      </div>
                      <div>
                        <dt>Embroidery & Craft:</dt>
                        <dd>{item.embroidery}</dd>
                      </div>
                      <div>
                        <dt>Design Notes:</dt>
                        <dd>{item.details}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "rationale" && (
            <div className="product-deepdive__pane">
              <h3 className="product-deepdive__heading">{p.pricingRationale.title}</h3>
              <p className="product-deepdive__p">
                At Mehfil Couture, luxury is defined by authenticity and transparent value. Here is why the ₹25,000 proposed retail price delivers unmatched elegance:
              </p>
              <div className="product-rationale-grid">
                {p.pricingRationale.points.map((pt, idx) => (
                  <div key={idx} className="product-rationale-card">
                    <h4>{pt.label}</h4>
                    <p>{pt.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "care" && (
            <div className="product-deepdive__pane">
              <h3 className="product-deepdive__heading">Personalised Fit & Garment Preservation</h3>
              <p className="product-deepdive__p">
                Every piece is tailored to perfection. You can attach your measurements via our 14-Point Digital Measurement Passport, or request minor alterations at our South Tukoganj studio.
              </p>
              <ul className="product-care-list">
                {p.careInstructions.map((tip, idx) => (
                  <li key={idx}>
                    <Check size={16} className="product-care-check" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Video Modal Walkthrough */}
      {showVideoModal && (
        <div className="product-video-modal" role="dialog" aria-modal="true" aria-label="Studio Video Walkthrough">
          <div className="product-video-modal__backdrop" onClick={() => setShowVideoModal(false)} />
          <div className="product-video-modal__box">
            <header className="product-video-modal__head">
              <h3>Mehfil Couture Atelier Reel · {p.name}</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowVideoModal(false)}
              >
                Close ✕
              </button>
            </header>
            <div className="product-video-modal__body">
              <video
                controls
                autoPlay
                playsInline
                className="product-video-modal__player"
                poster="/images/pieces/mayuri/mayuri-front-full.jpg"
              >
                <source src="/videos/festive-statement-walkthrough.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="product-video-modal__note">
                <p>
                  Direct unedited studio video showing real fabric drape, natural light colour tones, and zardozi sparkle at our South Tukoganj studio in Indore.
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowVideoModal(false);
                    handleOrderWhatsApp();
                  }}
                >
                  <MessageCircle size={16} /> Enquire About This Piece (₹25,000)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
