import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Send,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Ruler,
  Calendar,
  Info,
} from "lucide-react";
import {
  MEASUREMENT_POINTS,
  type MeasurementId,
  type MeasurementCategory,
  type PassportData,
  DEFAULT_PASSPORT,
  loadPassport,
  savePassport,
  formatValueDisplay,
  formatPassportForEnquiry,
  GHERA_PRESETS,
  inchesToCm,
} from "../data/measurements";
import { OPEN_PASSPORT, notifyPassportUpdated } from "../lib/passportBus";
import { copyText, openEnquiry } from "../lib/enquiry";
import { toast } from "../lib/toast";
import { track } from "../lib/analytics";
import { MannequinSilhouette } from "./MannequinSilhouette";
import "./MeasurementPassport.css";

const CATEGORIES: { key: MeasurementCategory; title: string; count: number }[] = [
  { key: "choli", title: "Choli & Torso", count: 5 },
  { key: "necklines_arms", title: "Necklines & Sleeves", count: 5 },
  { key: "lehenga", title: "Lehenga & Flare", count: 4 },
];

export const MeasurementPassport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [passport, setPassport] = useState<PassportData>(loadPassport);
  const [activePointId, setActivePointId] = useState<MeasurementId>("bust");
  const [activeCategory, setActiveCategory] = useState<MeasurementCategory>("choli");
  const [mannequinView, setMannequinView] = useState<"front" | "back">("front");
  const [showSummaryView, setShowSummaryView] = useState(false);
  const [copied, setCopied] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Active measurement metadata
  const activePoint = useMemo(
    () => MEASUREMENT_POINTS.find((p) => p.id === activePointId) || MEASUREMENT_POINTS[0],
    [activePointId],
  );

  // Sync mannequin view when active point changes (e.g. shoulders or back neck switch to back)
  useEffect(() => {
    if (activePoint.view === "back") {
      setMannequinView("back");
    } else if (activePoint.view === "front") {
      setMannequinView("front");
    }
  }, [activePoint]);

  // Listen for open events from anywhere
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<string | undefined>).detail;
      if (detail && MEASUREMENT_POINTS.some((p) => p.id === detail)) {
        setActivePointId(detail as MeasurementId);
      }
      setPassport(loadPassport());
      setIsOpen(true);
      track("passport_open");
    };

    window.addEventListener(OPEN_PASSPORT, handleOpen);
    return () => window.removeEventListener(OPEN_PASSPORT, handleOpen);
  }, []);

  // Save changes to localStorage
  const updateValue = useCallback(
    (id: MeasurementId, valInches: number) => {
      setPassport((prev) => {
        const next: PassportData = {
          ...prev,
          values: {
            ...prev.values,
            [id]: Math.round(valInches * 4) / 4, // 0.25" precision
          },
        };
        savePassport(next);
        notifyPassportUpdated();
        return next;
      });
    },
    [],
  );

  const updateUnit = (unit: "inches" | "cm") => {
    setPassport((prev) => {
      const next = { ...prev, unit };
      savePassport(next);
      notifyPassportUpdated();
      return next;
    });
  };

  const updateClientName = (name: string) => {
    setPassport((prev) => {
      const next = { ...prev, clientName: name };
      savePassport(next);
      notifyPassportUpdated();
      return next;
    });
  };

  const updateHeelHeight = (valInches: number) => {
    setPassport((prev) => {
      const next = { ...prev, heelHeightInches: valInches };
      savePassport(next);
      notifyPassportUpdated();
      return next;
    });
  };

  const updateNotes = (notes: string) => {
    setPassport((prev) => {
      const next = { ...prev, postureNotes: notes };
      savePassport(next);
      notifyPassportUpdated();
      return next;
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all measurements to standard couture defaults?")) {
      setPassport(DEFAULT_PASSPORT);
      savePassport(DEFAULT_PASSPORT);
      notifyPassportUpdated();
      toast("Measurements reset to atelier baseline.");
    }
  };

  // Keyboard accessibility & lock scroll
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowSummaryView(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, handleClose]);

  // Point navigation
  const currentIndex = MEASUREMENT_POINTS.findIndex((p) => p.id === activePointId);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < MEASUREMENT_POINTS.length - 1;

  const goToPrev = () => {
    if (canGoPrev) {
      const nextP = MEASUREMENT_POINTS[currentIndex - 1];
      setActivePointId(nextP.id);
      setActiveCategory(nextP.category);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      const nextP = MEASUREMENT_POINTS[currentIndex + 1];
      setActivePointId(nextP.id);
      setActiveCategory(nextP.category);
    } else {
      setShowSummaryView(true);
    }
  };

  const handleCopySummary = async () => {
    const text = formatPassportForEnquiry(passport);
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      toast("Bespoke Passport copied to clipboard!");
      setTimeout(() => setCopied(false), 2400);
      track("passport_copied");
    }
  };

  const handleSendToStudio = () => {
    const text = formatPassportForEnquiry(passport);
    openEnquiry(`Hi Mehfil Couture! Here is my Bespoke Measurement Passport for my consultation:\n\n${text}`, "passport");
    track("passport_sent");
  };

  const handleAttachToAppointment = () => {
    handleClose();
    setTimeout(() => {
      const el = document.getElementById("appointment");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        toast("Passport attached to your appointment request!");
      }
    }, 150);
  };

  if (!isOpen) return null;

  const currentVal = passport.values[activePointId];

  return (
    <div className="passport-overlay" role="dialog" aria-modal="true" aria-labelledby="passport-title">
      <div className="passport-backdrop" onClick={handleClose} />

      <div className="passport-dialog" ref={dialogRef}>
        {/* Header */}
        <header className="passport-header">
          <div className="passport-header__left">
            <span className="passport-kicker">Mehfil Atelier · Bespoke Studio</span>
            <h2 id="passport-title" className="passport-title">
              14-Point Digital <em>Measurement Passport</em>
            </h2>
          </div>

          <div className="passport-header__actions">
            {/* Unit toggle */}
            <div className="unit-toggle" role="group" aria-label="Measurement Units">
              <button
                type="button"
                className={`unit-btn ${passport.unit === "inches" ? "active" : ""}`}
                onClick={() => updateUnit("inches")}
              >
                Inches (")
              </button>
              <button
                type="button"
                className={`unit-btn ${passport.unit === "cm" ? "active" : ""}`}
                onClick={() => updateUnit("cm")}
              >
                Centimeters (cm)
              </button>
            </div>

            <button
              type="button"
              className="passport-close-btn"
              onClick={handleClose}
              aria-label="Close Measurement Passport"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        {!showSummaryView ? (
          <div className="passport-body">
            {/* Left Column: Interactive Mannequin */}
            <aside className="passport-visual-col">
              <MannequinSilhouette
                activePointId={activePointId}
                onSelectPoint={(id) => {
                  setActivePointId(id);
                  const p = MEASUREMENT_POINTS.find((x) => x.id === id);
                  if (p) setActiveCategory(p.category);
                }}
                passport={passport}
                view={mannequinView}
                onToggleView={setMannequinView}
              />

              <div className="visual-footer">
                <div className="progress-badge">
                  <span>Calibrated:</span>
                  <strong>14 / 14 Points Ready</strong>
                </div>
                <button
                  type="button"
                  className="summary-switch-btn"
                  onClick={() => setShowSummaryView(true)}
                >
                  <Sparkles size={14} />
                  <span>View Certified Passport</span>
                </button>
              </div>
            </aside>

            {/* Right Column: Step by step calibration */}
            <main className="passport-editor-col">
              {/* Category tabs */}
              <nav className="category-tabs" aria-label="Measurement Categories">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`cat-tab ${activeCategory === cat.key ? "active" : ""}`}
                    onClick={() => {
                      setActiveCategory(cat.key);
                      const firstInCat = MEASUREMENT_POINTS.find((p) => p.category === cat.key);
                      if (firstInCat) setActivePointId(firstInCat.id);
                    }}
                  >
                    <span>{cat.title}</span>
                  </button>
                ))}
              </nav>

              {/* Point Quick Selector Chips */}
              <div className="point-chips">
                {MEASUREMENT_POINTS.filter((p) => p.category === activeCategory).map((pt) => {
                  const isCurrent = pt.id === activePointId;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      className={`point-chip ${isCurrent ? "active" : ""}`}
                      onClick={() => setActivePointId(pt.id)}
                    >
                      <span className="chip-no">{pt.number}</span>
                      <span className="chip-label">{pt.shortName}</span>
                      <span className="chip-val">
                        {formatValueDisplay(passport.values[pt.id], passport.unit, pt.id === "gheraPreference")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Point Calibration Panel */}
              <section className="calibration-card">
                <header className="calibration-head">
                  <div className="point-meta">
                    <span className="point-seq">Step {activePoint.number} of 14</span>
                    <h3 className="point-name">{activePoint.name}</h3>
                    <p className="point-desc">{activePoint.description}</p>
                  </div>

                  <div className="point-value-display">
                    <span className="value-digits">
                      {passport.unit === "cm" && activePoint.id !== "gheraPreference"
                        ? inchesToCm(currentVal)
                        : currentVal}
                    </span>
                    <span className="value-unit">
                      {activePoint.id === "gheraPreference"
                        ? "meters"
                        : passport.unit === "cm"
                        ? "cm"
                        : "inches"}
                    </span>
                  </div>
                </header>

                {/* Tactical slider controller */}
                <div className="slider-container">
                  {activePoint.id === "gheraPreference" ? (
                    <div className="ghera-presets">
                      {GHERA_PRESETS.map((gp) => (
                        <button
                          key={gp.value}
                          type="button"
                          className={`ghera-btn ${Math.abs(currentVal - gp.value) < 0.3 ? "active" : ""}`}
                          onClick={() => updateValue("gheraPreference", gp.value)}
                        >
                          <span className="ghera-label">{gp.label}</span>
                          <span className="ghera-desc">{gp.desc}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="slider-row">
                        <button
                          type="button"
                          className="nudge-btn"
                          aria-label="Decrease value"
                          onClick={() =>
                            updateValue(
                              activePoint.id,
                              Math.max(activePoint.minInches, currentVal - activePoint.stepInches),
                            )
                          }
                        >
                          −
                        </button>

                        <input
                          type="range"
                          className="range-input"
                          min={activePoint.minInches}
                          max={activePoint.maxInches}
                          step={activePoint.stepInches}
                          value={currentVal}
                          onChange={(e) => updateValue(activePoint.id, parseFloat(e.target.value))}
                        />

                        <button
                          type="button"
                          className="nudge-btn"
                          aria-label="Increase value"
                          onClick={() =>
                            updateValue(
                              activePoint.id,
                              Math.min(activePoint.maxInches, currentVal + activePoint.stepInches),
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <div className="slider-bounds">
                        <span>
                          Min: {formatValueDisplay(activePoint.minInches, passport.unit)}
                        </span>
                        <span>
                          Standard: {formatValueDisplay(activePoint.defaultInches, passport.unit)}
                        </span>
                        <span>
                          Max: {formatValueDisplay(activePoint.maxInches, passport.unit)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Step-by-step instructions & Master Cutter Artisan Tip */}
                <div className="guidance-box">
                  <div className="guidance-instruction">
                    <div className="guidance-label">
                      <Ruler size={14} />
                      <span>How to place the tape</span>
                    </div>
                    <p>{activePoint.instruction}</p>
                  </div>

                  <div className="guidance-artisan">
                    <div className="guidance-label">
                      <Info size={14} />
                      <span>Master Cutter's Atelier Note</span>
                    </div>
                    <p>{activePoint.artisanTip}</p>
                  </div>
                </div>

                {/* Footwear heel height reminder for waist-to-floor */}
                {activePoint.id === "waistToFloor" && (
                  <div className="heel-box">
                    <label className="heel-label">
                      <span>Shoe Heel Height Allowance:</span>
                      <select
                        value={passport.heelHeightInches}
                        onChange={(e) => updateHeelHeight(parseFloat(e.target.value))}
                        className="heel-select"
                      >
                        <option value={0}>Flats / Barefoot (0")</option>
                        <option value={1.5}>Low Heel (1.5")</option>
                        <option value={2.5}>Moderate Heel (2.5")</option>
                        <option value={3.0}>Standard Bridal Stiletto (3.0")</option>
                        <option value={4.0}>High Platform Heel (4.0")</option>
                        <option value={4.5}>Sky-High Heel (4.5"+)</option>
                      </select>
                    </label>
                    <p className="heel-hint">
                      The lehenga length is custom-balanced against your exact heel height to ensure effortless walking.
                    </p>
                  </div>
                )}
              </section>

              {/* Navigation Bar */}
              <footer className="passport-footer">
                <button
                  type="button"
                  className="nav-btn prev"
                  disabled={!canGoPrev}
                  onClick={goToPrev}
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>

                <div className="footer-middle">
                  <button
                    type="button"
                    className="reset-btn"
                    onClick={handleResetDefaults}
                    title="Reset to atelier baseline"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                <button type="button" className="nav-btn next" onClick={goToNext}>
                  <span>{canGoNext ? "Next Point" : "Review Passport"}</span>
                  <ArrowRight size={16} />
                </button>
              </footer>
            </main>
          </div>
        ) : (
          /* Certified Passport Card Summary View */
          <div className="passport-summary-wrap">
            <div className="passport-card">
              <div className="card-seal">
                <span className="seal-text">MEHFIL ATELIER</span>
                <span className="seal-sub">INDORE · BESPOKE</span>
              </div>

              <div className="card-top">
                <div>
                  <span className="card-kicker">Official Atelier Dossier</span>
                  <h3 className="card-title">Bespoke Measurement Passport</h3>
                  <p className="card-subtitle">
                    Standard Couture Specifications · Handcrafted in South Tukoganj, Indore
                  </p>
                </div>

                <div className="client-input-wrap">
                  <label htmlFor="client-name-input">Client Name:</label>
                  <input
                    id="client-name-input"
                    type="text"
                    placeholder="Enter bride / client name..."
                    value={passport.clientName}
                    onChange={(e) => updateClientName(e.target.value)}
                    className="client-name-field"
                  />
                </div>
              </div>

              <div className="card-grid">
                {/* Choli specs */}
                <div className="spec-group">
                  <h4 className="spec-title">Choli & Torso</h4>
                  <ul className="spec-list">
                    <li>
                      <span>01. Bust Circumference</span>
                      <strong>{formatValueDisplay(passport.values.bust, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>02. Underbust Ribcage Band</span>
                      <strong>{formatValueDisplay(passport.values.underbust, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>03. Shoulder-to-Apex</span>
                      <strong>{formatValueDisplay(passport.values.apexPoint, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>04. Total Choli Length</span>
                      <strong>{formatValueDisplay(passport.values.choliLength, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>05. Across Shoulders</span>
                      <strong>{formatValueDisplay(passport.values.shoulderWidth, passport.unit)}</strong>
                    </li>
                  </ul>
                </div>

                {/* Neckline & Arm specs */}
                <div className="spec-group">
                  <h4 className="spec-title">Necklines & Sleeves</h4>
                  <ul className="spec-list">
                    <li>
                      <span>06. Front Neck Drop</span>
                      <strong>{formatValueDisplay(passport.values.frontNeckDepth, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>07. Back Neck Drop</span>
                      <strong>{formatValueDisplay(passport.values.backNeckDepth, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>08. Armhole</span>
                      <strong>{formatValueDisplay(passport.values.armhole, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>09. Bicep</span>
                      <strong>{formatValueDisplay(passport.values.bicep, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>10. Sleeve Length</span>
                      <strong>{formatValueDisplay(passport.values.sleeveLength, passport.unit)}</strong>
                    </li>
                  </ul>
                </div>

                {/* Lehenga & Skirt specs */}
                <div className="spec-group">
                  <h4 className="spec-title">Lehenga & Drape</h4>
                  <ul className="spec-list">
                    <li>
                      <span>11. Lehenga Waist</span>
                      <strong>{formatValueDisplay(passport.values.lehengaWaist, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>12. Full Hip</span>
                      <strong>{formatValueDisplay(passport.values.hip, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>13. Waist-to-Floor</span>
                      <strong>{formatValueDisplay(passport.values.waistToFloor, passport.unit)}</strong>
                    </li>
                    <li>
                      <span>14. Flare Volume</span>
                      <strong>{passport.values.gheraPreference}m Volume</strong>
                    </li>
                    <li>
                      <span>Shoe Heel Allowance</span>
                      <strong>{formatValueDisplay(passport.heelHeightInches, passport.unit)}</strong>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Special Posture & Customization Notes */}
              <div className="notes-box">
                <label htmlFor="posture-notes-input">Special Fit / Posture Notes (e.g. padding preferences, comfort ease):</label>
                <textarea
                  id="posture-notes-input"
                  rows={2}
                  placeholder="e.g. Prefer heavy bust padding; like deep back neck with latkans; sensitive to tight armholes..."
                  value={passport.postureNotes}
                  onChange={(e) => updateNotes(e.target.value)}
                  className="notes-textarea"
                />
              </div>

              <div className="card-footer-info">
                <span>Certified for Mehfil Couture Flagship Studio</span>
                <span>Saved locally on your device</span>
              </div>
            </div>

            {/* Passport Call to Actions */}
            <div className="summary-actions-bar">
              <button
                type="button"
                className="action-btn secondary"
                onClick={() => setShowSummaryView(false)}
              >
                <ArrowLeft size={16} />
                <span>Return to Calibration</span>
              </button>

              <button
                type="button"
                className="action-btn secondary"
                onClick={handleCopySummary}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "Copied!" : "Copy Passport"}</span>
              </button>

              <button
                type="button"
                className="action-btn secondary"
                onClick={handleSendToStudio}
              >
                <Send size={16} />
                <span>Send to Stylist</span>
              </button>

              <button
                type="button"
                className="action-btn primary"
                onClick={handleAttachToAppointment}
              >
                <Calendar size={16} />
                <span>Book Fitting with Passport</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
