import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { articles, readingMinutes } from "../data/journal";
import { track } from "../lib/analytics";
import { Img } from "./Img";
import "./FashionJournal.css";

export function FashionJournal() {
  const [feature, ...rest] = articles;
  return (
    <section id="journal" className="jr" aria-labelledby="jr-title">
      <div className="wrap">
        <header className="jr__head">
          <p className="label label-row" data-reveal>
            The Mehfil Edit · Journal
          </p>
          <h2 id="jr-title" className="h2" data-reveal>
            Notes on dressing <em>for the moment.</em>
          </h2>
        </header>

        <div className="jr__grid">
          <Link
            to={`/journal/${feature.slug}`}
            className="jr__feature"
            onClick={() => track("journal_open", { slug: feature.slug })}
          >
            <div className="jr__feature-img frame" data-clip>
              <Img photo={feature.image} sizes="(min-width: 900px) 56vw, 100vw" />
            </div>
            <div className="jr__feature-text">
              <span className="label label--gold">
                {feature.kicker} · {readingMinutes(feature)} min read
              </span>
              <h3 className="jr__feature-title">
                {feature.title} <em>{feature.accent}</em>
              </h3>
              <p className="jr__dek">{feature.dek}</p>
              <span className="link-arrow">
                Read the story <ArrowRight />
              </span>
            </div>
          </Link>

          <ol className="jr__list">
            {rest.map((a, i) => (
              <li key={a.slug} data-reveal>
                <Link to={`/journal/${a.slug}`} className="jr__item" onClick={() => track("journal_open", { slug: a.slug })}>
                  <span className="jr__no label">0{i + 2}</span>
                  <span className="jr__item-text">
                    <span className="label">{a.kicker}</span>
                    <span className="jr__item-title">
                      {a.title} <em>{a.accent}</em>
                    </span>
                  </span>
                  <span className="jr__thumb frame">
                    <Img photo={a.image} sizes="120px" />
                  </span>
                  <ArrowUpRight className="jr__arrow" size={18} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
