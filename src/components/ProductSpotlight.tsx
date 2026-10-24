import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, MessageCircle, Ruler, Sparkles } from "lucide-react";
import { heroProduct } from "../data/productData";
import { openEnquiry } from "../lib/enquiry";
import { openPassport } from "../lib/passportBus";
import "./ProductSpotlight.css";

export function ProductSpotlight() {
  const p = heroProduct;

  const handleQuickWhatsApp = () => {
    const message = [
      `Hi Mehfil Couture! I saw *${p.name}* (₹25,000) on your website.`,
      "Is the studio sample available for trial / purchase?",
    ].join("\n");
    openEnquiry(message, "homepage_spotlight");
  };

  return (
    <section className="spotlight wrap" id="hero-piece" aria-labelledby="spotlight-title">
      <div className="spotlight__card">
        {/* Visual Frame */}
        <div className="spotlight__media">
          <Link to="/product/festive-statement-lehenga" className="spotlight__img-link">
            <img
              src="/images/pieces/mayuri/mayuri-front-full.jpg"
              alt="The Festive Statement Lehenga on display at Mehfil Couture Indore"
              className="spotlight__img"
              loading="lazy"
            />
            <span className="spotlight__badge">
              <BadgeCheck size={14} /> Mehfil Hero Product
            </span>
            <div className="spotlight__media-hover">
              <span>View Full Look & Studio Walkthrough <ArrowRight size={14} /></span>
            </div>
          </Link>
          <div className="spotlight__thumbs">
            {p.gallery.slice(1, 4).map((g) => (
              <Link to="/product/festive-statement-lehenga" key={g.src} className="spotlight__thumb">
                <img src={g.src} alt={g.label} />
                <span>{g.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Story & Purchase Details */}
        <div className="spotlight__content">
          <div className="spotlight__tag-row">
            <span className="label label--gold">Our Hero Product</span>
            <span className="spotlight__location">📍 South Tukoganj, Indore</span>
          </div>

          <h2 id="spotlight-title" className="spotlight__title">
            The Festive <em>Statement</em> Lehenga
          </h2>

          <p className="spotlight__quote">
            “Own the moment. Wear the magic.”
          </p>

          <p className="spotlight__tagline">
            Traditional craftsmanship with contemporary appeal. Rich festive colour palette, coordinated bottle-green zardozi sweetheart blouse, flared multi-hued lehenga & scalloped organza dupatta.
          </p>

          <div className="spotlight__features-list">
            <div className="spotlight__feature">
              <strong>₹25,000</strong>
              <span>All-inclusive with bespoke custom fit</span>
            </div>
            <div className="spotlight__feature">
              <strong>4.5m Flare</strong>
              <span>Dual-layer structured cancan ghera</span>
            </div>
            <div className="spotlight__feature">
              <strong>Ready to Ship</strong>
              <span>1 Studio Sample (Size M) or Bespoke</span>
            </div>
          </div>

          <div className="spotlight__actions">
            <Link to="/product/festive-statement-lehenga" className="btn btn--block spotlight__btn-main">
              Explore Full Product & Order (₹25k) <ArrowRight size={16} />
            </Link>

            <div className="spotlight__btn-row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleQuickWhatsApp}
              >
                <MessageCircle size={16} /> Quick WhatsApp Order
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => openPassport()}
              >
                <Ruler size={16} /> Measurement Passport
              </button>
            </div>
          </div>

          <div className="spotlight__guarantee">
            <Sparkles size={14} className="spotlight__guarantee-icon" />
            <span>
              Real studio piece on display at our Indore atelier. Insured doorstep delivery across India and worldwide.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
