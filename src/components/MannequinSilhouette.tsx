import React from "react";
import {
  type MeasurementId,
  type PassportData,
  formatValueDisplay,
} from "../data/measurements";
import "./MannequinSilhouette.css";

type Props = {
  activePointId: MeasurementId;
  onSelectPoint: (id: MeasurementId) => void;
  passport: PassportData;
  view: "front" | "back";
  onToggleView: (v: "front" | "back") => void;
};

export const MannequinSilhouette: React.FC<Props> = ({
  activePointId,
  onSelectPoint,
  passport,
  view,
  onToggleView,
}) => {
  const v = passport.values;
  const unit = passport.unit;

  const isActive = (id: MeasurementId) => activePointId === id;

  return (
    <div className="mannequin-container">
      <div className="mannequin-header">
        <span className="mannequin-badge">Atelier Dress Form</span>
        <div className="view-toggle" role="group" aria-label="Mannequin View">
          <button
            type="button"
            className={`view-btn ${view === "front" ? "active" : ""}`}
            onClick={() => onToggleView("front")}
          >
            Front View
          </button>
          <button
            type="button"
            className={`view-btn ${view === "back" ? "active" : ""}`}
            onClick={() => onToggleView("back")}
          >
            Back View
          </button>
        </div>
      </div>

      <div className="mannequin-stage">
        <svg
          viewBox="0 0 320 620"
          className="mannequin-svg"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Interactive Atelier Silhouette"
        >
          <defs>
            {/* Gold tape gradient */}
            <linearGradient id="goldTapeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8d6828" />
              <stop offset="50%" stopColor="#dfb76c" />
              <stop offset="100%" stopColor="#b98a3d" />
            </linearGradient>

            {/* Glowing gold filter */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Mannequin body shadow gradient */}
            <radialGradient id="bodyShade" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f5ebe0" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#ecdac8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#dfc5b0" stopOpacity="0.3" />
            </radialGradient>
          </defs>

          {/* Pedestal Stand & Base */}
          <g className="mannequin-stand">
            <line x1="160" y1="460" x2="160" y2="590" stroke="rgba(31, 22, 18, 0.22)" strokeWidth="2.5" />
            <line x1="130" y1="590" x2="190" y2="590" stroke="rgba(31, 22, 18, 0.4)" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="160" cy="590" rx="36" ry="6" fill="rgba(31, 22, 18, 0.08)" />
          </g>

          {/* Dress Form Silhouette */}
          <g className="mannequin-body">
            {/* Neck & Finial */}
            <ellipse cx="160" cy="52" rx="7" ry="10" fill="#dfb76c" opacity="0.8" />
            <path
              d="M 152 64 C 152 74 153 82 150 90 L 170 90 C 167 82 168 74 168 64 Z"
              fill="url(#bodyShade)"
              stroke="rgba(31, 22, 18, 0.35)"
              strokeWidth="1.2"
            />

            {/* Torso & Choli Base */}
            {view === "front" ? (
              <path
                d="M 150 90 
                   C 134 94 116 102 108 116 
                   C 104 124 102 136 104 148 
                   C 106 160 114 172 118 184 
                   C 122 198 126 216 128 230 
                   L 192 230 
                   C 194 216 198 198 202 184 
                   C 206 172 214 160 216 148 
                   C 218 136 216 124 212 116 
                   C 204 102 186 94 170 90 Z"
                fill="url(#bodyShade)"
                stroke="rgba(31, 22, 18, 0.4)"
                strokeWidth="1.4"
              />
            ) : (
              /* Back view torso with shoulder blade contours */
              <path
                d="M 150 90 
                   C 134 94 116 102 108 116 
                   C 104 126 103 138 105 150 
                   C 108 164 116 178 120 190 
                   C 124 204 127 218 128 230 
                   L 192 230 
                   C 193 218 196 204 200 190 
                   C 204 178 212 164 215 150 
                   C 217 138 216 126 212 116 
                   C 204 102 186 94 170 90 Z"
                fill="url(#bodyShade)"
                stroke="rgba(31, 22, 18, 0.4)"
                strokeWidth="1.4"
              />
            )}

            {/* Princess Seam Atelier Lines (Front) */}
            {view === "front" && (
              <g stroke="rgba(31, 22, 18, 0.15)" strokeWidth="1" strokeDasharray="2,3" fill="none">
                <path d="M 132 104 C 136 125 138 148 138 170 C 138 195 140 215 142 230" />
                <path d="M 188 104 C 184 125 182 148 182 170 C 182 195 180 215 178 230" />
                {/* Bust Apex Points */}
                <circle cx="138" cy="154" r="2.5" fill="#dfb76c" />
                <circle cx="182" cy="154" r="2.5" fill="#dfb76c" />
              </g>
            )}

            {/* Spine Centerline (Back) */}
            {view === "back" && (
              <g stroke="rgba(31, 22, 18, 0.18)" strokeWidth="1" strokeDasharray="3,3" fill="none">
                <line x1="160" y1="90" x2="160" y2="230" />
                {/* Shoulder blades subtle shading */}
                <path d="M 134 128 C 138 136 138 146 134 154" />
                <path d="M 186 128 C 182 136 182 146 186 154" />
              </g>
            )}

            {/* Arms / Sleeve Gestures (Stylized) */}
            <g className="mannequin-arms" stroke="rgba(31, 22, 18, 0.28)" strokeWidth="1.2" fill="none">
              {/* Left Arm (viewer right) */}
              <path d="M 214 120 C 228 138 236 168 238 200 C 240 228 235 258 230 280" />
              <path d="M 204 152 C 214 175 220 206 220 236 C 220 258 217 275 214 286" />
              {/* Right Arm (viewer left) */}
              <path d="M 106 120 C 92 138 84 168 82 200 C 80 228 85 258 90 280" />
              <path d="M 116 152 C 106 175 100 206 100 236 C 100 258 103 275 106 286" />
            </g>

            {/* Lehenga Waist & Grand Flared Skirt Outline */}
            <g className="mannequin-skirt">
              {/* Skirt Drape Volume Outline */}
              <path
                d="M 128 230 
                   C 120 250 102 280 84 330 
                   C 66 380 48 440 38 520 
                   C 95 536 225 536 282 520 
                   C 272 440 254 380 236 330 
                   C 218 280 200 250 192 230 
                   Z"
                fill="url(#bodyShade)"
                stroke="rgba(31, 22, 18, 0.35)"
                strokeWidth="1.3"
                opacity="0.85"
              />

              {/* Kalidar Panel Seams (Flowing down to hem) */}
              <g stroke="rgba(31, 22, 18, 0.12)" strokeWidth="1" fill="none">
                <path d="M 144 230 C 136 300 114 410 92 525" />
                <path d="M 160 230 C 160 300 160 410 160 528" />
                <path d="M 176 230 C 184 300 206 410 228 525" />
              </g>

              {/* Hem Curve */}
              <path
                d="M 38 520 C 100 540 220 540 282 520"
                stroke="rgba(185, 138, 61, 0.5)"
                strokeWidth="2"
                fill="none"
              />
            </g>
          </g>

          {/* ======================================================== */}
          {/* MEASUREMENT TAPE OVERLAYS & INTERACTIVE CLICK TARGETS   */}
          {/* ======================================================== */}

          {/* 01. BUST CIRCUMFERENCE (Front) */}
          {view === "front" && (
            <g
              className={`tape-group ${isActive("bust") ? "active" : ""}`}
              onClick={() => onSelectPoint("bust")}
              tabIndex={0}
              role="button"
              aria-label="Bust Measurement"
            >
              <line
                x1="102"
                y1="154"
                x2="218"
                y2="154"
                className="tape-line"
                filter={isActive("bust") ? "url(#goldGlow)" : undefined}
              />
              <circle cx="102" cy="154" r={isActive("bust") ? 5 : 3.5} className="tape-pin" />
              <circle cx="218" cy="154" r={isActive("bust") ? 5 : 3.5} className="tape-pin" />
              {isActive("bust") && (
                <g className="tape-badge" transform="translate(160, 142)">
                  <rect x="-44" y="-14" width="88" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Bust {formatValueDisplay(v.bust, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 02. UNDERBUST BAND (Front) */}
          {view === "front" && (
            <g
              className={`tape-group ${isActive("underbust") ? "active" : ""}`}
              onClick={() => onSelectPoint("underbust")}
              tabIndex={0}
              role="button"
              aria-label="Underbust Measurement"
            >
              <line
                x1="112"
                y1="184"
                x2="208"
                y2="184"
                className="tape-line"
                filter={isActive("underbust") ? "url(#goldGlow)" : undefined}
              />
              <circle cx="112" cy="184" r={isActive("underbust") ? 5 : 3.5} className="tape-pin" />
              <circle cx="208" cy="184" r={isActive("underbust") ? 5 : 3.5} className="tape-pin" />
              {isActive("underbust") && (
                <g className="tape-badge" transform="translate(160, 172)">
                  <rect x="-56" y="-14" width="112" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Underbust {formatValueDisplay(v.underbust, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 03. APEX POINT (Shoulder to Bust Apex) (Front) */}
          {view === "front" && (
            <g
              className={`tape-group ${isActive("apexPoint") ? "active" : ""}`}
              onClick={() => onSelectPoint("apexPoint")}
              tabIndex={0}
              role="button"
              aria-label="Apex Point Measurement"
            >
              <line
                x1="138"
                y1="93"
                x2="138"
                y2="154"
                className="tape-line vertical"
                filter={isActive("apexPoint") ? "url(#goldGlow)" : undefined}
              />
              <circle cx="138" cy="93" r="3" className="tape-pin" />
              <circle cx="138" cy="154" r={isActive("apexPoint") ? 5 : 4} className="tape-pin active-pin" />
              {isActive("apexPoint") && (
                <g className="tape-badge" transform="translate(110, 124)">
                  <rect x="-42" y="-14" width="84" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Apex {formatValueDisplay(v.apexPoint, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 04. TOTAL CHOLI LENGTH (Front) */}
          {view === "front" && (
            <g
              className={`tape-group ${isActive("choliLength") ? "active" : ""}`}
              onClick={() => onSelectPoint("choliLength")}
              tabIndex={0}
              role="button"
              aria-label="Choli Length Measurement"
            >
              {/* Bracket on left shoulder down to choli hem */}
              <line
                x1="184"
                y1="93"
                x2="184"
                y2="204"
                className="tape-line vertical"
                filter={isActive("choliLength") ? "url(#goldGlow)" : undefined}
              />
              <line x1="178" y1="93" x2="190" y2="93" className="tape-line" />
              <line x1="178" y1="204" x2="190" y2="204" className="tape-line" />
              {isActive("choliLength") && (
                <g className="tape-badge" transform="translate(216, 150)">
                  <rect x="-48" y="-14" width="96" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Length {formatValueDisplay(v.choliLength, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 05. ACROSS SHOULDERS (Back view) */}
          {view === "back" && (
            <g
              className={`tape-group ${isActive("shoulderWidth") ? "active" : ""}`}
              onClick={() => onSelectPoint("shoulderWidth")}
              tabIndex={0}
              role="button"
              aria-label="Shoulder Width Measurement"
            >
              <line
                x1="108"
                y1="116"
                x2="212"
                y2="116"
                className="tape-line"
                filter={isActive("shoulderWidth") ? "url(#goldGlow)" : undefined}
              />
              <circle cx="108" cy="116" r={isActive("shoulderWidth") ? 5 : 3.5} className="tape-pin" />
              <circle cx="212" cy="116" r={isActive("shoulderWidth") ? 5 : 3.5} className="tape-pin" />
              {isActive("shoulderWidth") && (
                <g className="tape-badge" transform="translate(160, 102)">
                  <rect x="-56" y="-14" width="112" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Shoulder {formatValueDisplay(v.shoulderWidth, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 06. FRONT NECKLINE DEPTH (Front) */}
          {view === "front" && (
            <g
              className={`tape-group ${isActive("frontNeckDepth") ? "active" : ""}`}
              onClick={() => onSelectPoint("frontNeckDepth")}
              tabIndex={0}
              role="button"
              aria-label="Front Neck Depth Measurement"
            >
              <path
                d="M 148 92 Q 160 120 160 134"
                className="tape-line"
                fill="none"
                filter={isActive("frontNeckDepth") ? "url(#goldGlow)" : undefined}
              />
              <circle cx="160" cy="134" r={isActive("frontNeckDepth") ? 5 : 3.5} className="tape-pin active-pin" />
              {isActive("frontNeckDepth") && (
                <g className="tape-badge" transform="translate(160, 118)">
                  <rect x="-54" y="-14" width="108" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Neck Drop {formatValueDisplay(v.frontNeckDepth, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 07. BACK NECKLINE DROP (Back) */}
          {view === "back" && (
            <g
              className={`tape-group ${isActive("backNeckDepth") ? "active" : ""}`}
              onClick={() => onSelectPoint("backNeckDepth")}
              tabIndex={0}
              role="button"
              aria-label="Back Neck Depth Measurement"
            >
              <line
                x1="160"
                y1="90"
                x2="160"
                y2="175"
                className="tape-line vertical"
                filter={isActive("backNeckDepth") ? "url(#goldGlow)" : undefined}
              />
              <circle cx="160" cy="90" r="3" className="tape-pin" />
              <circle cx="160" cy="175" r={isActive("backNeckDepth") ? 5 : 4} className="tape-pin active-pin" />
              {isActive("backNeckDepth") && (
                <g className="tape-badge" transform="translate(160, 140)">
                  <rect x="-56" y="-14" width="112" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Back Drop {formatValueDisplay(v.backNeckDepth, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 08. ARMHOLE (Front) */}
          {view === "front" && (
            <g
              className={`tape-group ${isActive("armhole") ? "active" : ""}`}
              onClick={() => onSelectPoint("armhole")}
              tabIndex={0}
              role="button"
              aria-label="Armhole Measurement"
            >
              <ellipse
                cx="214"
                cy="134"
                rx="14"
                ry="18"
                className="tape-line"
                fill="none"
                transform="rotate(-15 214 134)"
                filter={isActive("armhole") ? "url(#goldGlow)" : undefined}
              />
              {isActive("armhole") && (
                <g className="tape-badge" transform="translate(254, 134)">
                  <rect x="-44" y="-14" width="88" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Armhole {formatValueDisplay(v.armhole, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 09. BICEP (Front) */}
          {view === "front" && (
            <g
              className={`tape-group ${isActive("bicep") ? "active" : ""}`}
              onClick={() => onSelectPoint("bicep")}
              tabIndex={0}
              role="button"
              aria-label="Bicep Measurement"
            >
              <line
                x1="222"
                y1="180"
                x2="238"
                y2="182"
                className="tape-line"
                filter={isActive("bicep") ? "url(#goldGlow)" : undefined}
              />
              <circle cx="222" cy="180" r="3" className="tape-pin" />
              <circle cx="238" cy="182" r="3" className="tape-pin" />
              {isActive("bicep") && (
                <g className="tape-badge" transform="translate(262, 180)">
                  <rect x="-40" y="-14" width="80" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Bicep {formatValueDisplay(v.bicep, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 10. SLEEVE LENGTH (Front) */}
          {view === "front" && (
            <g
              className={`tape-group ${isActive("sleeveLength") ? "active" : ""}`}
              onClick={() => onSelectPoint("sleeveLength")}
              tabIndex={0}
              role="button"
              aria-label="Sleeve Length Measurement"
            >
              <line
                x1="214"
                y1="116"
                x2="236"
                y2="216"
                className="tape-line"
                filter={isActive("sleeveLength") ? "url(#goldGlow)" : undefined}
              />
              <circle cx="214" cy="116" r="3" className="tape-pin" />
              <circle cx="236" cy="216" r={isActive("sleeveLength") ? 5 : 3.5} className="tape-pin" />
              {isActive("sleeveLength") && (
                <g className="tape-badge" transform="translate(262, 216)">
                  <rect x="-44" y="-14" width="88" height="22" rx="4" className="badge-bg" />
                  <text textAnchor="middle" y="2" className="badge-text">
                    Sleeve {formatValueDisplay(v.sleeveLength, unit)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 11. LEHENGA WAIST (Both views) */}
          <g
            className={`tape-group ${isActive("lehengaWaist") ? "active" : ""}`}
            onClick={() => onSelectPoint("lehengaWaist")}
            tabIndex={0}
            role="button"
            aria-label="Lehenga Waist Measurement"
          >
            <path
              d="M 128 230 Q 160 236 192 230"
              className="tape-line"
              fill="none"
              filter={isActive("lehengaWaist") ? "url(#goldGlow)" : undefined}
            />
            <circle cx="128" cy="230" r={isActive("lehengaWaist") ? 5 : 3.5} className="tape-pin" />
            <circle cx="192" cy="230" r={isActive("lehengaWaist") ? 5 : 3.5} className="tape-pin" />
            {isActive("lehengaWaist") && (
              <g className="tape-badge" transform="translate(160, 216)">
                <rect x="-56" y="-14" width="112" height="22" rx="4" className="badge-bg" />
                <text textAnchor="middle" y="2" className="badge-text">
                  Waist {formatValueDisplay(v.lehengaWaist, unit)}
                </text>
              </g>
            )}
          </g>

          {/* 12. FULL HIP CIRCUMFERENCE (Both views) */}
          <g
            className={`tape-group ${isActive("hip") ? "active" : ""}`}
            onClick={() => onSelectPoint("hip")}
            tabIndex={0}
            role="button"
            aria-label="Hip Measurement"
          >
            <path
              d="M 106 288 Q 160 298 214 288"
              className="tape-line"
              fill="none"
              filter={isActive("hip") ? "url(#goldGlow)" : undefined}
            />
            <circle cx="106" cy="288" r={isActive("hip") ? 5 : 3.5} className="tape-pin" />
            <circle cx="214" cy="288" r={isActive("hip") ? 5 : 3.5} className="tape-pin" />
            {isActive("hip") && (
              <g className="tape-badge" transform="translate(160, 274)">
                <rect x="-48" y="-14" width="96" height="22" rx="4" className="badge-bg" />
                <text textAnchor="middle" y="2" className="badge-text">
                  Hip {formatValueDisplay(v.hip, unit)}
                </text>
              </g>
            )}
          </g>

          {/* 13. WAIST TO FLOOR WITH HEELS (Front/Both) */}
          <g
            className={`tape-group ${isActive("waistToFloor") ? "active" : ""}`}
            onClick={() => onSelectPoint("waistToFloor")}
            tabIndex={0}
            role="button"
            aria-label="Waist to Floor Measurement"
          >
            <line
              x1="66"
              y1="230"
              x2="66"
              y2="526"
              className="tape-line vertical"
              filter={isActive("waistToFloor") ? "url(#goldGlow)" : undefined}
            />
            <line x1="58" y1="230" x2="74" y2="230" className="tape-line" />
            <line x1="58" y1="526" x2="74" y2="526" className="tape-line" />
            {isActive("waistToFloor") && (
              <g className="tape-badge" transform="translate(76, 380)">
                <rect x="-62" y="-14" width="124" height="22" rx="4" className="badge-bg" />
                <text textAnchor="middle" y="2" className="badge-text">
                  Floor Drop {formatValueDisplay(v.waistToFloor, unit)}
                </text>
              </g>
            )}
          </g>

          {/* 14. GHERA FLARE PREFERENCE (Hem Arc) */}
          <g
            className={`tape-group ${isActive("gheraPreference") ? "active" : ""}`}
            onClick={() => onSelectPoint("gheraPreference")}
            tabIndex={0}
            role="button"
            aria-label="Ghera Flare Volume"
          >
            <path
              d="M 38 520 Q 160 554 282 520"
              className="tape-line"
              fill="none"
              strokeWidth="2.5"
              filter={isActive("gheraPreference") ? "url(#goldGlow)" : undefined}
            />
            {/* Animated Flare concentric ripples */}
            <path
              d="M 28 532 Q 160 568 292 532"
              className="tape-line"
              strokeDasharray="4,4"
              fill="none"
              opacity={isActive("gheraPreference") ? 0.9 : 0.3}
            />
            {isActive("gheraPreference") && (
              <g className="tape-badge" transform="translate(160, 560)">
                <rect x="-64" y="-14" width="128" height="22" rx="4" className="badge-bg" />
                <text textAnchor="middle" y="2" className="badge-text">
                  Flare {v.gheraPreference}m Volume
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      <div className="mannequin-legend">
        <span className="legend-indicator" />
        <span className="legend-text">Click any tape line or use the panel to calibrate</span>
      </div>
    </div>
  );
};
