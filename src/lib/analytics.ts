import { brand } from "../config/brand";

/**
 * Analytics-ready event layer. Nothing is sent anywhere unless
 * VITE_ANALYTICS_ENABLED=true AND the visitor has consented. Events never
 * include form contents (names, phone numbers, emails).
 *
 * Event names: collection_click, enquiry_open, appointment_submit,
 * studio_complete, studio_share, newsletter_submit, campaign_click,
 * look_saved, journal_open.
 */

type Props = Record<string, string | number | boolean | undefined>;
const CONSENT_KEY = "mehfil-analytics-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function getConsent(): "granted" | "denied" | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* storage unavailable — consent applies to this page view only */
  }
}

export function track(event: string, props: Props = {}) {
  // Always emit a DOM event so integrations/tests can listen locally.
  window.dispatchEvent(new CustomEvent("mehfil:track", { detail: { event, ...props } }));
  if (!brand.analyticsEnabled || getConsent() !== "granted") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...props });
}
