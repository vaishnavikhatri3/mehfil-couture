import { useEffect, useState } from "react";
import { generalEnquiry, enquiryChannel, hasWhatsApp } from "../lib/enquiry";
import { InstagramIcon, WhatsAppIcon } from "./Icons";
import "./WhatsAppButton.css";

/**
 * Floating enquiry button. Uses WhatsApp when a verified number is configured,
 * otherwise the studio's Instagram DM. Appears after the hero.
 */
export function WhatsAppButton() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const wa = hasWhatsApp();
  return (
    <button
      type="button"
      className={`fab ${show ? "is-shown" : ""} ${wa ? "fab--wa" : "fab--ig"}`}
      onClick={() => generalEnquiry()}
      aria-label={`Enquire via ${enquiryChannel()}`}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
    >
      {wa ? <WhatsAppIcon size={24} /> : <InstagramIcon size={22} />}
      <span className="fab__label">Enquire</span>
    </button>
  );
}
