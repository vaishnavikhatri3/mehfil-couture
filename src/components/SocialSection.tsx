import { ArrowUpRight } from "lucide-react";
import { brand } from "../config/brand";
import { photos } from "../data/images";
import { Img } from "./Img";
import { InstagramIcon } from "./Icons";
import "./SocialSection.css";

const BOARD = [photos.redStudio, photos.goldBride, photos.teal, photos.palace, photos.ivoryGold, photos.redPose];

/**
 * Instagram is the studio's verified channel. Rather than faking a feed, this
 * is a clearly labelled moodboard that links out to the real account. Swap in
 * a proper embed (e.g. Instagram Basic Display via a server) when configured.
 */
export function SocialSection() {
  return (
    <section className="social" aria-labelledby="social-title">
      <div className="wrap social__grid">
        <div className="social__text">
          <p className="label label-row" data-reveal>
            On Instagram
          </p>
          <h2 id="social-title" className="social__title" data-reveal>
            New looks land <em>there first.</em>
          </h2>
          <p className="lede" data-reveal>
            New pieces, styling ideas, behind-the-scenes from the studio and outfit reels — follow along so the next one doesn't
            pass you by.
          </p>
          <a
            href={brand.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social__handle"
            data-reveal
          >
            <InstagramIcon size={26} />
            <span>{brand.instagram.handle}</span>
            <ArrowUpRight size={22} />
          </a>
        </div>

        <a
          className="social__board"
          href={brand.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${brand.instagram.handle} on Instagram`}
        >
          {BOARD.map((p, i) => (
            <span key={p.src} className={`social__tile social__tile--${i + 1} frame`} data-clip>
              <Img photo={p} sizes="(min-width: 900px) 16vw, 32vw" />
            </span>
          ))}
          <span className="social__board-cap label">Moodboard · editorial inspiration</span>
        </a>
      </div>
    </section>
  );
}
