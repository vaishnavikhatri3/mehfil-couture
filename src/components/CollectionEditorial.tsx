import { ArrowRight, ArrowUpRight } from "lucide-react";
import { collections } from "../data/collections";
import { photos } from "../data/images";
import { brand } from "../config/brand";
import { openEnquiry } from "../lib/enquiry";
import { track } from "../lib/analytics";
import { Img } from "./Img";
import { Motif } from "./Icons";
import "./CollectionEditorial.css";

export function CollectionEditorial() {
  const enquire = (name: string, slug: string) => () => {
    track("collection_click", { collection: slug, source: "collections" });
    openEnquiry(
      `Hi Mehfil Couture! I'd love to know more about your ${name} collection — what's currently in the studio?`,
      `collection_${slug}`,
    );
  };

  return (
    <section id="collections" className="cols" aria-labelledby="cols-title">
      <div className="wrap">
        <header className="cols__head">
          <p className="label label-row" data-reveal>
            The collections · Nº 01 — 03
          </p>
          <h2 id="cols-title" className="h2" data-reveal>
            Three ways
            <br /> to <em>arrive.</em>
          </h2>
          <p className="lede cols__lede" data-reveal>
            Everything we make begins with a celebration in mind — the people in the room, the light, the moment someone says
            your name. Choose your entrance.
          </p>
        </header>

        {collections.map((c, i) => {
          const fullName = `${c.name}${c.name.endsWith("-") ? "" : " "}${c.accent}`;
          return (
            <article key={c.slug} className={`col col--${i + 1}`} aria-labelledby={`col-${c.slug}`}>
              <div className="col__media">
                <div className="col__main frame" data-clip>
                  <Img photo={c.image} sizes={i === 1 ? "(min-width: 900px) 52vw, 100vw" : "(min-width: 900px) 46vw, 100vw"} />
                  <span className="col__tag label">Nº {c.no}</span>
                </div>
                <div className="col__detail frame" data-clip data-speed="1.2">
                  <Img photo={c.detail} sizes="(min-width: 900px) 18vw, 40vw" />
                </div>
              </div>

              <div className="col__text">
                <span className="col__num" aria-hidden="true" data-speed="0.6">
                  {c.no}
                </span>
                <p className="label label--gold" data-reveal>
                  {c.label}
                </p>
                <h3 id={`col-${c.slug}`} className="col__title" data-reveal>
                  {c.name}
                  {c.name.endsWith("-") ? "" : " "}
                  <em>{c.accent}</em>
                </h3>
                <p className="col__desc" data-reveal>
                  {c.description}
                </p>
                <div className="col__actions" data-reveal>
                  <button type="button" className="btn btn--ghost" onClick={enquire(fullName, c.slug)}>
                    Enquire about {fullName} <ArrowRight />
                  </button>
                  <a
                    className="link-arrow"
                    href={brand.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("collection_click", { collection: c.slug, source: "instagram_link" })}
                  >
                    See new pieces <ArrowUpRight />
                  </a>
                </div>
              </div>
            </article>
          );
        })}

        <aside className="craft" aria-label="Handcrafted">
          <div className="craft__img frame" data-clip>
            <Img photo={photos.zariWide} sizes="(min-width: 900px) 40vw, 100vw" />
          </div>
          <div className="craft__text">
            <Motif size={64} className="craft__motif" />
            <p className="craft__quote" data-reveal>
              Every collection begins the same way — <em>by hand,</em> one stitch at a time.
            </p>
            <p className="note" data-reveal>
              Photography on this page is editorial inspiration. For the pieces in the studio right now, follow{" "}
              <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="u">
                {brand.instagram.handle}
              </a>{" "}
              or visit the flagship.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
