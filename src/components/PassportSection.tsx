import React, { useState, useEffect } from "react";
import { ArrowRight, Ruler, Sparkles, CheckCircle2 } from "lucide-react";
import { openPassport, PASSPORT_UPDATED } from "../lib/passportBus";
import { hasSavedPassport, loadPassport, type PassportData } from "../data/measurements";
import "./PassportSection.css";

export const PassportSection: React.FC = () => {
  const [passport, setPassport] = useState<PassportData | null>(() =>
    hasSavedPassport() ? loadPassport() : null,
  );

  useEffect(() => {
    const handleUpdate = () => {
      setPassport(hasSavedPassport() ? loadPassport() : null);
    };
    window.addEventListener(PASSPORT_UPDATED, handleUpdate);
    return () => window.removeEventListener(PASSPORT_UPDATED, handleUpdate);
  }, []);

  return (
    <section id="passport" className="passport-sec" aria-labelledby="passport-sec-title">
      <div className="wrap passport-sec__grid">
        <div className="passport-sec__text" data-reveal>
          <div className="label-row">
            <span className="label label--gold">The Bespoke Atelier Sizing</span>
            <span className="label">14-Point Digital Passport</span>
          </div>

          <h2 id="passport-sec-title" className="h2">
            Tailored to your contour. <em>Even from afar.</em>
          </h2>

          <p className="passport-sec__dek">
            Whether you are visiting our flagship in South Tukoganj or commissioning your bridal
            lehenga from London, Dubai, or Mumbai — our master cutters calibrate every choli and kalidar
            flare across 14 precise anatomical anchor points.
          </p>

          <div className="passport-sec__features">
            <div className="p-feat">
              <span className="p-feat__num">01</span>
              <div>
                <strong>Sculpted Choli Architecture</strong>
                <p>Shoulder-to-apex dart placement and ribcage band calibration eliminate gaping and riding up.</p>
              </div>
            </div>

            <div className="p-feat">
              <span className="p-feat__num">02</span>
              <div>
                <strong>Heel-Balanced Hemlines</strong>
                <p>Lehenga length calculated against your bridal shoe heel height for an effortless, floaty walking clearance.</p>
              </div>
            </div>

            <div className="p-feat">
              <span className="p-feat__num">03</span>
              <div>
                <strong>Atelier Digital Dossier</strong>
                <p>Calibrate in inches or centimeters, save on your device, and attach directly to your booking in one tap.</p>
              </div>
            </div>
          </div>

          <div className="passport-sec__cta">
            <button
              type="button"
              className="btn btn--gold"
              onClick={() => openPassport()}
            >
              <Ruler size={16} />
              <span>{passport ? "Review / Edit Measurement Passport" : "Calibrate My Measurement Passport"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="passport-sec__visual" data-reveal>
          <div className="passport-preview-card">
            <div className="preview-top">
              <div className="preview-seal">
                <span>MEHFIL</span>
                <small>ATELIER</small>
              </div>
              <span className="preview-badge">
                <Sparkles size={12} />
                <span>Haute Couture Passport</span>
              </span>
            </div>

            <h3 className="preview-title">Bespoke Fitting Passport</h3>
            <p className="preview-sub">14-Point Master Cutter Dossier · Indore Studio</p>

            <div className="preview-specs">
              <div className="p-spec-item">
                <span>01. Bust Circumference</span>
                <strong>{passport ? `${passport.values.bust}"` : '36.0"'}</strong>
              </div>
              <div className="p-spec-item">
                <span>02. Underbust Anchor</span>
                <strong>{passport ? `${passport.values.underbust}"` : '30.0"'}</strong>
              </div>
              <div className="p-spec-item">
                <span>03. Shoulder-to-Apex</span>
                <strong>{passport ? `${passport.values.apexPoint}"` : '10.0"'}</strong>
              </div>
              <div className="p-spec-item">
                <span>04. Total Choli Length</span>
                <strong>{passport ? `${passport.values.choliLength}"` : '14.5"'}</strong>
              </div>
              <div className="p-spec-item">
                <span>11. Lehenga Waist</span>
                <strong>{passport ? `${passport.values.lehengaWaist}"` : '29.0"'}</strong>
              </div>
              <div className="p-spec-item">
                <span>13. Waist-to-Floor Drop</span>
                <strong>{passport ? `${passport.values.waistToFloor}"` : '42.5"'}</strong>
              </div>
              <div className="p-spec-item">
                <span>14. Ghera Flare Volume</span>
                <strong>{passport ? `${passport.values.gheraPreference}m` : "5.5m"}</strong>
              </div>
            </div>

            <div className="preview-status">
              <CheckCircle2 size={16} className="status-icon" />
              <span>
                {passport
                  ? `Calibrated for ${passport.clientName.trim() || "Client"} · Ready for Appointment`
                  : "Interactive Mannequin & Guide Ready"}
              </span>
            </div>

            <button
              type="button"
              className="preview-btn"
              onClick={() => openPassport()}
            >
              Open Interactive Mannequin <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
