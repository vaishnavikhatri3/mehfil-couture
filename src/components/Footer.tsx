import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { brand } from "../config/brand";
import { collectionNames } from "../data/collections";
import { photoCredits } from "../data/images";
import { generalEnquiry, enquiryChannel } from "../lib/enquiry";
import { useSectionLink } from "../hooks/useSectionLink";
import { NewsletterForm } from "./NewsletterForm";
import { InstagramIcon, Motif } from "./Icons";
import "./Footer.css";

export function Footer() {
  const go = useSectionLink();
  const [credits, setCredits] = useState(false);
  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    document.querySelector<HTMLElement>(".nav__mark")?.focus({ preventScroll: true });
  };

  return (
    <footer className="foot">
      <div className="wrap">
        <NewsletterForm />

        <div className="foot__closing">
          <Motif size={90} className="foot__motif" />
          <p className="foot__line">
            Your next unforgettable outfit <em>starts here.</em>
          </p>
          <button type="button" className="btn btn--light" onClick={() => generalEnquiry()}>
            Enquire via {enquiryChannel()} <ArrowUpRight />
          </button>
        </div>

        <div className="foot__cols">
          <div className="foot__col">
            <p className="label">Collections</p>
            <ul>
              {collectionNames.map((c) => (
                <li key={c}>
                  <a href="/#collections" onClick={go("collections")}>
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot__col">
            <p className="label">Explore</p>
            <ul>
              <li>
                <a href="/#occasions" onClick={go("occasions")}>
                  Shop by Occasion
                </a>
              </li>
              <li>
                <a href="/#studio" onClick={go("studio")}>
                  Style Studio
                </a>
              </li>
              <li>
                <a href="/#sketchbook" onClick={go("sketchbook")}>
                  Atelier Sketchbook
                </a>
              </li>
              <li>
                <a href="/#journal" onClick={go("journal")}>
                  The Mehfil Edit
                </a>
              </li>
              <li>
                <a href="/#story" onClick={go("story")}>
                  Our Story
                </a>
              </li>
            </ul>
          </div>
          <div className="foot__col">
            <p className="label">Visit</p>
            <address>
              {brand.studio.lines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </address>
            <ul>
              <li>
                <a href={brand.studio.mapUrl} target="_blank" rel="noopener noreferrer">
                  Get directions ↗
                </a>
              </li>
              <li>
                <a href="/#appointment" onClick={go("appointment")}>
                  Book an appointment
                </a>
              </li>
              {brand.phone && (
                <li>
                  <a href={`tel:${brand.phone.replace(/\s/g, "")}`}>{brand.phone}</a>
                </li>
              )}
              {brand.email && (
                <li>
                  <a href={`mailto:${brand.email}`}>{brand.email}</a>
                </li>
              )}
            </ul>
          </div>
          <div className="foot__col">
            <p className="label">Follow</p>
            <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="foot__ig">
              <InstagramIcon size={18} /> {brand.instagram.handle}
            </a>
          </div>
        </div>

        <div className="foot__base">
          <span className="label">
            © {new Date().getFullYear()} {brand.name} · {brand.tagline}
          </span>
          <div className="foot__legal">
            <Link to="/privacy">Privacy &amp; terms</Link>
            <button type="button" onClick={() => setCredits((c) => !c)} aria-expanded={credits} aria-controls="photo-credits">
              Photo credits
            </button>
            <button type="button" className="foot__top" onClick={toTop}>
              Back to top <ArrowUp size={14} />
            </button>
          </div>
        </div>
        <p id="photo-credits" className="foot__credits" hidden={!credits}>
          Editorial photography via Unsplash (Unsplash License) — used as inspiration, not Mehfil Couture products:{" "}
          {photoCredits.join(", ")}.
        </p>

        <p className="foot__wordmark" aria-hidden="true">
          Mehfil
        </p>
      </div>
    </footer>
  );
}
