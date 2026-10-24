import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Menu, Sparkles, X } from "lucide-react";
import { collections } from "../data/collections";
import { brand } from "../config/brand";
import { generalEnquiry, enquiryChannel } from "../lib/enquiry";
import { track } from "../lib/analytics";
import { useSectionLink } from "../hooks/useSectionLink";
import { openPassport } from "../lib/passportBus";
import { openTrousseau } from "../lib/trousseauBus";
import { Img } from "./Img";
import { InstagramIcon } from "./Icons";
import "./Navigation.css";

const LEFT: { id: string; label: string; isTrousseau?: boolean; to?: string }[] = [
  { id: "hero-product", label: "Hero Piece · ₹25k", to: "/product/festive-statement-lehenga" },
  { id: "occasions", label: "Shop by Occasion" },
  { id: "trousseau", label: "Trousseau", isTrousseau: true },
  { id: "studio", label: "Style Studio" },
];
const RIGHT: { id: string; label: string; isPassport?: boolean }[] = [
  { id: "passport", label: "Bespoke Passport", isPassport: true },
  { id: "story", label: "Our Story" },
  { id: "journal", label: "The Mehfil Edit" },
];

export function Navigation() {
  const go = useSectionLink();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const megaBtn = useRef<HTMLButtonElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const mobilePanel = useRef<HTMLDivElement>(null);

  // Hide on scroll down, reveal on scroll up — never covers what you're reading.
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        if (Math.abs(y - last) > 6) {
          setHidden(y > last && y > 400);
          last = y;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (hidden) setMega(false);
  }, [hidden]);

  // Mobile menu: lock scroll, Esc to close, focus management, simple focus trap
  useEffect(() => {
    if (!mobile) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const panel = mobilePanel.current;
    panel?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
      if (e.key === "Tab" && panel) {
        const f = Array.from(panel.querySelectorAll<HTMLElement>("a,button")).filter(
          (el) => el.offsetParent !== null,
        );
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      menuBtn.current?.focus({ preventScroll: true });
    };
  }, [mobile]);

  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMega(true);
  };
  const closeMegaSoon = () => {
    closeTimer.current = window.setTimeout(() => setMega(false), 240);
  };

  const sectionClick = (id: string) => (e: React.MouseEvent) => {
    setMega(false);
    setMobile(false);
    go(id)(e);
  };

  return (
    <>
    <header className={`nav ${hidden && !mobile ? "is-hidden" : ""} ${scrolled ? "is-scrolled" : ""} ${mega ? "is-mega" : ""}`} data-hero="nav">
      <div className="nav__bar wrap">
        <nav className="nav__side nav__side--left" aria-label="Primary">
          <div className="nav__mega-trigger" onMouseEnter={openMega} onMouseLeave={closeMegaSoon}>
            <button
              ref={megaBtn}
              type="button"
              className="nav__link"
              aria-expanded={mega}
              aria-controls="mega-menu"
              onClick={() => setMega((m) => !m)}
            >
              Collections
              <span className="nav__caret" aria-hidden="true" />
            </button>
          </div>
          {LEFT.map((l) =>
            l.to ? (
              <Link
                key={l.id}
                to={l.to}
                className="nav__link nav__link--hero"
                onClick={() => setMega(false)}
              >
                <Sparkles size={13} className="nav__hero-sparkle" />
                <span>{l.label}</span>
              </Link>
            ) : l.isTrousseau ? (
              <button
                key={l.id}
                type="button"
                className="nav__link nav__link--btn"
                onClick={() => openTrousseau()}
              >
                {l.label}
              </button>
            ) : (
              <a key={l.id} href={`/#${l.id}`} className="nav__link" onClick={sectionClick(l.id)}>
                {l.label}
              </a>
            ),
          )}
        </nav>

        <Link to="/" className="nav__mark" aria-label="Mehfil Couture — home" onClick={() => window.scrollTo({ top: 0 })}>
          <span className="nav__mark-main">Mehfil</span>
          <span className="nav__mark-sub">Couture</span>
        </Link>

        <div className="nav__side nav__side--right">
          <nav aria-label="Secondary" className="nav__secondary">
            {RIGHT.map((l) =>
              l.isPassport ? (
                <button
                  key={l.id}
                  type="button"
                  className="nav__link nav__link--btn"
                  onClick={() => openPassport()}
                >
                  {l.label}
                </button>
              ) : (
                <a key={l.id} href={`/#${l.id}`} className="nav__link" onClick={sectionClick(l.id)}>
                  {l.label}
                </a>
              ),
            )}
            <Link to="/fitcheck" className="nav__link" onClick={() => setMega(false)}>
              Measure Me
            </Link>
          </nav>
          <button type="button" className="nav__cta" onClick={() => generalEnquiry()}>
            <span>Enquire</span>
          </button>
          <button
            ref={menuBtn}
            type="button"
            className="nav__burger"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            aria-controls="mobile-menu"
            onClick={() => setMobile((m) => !m)}
          >
            {mobile ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mega menu */}
      <div
        id="mega-menu"
        className="mega"
        data-open={mega}
        onMouseEnter={openMega}
        onMouseLeave={closeMegaSoon}
        inert={!mega}
      >
        <div className="mega__inner wrap">
          <div className="mega__cols">
            {collections.map((c, i) => (
              <a
                key={c.slug}
                href="/#collections"
                className="mega__col"
                style={{ transitionDelay: mega ? `${60 + i * 50}ms` : "0ms" }}
                onClick={(e) => {
                  track("collection_click", { collection: c.slug, source: "mega_menu" });
                  sectionClick("collections")(e);
                }}
              >
                <div className="mega__img frame">
                  <Img photo={c.image} zoomScale={1.6} sizes="(min-width: 1100px) 22vw, 30vw" />
                </div>
                <span className="label">No. {c.no} — {c.label}</span>
                <span className="mega__title">
                  {c.name}
                  {c.name.endsWith("-") ? "" : " "}
                  <em>{c.accent}</em>
                </span>
                <span className="mega__desc">{c.description}</span>
                <span className="mega__go">
                  Explore <ArrowRight size={14} />
                </span>
              </a>
            ))}
          </div>
          <div className="mega__aside">
            <span className="label">Atelier</span>
            <p className="mega__aside-p">
              Every piece begins with a conversation in our Indore studio. We shape silhouette, fabric and embroidery to the ceremony.
            </p>
            <div className="mega__aside-links">
              <Link to="/product/festive-statement-lehenga" className="mega__aside-link" onClick={() => setMega(false)}>
                Hero Piece: Festive Statement Lehenga (₹25k) <ArrowRight size={13} />
              </Link>
              <button
                type="button"
                className="mega__aside-link"
                onClick={() => {
                  setMega(false);
                  openTrousseau();
                }}
              >
                Plan your trousseau <ArrowRight size={13} />
              </button>
              <a href="/#studio" className="mega__aside-link" onClick={sectionClick("studio")}>
                Explore the Style Studio <ArrowRight size={13} />
              </a>
              <button
                type="button"
                className="mega__aside-link"
                onClick={() => {
                  setMega(false);
                  openPassport();
                }}
              >
                Bespoke Measurement Passport <ArrowRight size={13} />
              </button>
            </div>
            <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="mega__social">
              <InstagramIcon size={14} />
              <span>{brand.instagram.handle}</span>
              <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile drawer */}
    {mobile && (
      <div
        id="mobile-menu"
        ref={mobilePanel}
        className="mmenu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <nav className="mmenu__links" aria-label="Mobile">
          <Link
            to="/product/festive-statement-lehenga"
            className="mmenu__passport-btn"
            style={{ background: "var(--maroon)", color: "var(--paper)", borderColor: "var(--maroon)" }}
            onClick={() => setMobile(false)}
          >
            <span className="mmenu__no">✨</span>
            <span>Hero Piece · Festive Lehenga (₹25k)</span>
          </Link>

          <button
            type="button"
            className="mmenu__passport-btn"
            onClick={() => {
              setMobile(false);
              openTrousseau();
            }}
          >
            <span className="mmenu__no">👑</span>
            <span>Trousseau Concierge</span>
          </button>

          <button
            type="button"
            className="mmenu__passport-btn"
            onClick={() => {
              setMobile(false);
              openPassport();
            }}
          >
            <span className="mmenu__no">✦</span>
            <span>Bespoke Measurement Passport</span>
          </button>

          {[{ id: "collections", label: "Collections" }, ...LEFT.filter((l) => !l.isTrousseau && !l.to), ...RIGHT.filter((r) => !r.isPassport), { id: "visit", label: "Visit the Studio" }].map((l, i) => (
            <a
              key={l.id}
              href={`/#${l.id}`}
              onClick={sectionClick(l.id)}
              style={{ transitionDelay: mobile ? `${80 + i * 45}ms` : "0ms" }}
            >
              <span className="mmenu__no">0{i + 1}</span>
              {l.label}
            </a>
          ))}
          <Link to="/fitcheck" onClick={() => setMobile(false)} style={{ transitionDelay: mobile ? "450ms" : "0ms" }}>
            <span className="mmenu__no">08</span>
            Measure Me
          </Link>
        </nav>
        <div className="mmenu__foot">
          <button
            type="button"
            className="btn btn--light btn--block"
            onClick={() => {
              setMobile(false);
              generalEnquiry();
            }}
          >
            Enquire via {enquiryChannel()} <ArrowRight size={14} />
          </button>
          <p className="mmenu__meta">
            {brand.studio.lines.join(" · ")}
          </p>
        </div>
      </div>
    )}
    </>
  );
}
