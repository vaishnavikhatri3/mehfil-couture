import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { occasions } from "../data/occasions";
import { openEnquiry } from "../lib/enquiry";
import { track } from "../lib/analytics";
import { presetStudio } from "../lib/studioBus";
import { useSectionLink } from "../hooks/useSectionLink";
import { Img } from "./Img";
import "./OccasionExplorer.css";

export function OccasionExplorer() {
  const [active, setActive] = useState(0);
  const go = useSectionLink();

  return (
    <section id="occasions" className="occ" aria-labelledby="occ-title">
      <div className="wrap occ__wrap">
        <header className="occ__head">
          <p className="label label-row" data-reveal>
            Shop by occasion
          </p>
          <h2 id="occ-title" className="h2" data-reveal>
            Who are you
            <br /> <em>tonight?</em>
          </h2>
          <div className="occ__poem" data-reveal>
            <p>
              Here for the bride? <em>Make an entrance.</em>
            </p>
            <p>
              Here for your bestie? <em>Steal the spotlight.</em>
            </p>
            <p>
              Here for yourself? <em>Always the right reason.</em>
            </p>
          </div>
        </header>

        <div className="occ__body">
          <ol className="occ__list">
            {occasions.map((o, i) => {
              const open = i === active;
              return (
                <li key={o.slug} className={`occ__item ${open ? "is-open" : ""}`} data-reveal>
                  <button
                    type="button"
                    className="occ__trigger"
                    aria-expanded={open}
                    aria-controls={`occ-panel-${o.slug}`}
                    onClick={() => setActive(i)}
                  >
                    <span className="occ__no label">0{i + 1}</span>
                    <span className="occ__role">{o.role}</span>
                    <span className="occ__plus" aria-hidden="true" />
                  </button>
                  <div className="occ__panel" id={`occ-panel-${o.slug}`} role="region" aria-label={o.role}>
                    <div className="occ__panel-inner">
                      <div className="occ__mobile-img frame">
                        <Img photo={o.image} sizes="90vw" />
                      </div>
                      <p className="occ__hook">{o.hook}</p>
                      <p className="occ__copy">{o.copy}</p>
                      <div className="occ__actions">
                        <a
                          href="#studio"
                          className="link-arrow"
                          onClick={(e) => {
                            track("collection_click", { occasion: o.slug, source: "occasion_style" });
                            presetStudio({ occasion: o.studio });
                            go("studio")(e);
                          }}
                        >
                          Style this occasion <ArrowRight />
                        </a>
                        <button
                          type="button"
                          className="link-arrow occ__ask"
                          onClick={() =>
                            openEnquiry(
                              `Hi Mehfil Couture! I'm dressing as ${o.role.toLowerCase()} for an upcoming celebration. Could you suggest something from your ${o.collection} pieces?`,
                              `occasion_${o.slug}`,
                            )
                          }
                        >
                          Ask about {o.collection} <ArrowRight />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="occ__visual" aria-hidden="true">
            <div className="occ__stack frame">
              {occasions.map((o, i) => (
                <div key={o.slug} className={`occ__slide ${i === active ? "is-active" : ""}`}>
                  <Img photo={o.image} sizes="(min-width: 900px) 40vw, 1px" />
                </div>
              ))}
            </div>
            <p className="occ__caption caption">
              <span className="label">0{active + 1} / 0{occasions.length}</span> {occasions[active].hook}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
