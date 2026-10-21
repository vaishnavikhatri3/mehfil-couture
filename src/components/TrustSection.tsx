import { useId, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { brand, services } from "../config/brand";
import { faqs } from "../data/faq";
import { AppointmentForm } from "./AppointmentForm";
import { InstagramIcon } from "./Icons";
import "./TrustSection.css";

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();
  return (
    <div className="faq">
      <h3 className="label faq__label">Questions, answered</h3>
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className={`faq__item ${isOpen ? "is-open" : ""}`}>
            <h4 className="faq__q">
              <button
                type="button"
                id={`${uid}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-a${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{f.q}</span>
                <span className="faq__icon" aria-hidden="true" />
              </button>
            </h4>
            <div className="faq__a" id={`${uid}-a${i}`} role="region" aria-labelledby={`${uid}-q${i}`} hidden={!isOpen}>
              <p>{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrustSection() {
  const verified = services.filter((s) => s.verified);
  return (
    <section id="visit" className="trust" aria-labelledby="trust-title">
      <div className="wrap trust__grid">
        <div className="trust__info">
          <p className="label label-row" data-reveal>
            Visit the flagship
          </p>
          <h2 id="trust-title" className="h2" data-reveal>
            Some things you <em>have to</em> see in person.
          </h2>

          <div className="trust__visit" data-reveal>
            <MapPin size={20} strokeWidth={1.4} className="trust__pin" />
            <address>
              <strong>{brand.studio.label}</strong>
              {brand.studio.lines.map((l) => (
                <span key={l}>{l}</span>
              ))}
              {brand.studio.hours && <span className="trust__hours">{brand.studio.hours}</span>}
            </address>
            <div className="trust__links">
              <a href={brand.studio.mapUrl} target="_blank" rel="noopener noreferrer" className="link-arrow">
                Get directions <ArrowUpRight />
              </a>
              <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="link-arrow">
                <InstagramIcon size={15} /> {brand.instagram.handle}
              </a>
            </div>
          </div>

          <ul className="trust__services">
            {verified.map((s) => (
              <li key={s.key} data-reveal>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ul>

          <Faq />
        </div>

        <div className="trust__form" id="appointment">
          <AppointmentForm />
        </div>
      </div>
    </section>
  );
}
