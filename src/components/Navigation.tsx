import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { collections } from "../data/collections";
import { occasions } from "../data/occasions";
import { brand } from "../config/brand";
import { generalEnquiry, enquiryChannel } from "../lib/enquiry";
import { track } from "../lib/analytics";
import { useSectionLink } from "../hooks/useSectionLink";
import { Img } from "./Img";
import { InstagramIcon } from "./Icons";
import "./Navigation.css";

const LEFT = [
  { id: "occasions", label: "Shop by Occasion" },
  { id: "studio", label: "Style Studio" },
];
const RIGHT = [
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
        const f = Array.from(panel.querySelectorAll<HTMLElement>("a,button"));
        const first = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
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

  useEffect(() => {
    if (!mega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMega(false);
        megaBtn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mega]);

  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMega(true);
  };
  const closeMegaSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMega(false), 140);
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
          {LEFT.map((l) => (
            <a key={l.id} href={`/#${l.id}`} className="nav__link" onClick={sectionClick(l.id)}>
              {l.label}
            </a>
          ))}
        </nav>

        <Link to="/" className="nav__mark" aria-label="Mehfil Couture — home" onClick={() => window.scrollTo({ top: 0 })}>
          <span className="nav__mark-main">Mehfil</span>
          <span className="nav__mark-sub">Couture</span>
        </Link>

        <div className="nav__side nav__side--right">
          <nav aria-label="Secondary" className="nav__secondary">
            {RIGHT.map((l) => (
              <a key={l.id} href={`/#${l.id}`} className="nav__link" onClick={sectionClick(l.id)}>
                {l.label}
              </a>
            ))}
            <Link to="/fitcheck" className="nav__link" onClick={() => setMega(false)}>
              Measure Me
            </Link>
          </nav>
          <button type="button" className="nav__cta" onClick={() => generalEnquiry()}>
            <span>Enquire</span>
            <span className="nav__cta-via">via {enquiryChannel()}</span>
          </button>
          <button
            ref={menuBtn}
            type="button"
            className="nav__burger"
            aria-expanded={mobile}
            aria-controls="mobile-menu"
            aria-label={mobile ? "Close menu" : "Open menu"}
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
            <span className="label">Shop by occasion</span>
            <ul>
              {occasions.map((o) => (
                <li key={o.slug}>
                  <a href="/#occasions" onClick={sectionClick("occasions")}>
                    {o.role}
                  </a>
                </li>
              ))}
            </ul>
            <a href="/#studio" className="link-arrow" onClick={sectionClick("studio")}>
              Find your look <ArrowRight />
            </a>
          </div>
        </div>
      </div>

    </header>

      {/* Mobile menu — outside <header> so header transforms/filters can't trap it */}
      <div
        id="mobile-menu"
        className="mmenu"
        data-open={mobile}
        ref={mobilePanel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!mobile}
      >
        <nav className="mmenu__links" aria-label="Mobile">
          {[{ id: "collections", label: "Collections" }, ...LEFT, ...RIGHT, { id: "visit", label: "Visit the Studio" }].map((l, i) => (
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
            Enquire via {enquiryChannel()} <ArrowUpRight />
          </button>
          <div className="mmenu__meta">
            <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="mmenu__ig">
              <InstagramIcon size={16} /> {brand.instagram.handle}
            </a>
            <span className="label">{brand.studio.lines[1]}</span>
          </div>
        </div>
      </div>
    </>
  );
}
