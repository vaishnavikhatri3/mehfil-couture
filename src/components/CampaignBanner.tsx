import { ArrowRight } from "lucide-react";
import { campaign } from "../config/brand";
import { photos } from "../data/images";
import { track } from "../lib/analytics";
import { openTrousseau } from "../lib/trousseauBus";
import { Img } from "./Img";
import "./CampaignBanner.css";

/**
 * Editable seasonal campaign (src/config/brand.ts → `campaign`). Shows an
 * offer line only when one is configured — no fake countdowns or scarcity.
 */
export function CampaignBanner() {
  if (!campaign.enabled) return null;
  return (
    <section className="camp" aria-labelledby="camp-title">
      <div className="camp__media" data-clip>
        <Img photo={photos.lightsBride} sizes="100vw" q={76} zoomScale={1.4} className="img-cover camp__img" />
      </div>
      <div className="camp__veil" aria-hidden="true" />
      <div className="wrap camp__inner">
        <p className="label camp__kicker" data-reveal>
          {campaign.kicker}
        </p>
        <h2 id="camp-title" className="camp__title" data-reveal>
          {campaign.title}
        </h2>
        <p className="camp__body" data-reveal>
          {campaign.body}
        </p>
        {campaign.offer && (
          <p className="camp__offer label" data-reveal>
            {campaign.offer}
          </p>
        )}
        <div data-reveal>
          <button
            type="button"
            className="btn btn--light"
            onClick={() => {
              track("campaign_click", { campaign: campaign.kicker });
              openTrousseau();
            }}
          >
            {campaign.cta} <ArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
}
