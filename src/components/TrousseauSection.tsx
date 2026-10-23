import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Clock, Palette } from "lucide-react";
import { openTrousseau, TROUSSEAU_UPDATED } from "../lib/trousseauBus";
import {
  CEREMONIES,
  TROUSSEAU_SWATCHES,
  loadTrousseau,
  inspectPaletteHarmony,
  type TrousseauPlan,
} from "../data/trousseau";
import "./TrousseauSection.css";

export const TrousseauSection: React.FC = () => {
  const [plan, setPlan] = useState<TrousseauPlan>(loadTrousseau);

  useEffect(() => {
    const handleUpdate = () => {
      setPlan(loadTrousseau());
    };
    window.addEventListener(TROUSSEAU_UPDATED, handleUpdate);
    return () => window.removeEventListener(TROUSSEAU_UPDATED, handleUpdate);
  }, []);

  const harmony = inspectPaletteHarmony(plan);

  return (
    <section id="trousseau" className="trousseau-sec" aria-labelledby="trousseau-sec-title">
      <div className="wrap trousseau-sec__inner">
        <header className="trousseau-sec__head" data-reveal>
          <div className="label-row">
            <span className="label label--gold">The Bridal Trousseau Concierge</span>
            <span className="label">6-Ceremony Wardrobe Architecture</span>
          </div>
          <h2 id="trousseau-sec-title" className="h2">
            The season of mehfils. <em>Curate your entire trousseau.</em>
          </h2>
          <p className="trousseau-sec__dek">
            From the morning sunlight of the Haldi to the 360-degree twirl of the Sangeet and the
            sacred vows of the Pheras — our Trousseau Concierge coordinates your whole wedding week.
            Inspect color harmony, avoid tone collisions, and track Indore karigari loom deadlines.
          </p>
        </header>

        {/* Interactive Ceremonies Ribbon Preview */}
        <div className="trousseau-sec__ribbon-wrap" data-reveal>
          <div className="trousseau-sec__events-grid">
            {CEREMONIES.map((c) => {
              const look = plan.ceremonies[c.id];
              const swatch = TROUSSEAU_SWATCHES.find((s) => s.key === look?.colorKey);
              const isIncluded = look?.included ?? true;

              return (
                <div
                  key={c.id}
                  className={`t-event-card ${isIncluded ? "included" : "omitted"}`}
                  onClick={() => openTrousseau(c.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="t-event-card__top">
                    <span className="t-event-icon">{c.icon}</span>
                    <span
                      className="t-event-swatch"
                      style={{ backgroundColor: swatch?.hex }}
                      title={swatch?.label}
                    />
                  </div>
                  <h3 className="t-event-name">{c.name}</h3>
                  <span className="t-event-vibe">{c.timeVibe}</span>

                  <div className="t-event-foot">
                    <span className="t-event-lead">{c.typicalWeeksToCraft}w lead</span>
                    <span className="t-event-action">
                      Curate <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Harmony Score Strip */}
          <div className="trousseau-sec__score-strip">
            <div className="score-pill">
              <Palette size={14} />
              <span>Palette Harmony: <strong>{harmony.score}% ({harmony.verdict})</strong></span>
            </div>

            <div className="timeline-pill">
              <Clock size={14} />
              <span>
                {plan.weddingDate
                  ? `Target Wedding: ${plan.weddingDate}`
                  : "Artisan Timeline Calculator Ready"}
              </span>
            </div>

            <button
              type="button"
              className="btn btn--gold-sec"
              onClick={() => openTrousseau()}
            >
              <Sparkles size={14} />
              <span>Open Trousseau Planner</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
