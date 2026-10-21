import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Share2 } from "lucide-react";
import { articles, getArticle, readingMinutes } from "../data/journal";
import { Img } from "../components/Img";
import { Dinkus } from "../components/Icons";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { usePageMeta } from "../hooks/usePageMeta";
import { shareText } from "../lib/share";
import { openEnquiry } from "../lib/enquiry";
import NotFound from "./NotFound";
import "./Article.css";

export default function Article() {
  const { slug } = useParams();
  const a = getArticle(slug);
  const main = useRef<HTMLElement>(null);
  useScrollReveal(main);
  usePageMeta(a ? `${a.title} ${a.accent} — The Mehfil Edit` : "Not found — Mehfil Couture", a?.dek);

  if (!a) return <NotFound />;
  const idx = articles.indexOf(a);
  const more = [articles[(idx + 1) % articles.length], articles[(idx + 2) % articles.length]];

  return (
    <main id="main" ref={main} className="art">
      <article>
        <header className="art__head wrap">
          <Link to="/#journal" className="art__back label">
            <ArrowLeft size={14} /> The Mehfil Edit
          </Link>
          <p className="label label--gold" data-reveal>
            {a.kicker} · {readingMinutes(a)} min read
          </p>
          <h1 className="art__title" data-reveal>
            {a.title} <em>{a.accent}</em>
          </h1>
          <p className="art__dek" data-reveal>
            {a.dek}
          </p>
        </header>

        <figure className="art__hero wrap">
          <div className="frame art__hero-img" data-clip>
            <Img photo={a.image} eager sizes="(min-width: 1100px) 1100px, 100vw" />
          </div>
          <figcaption className="label">Photograph: {a.image.credit} / Unsplash — editorial inspiration</figcaption>
        </figure>

        <div className="art__body wrap">
          {a.body.map((b, i) => {
            if (b.t === "h") return <h2 key={i}>{b.text}</h2>;
            if (b.t === "pull")
              return (
                <blockquote key={i} className="art__pull">
                  <Dinkus size={12} className="art__dink" />
                  <p>{b.text}</p>
                </blockquote>
              );
            if (b.t === "list")
              return (
                <ul key={i}>
                  {b.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              );
            return <p key={i}>{b.text}</p>;
          })}

          <div className="art__actions">
            <button
              type="button"
              className="btn"
              onClick={() =>
                openEnquiry(
                  `Hi Mehfil Couture! I just read “${a.title} ${a.accent}” on your site and would love some styling help.`,
                  `journal_${a.slug}`,
                )
              }
            >
              Ask the studio <ArrowRight />
            </button>
            <button type="button" className="link-arrow" onClick={() => shareText(`${a.title} ${a.accent}`, a.dek, window.location.href)}>
              <Share2 /> Share this story
            </button>
          </div>
        </div>
      </article>

      <aside className="art__more wrap" aria-labelledby="more-title">
        <h2 id="more-title" className="label label-row">
          Keep reading
        </h2>
        <div className="art__more-grid">
          {more.map((m) => (
            <Link key={m.slug} to={`/journal/${m.slug}`} className="art__card">
              <div className="frame art__card-img">
                <Img photo={m.image} sizes="(min-width: 800px) 40vw, 100vw" />
              </div>
              <span className="label">{m.kicker}</span>
              <span className="art__card-title">
                {m.title} <em>{m.accent}</em>
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </main>
  );
}
