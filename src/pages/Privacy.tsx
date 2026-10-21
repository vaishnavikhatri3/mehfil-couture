import { brand } from "../config/brand";
import { usePageMeta } from "../hooks/usePageMeta";
import "./Article.css";

/** DRAFT — review with the business (and a legal adviser) before launch. */
export default function Privacy() {
  usePageMeta("Privacy & terms — Mehfil Couture", "How the Mehfil Couture website handles your information.");
  const channel = brand.whatsapp ? "WhatsApp" : "Instagram";
  return (
    <main id="main" className="art">
      <header className="art__head wrap">
        <p className="label label--gold">Privacy &amp; terms</p>
        <h1 className="art__title">
          Your details, <em>handled with care.</em>
        </h1>
      </header>
      <div className="art__body wrap">
        <p>
          This website is a showcase for {brand.name}. We've kept it deliberately light on data collection. This page explains
          what happens when you use it.
        </p>
        <h2>Enquiries &amp; appointments</h2>
        <p>
          When you use an enquiry button, the Style Studio, the Atelier Sketchbook or the appointment form, the website prepares a
          message and opens {channel} so that <em>you</em> choose whether to send it. Your message is then handled by {channel}{" "}
          under its own privacy policy.
          {brand.endpoints.appointment &&
            " If you submit the appointment form directly, your details are sent to the studio and used only to respond to your request."}
        </p>
        <h2>Stored on your device</h2>
        <p>
          Your Style Studio choices and any looks you save in the Atelier Sketchbook are kept in your browser's local storage so
          they're there when you come back. They never leave your device; clearing your browser data removes them.
        </p>
        <h2>Try-on lens</h2>
        <p>
          If you add a photo to the try-on lens, it is processed entirely in your browser. It is never uploaded to us or to any
          third party, never stored, and is cleared from memory when you close the lens. Images you choose to save or share are
          created on your own device.
        </p>
        <h2>Newsletter</h2>
        <p>
          {brand.endpoints.newsletter
            ? "If you join the launch list, we store your email address to send you news about new arrivals. You can unsubscribe at any time using the link in any email."
            : "The launch list isn't live yet, so no email addresses are collected or stored."}
        </p>
        <h2>Analytics</h2>
        <p>
          {brand.analyticsEnabled
            ? "With your permission, we measure anonymous usage (such as which sections are popular). We never record form contents."
            : "This website doesn't currently run analytics or advertising trackers."}
        </p>
        <h2>Photography</h2>
        <p>
          Some photography on this site is editorial inspiration licensed from Unsplash and credited in the footer — it does not
          depict specific {brand.name} products.
        </p>
        <h2>Contact</h2>
        <p>
          Questions? Message us on Instagram{" "}
          <a className="u" href={brand.instagram.url} target="_blank" rel="noopener noreferrer">
            {brand.instagram.handle}
          </a>{" "}
          or visit the studio at {brand.studio.lines.join(", ")}.
        </p>
      </div>
    </main>
  );
}
