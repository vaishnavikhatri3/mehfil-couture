import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Send,
  RotateCcw,
  Sparkles,
  Calendar,
  AlertTriangle,
  Clock,
  Palette,
  CheckCircle2,
} from "lucide-react";
import {
  CEREMONIES,
  TROUSSEAU_SWATCHES,
  type CeremonyId,
  type TrousseauPlan,
  DEFAULT_TROUSSEAU,
  loadTrousseau,
  saveTrousseau,
  inspectPaletteHarmony,
  calculateProductionTimeline,
  formatTrousseauForEnquiry,
} from "../data/trousseau";
import { OPEN_TROUSSEAU, notifyTrousseauUpdated } from "../lib/trousseauBus";
import { copyText, openEnquiry } from "../lib/enquiry";
import { toast } from "../lib/toast";
import { track } from "../lib/analytics";
import "./TrousseauPlanner.css";

type Tab = "curator" | "harmony" | "timeline" | "dossier";

export const TrousseauPlanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState<TrousseauPlan>(loadTrousseau);
  const [activeCeremonyId, setActiveCeremonyId] = useState<CeremonyId>("pheras");
  const [activeTab, setActiveTab] = useState<Tab>("curator");
  const [copied, setCopied] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Active ceremony definition & current planned look
  const activeDef = useMemo(
    () => CEREMONIES.find((c) => c.id === activeCeremonyId) || CEREMONIES[0],
    [activeCeremonyId],
  );
  const activeLook = plan.ceremonies[activeCeremonyId];

  // Derived analyses
  const harmony = useMemo(() => inspectPaletteHarmony(plan), [plan]);
  const timeline = useMemo(
    () => calculateProductionTimeline(plan.weddingDate),
    [plan.weddingDate],
  );

  // Listen to open events
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<string | undefined>).detail;
      if (detail && CEREMONIES.some((c) => c.id === detail)) {
        setActiveCeremonyId(detail as CeremonyId);
      }
      setPlan(loadTrousseau());
      setIsOpen(true);
      track("trousseau_open");
    };
    window.addEventListener(OPEN_TROUSSEAU, handleOpen);
    return () => window.removeEventListener(OPEN_TROUSSEAU, handleOpen);
  }, []);

  // Save changes
  const updateLook = useCallback(
    (cid: CeremonyId, partial: Partial<TrousseauPlan["ceremonies"][CeremonyId]>) => {
      setPlan((prev) => {
        const next: TrousseauPlan = {
          ...prev,
          ceremonies: {
            ...prev.ceremonies,
            [cid]: {
              ...prev.ceremonies[cid],
              ...partial,
            },
          },
        };
        saveTrousseau(next);
        notifyTrousseauUpdated();
        return next;
      });
    },
    [],
  );

  const updateWeddingDate = (date: string) => {
    setPlan((prev) => {
      const next = { ...prev, weddingDate: date };
      saveTrousseau(next);
      notifyTrousseauUpdated();
      return next;
    });
  };

  const updateBrideName = (name: string) => {
    setPlan((prev) => {
      const next = { ...prev, brideName: name };
      saveTrousseau(next);
      notifyTrousseauUpdated();
      return next;
    });
  };

  const updatePartnerName = (name: string) => {
    setPlan((prev) => {
      const next = { ...prev, partnerName: name };
      saveTrousseau(next);
      notifyTrousseauUpdated();
      return next;
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset trousseau wardrobe plan to default couture recommendations?")) {
      setPlan(DEFAULT_TROUSSEAU);
      saveTrousseau(DEFAULT_TROUSSEAU);
      notifyTrousseauUpdated();
      toast("Trousseau plan reset to atelier recommendations.");
    }
  };

  // Close & keyboard accessibility
  const handleClose = useCallback(() => {
    setIsOpen(false);
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

  // Actions
  const handleCopyDossier = async () => {
    const text = formatTrousseauForEnquiry(plan);
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      toast("Trousseau wardrobe dossier copied to clipboard!");
      setTimeout(() => setCopied(false), 2400);
      track("trousseau_copied");
    }
  };

  const handleSendToStudio = () => {
    const text = formatTrousseauForEnquiry(plan);
    openEnquiry(`Hi Mehfil Couture! Here is my planned Wedding Trousseau Wardrobe for consultation:\n\n${text}`, "trousseau");
    track("trousseau_sent");
  };

  const handleBookConsultation = () => {
    handleClose();
    setTimeout(() => {
      const el = document.getElementById("appointment");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        toast("Trousseau attached to your appointment request!");
      }
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="trousseau-overlay" role="dialog" aria-modal="true" aria-labelledby="trousseau-title">
      <div className="trousseau-backdrop" onClick={handleClose} />

      <div className="trousseau-dialog" ref={dialogRef}>
        {/* Header */}
        <header className="trousseau-header">
          <div className="trousseau-header__left">
            <span className="trousseau-kicker">Mehfil Haute Couture · Bridal Concierge</span>
            <h2 id="trousseau-title" className="trousseau-title">
              The Trousseau <em>Wardrobe & Timeline</em>
            </h2>
          </div>

          <div className="trousseau-header__actions">
            <nav className="trousseau-tabs-nav" aria-label="Planner Modes">
              <button
                type="button"
                className={`tab-btn ${activeTab === "curator" ? "active" : ""}`}
                onClick={() => setActiveTab("curator")}
              >
                <span>Curator</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "harmony" ? "active" : ""}`}
                onClick={() => setActiveTab("harmony")}
              >
                <span>Palette Matrix</span>
                <span className="tab-pill">{harmony.score}%</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
                onClick={() => setActiveTab("timeline")}
              >
                <span>Timeline</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "dossier" ? "active" : ""}`}
                onClick={() => setActiveTab("dossier")}
              >
                <Sparkles size={13} />
                <span>Dossier</span>
              </button>
            </nav>

            <button
              type="button"
              className="trousseau-close-btn"
              onClick={handleClose}
              aria-label="Close Trousseau Planner"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Wedding Metadata Strip */}
        <div className="wedding-meta-strip">
          <div className="meta-field">
            <label htmlFor="trousseau-wedding-date">
              <Calendar size={13} />
              <span>Wedding Date:</span>
            </label>
            <input
              id="trousseau-wedding-date"
              type="date"
              className="meta-date-input"
              value={plan.weddingDate}
              onChange={(e) => updateWeddingDate(e.target.value)}
            />
          </div>

          <div className="meta-field">
            <label htmlFor="trousseau-bride-name">Bride Name:</label>
            <input
              id="trousseau-bride-name"
              type="text"
              placeholder="e.g. Ananya Sharma"
              className="meta-text-input"
              value={plan.brideName}
              onChange={(e) => updateBrideName(e.target.value)}
            />
          </div>

          <div className="meta-field">
            <label htmlFor="trousseau-partner-name">Partner Name:</label>
            <input
              id="trousseau-partner-name"
              type="text"
              placeholder="e.g. Rohan Varma"
              className="meta-text-input"
              value={plan.partnerName}
              onChange={(e) => updatePartnerName(e.target.value)}
            />
          </div>

          {timeline && (
            <div className={`meta-urgency-pill ${timeline.daysRemaining < 60 ? "urgent" : ""}`}>
              <Clock size={12} />
              <span>{timeline.daysRemaining} days remaining · {timeline.urgency}</span>
            </div>
          )}
        </div>

        {/* Main Body per Tab */}
        <div className="trousseau-body">
          {activeTab === "curator" && (
            <div className="curator-layout">
              {/* Left Column: Ceremony Selector Cards */}
              <aside className="ceremony-nav-list" aria-label="Ceremonies List">
                <span className="ceremony-nav-head">Select Ceremony ({harmony.activeCount} Active)</span>
                {CEREMONIES.map((c) => {
                  const look = plan.ceremonies[c.id];
                  const swatch = TROUSSEAU_SWATCHES.find((s) => s.key === look.colorKey);
                  const isSelected = c.id === activeCeremonyId;

                  return (
                    <div
                      key={c.id}
                      className={`ceremony-nav-item ${isSelected ? "selected" : ""} ${look.included ? "active" : "inactive"}`}
                      onClick={() => setActiveCeremonyId(c.id)}
                    >
                      <label
                        className="ceremony-toggle"
                        onClick={(e) => e.stopPropagation()}
                        title="Include in trousseau"
                      >
                        <input
                          type="checkbox"
                          checked={look.included}
                          onChange={(e) => updateLook(c.id, { included: e.target.checked })}
                        />
                      </label>

                      <div className="c-item-info">
                        <div className="c-item-top">
                          <span className="c-item-icon">{c.icon}</span>
                          <span className="c-item-name">{c.name}</span>
                        </div>
                        <span className="c-item-vibe">{c.timeVibe}</span>
                      </div>

                      {look.included && swatch && (
                        <div
                          className="c-item-color-pill"
                          style={{ backgroundColor: swatch.hex }}
                          title={swatch.label}
                        />
                      )}
                    </div>
                  );
                })}
              </aside>

              {/* Right Column: Active Ceremony Look Studio */}
              <main className="ceremony-detail-panel">
                <header className="ceremony-head">
                  <div>
                    <div className="c-order-row">
                      <span className="c-order-badge">Ceremony {activeDef.order}</span>
                      <span className="c-time-badge">{activeDef.timeVibe}</span>
                    </div>
                    <h3 className="c-detail-title">
                      {activeDef.icon} {activeDef.name}
                    </h3>
                    <p className="c-detail-desc">{activeDef.description}</p>
                  </div>

                  <div className="c-include-toggle-wrap">
                    <label className="toggle-switch-label">
                      <input
                        type="checkbox"
                        checked={activeLook.included}
                        onChange={(e) => updateLook(activeDef.id, { included: e.target.checked })}
                      />
                      <span>{activeLook.included ? "Included in Wardrobe" : "Omit for this Wedding"}</span>
                    </label>
                  </div>
                </header>

                {activeLook.included ? (
                  <div className="c-look-editor">
                    {/* Palette Swatches */}
                    <div className="editor-group">
                      <label className="group-label">
                        <Palette size={14} />
                        <span>Ceremony Color Palette</span>
                        <small className="group-sublabel">(Recommended for {activeDef.name})</small>
                      </label>
                      <div className="swatch-grid">
                        {TROUSSEAU_SWATCHES.map((sw) => {
                          const isRecommended = activeDef.recommendedSwatches.includes(sw.key);
                          const isSelected = activeLook.colorKey === sw.key;

                          return (
                            <button
                              key={sw.key}
                              type="button"
                              className={`swatch-btn ${isSelected ? "selected" : ""} ${isRecommended ? "recommended" : ""}`}
                              onClick={() => updateLook(activeDef.id, { colorKey: sw.key })}
                            >
                              <span className="swatch-circle" style={{ backgroundColor: sw.hex }}>
                                {isSelected && <Check size={12} color="#fff" />}
                              </span>
                              <span className="swatch-name">{sw.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Silhouette Selection */}
                    <div className="editor-group">
                      <label className="group-label">
                        <span>Couture Silhouette Structure</span>
                      </label>
                      <div className="options-grid">
                        {activeDef.silhouetteOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`opt-btn ${activeLook.silhouette === opt ? "active" : ""}`}
                            onClick={() => updateLook(activeDef.id, { silhouette: opt })}
                          >
                            <span>{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Karigari Embroidery Style */}
                    <div className="editor-group">
                      <label className="group-label">
                        <span>Indore Karigari Embroidery Style</span>
                        <small className="lead-tag">Approx {activeDef.typicalWeeksToCraft} weeks handcrafting lead</small>
                      </label>
                      <div className="options-grid">
                        {activeDef.embroideryOptions.map((emb) => (
                          <button
                            key={emb}
                            type="button"
                            className={`opt-btn ${activeLook.embroidery === emb ? "active" : ""}`}
                            onClick={() => updateLook(activeDef.id, { embroidery: emb })}
                          >
                            <span>{emb}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Notes */}
                    <div className="editor-group">
                      <label className="group-label" htmlFor="ceremony-notes">
                        <span>Personal Styling & Drape Notes</span>
                      </label>
                      <textarea
                        id="ceremony-notes"
                        rows={2}
                        className="notes-input"
                        placeholder="e.g. Pinned cape dupatta; sheer sleeve; contrast jewellery; heel height..."
                        value={activeLook.notes}
                        onChange={(e) => updateLook(activeDef.id, { notes: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="ceremony-omitted-banner">
                    <p>This ceremony is currently marked as omitted from your wedding wardrobe.</p>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => updateLook(activeDef.id, { included: true })}
                    >
                      + Add {activeDef.name} to my Trousseau
                    </button>
                  </div>
                )}
              </main>
            </div>
          )}

          {activeTab === "harmony" && (
            <div className="harmony-tab-layout">
              {/* Palette Spectrum Visual Bar */}
              <div className="harmony-banner">
                <div className="harmony-top-row">
                  <div>
                    <span className="banner-kicker">Palette Flow & Lighting Analysis</span>
                    <h3 className="banner-title">Wedding Week Color Spectrum</h3>
                  </div>

                  <div className="harmony-score-badge">
                    <span className="score-val">{harmony.score}%</span>
                    <span className="score-label">{harmony.verdict}</span>
                  </div>
                </div>

                <div className="spectrum-ribbon">
                  {CEREMONIES.filter((c) => plan.ceremonies[c.id]?.included).map((c) => {
                    const look = plan.ceremonies[c.id];
                    const swatch = TROUSSEAU_SWATCHES.find((s) => s.key === look.colorKey);
                    return (
                      <div
                        key={c.id}
                        className="ribbon-segment"
                        style={{ backgroundColor: swatch?.hex }}
                      >
                        <span className="ribbon-event">{c.name.split(" ")[0]}</span>
                        <span className="ribbon-color">{swatch?.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback and warnings */}
              <div className="harmony-feedback-grid">
                <div className="feedback-card praises">
                  <h4 className="feedback-title">
                    <CheckCircle2 size={16} />
                    <span>Aesthetic Strengths</span>
                  </h4>
                  <ul>
                    {harmony.praises.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="feedback-card warnings">
                  <h4 className="feedback-title">
                    <AlertTriangle size={16} />
                    <span>Styling Suggestions & Alerts</span>
                  </h4>
                  {harmony.warnings.length > 0 ? (
                    <ul>
                      {harmony.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-warnings">
                      Zero tone collisions detected! Your ceremony palettes transition effortlessly from sunrise rituals to evening ballroom celebrations.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="timeline-tab-layout">
              {timeline ? (
                <>
                  <div className="timeline-hero-card">
                    <div className="timeline-hero-top">
                      <div>
                        <span className="timeline-kicker">Indore Atelier Craftsmanship Schedule</span>
                        <h3 className="timeline-title">Target Wedding: {timeline.weddingDateFormatted}</h3>
                        <p className="timeline-desc">{timeline.urgencyDesc}</p>
                      </div>

                      <div className="timeline-countdown-box">
                        <span className="countdown-days">{timeline.daysRemaining}</span>
                        <span className="countdown-label">Days to Wedding</span>
                      </div>
                    </div>
                  </div>

                  <div className="milestones-track">
                    {timeline.milestones.map((m, idx) => (
                      <div key={idx} className="milestone-card">
                        <div className="milestone-num">{idx + 1}</div>
                        <div className="milestone-content">
                          <span className="milestone-date">{m.date}</span>
                          <h4 className="milestone-phase">{m.phase}</h4>
                          <p className="milestone-detail">{m.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-timeline-state">
                  <Calendar size={36} className="empty-icon" />
                  <h3>Pick your Wedding Date to unlock Karigari Milestones</h3>
                  <p>Our master tailors in South Tukoganj, Indore back-calculate exact embroidery loom dates and fitting trials.</p>
                  <div className="date-picker-prompt">
                    <label htmlFor="prompt-date">Choose Wedding Date:</label>
                    <input
                      id="prompt-date"
                      type="date"
                      className="meta-date-input"
                      value={plan.weddingDate}
                      onChange={(e) => updateWeddingDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "dossier" && (
            <div className="dossier-tab-layout">
              <div className="dossier-card">
                <div className="dossier-seal">
                  <span>MEHFIL</span>
                  <small>TROUSSEAU</small>
                </div>

                <div className="dossier-header">
                  <span className="dossier-kicker">Certified Atelier Dossier</span>
                  <h3 className="dossier-title">
                    {plan.brideName ? `${plan.brideName}'s` : "Bespoke"} Wedding Trousseau
                  </h3>
                  <p className="dossier-sub">
                    {plan.weddingDate ? `Target Date: ${plan.weddingDate} · ` : ""}
                    Curated across {harmony.activeCount} Ceremonies · Handcrafted in Indore
                  </p>
                </div>

                <div className="dossier-grid">
                  {CEREMONIES.filter((c) => plan.ceremonies[c.id]?.included).map((c) => {
                    const look = plan.ceremonies[c.id];
                    const swatch = TROUSSEAU_SWATCHES.find((s) => s.key === look.colorKey);
                    return (
                      <div key={c.id} className="dossier-event-item">
                        <div className="d-item-header">
                          <span className="d-item-icon">{c.icon}</span>
                          <div>
                            <h4 className="d-item-name">{c.name}</h4>
                            <span className="d-item-vibe">{c.timeVibe}</span>
                          </div>
                        </div>

                        <div className="d-item-specs">
                          <div className="spec-row">
                            <span>Palette:</span>
                            <div className="swatch-inline">
                              <span className="sw-dot" style={{ backgroundColor: swatch?.hex }} />
                              <strong>{swatch?.label}</strong>
                            </div>
                          </div>
                          <div className="spec-row">
                            <span>Silhouette:</span>
                            <strong>{look.silhouette}</strong>
                          </div>
                          <div className="spec-row">
                            <span>Embroidery:</span>
                            <strong>{look.embroidery}</strong>
                          </div>
                          {look.notes && (
                            <div className="spec-row notes">
                              <span>Notes:</span>
                              <em>{look.notes}</em>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="dossier-footer">
                  <span>Certified for Mehfil Couture Studio, Indore</span>
                  <span>Harmonic Rating: {harmony.score}% ({harmony.verdict})</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Footer Actions */}
        <footer className="trousseau-footer">
          <div className="footer-left">
            <button type="button" className="reset-btn" onClick={handleResetDefaults}>
              <RotateCcw size={13} />
              <span>Reset Trousseau</span>
            </button>
          </div>

          <div className="footer-right">
            <button type="button" className="action-btn secondary" onClick={handleCopyDossier}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? "Copied!" : "Copy Trousseau"}</span>
            </button>

            <button type="button" className="action-btn secondary" onClick={handleSendToStudio}>
              <Send size={15} />
              <span>Send to Stylist</span>
            </button>

            <button type="button" className="action-btn primary" onClick={handleBookConsultation}>
              <Calendar size={15} />
              <span>Book Appointment with Trousseau</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
