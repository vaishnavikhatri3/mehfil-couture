import { useState } from "react";
import { brand } from "../config/brand";
import { getConsent, setConsent } from "../lib/analytics";
import "./ConsentBanner.css";

/** Only rendered when analytics is actually configured (VITE_ANALYTICS_ENABLED=true). */
export function ConsentBanner() {
  const [answered, setAnswered] = useState(() => getConsent() !== null);
  if (!brand.analyticsEnabled || answered) return null;
  const choose = (v: "granted" | "denied") => {
    setConsent(v);
    setAnswered(true);
  };
  return (
    <div className="consent" role="dialog" aria-label="Analytics preferences">
      <p>We'd like to measure how visitors use this site (no form contents, ever). Is that okay?</p>
      <div className="consent__actions">
        <button type="button" className="btn btn--ghost" onClick={() => choose("denied")}>
          No thanks
        </button>
        <button type="button" className="btn" onClick={() => choose("granted")}>
          Allow
        </button>
      </div>
    </div>
  );
}
